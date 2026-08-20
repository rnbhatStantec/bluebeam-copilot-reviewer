# Bluebeam Copilot Reviewer - Installation & Deployment Guide

## Prerequisites

- Node.js 16+ and npm 8+
- Docker (optional, for containerized deployment)
- Anthropic API key (Claude) or OpenAI API key (GPT)
- Bluebeam Cloud account (optional, for cloud integration)

## Quick Start (Local)

### 1. Clone & Install

```bash
git clone https://github.com/rnbhatStantec/bluebeam-copilot-reviewer.git
cd bluebeam-copilot-reviewer
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env

# Edit .env and add your API keys
# Minimum required:
CLAUDE_API_KEY=sk-ant-...
AI_MODEL=claude
```

### 3. Start Server

```bash
npm start
# Server runs on http://localhost:3000
```

### 4. Test API

```bash
# Health check
curl http://localhost:3000/health

# API documentation
curl http://localhost:3000/api
```

## CLI Usage

### Single File Review

```bash
# Basic review
node src/cli/review.js --file=path/to/document.pdf

# With options
node src/cli/review.js \
  --file=document.pdf \
  --template=architecture \
  --detail=detailed \
  --output=results.json

# List templates
node src/cli/review.js templates

# System info
node src/cli/review.js info
```

### Batch Processing

```bash
# Process entire directory
node src/cli/batch-review.js process \
  --input=./pdfs \
  --output=./reviews \
  --template=architecture \
  --parallel=3

# Show statistics
node src/cli/batch-review.js stats --input=./reviews
```

### Automated Workflows

```bash
# Configure workflows in config/workflows.json
# Then start the scheduler:
node src/scheduler.js
```

## Docker Deployment

### Option 1: Simple Docker Container

```bash
# Build
docker build -t bluebeam-copilot-reviewer .

# Run
docker run -p 3000:3000 \
  -e CLAUDE_API_KEY=sk-ant-... \
  -v ./pdfs:/app/uploads \
  -v ./reviews:/app/reviews \
  bluebeam-copilot-reviewer
```

### Option 2: Docker Compose (Recommended)

```bash
# Create .env file with API keys
echo "CLAUDE_API_KEY=sk-ant-..." > .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Option 3: Multi-stage Build

```bash
# Development
docker build --target dev -t bluebeam-dev .
docker run -p 3000:3000 -v $(pwd):/app bluebeam-dev

# Production
docker build --target prod -t bluebeam-prod .
docker run -p 3000:3000 bluebeam-prod
```

## Production Deployment

### AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker tag bluebeam-copilot-reviewer <account>.dkr.ecr.<region>.amazonaws.com/bluebeam:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/bluebeam:latest

# Deploy with CloudFormation or Terraform
```

### Kubernetes

```bash
# Create namespace
kubectl create namespace bluebeam

# Create secret for API keys
kubectl create secret generic bluebeam-secrets \
  --from-literal=claude-api-key=sk-ant-... \
  -n bluebeam

# Deploy (create k8s manifests)
kubectl apply -f k8s/ -n bluebeam
```

### Heroku

```bash
# Create app
heroku create my-bluebeam-reviewer

# Set environment variables
heroku config:set CLAUDE_API_KEY=sk-ant-...
heroku config:set AI_MODEL=claude

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## API Integration

### Upload & Review PDF

```bash
curl -X POST http://localhost:3000/api/review \
  -F "file=@document.pdf" \
  -F "template=architecture" \
  -F "detailLevel=standard"

# Response:
# {
#   "status": "processing",
#   "reviewId": "uuid-xxx",
#   "message": "Review started..."
# }
```

### Get Review Results

```bash
curl http://localhost:3000/api/review/uuid-xxx

# Response (when complete):
# {
#   "status": "complete",
#   "analysis": { ... },
#   "tokens": { ... },
#   "timestamp": "..."
# }
```

### List Templates

```bash
curl http://localhost:3000/api/templates
```

## Troubleshooting

### API Key Issues

```bash
# Test Claude API key
curl -H "Authorization: Bearer $CLAUDE_API_KEY" \
  https://api.anthropic.com/v1/messages/count_tokens

# Should return 200 if valid
```

### PDF Parsing Fails

```bash
# Verify PDF is valid
file path/to/document.pdf

# Try with different PDF
# Some PDFs may require additional libraries (pdfjs-dist for annotations)
```

### High Memory Usage

```bash
# Set Node memory limit
node --max-old-space-size=2048 src/server.js

# Or in Docker
docker run --memory=2g bluebeam-copilot-reviewer
```

### Slow Processing

```bash
# Use faster model
export AI_MODEL=gpt-3.5-turbo

# Reduce detail level
node src/cli/review.js --file=doc.pdf --detail=summary

# Process specific pages only
node src/cli/review.js --file=doc.pdf --pages=1-10
```

## Development

```bash
# Install dev dependencies
npm install --save-dev

# Run in watch mode
npm run dev

# Run tests
npm test

# Run linter
npm run lint:fix
```

## Monitoring & Logs

```bash
# View logs
tail -f error.log
tail -f combined.log

# Set log level
export LOG_LEVEL=debug

# Monitor performance
node --prof src/server.js
node --prof-process isolate-*.log > profile.txt
```

## Scaling

### Horizontal Scaling

- Use load balancer (nginx, HAProxy)
- Run multiple instances of server
- Use separate queue (Redis, RabbitMQ) for batch jobs
- Share state in database (PostgreSQL, MongoDB)

### Vertical Scaling

- Increase Node memory: `--max-old-space-size=4096`
- Use clustering: `node src/cluster.js`
- Optimize AI prompts for faster responses

## Security Considerations

1. **API Keys**
   - Never commit `.env` file
   - Use secret management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly

2. **File Handling**
   - Validate file uploads
   - Scan for malware
   - Limit file size: `app.use(express.json({ limit: '50mb' }))`

3. **Authentication**
   - Implement API key authentication
   - Use OAuth2 for web interface
   - Rate limiting for endpoints

4. **Data Privacy**
   - Encrypt PDFs in transit (HTTPS)
   - Store reviews securely
   - Implement data retention policies

## Next Steps

- [ ] Set up monitoring and alerting
- [ ] Configure automated backups
- [ ] Implement authentication
- [ ] Set up CI/CD pipeline
- [ ] Create web dashboard UI
- [ ] Add database persistence
- [ ] Implement user management

---

**For more help**, check the [README.md](../README.md) or open an [issue](https://github.com/rnbhatStantec/bluebeam-copilot-reviewer/issues).
