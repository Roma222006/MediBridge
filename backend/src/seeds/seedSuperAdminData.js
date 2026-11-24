const mongoose = require('mongoose');
const config = require('../config');
const { connectDB, disconnectDB } = require('../config/database');

const Hospital = require('../models/Hospital');
const User = require('../models/User');
const PlatformIncident = require('../models/PlatformIncident');
const SystemSetting = require('../models/SystemSetting');
const RolePermission = require('../models/RolePermission');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

async function seedSuperAdminData() {
  console.log('[SuperAdmin Seed] Connecting to database...');
  await connectDB(config.mongoUri);

  // 1. Ensure existing hospitals have approvalStatus: 'APPROVED'
  await Hospital.updateMany(
    { approvalStatus: { $exists: false } },
    { $set: { approvalStatus: 'APPROVED', accountStatus: 'ACTIVE', isVerified: true } }
  );

  // 2. Seed realistic pending/under-review hospital applications
  const existingPending = await Hospital.findOne({ name: 'Ganga Medical Centre & Hospital (Ram Nagar)' });
  if (!existingPending) {
    console.log('[SuperAdmin Seed] Creating pending hospital applications...');

    const gangaHospital = await Hospital.create({
      name: 'Ganga Medical Centre & Hospital (Ram Nagar)',
      licenseNumber: 'LIC-TN-CBE-044',
      type: 'tertiary',
      location: { type: 'Point', coordinates: [76.9614, 11.0118] },
      address: {
        street: '313, Mettupalayam Road, Ram Nagar',
        area: 'Ram Nagar',
        city: 'Coimbatore',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641009'
      },
      phone: '+914222485000',
      emergencyPhone: '108',
      email: 'administration@gangahospital-demo.org',
      website: 'https://gangahospital.org',
      operatingHours: '24/7 Trauma, Emergency & Orthopedic OPD',
      schemesSupported: ['pmjay', 'cmchis', 'private_star'],
      bedCapacity: {
        general: { total: 220, available: 42, lastUpdated: new Date() },
        icu: { total: 30, available: 6, lastUpdated: new Date() }
      },
      approvalStatus: 'PENDING',
      accountStatus: 'INACTIVE',
      isVerified: false,
      documents: [
        {
          title: 'Tamil Nadu Clinical Establishments Act Registration',
          docType: 'REGISTRATION_CERTIFICATE',
          url: '/api/v1/doctor/documents/download?token=demo_ganga_reg',
          uploadedAt: new Date(Date.now() - 36 * 3600 * 1000),
          status: 'PENDING'
        },
        {
          title: 'Directorate of Medical Services Operating Licence 2026',
          docType: 'HOSPITAL_LICENCE',
          url: '/api/v1/doctor/documents/download?token=demo_ganga_lic',
          uploadedAt: new Date(Date.now() - 36 * 3600 * 1000),
          status: 'PENDING'
        },
        {
          title: 'Fire Safety and Biomedical Waste Authorization Seal',
          docType: 'FIRE_AND_POLLUTION_NOC',
          url: '/api/v1/doctor/documents/download?token=demo_ganga_noc',
          uploadedAt: new Date(Date.now() - 36 * 3600 * 1000),
          status: 'PENDING'
        }
      ]
    });

    // Create admin user for Ganga Hospital
    await User.create({
      email: 'admin.ganga@medibridge.org',
      phone: '+919876500091',
      password: 'AdminPass123!',
      role: 'hospital_admin',
      hospitalId: gangaHospital._id,
      accountStatus: 'ACTIVE'
    });

    const childTrustHospital = await Hospital.create({
      name: 'Coimbatore Child Trust Hospital (R.S. Puram)',
      licenseNumber: 'LIC-TN-CBE-052',
      type: 'private',
      location: { type: 'Point', coordinates: [76.9482, 11.0084] },
      address: {
        street: 'DB Road, R.S. Puram West',
        area: 'R.S. Puram',
        city: 'Coimbatore',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641002'
      },
      phone: '+914222543322',
      emergencyPhone: '108',
      email: 'contact@childtrust-demo.org',
      website: 'https://childtrusthospital.org',
      operatingHours: '24/7 Pediatric Emergency & OPD (09:00 - 21:00)',
      schemesSupported: ['cmchis', 'private_hdfc'],
      bedCapacity: {
        general: { total: 85, available: 16, lastUpdated: new Date() },
        icu: { total: 14, available: 3, lastUpdated: new Date() }
      },
      approvalStatus: 'UNDER_REVIEW',
      accountStatus: 'INACTIVE',
      isVerified: false,
      documents: [
        {
          title: 'Clinical Establishment Licence',
          docType: 'HOSPITAL_LICENCE',
          url: '/api/v1/doctor/documents/download?token=demo_child_lic',
          uploadedAt: new Date(Date.now() - 72 * 3600 * 1000),
          status: 'PENDING'
        },
        {
          title: 'NABH Accreditation Quality Audit Statement',
          docType: 'NABH_CERTIFICATE',
          url: '/api/v1/doctor/documents/download?token=demo_child_nabh',
          uploadedAt: new Date(Date.now() - 72 * 3600 * 1000),
          status: 'PENDING'
        }
      ]
    });

    await User.create({
      email: 'admin.childtrust@medibridge.org',
      phone: '+919876500092',
      password: 'AdminPass123!',
      role: 'hospital_admin',
      hospitalId: childTrustHospital._id,
      accountStatus: 'ACTIVE'
    });

    const annurPHC = await Hospital.create({
      name: 'Annur Community Rural Health Center',
      licenseNumber: 'LIC-TN-ANN-012',
      type: 'phc',
      location: { type: 'Point', coordinates: [77.1352, 11.2334] },
      address: {
        street: 'Main Bus Stand Road',
        area: 'Annur North',
        city: 'Annur',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641653'
      },
      phone: '+914254262100',
      emergencyPhone: '108',
      email: 'phc.annur@tnhealth-demo.gov.in',
      website: null,
      operatingHours: '24/7 Primary Emergency & Maternity Care',
      schemesSupported: ['cmchis', 'pmjay'],
      bedCapacity: {
        general: { total: 30, available: 8, lastUpdated: new Date() },
        icu: { total: 2, available: 1, lastUpdated: new Date() }
      },
      approvalStatus: 'ADDITIONAL_INFO_REQUIRED',
      infoRequiredNote: 'Please provide the updated District Medical Officer water testing and auxiliary power generator inspection certificate.',
      accountStatus: 'INACTIVE',
      isVerified: false,
      documents: [
        {
          title: 'Government Primary Health Centre Establishment Gazette',
          docType: 'GAZETTE_NOTIFICATION',
          url: '/api/v1/doctor/documents/download?token=demo_annur_gaz',
          uploadedAt: new Date(Date.now() - 120 * 3600 * 1000),
          status: 'VERIFIED'
        }
      ]
    });

    await User.create({
      email: 'admin.annurphc@medibridge.org',
      phone: '+919876500093',
      password: 'AdminPass123!',
      role: 'hospital_admin',
      hospitalId: annurPHC._id,
      accountStatus: 'ACTIVE'
    });
  }

  // 3. Seed Platform Incidents
  const existingIncident = await PlatformIncident.findOne({ incidentNumber: 'INC-2026-001' });
  if (!existingIncident) {
    console.log('[SuperAdmin Seed] Creating platform incidents...');
    await PlatformIncident.create({
      incidentNumber: 'INC-2026-001',
      service: 'Teleconsultation WebRTC Gateway',
      severity: 'MEDIUM',
      title: 'Intermittent WebRTC ICE Candidate Latency Detected on BSNL Broadband Routes',
      description: 'Peer-to-peer audio-video stream connection initialization experiencing 1.8s delay during evening OPD peaks across tier-2 district PHC nodes.',
      status: 'OPEN',
      assignedTo: 'Teleconsult DevOps Pod',
      firstDetectedAt: new Date(Date.now() - 4 * 3600 * 1000),
      lastUpdatedAt: new Date(Date.now() - 1 * 3600 * 1000),
      internalNotes: [
        {
          note: 'Monitoring alert triggered by WebRTC STUN relay ping latency > 1200ms.',
          authorName: 'System Monitor',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000)
        },
        {
          note: 'Failover route via Chennai TURN cluster configured to stabilize packet throughput.',
          authorName: 'superadmin@medibridge.org',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000)
        }
      ]
    });

    await PlatformIncident.create({
      incidentNumber: 'INC-2026-002',
      service: 'Notification Delivery Service',
      severity: 'LOW',
      title: 'SMS Gateway Gateway Alpha Failover to Gateway Beta Completed',
      description: 'Scheduled provider route maintenance executed with zero patient notification drops.',
      status: 'RESOLVED',
      assignedTo: 'Infrastructure Team',
      firstDetectedAt: new Date(Date.now() - 28 * 3600 * 1000),
      lastUpdatedAt: new Date(Date.now() - 22 * 3600 * 1000),
      resolvedAt: new Date(Date.now() - 22 * 3600 * 1000),
      resolutionDetails: 'Route rebalanced successfully across dual telecom SMS aggregator channels.',
      internalNotes: [
        {
          note: 'Scheduled switchover confirmed successful.',
          authorName: 'superadmin@medibridge.org',
          timestamp: new Date(Date.now() - 22 * 3600 * 1000)
        }
      ]
    });
  }

  // 4. Ensure Super Admin user has lastLoginAt and active status
  await User.updateMany(
    { role: 'super_admin' },
    { $set: { accountStatus: 'ACTIVE', isActive: true, isEmailVerified: true, lastLoginAt: new Date() } }
  );

  console.log('[SuperAdmin Seed] Super Admin initial platform data seeded successfully!');
  await disconnectDB();
}

if (require.main === module) {
  seedSuperAdminData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SuperAdmin Seed] Error:', err);
      process.exit(1);
    });
}

module.exports = seedSuperAdminData;
