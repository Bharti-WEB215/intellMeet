# Deployment Guide for IntellMeet

## What is required for Vercel frontend deployment

The frontend is a Vite static app deployed on Vercel. It requires the backend URL to be configured via environment variables.

### Required Vercel environment variables

- `VITE_API_URL` = `https://<your-backend-domain>/api`
- `VITE_SOCKET_URL` = `https://<your-backend-domain>`

Example:

```text
VITE_API_URL=https://intellmeet-backend.example.com/api
VITE_SOCKET_URL=https://intellmeet-backend.example.com
```

### Backend environment variables

The backend server should allow requests from your frontend origin.

- `CORS_ORIGINS` = `https://<your-frontend-domain>.vercel.app`

Example:

```text
CORS_ORIGINS=https://intellmeet.vercel.app
```

## Deploying the backend

This project already includes a production Dockerfile for the backend.

### Recommended hosts

- Render
- Fly.io
- Railway
- DigitalOcean App Platform
- Any Docker-compatible host

### Basic Docker deploy flow

1. Build the image locally or in CI:
   ```bash
   docker build -t intellmeet-backend .
   ```
2. Run the container with environment variables:
   ```bash
   docker run -e PORT=5000 -e CORS_ORIGINS=https://<your-frontend-domain>.vercel.app \
     -e MONGODB_URI=<your-mongodb-uri> \
     -e REDIS_URL=<your-redis-url> \
     -e OPENAI_API_KEY=<your-openai-key> \
     -e CLOUDINARY_API_KEY=<your-cloudinary-key> \
     -e CLOUDINARY_API_SECRET=<your-cloudinary-secret> \
     intellmeet-backend
   ```

## Vercel-specific notes

If you want to keep the frontend on Vercel and the backend elsewhere, use `VITE_API_URL` to point to the backend.

- Do not set `VITE_API_URL` to `http://localhost:5000` for production.
- Do not rely on Vercel static deployment to serve your Express backend.

## Verifying after deploy

1. Confirm the backend is reachable:
   ```bash
   curl -I https://<your-backend-domain>/health
   ```
2. Confirm the frontend is using the backend URL:
   - Open browser DevTools
   - Watch the network request for `/auth/register`
   - The request should go to `https://<your-backend-domain>/api/auth/register`

## Fixing Vercel 405 errors

A 405 means your frontend is calling the wrong host for API routes. Usually this means:

- `VITE_API_URL` is missing or incorrect
- frontend is still calling the static Vercel URL instead of backend URL
- backend does not allow the frontend origin via CORS
