const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);
  }

  // 1. Mongoose Bad ObjectId (CastError) -> 400
  if (err.name === 'CastError') {
    const message = `Resource not found with invalid id: ${err.value}`;
    return res.status(400).json({
      success: false,
      error: 'CastError',
      message,
    });
  }

  // 2. Mongoose Duplicate Key Error (Code 11000) -> 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return res.status(409).json({
      success: false,
      error: 'DuplicateField',
      message,
    });
  }

  // 3. Mongoose Validation Error -> 400
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Validation failed',
      details,
    });
  }

  // 4. JWT Errors -> 401
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }

  // 5. Custom AppError status code or default 500
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    message: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  });
};

module.exports = errorHandler;
