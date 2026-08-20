const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { parsePDF } = require('../core/pdf-parser');
const { reviewDocument } = require('../core/ai-reviewer');
const logger = require('../utils/logger');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const reviews = new Map(); // In-memory store (replace with database in production)

/**
 * POST /api/review - Submit PDF for review
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const reviewId = uuidv4();
    const { template = 'general', detailLevel = 'standard', prompt } = req.body;

    // Start async processing
    processReview(reviewId, req.file.path, {
      template,
      detailLevel,
      customPrompt: prompt,
      originalFilename: req.file.originalname
    });

    res.json({
      status: 'processing',
      reviewId,
      message: 'Review started. Check status with GET /api/review/' + reviewId
    });
  } catch (error) {
    logger.error('Error in review endpoint:', error);
    res.status(500).json({ error: 'Error processing review' });
  }
});

/**
 * GET /api/review/:id - Get review results
 */
router.get('/:id', (req, res) => {
  const review = reviews.get(req.params.id);
  
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  if (review.status === 'processing') {
    return res.json({ status: 'processing' });
  }

  res.json(review);
});

/**
 * Process review asynchronously
 */
async function processReview(reviewId, filePath, metadata) {
  try {
    // Parse PDF
    const pdfResult = await parsePDF(filePath);
    
    if (!pdfResult.success) {
      reviews.set(reviewId, {
        status: 'error',
        error: 'Failed to parse PDF',
        reviewId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Review with AI
    const reviewResult = await reviewDocument(pdfResult.text, {
      template: metadata.template,
      detailLevel: metadata.detailLevel,
      customPrompt: metadata.customPrompt
    });

    // Parse AI response (attempt JSON, fallback to text)
    let analysis = reviewResult.analysis;
    try {
      analysis = JSON.parse(analysis);
    } catch (e) {
      // Keep as text if not valid JSON
    }

    // Store results
    reviews.set(reviewId, {
      status: 'complete',
      reviewId,
      fileName: metadata.originalFilename,
      documentMetadata: pdfResult.metadata,
      analysis,
      model: reviewResult.model,
      tokens: reviewResult.tokens,
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now()
    });

    logger.info(`Review ${reviewId} completed`);

    // Cleanup
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      logger.warn('Could not delete temp file:', e);
    }
  } catch (error) {
    logger.error(`Error processing review ${reviewId}:`, error);
    reviews.set(reviewId, {
      status: 'error',
      error: error.message,
      reviewId,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = router;
