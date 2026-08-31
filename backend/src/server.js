const express = require('express');
const { sequelize, syncDatabase } = require('./models');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const contractRoutes = require('./routes/contractRoutes');
const approvalRoutes = require('./routes/approvalRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { validateConfig } = require('./utils/configValidator');
const smtpConfigService = require('./utils/smtpConfigService');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'JH Contract Builder API Docs'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/approvals', approvalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'JH Contract Builder API is running' });
});

// Error handling middleware
app.use(errorHandler);

// PostgreSQL connection and sync
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established successfully');
    console.log('✓ PostgreSQL connection established successfully');

    // Sync database models
    await syncDatabase({ alter: process.env.NODE_ENV === 'development' });
    
    // Initialize SMTP service and validate configuration
    console.log(''); // Empty line for better readability
    smtpConfigService.initializeSMTPService();
    const configStatus = validateConfig();
    
    // Warning if no minimal config
    if (!configStatus.hasMinimalConfig) {
      logger.warn('⚠️  Server starting without complete notification configuration');
      logger.warn('   Notifications may fail. Please configure at least one SMTP provider.');
    }
    
    const PORT = process.env.PORT || 5001;
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
