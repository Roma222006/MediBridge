const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('../backend/node_modules/mongodb-memory-server');
const mongoose = require('../backend/node_modules/mongoose');

// Ensure system binary for MongoMemoryServer
process.env.MONGOMS_SYSTEM_BINARY = 'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe';
process.env.MONGOMS_VERSION = '8.0.8';

const targetDir = process.argv[2] || 'docs/ui/before';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function createStaticServer(distPath, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(distPath, reqPath === '/' ? 'index.html' : reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(r => server.listen(port, r));
  return server;
}

async function capture() {
  console.log(`Starting capture into directory: ${targetDir}`);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Start MongoDB Memory Server
  console.log('Starting MongoMemoryServer...');
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  process.env.MONGODB_URI = mongoUri;
  process.env.PORT = '5000';
  process.env.JWT_SECRET = 'demo_jwt_secret_for_tests_min_32_chars!';
  process.env.JWT_REFRESH_SECRET = 'demo_jwt_refresh_secret_min_32_chars!';
  process.env.TELECONSULT_SECRET = 'teleconsult_demo_secret_32_chars!';
  process.env.VAULT_SECRET_KEY = 'vault_demo_secret_key_32_chars!';

  // 2. Connect & Seed Demo Data
  console.log('Connecting to database and seeding demo data...');
  const seedDemoData = require('../backend/src/seeds/seedDemoData');
  const config = require('../backend/src/config');
  config.mongoUri = mongoUri;
  await seedDemoData();
  await mongoose.connect(mongoUri);
  console.log('Seed completed.');

  // Find KMCH hospital ID
  const Hospital = require('../backend/src/models/Hospital');
  const kmch = await Hospital.findOne({ name: /Kovai Medical Center/i });
  const kmchId = kmch ? kmch._id.toString() : 'kmch';

  // 3. Start Backend Express App
  console.log('Starting backend server...');
  const { app } = require('../backend/src/app');
  const backendServer = http.createServer(app);
  await new Promise(r => backendServer.listen(5000, r));

  // 4. Start Frontend Static Server (from frontend/dist)
  console.log('Starting frontend server...');
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  const frontendServer = await createStaticServer(distPath, 3000);

  // 5. Launch Chrome
  console.log('Launching headless Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars'
  ]);
  await sleep(1500);

  // Get WebSocket target
  const versionInfo = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const browserCdp = new CDPClient(versionInfo.webSocketDebuggerUrl);
  await browserCdp.connect();

  // Create new page target
  const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
  const pageTargets = await new Promise(resolve => {
    http.get('http://127.0.0.1:9222/json/list', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });
  const pageTarget = pageTargets.find(t => t.id === targetId);
  const pageCdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await pageCdp.connect();

  await pageCdp.send('Page.enable');
  await pageCdp.send('DOM.enable');

  // Obtain login tokens for patient, doctor, hospital_admin
  const User = require('../backend/src/models/User');
  const jwt = require('../backend/node_modules/jsonwebtoken');

  const patient = await User.findOne({ email: 'roma.patient@medibridge.org' });
  const doctor = await User.findOne({ email: 'dr.revathi@medibridge.org' });
  const admin = await User.findOne({ email: 'admin.kmch@medibridge.org' });

  const patientToken = jwt.sign({ userId: patient._id, role: patient.role, tokenVersion: patient.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const doctorToken = jwt.sign({ userId: doctor._id, role: doctor.role, hospitalId: doctor.hospitalId, tokenVersion: doctor.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const adminToken = jwt.sign({ userId: admin._id, role: admin.role, hospitalId: admin.hospitalId, tokenVersion: admin.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '15m' });

  const patientUserStr = JSON.stringify({ id: patient._id, name: patient.name, email: patient.email, role: patient.role });
  const doctorUserStr = JSON.stringify({ id: doctor._id, name: doctor.name, email: doctor.email, role: doctor.role, hospitalId: doctor.hospitalId });
  const adminUserStr = JSON.stringify({ id: admin._id, name: admin.name, email: admin.email, role: admin.role, hospitalId: admin.hospitalId });

  const routes = [
    { name: '01_search_discovery', url: 'http://localhost:3000/' },
    { name: '02_hospital_details', url: `http://localhost:3000/hospital/${kmchId}` },
    { name: '03_emergency_mode', url: 'http://localhost:3000/emergency' },
    { name: '04_login', url: 'http://localhost:3000/login' },
    {
      name: '05_patient_dashboard',
      url: 'http://localhost:3000/patient-dashboard',
      auth: { token: patientToken, user: patientUserStr }
    },
    {
      name: '06_doctor_portal',
      url: 'http://localhost:3000/doctor-portal',
      auth: { token: doctorToken, user: doctorUserStr }
    },
    {
      name: '07_admin_console',
      url: 'http://localhost:3000/admin-console',
      auth: { token: adminToken, user: adminUserStr }
    },
    {
      name: '08_teleconsult_room',
      url: 'http://localhost:3000/teleconsult/room/demo-teleconsult-1',
      auth: { token: patientToken, user: patientUserStr }
    }
  ];

  const viewports = [
    { width: 360, height: 740, label: '360' },
    { width: 768, height: 1024, label: '768' },
    { width: 1280, height: 800, label: '1280' }
  ];

  for (const vp of viewports) {
    console.log(`\n--- Capturing viewport: ${vp.width}x${vp.height} (${vp.label}) ---`);
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768
    });

    for (const r of routes) {
      console.log(`Navigating to ${r.name} at ${r.url}...`);
      await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/' });
      await sleep(300);

      if (r.auth) {
        await pageCdp.send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('medibridge_access_token', '${r.auth.token}');
            localStorage.setItem('medibridge_user', JSON.stringify(${r.auth.user}));
          `
        });
      } else {
        await pageCdp.send('Runtime.evaluate', {
          expression: `
            localStorage.removeItem('medibridge_access_token');
            localStorage.removeItem('medibridge_refresh_token');
            localStorage.removeItem('medibridge_user');
          `
        });
      }

      await pageCdp.send('Page.navigate', { url: r.url });
      await sleep(1000); // Allow render and data fetching

      const screenshot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      const filename = `${r.name}_${vp.label}.png`;
      const filePath = path.join(targetDir, filename);
      fs.writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }
  }

  console.log('\nAll screenshots captured successfully!');

  // Cleanup
  pageCdp.close();
  browserCdp.close();
  chrome.kill();
  frontendServer.close();
  backendServer.close();
  await mongoose.disconnect();
  await mongod.stop();
  console.log('Cleanup complete.');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
