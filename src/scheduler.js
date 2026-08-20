const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { parsePDF } = require('./core/pdf-parser');
const { reviewDocument } = require('./core/ai-reviewer');
const logger = require('./utils/logger');

class WorkflowScheduler {
  constructor(configPath = './config/workflows.json') {
    this.configPath = configPath;
    this.workflows = [];
    this.tasks = new Map();
    this.loadConfig();
  }

  /**
   * Load workflow configuration
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.workflows = config.workflows || [];
        logger.info(`Loaded ${this.workflows.length} workflows`);
      } else {
        logger.warn(`Config file not found: ${this.configPath}`);
      }
    } catch (error) {
      logger.error('Error loading config:', error);
    }
  }

  /**
   * Start all scheduled workflows
   */
  start() {
    this.workflows.forEach(workflow => {
      this.scheduleWorkflow(workflow);
    });
    logger.info('Workflow scheduler started');
  }

  /**
   * Schedule a workflow
   */
  scheduleWorkflow(workflow) {
    try {
      const task = cron.schedule(workflow.schedule, () => {
        this.executeWorkflow(workflow);
      });

      this.tasks.set(workflow.name, task);
      logger.info(`Scheduled workflow: ${workflow.name} (${workflow.schedule})`);
    } catch (error) {
      logger.error(`Error scheduling workflow ${workflow.name}:`, error);
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflow) {
    logger.info(`Executing workflow: ${workflow.name}`);

    try {
      // Find PDF files
      const files = this.findPDFFiles(workflow.input);
      logger.info(`Found ${files.length} files to process`);

      // Process files
      for (const file of files) {
        try {
          await this.processFile(file, workflow);
        } catch (error) {
          logger.error(`Error processing ${file}:`, error);
        }
      }

      // Send notification
      if (workflow.notifyEmail) {
        logger.info(`Workflow ${workflow.name} would send notification to ${workflow.notifyEmail}`);
      }

      logger.info(`Workflow ${workflow.name} completed`);
    } catch (error) {
      logger.error(`Error executing workflow ${workflow.name}:`, error);
    }
  }

  /**
   * Process a single file
   */
  async processFile(filePath, workflow) {
    const pdfResult = await parsePDF(filePath);

    if (!pdfResult.success) {
      throw new Error(`Failed to parse PDF: ${pdfResult.error}`);
    }

    const reviewResult = await reviewDocument(pdfResult.text, {
      template: workflow.template || 'general',
      detailLevel: workflow.detailLevel || 'standard'
    });

    // Save result
    const filename = path.basename(filePath, '.pdf');
    const outputPath = path.join(workflow.output, `${filename}_${Date.now()}.json`);

    if (!fs.existsSync(workflow.output)) {
      fs.mkdirSync(workflow.output, { recursive: true });
    }

    let analysis = reviewResult.analysis;
    try {
      analysis = JSON.parse(analysis);
    } catch (e) {
      // Keep as text
    }

    const result = {
      file: filename,
      documentMetadata: pdfResult.metadata,
      analysis,
      model: reviewResult.model,
      tokens: reviewResult.tokens,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    logger.info(`Saved review: ${outputPath}`);
  }

  /**
   * Find PDF files in directory
   */
  findPDFFiles(dir) {
    let files = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name.endsWith('.pdf')) {
        files.push(fullPath);
      }
    });

    return files;
  }

  /**
   * Stop scheduler
   */
  stop() {
    this.tasks.forEach(task => task.stop());
    logger.info('Workflow scheduler stopped');
  }
}

// Start if run directly
if (require.main === module) {
  const scheduler = new WorkflowScheduler();
  scheduler.start();

  // Handle shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down scheduler...');
    scheduler.stop();
    process.exit(0);
  });
}

module.exports = WorkflowScheduler;
