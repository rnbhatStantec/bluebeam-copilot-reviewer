# Bluebeam Copilot Reviewer

AI-assisted PDF review tool that integrates Bluebeam PDFs with Claude/OpenAI for intelligent document analysis, markup review, and automated workflows.

## Features

✅ **Quick AI Review** - Upload Bluebeam PDFs for instant intelligent analysis
✅ **Markup Analysis** - Automatically extract and summarize all markups and comments
✅ **Compliance Check** - Review documents against design standards and codes
✅ **Conflict Detection** - Identify design conflicts and inconsistencies
✅ **Automated Workflows** - Schedule batch processing and automated reviews
✅ **CLI & Web Interface** - Command-line tool + optional web dashboard
✅ **Extensible** - Custom review templates and rules
✅ **Cloud Integration** - Works with Bluebeam Cloud and local PDFs

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/rnbhatStantec/bluebeam-copilot-reviewer.git
cd bluebeam-copilot-reviewer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### Basic Usage

#### 1. Quick Review (CLI)

```bash
# Review a single PDF
node src/cli/review.js --file=path/to/document.pdf --model=claude

# Review with custom instructions
node src/cli/review.js --file=document.pdf --prompt="Check for structural issues and code compliance"

# Export results to JSON
node src/cli/review.js --file=document.pdf --output=results.json
```

#### 2. Web Interface

```bash
# Start the web server
node src/server.js

# Open http://localhost:3000 in your browser
```

#### 3. Automated Workflow

```bash
# Process entire directory
node src/cli/batch-review.js --input=./pdfs --output=./reviews --schedule=daily
```

## Configuration

### Environment Variables (.env)

```env
# API Keys
CLAUDE_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional
BLUEBEAM_API_KEY=your_bluebeam_api_key  # Optional

# Model Selection
AI_MODEL=claude  # Options: claude, gpt-4, gpt-3.5-turbo

# Review Settings
REVIEW_DETAIL_LEVEL=detailed  # Options: summary, standard, detailed
EXTRACT_MARKUPS=true
DETECT_CONFLICTS=true
CHECK_COMPLIANCE=true

# Optional: Bluebeam Cloud Integration
BLUEBEAM_WORKSPACE_ID=your_workspace_id
BLUEBEAM_CLOUD_ENABLED=false

# Server Settings
PORT=3000
NODE_ENV=development
```

## Review Templates

Custom review templates for different document types:

### Architectural Plans
```bash
node src/cli/review.js --file=plans.pdf --template=architecture
```

### Structural Drawings
```bash
node src/cli/review.js --file=structural.pdf --template=structural
```

### MEP Systems
```bash
node src/cli/review.js --file=mep.pdf --template=mep
```

### Custom Template
```bash
node src/cli/review.js --file=document.pdf --template=custom --template-config=my-template.json
```

## Automated Workflows

### Daily Batch Review

Configure in `config/workflows.json`:

```json
{
  "workflows": [
    {
      "name": "daily-review",
      "schedule": "0 9 * * *",
      "input": "./bluebeam-exports",
      "output": "./reviews",
      "template": "architecture",
      "notifyEmail": "team@example.com"
    }
  ]
}
```

Start the workflow scheduler:
```bash
node src/scheduler.js
```

### Webhook Integration

Trigger reviews automatically when files are added:

```bash
# Set up a webhook server
node src/webhooks/bluebeam-webhook.js

# Configure in Bluebeam or your file storage to POST to:
# http://your-server:3000/api/webhooks/file-uploaded
```

## API Reference

### Review Endpoint

```bash
curl -X POST http://localhost:3000/api/review \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -F "template=architecture" \
  -F "model=claude"
```

### Response Format

```json
{
  "status": "success",
  "documentId": "doc_123",
  "fileName": "architectural-plans.pdf",
  "analysis": {
    "summary": "Overall assessment of the document...",
    "keyFindings": [
      "Finding 1",
      "Finding 2"
    ],
    "issues": [
      {
        "type": "conflict",
        "severity": "high",
        "description": "Design conflict between...",
        "location": "Sheet A-2, Grid 3-C",
        "recommendation": "..."
      }
    ],
    "markups": [
      {
        "text": "Markup comment",
        "author": "John Doe",
        "date": "2024-08-20",
        "analysis": "AI interpretation"
      }
    ],
    "complianceCheck": {
      "passed": true,
      "standards": ["IBC", "ADA"],
      "violations": []
    }
  },
  "metadata": {
    "pageCount": 15,
    "processingTime": 8.5,
    "model": "claude-3-opus",
    "tokens": {
      "input": 12500,
      "output": 2300
    }
  }
}
```

## Docker Deployment

```bash
# Build Docker image
docker build -t bluebeam-copilot-reviewer .

# Run container
docker run -p 3000:3000 \
  -e CLAUDE_API_KEY=your_key \
  -e AI_MODEL=claude \
  -v ./pdfs:/app/pdfs \
  -v ./reviews:/app/reviews \
  bluebeam-copilot-reviewer
```

## Advanced Features

### Custom Review Rules

Create `config/review-rules.json`:

```json
{
  "rules": [
    {
      "name": "check-dimensions",
      "prompt": "Verify all dimensions are clearly labeled and consistent",
      "severity": "high"
    },
    {
      "name": "check-notes",
      "prompt": "Ensure all general notes are legible and complete",
      "severity": "medium"
    }
  ]
}
```

### Integration with External Systems

- **Procore**: Auto-sync reviews to project management
- **Slack**: Send notifications for high-severity issues
- **Email**: Automated reports and summaries
- **Database**: Store review history and analytics

## Bluebeam Cloud Integration (Optional)

If you have Bluebeam Cloud API access:

```bash
# Configure in .env
BLUEBEAM_CLOUD_ENABLED=true
BLUEBEAM_API_KEY=your_key
BLUEBEAM_WORKSPACE_ID=workspace_id

# Review PDFs directly from Bluebeam Cloud
node src/cli/review.js --source=bluebeam --workspace-id=xyz123
```

## Development

```bash
# Install dev dependencies
npm install --save-dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Project Structure

```
.
├── src/
│   ├── cli/                    # Command-line tools
│   │   ├── review.js          # Single file review
│   │   ├── batch-review.js    # Batch processing
│   │   └── config.js          # CLI configuration
│   ├── core/                  # Core functionality
│   │   ├── pdf-parser.js      # PDF parsing & markup extraction
│   │   ├── ai-reviewer.js     # AI analysis engine
│   │   ├── templates.js       # Review templates
│   │   └── rules.js           # Custom review rules
│   ├── integrations/          # External integrations
│   │   ├── bluebeam.js        # Bluebeam Cloud API
│   │   ├── claude.js          # Anthropic Claude API
│   │   ├── openai.js          # OpenAI API
│   │   ├── procore.js         # Procore integration
│   │   └── slack.js           # Slack notifications
│   ├── api/                   # REST API endpoints
│   │   ├── review.js
│   │   ├── templates.js
│   │   └── webhooks.js
│   ├── server.js              # Express server
│   └── scheduler.js           # Workflow scheduler
├── config/
│   ├── templates/             # Review templates
│   ├── workflows.json         # Workflow definitions
│   └── review-rules.json      # Custom rules
├── public/                    # Web UI static files
├── tests/
├── docker/
│   └── Dockerfile
├── .env.example
├── package.json
└── README.md
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Issue**: API key not found
```bash
# Solution: Ensure .env file is in root directory with correct keys
cp .env.example .env
echo "CLAUDE_API_KEY=sk-..." >> .env
```

**Issue**: PDF parsing fails
```bash
# Ensure pdf-parse is installed and file is valid
npm install
# Verify PDF: file path/to/document.pdf
```

**Issue**: Slow processing
```bash
# Use faster model or reduce page count
node src/cli/review.js --file=doc.pdf --model=gpt-3.5-turbo
# Or process specific pages
node src/cli/review.js --file=doc.pdf --pages=1-10
```

## License

MIT - See LICENSE file for details

## Support

- 📚 [Documentation](./docs)
- 🐛 [Issue Tracker](https://github.com/rnbhatStantec/bluebeam-copilot-reviewer/issues)
- 💬 [Discussions](https://github.com/rnbhatStantec/bluebeam-copilot-reviewer/discussions)
- 📧 Email: support@example.com

## Roadmap

- [ ] Web UI dashboard with analytics
- [ ] Advanced markup extraction with OCR
- [ ] Machine learning model training for custom rules
- [ ] Real-time collaborative review interface
- [ ] Integration with more AI models (Gemini, LLaMA)
- [ ] Mobile app for on-site reviews
- [ ] Database persistence and review history
- [ ] Advanced reporting and export formats

---

**Built with ❤️ for AEC professionals**
