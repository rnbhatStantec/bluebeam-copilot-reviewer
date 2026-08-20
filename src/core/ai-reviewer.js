const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

/**
 * Initialize AI client based on model selection
 */
function initializeAIClient() {
  const model = process.env.AI_MODEL || 'claude';
  
  if (model === 'claude') {
    return {
      type: 'claude',
      client: new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY
      })
    };
  } else if (model.startsWith('gpt')) {
    // OpenAI implementation would go here
    return {
      type: 'openai',
      client: null // To be implemented
    };
  }
  
  throw new Error(`Unsupported AI model: ${model}`);
}

/**
 * Review PDF content with AI
 */
async function reviewDocument(pdfText, options = {}) {
  try {
    const {
      template = 'general',
      detailLevel = process.env.REVIEW_DETAIL_LEVEL || 'standard',
      customPrompt = null,
      customRules = []
    } = options;

    const aiClient = initializeAIClient();
    
    if (aiClient.type === 'claude') {
      return await reviewWithClaude(aiClient.client, pdfText, {
        template,
        detailLevel,
        customPrompt,
        customRules
      });
    }
    
    throw new Error(`AI provider ${aiClient.type} not yet implemented`);
  } catch (error) {
    logger.error('Error reviewing document:', error);
    throw error;
  }
}

/**
 * Review document using Claude API
 */
async function reviewWithClaude(client, pdfText, options) {
  const { template, detailLevel, customPrompt, customRules } = options;
  
  const systemPrompt = buildSystemPrompt(template, detailLevel, customRules);
  const userPrompt = customPrompt || buildUserPrompt(pdfText, template);
  
  const message = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });
  
  return {
    success: true,
    analysis: message.content[0].text,
    model: 'claude-3-opus',
    tokens: {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens
    }
  };
}

/**
 * Build system prompt based on template
 */
function buildSystemPrompt(template, detailLevel, customRules) {
  const basePrompt = `You are an expert document reviewer for architectural and engineering documents. 
Your task is to analyze PDF documents and provide constructive feedback.`;
  
  let templatePrompt = '';
  
  switch (template) {
    case 'architecture':
      templatePrompt = `
Focus on architectural aspects including:
- Design consistency and coherence
- Code compliance (building codes, accessibility, etc.)
- Dimensional accuracy and clarity
- Material specifications
- Constructability concerns`;
      break;
    case 'structural':
      templatePrompt = `
Focus on structural aspects including:
- Load path verification
- Connection details
- Material specifications
- Code compliance (structural codes)
- Safety considerations`;
      break;
    case 'mep':
      templatePrompt = `
Focus on MEP (Mechanical, Electrical, Plumbing) systems including:
- System integration and conflicts
- Code compliance
- Capacity and sizing verification
- Coordination with structural and architectural elements`;
      break;
    default:
      templatePrompt = '';
  }
  
  let detailPrompt = '';
  
  switch (detailLevel) {
    case 'summary':
      detailPrompt = 'Provide a brief summary of key issues (2-3 main points).';
      break;
    case 'standard':
      detailPrompt = 'Provide a standard level review with main issues and recommendations.';
      break;
    case 'detailed':
      detailPrompt = 'Provide a comprehensive review with detailed analysis of all issues, recommendations, and areas of concern.';
      break;
  }
  
  let customRulesPrompt = '';
  if (customRules && customRules.length > 0) {
    customRulesPrompt = `\n\nAdditional review rules to apply:\n${customRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }
  
  return basePrompt + templatePrompt + '\n\n' + detailPrompt + customRulesPrompt;
}

/**
 * Build user prompt from document text
 */
function buildUserPrompt(pdfText, template) {
  return `Please review the following document and provide a comprehensive analysis.

Document content:
---
${pdfText.substring(0, 12000)}${pdfText.length > 12000 ? '\n\n[Document continues...]' : ''}
---

Provide your analysis in the following JSON format:
{
  "summary": "brief overview of the document",
  "keyFindings": ["finding 1", "finding 2"],
  "issues": [
    {"type": "conflict", "severity": "high", "description": "...", "recommendation": "..."}
  ],
  "complianceCheck": {"passed": true, "standards": [], "violations": []},
  "overallAssessment": "..."
}`;
}

module.exports = {
  reviewDocument,
  reviewWithClaude,
  buildSystemPrompt,
  buildUserPrompt,
  initializeAIClient
};
