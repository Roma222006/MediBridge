const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function request(path, options = {}) {
  const url = new URL(BASE_URL + path);
  const headers = options.headers || {};
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  if (res.status === 200 && res.data?.data?.tokens?.accessToken) {
    return {
      token: res.data.data.tokens.accessToken,
      user: res.data.data.user
    };
  }
  return null;
}

async function runAudit() {
  console.log('Authenticating test identities...');
  const users = {
    guest: { token: null, name: 'Guest (No Token)' },
    patient: await login('roma.patient@medibridge.org', 'PatientPass123!'),
    doctor: await login('dr.sundaram@medibridge.org', 'DoctorPass123!'),
    hospitalAdminKmch: await login('admin.kmch@medibridge.org', 'AdminPass123!'),
    hospitalAdminPsg: await login('admin.psg@medibridge.org', 'AdminPass123!'),
    superAdmin: await login('superadmin@medibridge.org', 'SuperAdmin123!')
  };

  for (const [k, v] of Object.entries(users)) {
    console.log(`Identity ${k}: ${v?.token ? 'Authenticated OK' : (k === 'guest' ? 'No Token' : 'FAILED')}`);
  }

  const routes = [
    // Emergency
    { method: 'GET', path: '/emergency/nearest?lat=11.0168&lng=76.9558', name: 'Emergency Nearest (Public)' },
    { method: 'GET', path: '/emergency/offline-bundle', name: 'Emergency Offline Bundle (Public)' },

    // Search
    { method: 'GET', path: '/search?district=Coimbatore', name: 'Public Search' },
    { method: 'GET', path: '/search/slots?hospitalId=dummy&date=2026-11-20', name: 'Public Slots' },
    { method: 'PATCH', path: '/search/hospitals/dummy/bed-capacity', body: { general: { total: 10, available: 5 } }, name: 'Update Bed Capacity' },

    // Patient Profiles
    { method: 'GET', path: '/patient-profiles', name: 'List Patient Profiles' },
    { method: 'POST', path: '/patient-profiles', body: { fullName: 'Test Profile', relationship: 'self' }, name: 'Create Patient Profile' },

    // Bookings
    { method: 'GET', path: '/bookings/my-bookings', name: 'Patient My Bookings' },
    { method: 'POST', path: '/bookings/hold', body: { slotId: 'dummy', patientProfileId: 'dummy' }, name: 'Hold Slot' },
    { method: 'POST', path: '/bookings/confirm', body: { slotId: 'dummy', patientProfileId: 'dummy' }, name: 'Confirm Booking' },

    // Reassignment
    { method: 'GET', path: '/reassignments/pending', name: 'Patient Pending Reassignments' },
    { method: 'POST', path: '/reassignments/leave', body: { doctorId: 'dummy', startDate: '2026-11-20', endDate: '2026-11-21', reason: 'Test' }, name: 'Record Leave' },

    // Doctor Portal
    { method: 'GET', path: '/doctor/schedule', name: 'Doctor Schedule' },
    { method: 'GET', path: '/doctor/referrals', name: 'Doctor Referrals' },

    // Referrals
    { method: 'GET', path: '/referrals', name: 'List Hospital Referrals' },
    { method: 'POST', path: '/referrals', body: { patientProfileId: 'dummy', receivingHospitalId: 'dummy', targetSpecialty: 'Cardiology', clinicalSummary: 'Test' }, name: 'Create Referral' },

    // Operations / Admin Console
    { method: 'GET', path: '/admin/overview', name: 'Admin Overview' },
    { method: 'GET', path: '/admin/slots', name: 'Admin Get Slots' },
    { method: 'POST', path: '/admin/slots', body: { serviceId: 'dummy', date: '2026-11-20', startTime: '09:00', endTime: '09:30' }, name: 'Admin Create Slot' },
    { method: 'GET', path: '/admin/services', name: 'Admin Get Services' },
    { method: 'GET', path: '/admin/audit-logs', name: 'Admin Audit Logs' },

    // Vault
    { method: 'GET', path: '/vault/records?patientProfileId=dummy', name: 'Vault Get Records' },
    { method: 'GET', path: '/vault/access-logs?patientProfileId=dummy', name: 'Vault Access Logs' },
    { method: 'GET', path: '/vault/consents?patientProfileId=dummy', name: 'Vault Consents' },
    { method: 'POST', path: '/vault/consent', body: { patientProfileId: 'dummy', doctorId: 'dummy', purpose: 'Test' }, name: 'Grant Vault Consent' },

    // Teleconsult
    { method: 'POST', path: '/teleconsult/session/dummy/join', name: 'Join Teleconsult Session' },
    { method: 'GET', path: '/teleconsult/session/dummy/status', name: 'Teleconsult Session Status' }
  ];

  console.log('\n--- LIVE PERMISSION MATRIX PROBE RESULTS ---');
  const matrixResults = [];

  for (const r of routes) {
    const row = { route: `${r.method} ${r.path.split('?')[0]}`, name: r.name };
    for (const [roleKey, roleObj] of Object.entries(users)) {
      if (!roleObj && roleKey !== 'guest') {
        row[roleKey] = 'AUTH_FAIL';
        continue;
      }
      const res = await request(r.path, {
        method: r.method,
        token: roleObj?.token,
        body: r.body
      });
      row[roleKey] = res.status;
    }
    matrixResults.push(row);
  }

  console.table(matrixResults);

  // Return the results as JSON
  console.log('\nAudit probe completed successfully.');
}

runAudit().catch(console.error);
