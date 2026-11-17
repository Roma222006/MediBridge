const IdempotencyRecord = require('../models/IdempotencyRecord');

function idempotencyMiddleware(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key || !req.user) {
    return next();
  }

  const userId = req.user._id;

  IdempotencyRecord.findOne({ key, userId })
    .then((existingRecord) => {
      if (existingRecord) {
        if (existingRecord.status === 'COMPLETED') {
          res.setHeader('X-Cache-Lookup', 'HIT');
          res.setHeader('Idempotency-Key', key);
          return res.status(existingRecord.statusCode).json(existingRecord.responseBody);
        }

        if (existingRecord.status === 'PROCESSING') {
          return res.status(409).json({
            success: false,
            error: {
              code: 'REQUEST_IN_PROGRESS',
              message: 'A concurrent request with this Idempotency-Key is currently being processed.'
            }
          });
        }
      }

      // Record new processing attempt
      IdempotencyRecord.create({
        key,
        userId,
        endpoint: req.originalUrl,
        status: 'PROCESSING'
      })
        .then(() => {
          // Intercept res.json to capture output
          const originalJson = res.json.bind(res);
          res.json = (body) => {
            if (res.statusCode < 500) {
              IdempotencyRecord.updateOne(
                { key, userId },
                {
                  $set: {
                    status: 'COMPLETED',
                    statusCode: res.statusCode,
                    responseBody: body
                  }
                }
              ).catch((err) => console.error('[Idempotency] Failed to store record:', err.message));
            } else {
              // Delete or mark failed so it can be retried cleanly
              IdempotencyRecord.deleteOne({ key, userId }).catch(() => {});
            }
            return originalJson(body);
          };

          next();
        })
        .catch((err) => {
          if (err.code === 11000) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'REQUEST_IN_PROGRESS',
                message: 'Concurrent request detected for this Idempotency-Key.'
              }
            });
          }
          next(err);
        });
    })
    .catch((err) => next(err));
}

module.exports = idempotencyMiddleware;
