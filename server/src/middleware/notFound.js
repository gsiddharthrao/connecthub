const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NotFoundError',
    message: `Not found - ${req.originalUrl}`,
  });
};

module.exports = notFound;
