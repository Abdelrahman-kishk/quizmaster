class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Standardized JSON error envelope for every failure in the app.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  if (statusCode >= 500) console.error('[error]', err);
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      details: err.details || undefined,
    },
  });
}

module.exports = { ApiError, notFound, errorHandler };
