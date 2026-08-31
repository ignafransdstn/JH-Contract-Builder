const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors ? err.errors.map(e => e.message).join(', ') : 'Data duplikat';
    error = { message, statusCode: 400 };
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors ? err.errors.map(e => e.message).join(', ') : 'Validasi gagal';
    error = { message, statusCode: 400 };
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referensi data tidak valid atau data terkait masih digunakan';
    error = { message, statusCode: 400 };
  }

  // Sequelize database error (e.g. wrong data type)
  if (err.name === 'SequelizeDatabaseError') {
    const message = 'Terjadi kesalahan pada database';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
