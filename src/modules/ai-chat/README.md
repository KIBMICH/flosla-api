# AI Chat Module

## Overview
AI-powered chat endpoint using Hugging Face's Mistral-7B model for menstrual hygiene, mental health awareness, and youth empowerment guidance.

## Setup

1. Get your Hugging Face token from: https://huggingface.co/settings/tokens
2. Add to `.env`:
   ```
   HF_TOKEN=your_huggingface_token_here
   ```
3. Restart the server

## Endpoint

**POST** `/api/ai/chat`

### Request Body
```json
{
  "message": "What is menstrual hygiene?"
}
```

### Response
```json
{
  "success": true,
  "reply": "Menstrual hygiene refers to..."
}
```

### Error Response
```json
{
  "success": false,
  "message": "AI service temporarily unavailable. Please try again later."
}
```

## Safety Features

- Crisis keyword detection (suicide, self-harm)
- Automatic crisis response with support resources
- Input validation (max 1000 characters)
- Rate limiting (inherited from global middleware)
- 30-second timeout for API calls

## Rate Limits

- Global: 100 requests per 15 minutes (per IP)
- Message length: 1-1000 characters
