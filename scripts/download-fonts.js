const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '..', 'frontend', 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching CSS for Manrope and Inter...');
  const css = await fetchText('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700&display=swap');

  // Parse latin blocks:
  // e.g. /* latin */ @font-face { font-family: 'Manrope'; font-weight: 600; src: url(https://...) format('woff2'); }
  const regex = /\/\* latin \*\/\s*@font-face\s*\{([^}]+)\}/g;
  let match;
  const downloads = [];

  while ((match = regex.exec(css)) !== null) {
    const block = match[1];
    const familyMatch = block.match(/font-family:\s*['"]?([^'";]+)['"]?/);
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const urlMatch = block.match(/src:\s*url\((https:[^)]+)\)\s*format\(['"]?woff2['"]?\)/);

    if (familyMatch && weightMatch && urlMatch) {
      const family = familyMatch[1].toLowerCase();
      const weight = weightMatch[1];
      const url = urlMatch[1];
      const filename = `${family}-${weight}-latin.woff2`;
      const dest = path.join(fontsDir, filename);
      downloads.push({ family, weight, url, filename, dest });
    }
  }

  console.log(`Found ${downloads.length} latin font files to download.`);
  for (const item of downloads) {
    console.log(`Downloading ${item.filename} from ${item.url}...`);
    await downloadBinary(item.url, item.dest);
    console.log(`Saved ${item.filename}`);
  }

  console.log('All fonts downloaded successfully!');
}

run().catch(err => {
  console.error('Font download error:', err);
  process.exit(1);
});
