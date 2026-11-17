const searchService = require('../services/searchService');

class SearchController {
  async search(req, res, next) {
    try {
      const results = await searchService.searchHospitals(req.query);
      res.json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }

  async getHospitalDetails(req, res, next) {
    try {
      const result = await searchService.getHospitalDetails(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getSlots(req, res, next) {
    try {
      const { hospitalId, serviceId, doctorId, date } = req.query;
      if (!hospitalId || !date) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'hospitalId and date are required query parameters.' }
        });
      }

      const slots = await searchService.getAvailableSlots({
        hospitalId,
        serviceId,
        doctorId,
        date
      });

      res.json({
        success: true,
        count: slots.length,
        data: slots
      });
    } catch (err) {
      next(err);
    }
  }

  async updateBedCapacity(req, res, next) {
    try {
      const io = req.app.get('io');
      const updatedCapacity = await searchService.updateBedCapacity(
        req.params.id,
        req.body,
        req.user,
        io
      );

      res.json({
        success: true,
        message: 'Bed capacity updated successfully.',
        data: updatedCapacity
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SearchController();
