const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/webhooks/file-uploaded - Handle file uploads from external systems
 */
router.post('/file-uploaded', upload.single('file'), async (req, res) => {
  try {
    const webhookSecret = req.headers['x-webhook-secret'];
    
    // Verify webhook secret
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { source, projectId, metadata } = req.body;
    
    logger.info(`Webhook received: ${source} - ${req.file.originalname}`);

    // Trigger review
    const reviewId = uuidv4();
    // In production, trigger the review processing here

    res.json({
      status: 'received',
      reviewId,
      source,
      file: req.file.originalname
    });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

module.exports = router;
