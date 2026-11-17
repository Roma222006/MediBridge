const { v4: uuidv4 } = require('uuid');

function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  req.startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    // Log structured message, omitting any sensitive medical or auth payloads
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        JSON.stringify({
          time: new Date().toISOString(),
          requestId,
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: duration,
          ip: req.ip
        })
      );
    }
  });

  next();
}

module.exports = requestLogger;
