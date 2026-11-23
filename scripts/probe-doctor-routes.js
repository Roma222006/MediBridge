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

async function runDoctorProbe() {
  console.log('Authenticating identities for doctor route probe...');
  const users = {
    guest: { token: null, label: 'Guest (No Token)' },
    patient: await login('roma.patient@medibridge.org', 'PatientPass123!'),
    doctorSundaram: await login('dr.sundaram@medibridge.org', 'DoctorPass123!'), // KMCH
    doctorArumugam: await login('dr.arumugam@medibridge.org', 'DoctorPass123!'), // Pollachi GH
    adminPsg: await login('admin.psg@medibridge.org', 'AdminPass123!'), // Admin Other Hospital
    superAdmin: await login('superadmin@medibridge.org', 'SuperAdmin123!')
  };

  for (const [k, v] of Object.entries(users)) {
    console.log(`- ${k}: ${v?.token ? 'Authenticated OK' : (k === 'guest' ? 'No Token' : 'FAILED')}`);
  }

  // Get an appointment ID and referral ID from seeded data for real parameter probing
  const sundaramSched = await request('/doctor/schedule', { token: users.doctorSundaram?.token });
  const apptId = sundaramSched.data?.data?.appointments?.[0]?._id || '600000000000000000000001';

  const refList = await request('/referrals', { token: users.doctorSundaram?.token });
  const referralId = refList.data?.data?.[0]?._id || '600000000000000000000002';

  const routes = [
    { method: 'GET', path: '/doctor/schedule', name: 'Doctor Schedule (Own)' },
    { method: 'GET', path: '/doctor/referrals', name: 'Doctor Specialty Referrals' },
    { method: 'POST', path: '/referrals', body: { targetSpecialty: 'Cardiology', clinicalSummary: 'Probe test' }, name: 'Create Referral' },
    { method: 'GET', path: '/referrals', name: 'List Referrals (Hospital Queue)' },
    { method: 'PATCH', path: `/referrals/${referralId}/receive`, name: 'Receive Referral' },
    { method: 'PATCH', path: `/referrals/${referralId}/review`, name: 'Review Referral' },
    { method: 'PATCH', path: `/referrals/${referralId}/accept`, body: {}, name: 'Accept Referral' },
    { method: 'PATCH', path: `/referrals/${referralId}/reject`, body: { reason: 'Capacity full' }, name: 'Reject Referral' },
    { method: 'GET', path: '/vault/records?patientProfileId=600000000000000000000003', name: 'Fetch Vault Records (Consent Gated)' },
    { method: 'POST', path: `/teleconsult/session/${apptId}/join`, name: 'Join Teleconsult Session' },
    { method: 'GET', path: `/teleconsult/session/${apptId}/status`, name: 'Get Teleconsult Session Status' },
    // Checking endpoints that may be missing:
    { method: 'GET', path: '/doctor/profile', name: 'Doctor Profile' },
    { method: 'POST', path: '/doctor/leave-request', body: { startDate: '2026-11-25', endDate: '2026-11-26', reason: 'Personal' }, name: 'Submit Leave Request' },
    { method: 'GET', path: '/doctor/leave-requests', name: 'List Own Leave Requests' },
    { method: 'PATCH', path: `/doctor/appointments/${apptId}/status`, body: { status: 'IN_CONSULTATION' }, name: 'Update Appointment Status' },
    { method: 'POST', path: `/teleconsult/session/${apptId}/notes`, body: { notes: 'Clinical notes' }, name: 'Save Consult Notes' }
  ];

  console.log('\n--- DOCTOR MODULE SECURITY & OWNERSHIP AUDIT PROBE ---');
  const results = [];

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
    results.push(row);
  }

  console.table(results);
}

runDoctorProbe().catch(console.error);
