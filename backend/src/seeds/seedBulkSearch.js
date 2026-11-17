const mongoose = require('mongoose');
const config = require('../config');
const { connectDB, disconnectDB } = require('../config/database');
const Hospital = require('../models/Hospital');
const Service = require('../models/Service');
const Slot = require('../models/Slot');

// Seed 1,000 realistic healthcare nodes across Tamil Nadu & neighbouring regions
async function seedBulkSearch(count = 1000) {
  console.log(`[BulkSeed] Connecting to MongoDB to seed ${count} hospitals...`);
  await connectDB(config.mongoUri);

  const districts = [
    { name: 'Coimbatore', centerLat: 11.0168, centerLng: 76.9558 },
    { name: 'Tiruppur', centerLat: 11.1085, centerLng: 77.3411 },
    { name: 'Erode', centerLat: 11.3410, centerLng: 77.7172 },
    { name: 'Salem', centerLat: 11.6643, centerLng: 78.1460 },
    { name: 'Madurai', centerLat: 9.9252, centerLng: 78.1198 },
    { name: 'Trichy', centerLat: 10.7905, centerLng: 78.7047 },
    { name: 'Chennai', centerLat: 13.0827, centerLng: 80.2707 },
    { name: 'Dindigul', centerLat: 10.3673, centerLng: 77.9803 }
  ];

  const hospitalTypes = ['private', 'tertiary', 'district_hq', 'phc'];
  const specialties = ['Cardiology', 'Neurology', 'Radiology', 'General Medicine', 'Orthopedics', 'Pediatrics'];
  const schemes = ['pmjay', 'cmchis', 'private_star', 'none'];

  const hospitalsToInsert = [];
  const baseDate = new Date().toISOString().split('T')[0];

  for (let i = 1; i <= count; i++) {
    const district = districts[i % districts.length];
    // Jitter coordinates within ~25km radius
    const latJitter = (Math.random() - 0.5) * 0.4;
    const lngJitter = (Math.random() - 0.5) * 0.4;
    const lat = parseFloat((district.centerLat + latJitter).toFixed(6));
    const lng = parseFloat((district.centerLng + lngJitter).toFixed(6));

    const totalBeds = Math.floor(Math.random() * 200) + 20;
    const availBeds = Math.floor(Math.random() * totalBeds * 0.4);
    const totalIcu = Math.floor(Math.random() * 30) + 4;
    const availIcu = Math.floor(Math.random() * totalIcu * 0.3);

    hospitalsToInsert.push({
      name: `${district.name} Healthcare Facility #${i}`,
      licenseNumber: `LIC-TN-PERF-${String(i).padStart(4, '0')}`,
      type: hospitalTypes[i % hospitalTypes.length],
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      address: {
        street: `Main Road #${i % 50 + 1}`,
        area: `${district.name} Sector ${i % 10 + 1}`,
        city: district.name,
        district: district.name,
        state: 'Tamil Nadu',
        pincode: `64${String(1000 + (i % 900)).padStart(4, '0')}`
      },
      phone: `+91422${String(100000 + i).slice(0, 6)}`,
      emergencyPhone: '108',
      schemesSupported: [schemes[i % schemes.length]],
      bedCapacity: {
        general: { total: totalBeds, available: availBeds, lastUpdated: new Date() },
        icu: { total: totalIcu, available: availIcu, lastUpdated: new Date() }
      },
      emergencyAvailable: true,
      isVerified: true
    });
  }

  console.log(`[BulkSeed] Inserting ${hospitalsToInsert.length} hospital documents...`);
  const insertedHospitals = await Hospital.insertMany(hospitalsToInsert);
  await Hospital.createIndexes();
  console.log(`[BulkSeed] Successfully inserted ${insertedHospitals.length} hospitals with 2dsphere indexes!`);

  // Insert a sample set of services & slots
  const servicesToInsert = [];
  const slotsToInsert = [];

  for (let i = 0; i < 200; i++) {
    const h = insertedHospitals[i];
    const spec = specialties[i % specialties.length];
    const sId = new mongoose.Types.ObjectId();

    servicesToInsert.push({
      _id: sId,
      hospitalId: h._id,
      name: `${spec} Consultation`,
      code: `SRV-PERF-${i}`,
      category: 'consultation',
      specialty: spec,
      price: 300 + (i % 10) * 50,
      operatingDays: [1, 2, 3, 4, 5, 6]
    });

    slotsToInsert.push({
      hospitalId: h._id,
      serviceId: sId,
      date: baseDate,
      startTime: '10:00',
      endTime: '10:30',
      status: 'AVAILABLE'
    });
  }

  await Service.insertMany(servicesToInsert);
  await Slot.insertMany(slotsToInsert);
  console.log('[BulkSeed] Inserted supporting services and slots for performance benchmark.');

  await disconnectDB();
}

if (require.main === module) {
  seedBulkSearch(1000)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[BulkSeed] Error:', err);
      process.exit(1);
    });
}

module.exports = seedBulkSearch;
