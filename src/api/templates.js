const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

const templates = {
  architecture: {
    name: 'Architectural Plans',
    description: 'Review architectural drawings and plans',
    focus: ['design-consistency', 'code-compliance', 'dimensions', 'materials'],
    detailLevels: ['summary', 'standard', 'detailed']
  },
  structural: {
    name: 'Structural Drawings',
    description: 'Review structural engineering drawings',
    focus: ['load-paths', 'connections', 'materials', 'safety'],
    detailLevels: ['summary', 'standard', 'detailed']
  },
  mep: {
    name: 'MEP Systems',
    description: 'Review mechanical, electrical, and plumbing systems',
    focus: ['system-integration', 'conflicts', 'capacity', 'coordination'],
    detailLevels: ['summary', 'standard', 'detailed']
  },
  general: {
    name: 'General Document',
    description: 'General document review',
    focus: ['content', 'clarity', 'completeness'],
    detailLevels: ['summary', 'standard', 'detailed']
  }
};

/**
 * GET /api/templates - List available templates
 */
router.get('/', (req, res) => {
  res.json({
    templates: Object.entries(templates).map(([key, value]) => ({
      id: key,
      ...value
    }))
  });
});

/**
 * GET /api/templates/:id - Get specific template
 */
router.get('/:id', (req, res) => {
  const template = templates[req.params.id];
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({
    id: req.params.id,
    ...template
  });
});

module.exports = router;
