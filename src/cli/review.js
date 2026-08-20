#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { parsePDF } = require('../core/pdf-parser');
const { reviewDocument } = require('../core/ai-reviewer');
const logger = require('../utils/logger');

const program = new Command();

program
  .name('bluebeam-reviewer')
  .description('AI-assisted PDF review tool')
  .version('1.0.0');

program
  .command('review')
  .description('Review a single PDF document')
  .option('-f, --file <path>', 'Path to PDF file', '')
  .option('-m, --model <model>', 'AI model to use (claude, gpt-4)', 'claude')
  .option('-t, --template <template>', 'Review template (architecture, structural, mep, general)', 'general')
  .option('-d, --detail <level>', 'Detail level (summary, standard, detailed)', 'standard')
  .option('-p, --prompt <prompt>', 'Custom prompt for review', '')
  .option('-o, --output <path>', 'Output file for results (JSON)', '')
  .option('--pages <pages>', 'Specific pages to review (e.g., 1-10)', '')
  .action(async (options) => {
    try {
      if (!options.file) {
        console.error('❌ Error: --file argument required');
        process.exit(1);
      }

      if (!fs.existsSync(options.file)) {
        console.error(`❌ Error: File not found: ${options.file}`);
        process.exit(1);
      }

      console.log('📄 Parsing PDF...');
      const pdfResult = await parsePDF(options.file);

      if (!pdfResult.success) {
        console.error(`❌ Error parsing PDF: ${pdfResult.error}`);
        process.exit(1);
      }

      console.log(`✅ PDF parsed: ${pdfResult.metadata.pages} pages`);
      console.log('🤖 Running AI review...');

      const reviewResult = await reviewDocument(pdfResult.text, {
        template: options.template,
        detailLevel: options.detail,
        customPrompt: options.prompt
      });

      // Parse analysis
      let analysis = reviewResult.analysis;
      try {
        analysis = JSON.parse(analysis);
      } catch (e) {
        // Keep as text
      }

      const result = {
        status: 'complete',
        file: options.file,
        template: options.template,
        detailLevel: options.detail,
        documentMetadata: pdfResult.metadata,
        analysis,
        model: reviewResult.model,
        tokens: reviewResult.tokens,
        timestamp: new Date().toISOString()
      };

      // Output results
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
        console.log(`✅ Results saved to: ${options.output}`);
      } else {
        console.log('\n📊 Review Results:');
        console.log('═'.repeat(50));
        console.log(JSON.stringify(result, null, 2));
      }

      console.log(`\n✅ Review completed (${reviewResult.tokens.input + reviewResult.tokens.output} tokens used)`);
    } catch (error) {
      logger.error('Error in review command:', error);
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('List available review templates')
  .action(() => {
    const templates = {
      architecture: 'Architectural Plans - Review architectural drawings and plans',
      structural: 'Structural Drawings - Review structural engineering drawings',
      mep: 'MEP Systems - Review mechanical, electrical, and plumbing systems',
      general: 'General Document - General document review'
    };

    console.log('📋 Available Templates:');
    console.log('═'.repeat(50));
    Object.entries(templates).forEach(([key, desc]) => {
      console.log(`  ${key.padEnd(15)} - ${desc}`);
    });
  });

program
  .command('info')
  .description('Show system information')
  .action(() => {
    console.log('📋 Bluebeam Copilot Reviewer Info:');
    console.log('═'.repeat(50));
    console.log(`Version: 1.0.0`);
    console.log(`Node: ${process.version}`);
    console.log(`AI Model: ${process.env.AI_MODEL || 'claude'}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\nConfiguration:`);
    console.log(`  - Extract Markups: ${process.env.EXTRACT_MARKUPS || 'true'}`);
    console.log(`  - Detect Conflicts: ${process.env.DETECT_CONFLICTS || 'true'}`);
    console.log(`  - Check Compliance: ${process.env.CHECK_COMPLIANCE || 'true'}`);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
