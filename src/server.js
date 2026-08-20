require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const reviewRoutes = require('./api/review');
const webhookRoutes = require('./api/webhooks');
const templateRoutes = require('./api/templates');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/review', reviewRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'Bluebeam Copilot Reviewer',
    version: '1.0.0',
    endpoints: {
      review: {
        POST: '/api/review - Submit PDF for review',
        GET: '/api/review/:id - Get review results'
      },
      templates: {
        GET: '/api/templates - List available templates',
        POST: '/api/templates - Create custom template'
      },
      webhooks: {
        POST: '/api/webhooks/file-uploaded - Webhook for file uploads'
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Bluebeam Copilot Reviewer running on http://localhost:${PORT}`);
  logger.info(`API docs available at http://localhost:${PORT}/api`);
});

module.exports = app;
