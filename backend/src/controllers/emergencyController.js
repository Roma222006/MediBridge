const Hospital = require('../models/Hospital');

class EmergencyController {
  async getNearestHospitals(req, res, next) {
    try {
      const { lat, lng, district } = req.query;
      let query = { emergencyAvailable: true, isVerified: true };

      if (district) {
        query['address.district'] = { $regex: district, $options: 'i' };
      }

      let hospitals = [];
      const hasCoords = lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng));

      if (hasCoords) {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);

        try {
          await Hospital.createIndexes();
          hospitals = await Hospital.aggregate([
            {
              $geoNear: {
                near: { type: 'Point', coordinates: [parsedLng, parsedLat] },
                distanceField: 'distanceMeters',
                maxDistance: 100000, // 100km radius
                spherical: true,
                query
              }
            },
            { $limit: 10 }
          ]);
        } catch (geoErr) {
          // Haversine fallback
          const all = await Hospital.find(query).lean();
          hospitals = all
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
              return { ...h, distanceMeters: 6371000 * c };
            })
            .sort((a, b) => a.distanceMeters - b.distanceMeters)
            .slice(0, 10);
        }
      } else {
        // Fallback: list top hospitals by district or all emergency facilities
        hospitals = await Hospital.find(query).limit(10).lean();
      }

      const results = hospitals.map((h) => {
        const genLastUpdated = h.bedCapacity?.general?.lastUpdated || h.updatedAt;
        const icuLastUpdated = h.bedCapacity?.icu?.lastUpdated || h.updatedAt;
        const genMinutesAgo = Math.floor((Date.now() - new Date(genLastUpdated).getTime()) / 60000);
        const icuMinutesAgo = Math.floor((Date.now() - new Date(icuLastUpdated).getTime()) / 60000);

        return {
          id: h._id,
          name: h.name,
          type: h.type,
          address: h.address,
          phone: h.phone,
          emergencyPhone: h.emergencyPhone || '108',
          distanceKm: h.distanceMeters !== undefined ? parseFloat((h.distanceMeters / 1000).toFixed(1)) : null,
          bedCapacity: {
            general: {
              ...h.bedCapacity.general,
              minutesAgo: genMinutesAgo
            },
            icu: {
              ...h.bedCapacity.icu,
              minutesAgo: icuMinutesAgo
            },
            disclaimer: `Reported capacity as of ${Math.max(genMinutesAgo, icuMinutesAgo)} min ago. Confirm directly with casualty triage.`,
            isStale: genMinutesAgo > 120 || icuMinutesAgo > 120
          }
        };
      });

      res.json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }

  async getOfflineBundle(req, res, next) {
    try {
      const emergencyCenters = await Hospital.find({
        emergencyAvailable: true,
        isVerified: true
      })
        .select('name phone emergencyPhone address bedCapacity location type')
        .limit(20)
        .lean();

      res.json({
        success: true,
        generatedAt: new Date().toISOString(),
        emergencyDial: '108',
        centers: emergencyCenters
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmergencyController();
