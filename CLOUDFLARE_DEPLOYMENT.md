# Cloudflare Workers Deployment Guide

This guide explains how to deploy the JobsForHer Foundation Asha AI Chatbot to Cloudflare Workers.

## Prerequisites

- Node.js installed
- npm installed
- A Cloudflare account
- Wrangler CLI (installed via npm)

## Deployment Files

The following files have been added/modified to support Cloudflare Workers deployment:

1. `wrangler.toml` - Configuration file for Cloudflare Workers
2. `worker.js` - Main worker script that handles requests
3. `package.json` - Updated with Cloudflare dependencies and deployment scripts

## Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 3. Deploy to Cloudflare Workers

```bash
npm run deploy
```

Or directly:

```bash
npx wrangler deploy
```

## Deployment Configuration

The deployment is configured to:

- Use the domain: `asha-ai-h2s.swasthikadevadiga2.workers.dev`
- Serve static files from the `frontend` directory
- Handle API requests through the worker script

## Local Development vs. Production

The application is configured to automatically detect whether it's running locally or in production:

- In local development, API requests go to `http://localhost:9002/api`
- In production, API requests go to `https://asha-ai-h2s.swasthikadevadiga2.workers.dev/api`

## Troubleshooting

If you encounter build failures:

1. Check that all dependencies are installed
2. Verify that the wrangler.toml configuration is correct
3. Ensure you have the correct permissions in your Cloudflare account
4. Check the build logs for specific error messages

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
