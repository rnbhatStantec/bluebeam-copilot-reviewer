# Bluebeam Copilot Reviewer - API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Current version uses webhook secrets for webhook endpoints. Future versions will support:
- API Key authentication
- OAuth2
- JWT tokens

## Endpoints

### Review Operations

#### POST /review

Submit a PDF document for AI-assisted review.

**Request:**

```bash
curl -X POST http://localhost:3000/api/review \
  -F "file=@document.pdf" \
  -F "template=architecture" \
  -F "detailLevel=detailed" \
  -F "prompt=Focus on structural integrity"
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | PDF file to review |
| template | String | No | Review template: `architecture`, `structural`, `mep`, `general` (default: `general`) |
| detailLevel | String | No | Detail level: `summary`, `standard`, `detailed` (default: `standard`) |
| prompt | String | No | Custom review prompt |

**Response:**

```json
{
  "status": "processing",
  "reviewId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Review started. Check status with GET /api/review/{reviewId}"
}
```

**Status Codes:**
- `200` - Review accepted and processing
- `400` - Missing file or invalid parameters
- `500` - Server error

#### GET /review/:id

Get review results.

**Request:**

```bash
curl http://localhost:3000/api/review/550e8400-e29b-41d4-a716-446655440000
```

**Response (Processing):**

```json
{
  "status": "processing"
}
```

**Response (Complete):**

```json
{
  "status": "complete",
  "reviewId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "architectural-plans.pdf",
  "documentMetadata": {
    "pages": 15,
    "producer": "Adobe Acrobat",
    "creator": "AutoCAD",
    "creationDate": "2024-01-15T10:30:00Z",
    "modificationDate": "2024-08-20T15:45:00Z"
  },
  "analysis": {
    "summary": "Overall assessment of the architectural plans...",
    "keyFindings": [
      "Dimensional consistency verified",
      "Code compliance issues found in Section 3",
      "Coordination gaps with structural drawings"
    ],
    "issues": [
      {
        "type": "conflict",
        "severity": "high",
        "description": "Conflicting dimensions on Sheet A-2",
        "location": "Grid 3-C",
        "recommendation": "Reconcile dimensions with structural team"
      }
    ],
    "complianceCheck": {
      "passed": false,
      "standards": ["IBC 2021", "ADA"],
      "violations": ["Stair slope exceeds ADA requirements"]
    },
    "overallAssessment": "Document requires revision before proceeding to construction documents."
  },
  "model": "claude-3-opus",
  "tokens": {
    "input": 12500,
    "output": 2300
  },
  "timestamp": "2024-08-20T16:30:45Z"
}
```

**Response (Error):**

```json
{
  "status": "error",
  "error": "Failed to parse PDF",
  "reviewId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-08-20T16:30:45Z"
}
```

### Templates

#### GET /templates

List all available review templates.

**Request:**

```bash
curl http://localhost:3000/api/templates
```

**Response:**

```json
{
  "templates": [
    {
      "id": "architecture",
      "name": "Architectural Plans",
      "description": "Review architectural drawings and plans",
      "focus": [
        "design-consistency",
        "code-compliance",
        "dimensions",
        "materials"
      ],
      "detailLevels": ["summary", "standard", "detailed"]
    },
    {
      "id": "structural",
      "name": "Structural Drawings",
      "description": "Review structural engineering drawings",
      "focus": ["load-paths", "connections", "materials", "safety"],
      "detailLevels": ["summary", "standard", "detailed"]
    },
    {
      "id": "mep",
      "name": "MEP Systems",
      "description": "Review mechanical, electrical, and plumbing systems",
      "focus": ["system-integration", "conflicts", "capacity", "coordination"],
      "detailLevels": ["summary", "standard", "detailed"]
    },
    {
      "id": "general",
      "name": "General Document",
      "description": "General document review",
      "focus": ["content", "clarity", "completeness"],
      "detailLevels": ["summary", "standard", "detailed"]
    }
  ]
}
```

#### GET /templates/:id

Get specific template details.

**Request:**

```bash
curl http://localhost:3000/api/templates/architecture
```

**Response:**

```json
{
  "id": "architecture",
  "name": "Architectural Plans",
  "description": "Review architectural drawings and plans",
  "focus": ["design-consistency", "code-compliance", "dimensions", "materials"],
  "detailLevels": ["summary", "standard", "detailed"]
}
```

### Webhooks

#### POST /webhooks/file-uploaded

Handle file uploads from external systems (Bluebeam, storage services, etc.).

**Request:**

```bash
curl -X POST http://localhost:3000/api/webhooks/file-uploaded \
  -H "X-Webhook-Secret: your_webhook_secret" \
  -F "file=@document.pdf" \
  -F "source=bluebeam" \
  -F "projectId=proj_123" \
  -F "metadata={\"designer\":\"John Doe\"}"
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | PDF file |
| X-Webhook-Secret | Header | Yes | Webhook secret for authentication |
| source | String | Yes | Source system (`bluebeam`, `dropbox`, `gdrive`, etc.) |
| projectId | String | No | Associated project ID |
| metadata | JSON | No | Additional metadata |

**Response:**

```json
{
  "status": "received",
  "reviewId": "550e8400-e29b-41d4-a716-446655440000",
  "source": "bluebeam",
  "file": "architectural-plans.pdf"
}
```

### System

#### GET /health

Health check endpoint.

**Request:**

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-08-20T16:30:45Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

#### GET /api

API documentation.

**Request:**

```bash
curl http://localhost:3000/api
```

**Response:**

```json
{
  "name": "Bluebeam Copilot Reviewer",
  "version": "1.0.0",
  "endpoints": {
    "review": {
      "POST": "/api/review - Submit PDF for review",
      "GET": "/api/review/:id - Get review results"
    },
    "templates": {
      "GET": "/api/templates - List available templates"
    },
    "webhooks": {
      "POST": "/api/webhooks/file-uploaded - Webhook for file uploads"
    }
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "status": 400
}
```

### Common Error Codes

| Code | Meaning |
|------|--------|
| 400 | Bad Request - Invalid parameters or missing file |
| 401 | Unauthorized - Invalid webhook secret |
| 404 | Not Found - Review or template not found |
| 500 | Internal Server Error - Processing error |

## Rate Limiting

Current version does not implement rate limiting. Production deployments should implement:
- Request rate limiting (e.g., 100 requests per minute per IP)
- File size limits (default: 50MB)
- Token usage limits based on plan

## Pagination

Not applicable to current endpoints. Future versions may support:
- Listing review history
- Pagination for large result sets

## Examples

### Complete Review Workflow

```bash
#!/bin/bash

# 1. Upload PDF for review
RESPONSE=$(curl -X POST http://localhost:3000/api/review \
  -F "file=@plans.pdf" \
  -F "template=architecture" \
  -F "detailLevel=detailed")

REVIEW_ID=$(echo $RESPONSE | jq -r '.reviewId')
echo "Review ID: $REVIEW_ID"

# 2. Poll for results
while true; do
  RESULT=$(curl -s http://localhost:3000/api/review/$REVIEW_ID)
  STATUS=$(echo $RESULT | jq -r '.status')
  
  if [ "$STATUS" = "complete" ]; then
    echo "Review Complete:"
    echo $RESULT | jq '.analysis.summary'
    break
  elif [ "$STATUS" = "error" ]; then
    echo "Review Failed:"
    echo $RESULT | jq '.error'
    break
  else
    echo "Status: $STATUS... waiting"
    sleep 2
  fi
done
```

### Batch Review with Polling

```bash
#!/bin/bash

# Process multiple PDFs and wait for all results
RESULTS=()

for pdf in *.pdf; do
  REVIEW=$(curl -s -X POST http://localhost:3000/api/review \
    -F "file=@$pdf" \
    -F "template=architecture")
  RESULTS+=($(echo $REVIEW | jq -r '.reviewId'))
done

echo "Processing ${#RESULTS[@]} documents..."

# Wait for all to complete
for id in "${RESULTS[@]}"; do
  while true; do
    STATUS=$(curl -s http://localhost:3000/api/review/$id | jq -r '.status')
    [ "$STATUS" = "complete" ] || [ "$STATUS" = "error" ] && break
    sleep 2
  done
  echo "Review $id complete"
done
```

---

For more information, see [INSTALL.md](./INSTALL.md) or check the [README.md](../README.md).
