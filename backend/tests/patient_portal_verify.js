const API_URL = 'http://localhost:5000/api/v1';

async function testPatientPortal() {
  console.log('--- 1. Testing Patient Login with Roma R ---');
  const romaRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'roma.patient@medibridge.org',
      password: 'PatientPass123!'
    })
  });
  const romaLogin = await romaRes.json();
  console.log('Roma Login Response:', {
    success: romaLogin.success,
    userId: romaLogin.data?.user?.id,
    fullName: romaLogin.data?.user?.fullName,
    role: romaLogin.data?.user?.role
  });
  if (romaLogin.data?.user?.fullName !== 'Roma R') {
    throw new Error(`Expected Roma R, got ${romaLogin.data?.user?.fullName}`);
  }

  const romaToken = romaLogin.data.tokens.accessToken;
  const romaProfRes = await fetch(`${API_URL}/patient-profiles`, {
    headers: { Authorization: `Bearer ${romaToken}` }
  });
  const romaProfiles = await romaProfRes.json();
  console.log('Roma Profiles count:', romaProfiles.data.length);
  console.log('Roma Profiles:', romaProfiles.data.map(p => ({ name: p.fullName, rel: p.relationship })));

  console.log('\n--- 2. Registering a completely new patient to test data isolation ---');
  const uniqueSuffix = Date.now().toString().slice(-5);
  const newEmail = `arun.patient${uniqueSuffix}@test.org`;
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newEmail,
      phone: `+91 98401${uniqueSuffix}`,
      password: 'NewPatient123!',
      fullName: `Arun Kumar ${uniqueSuffix}`,
      role: 'patient'
    })
  });
  const newRegister = await regRes.json();
  console.log('New Patient Registered:', {
    email: newRegister.data?.user?.email,
    fullName: newRegister.data?.user?.fullName,
    role: newRegister.data?.user?.role
  });
  if (newRegister.data?.user?.fullName !== `Arun Kumar ${uniqueSuffix}`) {
    throw new Error(`Expected Arun Kumar ${uniqueSuffix}, got ${newRegister.data?.user?.fullName}`);
  }

  console.log('\n--- 3. Logging in as the new patient ---');
  const newLogRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newEmail,
      password: 'NewPatient123!'
    })
  });
  const newLogin = await newLogRes.json();
  console.log('New Patient Login user object:', {
    id: newLogin.data?.user?.id,
    email: newLogin.data?.user?.email,
    fullName: newLogin.data?.user?.fullName,
    role: newLogin.data?.user?.role
  });
  if (newLogin.data?.user?.fullName !== `Arun Kumar ${uniqueSuffix}`) {
    throw new Error(`Isolation failed: Expected Arun Kumar ${uniqueSuffix}, got ${newLogin.data?.user?.fullName}`);
  }

  const newToken = newLogin.data.tokens.accessToken;
  const newProfRes = await fetch(`${API_URL}/patient-profiles`, {
    headers: { Authorization: `Bearer ${newToken}` }
  });
  const newProfiles = await newProfRes.json();
  console.log('New Patient Profiles count:', newProfiles.data.length);
  console.log('New Patient Profiles:', newProfiles.data.map(p => ({ name: p.fullName, rel: p.relationship })));
  if (newProfiles.data.some(p => p.fullName === 'Roma R')) {
    throw new Error('Data leak: New patient saw Roma R profile!');
  }

  console.log('\n--- 4. Creating a family dependent profile for the new patient ---');
  const createRes = await fetch(`${API_URL}/patient-profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newToken}`
    },
    body: JSON.stringify({
      fullName: 'Pooja Arun',
      dateOfBirth: '2002-05-18',
      gender: 'female',
      bloodGroup: 'B+',
      relationship: 'spouse',
      phone: '+91 9840199999'
    })
  });
  const createdProfile = await createRes.json();
  console.log('Created Dependent Profile:', {
    id: createdProfile.data?._id,
    fullName: createdProfile.data?.fullName,
    relationship: createdProfile.data?.relationship
  });

  const updatedProfRes = await fetch(`${API_URL}/patient-profiles`, {
    headers: { Authorization: `Bearer ${newToken}` }
  });
  const updatedProfiles = await updatedProfRes.json();
  console.log('Updated New Patient Profiles:', updatedProfiles.data.map(p => ({ name: p.fullName, rel: p.relationship })));

  console.log('\n--- 5. Updating patient personal details via API ---');
  const selfProfile = updatedProfiles.data.find(p => p.relationship === 'self') || updatedProfiles.data[0];
  const updateRes = await fetch(`${API_URL}/patient-profiles/${selfProfile._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newToken}`
    },
    body: JSON.stringify({
      fullName: `Arun Kumar ${uniqueSuffix} (Updated)`,
      bloodGroup: 'O+',
      emergencyContact: {
        name: 'Pooja Arun',
        phone: '+91 9840199999',
        relationship: 'Spouse'
      }
    })
  });
  const updatedDoc = await updateRes.json();
  console.log('Profile successfully updated:', {
    id: updatedDoc.data?._id,
    fullName: updatedDoc.data?.fullName,
    bloodGroup: updatedDoc.data?.bloodGroup
  });

  console.log('\n--- ALL PATIENT ISOLATION & API TESTS PASSED! ---');
}

testPatientPortal().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
