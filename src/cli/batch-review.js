#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { parsePDF } = require('../core/pdf-parser');
const { reviewDocument } = require('../core/ai-reviewer');
const logger = require('../utils/logger');

const program = new Command();

program
  .name('batch-reviewer')
  .description('Batch process multiple PDF documents')
  .version('1.0.0');

program
  .command('process')
  .description('Process all PDFs in a directory')
  .option('-i, --input <dir>', 'Input directory containing PDFs', './pdfs')
  .option('-o, --output <dir>', 'Output directory for results', './reviews')
  .option('-t, --template <template>', 'Review template to use', 'general')
  .option('-d, --detail <level>', 'Detail level (summary, standard, detailed)', 'standard')
  .option('-p, --parallel <num>', 'Number of parallel processes', '2')
  .option('-r, --recursive', 'Process subdirectories recursively', false)
  .action(async (options) => {
    try {
      if (!fs.existsSync(options.input)) {
        console.error(`❌ Input directory not found: ${options.input}`);
        process.exit(1);
      }

      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
        console.log(`📁 Created output directory: ${options.output}`);
      }

      // Find PDF files
      const pdfFiles = findPDFFiles(options.input, options.recursive);
      console.log(`📄 Found ${pdfFiles.length} PDF files to process`);

      if (pdfFiles.length === 0) {
        console.log('ℹ️  No PDF files found');
        return;
      }

      // Process in batches
      const batchSize = parseInt(options.parallel);
      let completed = 0;
      let errors = 0;

      for (let i = 0; i < pdfFiles.length; i += batchSize) {
        const batch = pdfFiles.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(file => processPDF(file, options.output, {
            template: options.template,
            detail: options.detail
          }))
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            completed++;
            console.log(`✅ [${completed}/${pdfFiles.length}] ${result.value}`);
          } else {
            errors++;
            console.error(`❌ Error: ${result.reason}`);
          }
        });

        // Progress indicator
        const progress = Math.min(completed + errors, pdfFiles.length);
        const percent = Math.round((progress / pdfFiles.length) * 100);
        console.log(`\n📊 Progress: ${progress}/${pdfFiles.length} (${percent}%)\n`);
      }

      console.log('\n🎉 Batch processing complete!');
      console.log(`   Completed: ${completed}`);
      console.log(`   Errors: ${errors}`);
      console.log(`   Results saved to: ${options.output}`);
    } catch (error) {
      logger.error('Error in batch processing:', error);
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show statistics about completed reviews')
  .option('-i, --input <dir>', 'Results directory', './reviews')
  .action((options) => {
    try {
      if (!fs.existsSync(options.input)) {
        console.error(`❌ Directory not found: ${options.input}`);
        process.exit(1);
      }

      const files = fs.readdirSync(options.input).filter(f => f.endsWith('.json'));
      console.log(`\n📊 Review Statistics:`);
      console.log('═'.repeat(50));
      console.log(`Total Reviews: ${files.length}`);

      let totalTokens = 0;
      let highSeverity = 0;

      files.forEach(file => {
        const content = JSON.parse(fs.readFileSync(path.join(options.input, file), 'utf-8'));
        if (content.tokens) {
          totalTokens += content.tokens.input + content.tokens.output;
        }
        if (content.analysis && content.analysis.issues) {
          highSeverity += content.analysis.issues.filter(i => i.severity === 'high').length;
        }
      });

      console.log(`Total Tokens Used: ${totalTokens}`);
      console.log(`High Severity Issues: ${highSeverity}`);
    } catch (error) {
      logger.error('Error calculating stats:', error);
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Find all PDF files in directory
 */
function findPDFFiles(dir, recursive = false) {
  let files = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && recursive) {
      files = files.concat(findPDFFiles(fullPath, recursive));
    } else if (entry.isFile() && entry.name.endsWith('.pdf')) {
      files.push(fullPath);
    }
  });

  return files;
}

/**
 * Process a single PDF
 */
async function processPDF(filePath, outputDir, options) {
  try {
    const filename = path.basename(filePath, '.pdf');
    const outputFile = path.join(outputDir, `${filename}_review.json`);

    // Parse PDF
    const pdfResult = await parsePDF(filePath);

    if (!pdfResult.success) {
      throw new Error(`Failed to parse PDF: ${pdfResult.error}`);
    }

    // Review with AI
    const reviewResult = await reviewDocument(pdfResult.text, {
      template: options.template,
      detailLevel: options.detail
    });

    // Parse analysis
    let analysis = reviewResult.analysis;
    try {
      analysis = JSON.parse(analysis);
    } catch (e) {
      // Keep as text
    }

    // Save results
    const result = {
      file: filename,
      documentMetadata: pdfResult.metadata,
      analysis,
      model: reviewResult.model,
      tokens: reviewResult.tokens,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    return filename;
  } catch (error) {
    throw new Error(`${path.basename(filePath)}: ${error.message}`);
  }
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
