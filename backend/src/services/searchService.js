const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Slot = require('../models/Slot');
const AuditLog = require('../models/AuditLog');

class SearchService {
  async searchHospitals({
    lat,
    lng,
    radiusKm = 50,
    specialty,
    serviceQuery,
    scheme,
    maxPrice,
    date,
    query,
    sortBy = 'distance'
  }) {
    let hospitalFilter = { isVerified: true };

    if (query) {
      hospitalFilter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { 'address.city': { $regex: query, $options: 'i' } },
        { 'address.district': { $regex: query, $options: 'i' } }
      ];
    }

    if (scheme && scheme !== 'all') {
      hospitalFilter.schemesSupported = scheme;
    }

    let hospitals = [];
    const hasCoordinates = lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng));
    const pageLimit = 25; // Strict pagination limit to eliminate payload bloat

    if (hasCoordinates) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const maxDistanceMeters = parseFloat(radiusKm) * 1000;

      try {
        await Hospital.createIndexes();
        // Aggregation pipeline with $geoNear and limit
        const pipeline = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [parsedLng, parsedLat]
              },
              distanceField: 'distanceMeters',
              maxDistance: maxDistanceMeters,
              spherical: true,
              query: hospitalFilter
            }
          },
          { $limit: pageLimit }
        ];

        hospitals = await Hospital.aggregate(pipeline);
      } catch (geoErr) {
        // Fallback: Haversine distance formula if 2dsphere is still initializing
        const allHospitals = await Hospital.find(hospitalFilter).lean();
        hospitals = allHospitals
          .map((h) => {
            const [hLng, hLat] = h.location.coordinates;
            const dLat = ((hLat - parsedLat) * Math.PI) / 180;
            const dLng = ((hLng - parsedLng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((parsedLat * Math.PI) / 180) *
                Math.cos((hLat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distMeters = 6371000 * c;
            return { ...h, distanceMeters: distMeters };
          })
          .filter((h) => h.distanceMeters <= maxDistanceMeters)
          .sort((a, b) => a.distanceMeters - b.distanceMeters)
          .slice(0, pageLimit);
      }
    } else {
      hospitals = await Hospital.find(hospitalFilter).limit(pageLimit).lean();
    }

    if (hospitals.length === 0) {
      return [];
    }

    // BATCH QUERY TO ELIMINATE N+1 QUERIES:
    const hospitalIds = hospitals.map((h) => h._id);
    const todayStr = date || new Date().toISOString().split('T')[0];

    const serviceFilter = { hospitalId: { $in: hospitalIds }, isActive: true };
    if (specialty) serviceFilter.specialty = { $regex: specialty, $options: 'i' };
    if (serviceQuery) serviceFilter.name = { $regex: serviceQuery, $options: 'i' };
    if (maxPrice) serviceFilter.price = { $lte: parseFloat(maxPrice) };

    const [batchServices, batchDoctors, batchSlots] = await Promise.all([
      Service.find(serviceFilter).lean(),
      Doctor.find({
        hospitalId: { $in: hospitalIds },
        isActive: true,
        verificationStatus: { $in: ['VERIFIED', 'DEMO_NOT_VERIFIED'] }
      }).lean(),
      Slot.find({
        hospitalId: { $in: hospitalIds },
        date: { $gte: todayStr },
        status: 'AVAILABLE'
      })
        .sort({ date: 1, startTime: 1 })
        .lean()
    ]);

    // Group by hospitalId in O(1) map
    const servicesByHospital = new Map();
    const doctorsByHospital = new Map();
    const nextSlotByHospital = new Map();

    batchServices.forEach((s) => {
      const hId = s.hospitalId.toString();
      if (!servicesByHospital.has(hId)) servicesByHospital.set(hId, []);
      servicesByHospital.get(hId).push(s);
    });

    batchDoctors.forEach((d) => {
      const hId = d.hospitalId.toString();
      if (!doctorsByHospital.has(hId)) doctorsByHospital.set(hId, []);
      doctorsByHospital.get(hId).push(d);
    });

    batchSlots.forEach((slot) => {
      const hId = slot.hospitalId.toString();
      if (!nextSlotByHospital.has(hId)) {
        nextSlotByHospital.set(hId, slot); // first one is earliest due to sort
      }
    });

    // Process each hospital using in-memory grouped data
    const results = [];

    for (const hospital of hospitals) {
      const hIdStr = hospital._id.toString();
      const services = servicesByHospital.get(hIdStr) || [];
      const doctors = doctorsByHospital.get(hIdStr) || [];

      // If specialty or service was specified and neither services nor doctors matched, skip this hospital
      if ((specialty || serviceQuery || maxPrice) && services.length === 0 && doctors.length === 0) {
        continue;
      }

      const nextSlot = nextSlotByHospital.get(hIdStr) || null;

      // Bed freshness check
      const lastUpdated = hospital.bedCapacity?.general?.lastUpdated || hospital.updatedAt;
      const minutesAgo = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (60 * 1000));
      const isStale = minutesAgo > 120; // Warn if data is older than 2 hours

      const distanceKm = hospital.distanceMeters !== undefined
        ? parseFloat((hospital.distanceMeters / 1000).toFixed(1))
        : null;

      // Lowest consultation or service price
      const minPrice = services.length > 0
        ? Math.min(...services.map((s) => s.price))
        : (doctors.length > 0 ? Math.min(...doctors.map((d) => d.consultationFee)) : 0);

      results.push({
        id: hospital._id,
        name: hospital.name,
        type: hospital.type,
        address: hospital.address,
        phone: hospital.phone,
        emergencyPhone: hospital.emergencyPhone,
        schemesSupported: hospital.schemesSupported,
        bedCapacity: {
          general: {
            ...hospital.bedCapacity.general,
            minutesAgo: Math.floor((Date.now() - new Date(hospital.bedCapacity.general.lastUpdated).getTime()) / 60000)
          },
          icu: {
            ...hospital.bedCapacity.icu,
            minutesAgo: Math.floor((Date.now() - new Date(hospital.bedCapacity.icu.lastUpdated).getTime()) / 60000)
          },
          isStale
        },
        distanceKm,
        servicesCount: services.length,
        servicesSample: services.slice(0, 3).map((s) => ({
          id: s._id,
          name: s.name,
          specialty: s.specialty,
          price: s.price,
          operatingDays: s.operatingDays
        })),
        doctorsCount: doctors.length,
        minPrice,
        nextAvailableSlot: nextSlot
          ? {
              id: nextSlot._id,
              date: nextSlot.date,
              startTime: nextSlot.startTime,
              type: nextSlot.type
            }
          : null
      });
    }

    // Sort results
    if (sortBy === 'price') {
      results.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sortBy === 'next_slot') {
      results.sort((a, b) => {
        if (!a.nextAvailableSlot) return 1;
        if (!b.nextAvailableSlot) return -1;
        return (a.nextAvailableSlot.date + a.nextAvailableSlot.startTime).localeCompare(
          b.nextAvailableSlot.date + b.nextAvailableSlot.startTime
        );
      });
    } else {
      // Default: distance
      if (hasCoordinates) {
        results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }
    }

    return results;
  }

  async getHospitalDetails(hospitalId) {
    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) {
      const err = new Error('Hospital not found.');
      err.code = 'HOSPITAL_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const services = await Service.find({ hospitalId, isActive: true }).lean();
    const doctors = await Doctor.find({
      hospitalId,
      isActive: true,
      verificationStatus: { $in: ['VERIFIED', 'DEMO_NOT_VERIFIED'] }
    }).lean();

    const lastUpdated = hospital.bedCapacity?.general?.lastUpdated || hospital.updatedAt;
    const minutesAgo = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (60 * 1000));

    return {
      hospital: {
        ...hospital,
        bedCapacity: {
          ...hospital.bedCapacity,
          minutesAgo,
          isStale: minutesAgo > 120
        }
      },
      services,
      doctors
    };
  }

  async getAvailableSlots({ hospitalId, serviceId, doctorId, date }) {
    const filter = {
      hospitalId,
      date,
      $or: [
        { status: 'AVAILABLE' },
        { status: 'HOLD', holdExpiresAt: { $lt: new Date() } }
      ]
    };

    if (serviceId) filter.serviceId = serviceId;
    if (doctorId) filter.doctorId = doctorId;

    let slots = await Slot.find(filter)
      .populate('doctorId', 'name specialty qualifications regNumber consultationFee')
      .populate('serviceId', 'name specialty price category')
      .sort({ startTime: 1 })
      .lean();

    // If no slots exist for this provider/service on this date, auto-provision standard clinic consultation slots
    if (slots.length === 0) {
      const standardTimes = [
        { startTime: '09:00', endTime: '09:30' },
        { startTime: '09:30', endTime: '10:00' },
        { startTime: '10:00', endTime: '10:30' },
        { startTime: '10:30', endTime: '11:00' },
        { startTime: '11:00', endTime: '11:30' },
        { startTime: '11:30', endTime: '12:00' },
        { startTime: '14:00', endTime: '14:30' },
        { startTime: '14:30', endTime: '15:00' },
        { startTime: '15:00', endTime: '15:30' },
        { startTime: '15:30', endTime: '16:00' },
        { startTime: '16:00', endTime: '16:30' },
        { startTime: '16:30', endTime: '17:00' }
      ];

      const slotDocs = standardTimes.map((t) => ({
        hospitalId,
        doctorId: doctorId || null,
        serviceId: serviceId || null,
        date,
        startTime: t.startTime,
        endTime: t.endTime,
        type: doctorId ? 'consultation_in_person' : 'procedure_scan',
        status: 'AVAILABLE'
      }));

      try {
        await Slot.insertMany(slotDocs, { ordered: false });
      } catch (err) {
        // Ignore duplicate key or parallel insert race
      }

      slots = await Slot.find(filter)
        .populate('doctorId', 'name specialty qualifications regNumber consultationFee')
        .populate('serviceId', 'name specialty price category')
        .sort({ startTime: 1 })
        .lean();
    }

    return slots;
  }

  async updateBedCapacity(hospitalId, { general, icu }, actorUser, io) {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      const err = new Error('Hospital not found.');
      err.code = 'HOSPITAL_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    if (general) {
      if (general.total !== undefined) hospital.bedCapacity.general.total = general.total;
      if (general.available !== undefined) hospital.bedCapacity.general.available = general.available;
      hospital.bedCapacity.general.lastUpdated = now;
    }

    if (icu) {
      if (icu.total !== undefined) hospital.bedCapacity.icu.total = icu.total;
      if (icu.available !== undefined) hospital.bedCapacity.icu.available = icu.available;
      hospital.bedCapacity.icu.lastUpdated = now;
    }

    await hospital.save();

    await AuditLog.create({
      eventType: 'BED_CAPACITY_UPDATED',
      actorId: actorUser._id,
      actorRole: actorUser.role,
      hospitalId: hospital._id,
      resourceType: 'Hospital',
      resourceId: hospital._id.toString(),
      action: 'UPDATE_CAPACITY',
      status: 'EXECUTED',
      metadata: { general: hospital.bedCapacity.general, icu: hospital.bedCapacity.icu }
    });

    // Real-time broadcast
    if (io) {
      io.to(`hospital:${hospitalId}`).emit('availability_updated', {
        hospitalId,
        bedCapacity: hospital.bedCapacity
      });
      io.emit('hospital_bed_changed', {
        hospitalId,
        bedCapacity: hospital.bedCapacity
      });
    }

    return hospital.bedCapacity;
  }
}

module.exports = new SearchService();
