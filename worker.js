/**
 * JobsForHer Foundation - Asha AI Chatbot
 * Cloudflare Worker for serving static files and handling API requests
 */

// Import necessary Cloudflare Workers modules
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

/**
 * The main request handler for the Cloudflare Worker
 */
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

/**
 * Handle incoming requests
 * @param {FetchEvent} event - The fetch event
 * @returns {Promise<Response>} - The response
 */
async function handleRequest(event) {
  const url = new URL(event.request.url);
  const path = url.pathname;

  try {
    // Handle API requests
    if (path.startsWith('/api')) {
      return await handleApiRequest(event);
    }

    // Serve static assets
    return await getAssetFromKV(event);
  } catch (e) {
    // If an error is thrown, return a 404 or appropriate error
    return new Response(`Not found: ${path}`, {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

/**
 * Handle API requests
 * @param {FetchEvent} event - The fetch event
 * @returns {Promise<Response>} - The API response
 */
async function handleApiRequest(event) {
  const url = new URL(event.request.url);
  const path = url.pathname;

  // Handle authentication API
  if (path.startsWith('/api/auth')) {
    // For now, we'll mock the authentication API
    // In a real deployment, you'd connect to a database or external service
    if (path === '/api/auth/login') {
      const data = await event.request.json();
      // Simple mock login
      if (data.email && data.password) {
        return new Response(
          JSON.stringify({
            token: 'mock-jwt-token-' + Date.now(),
            userId: 'user-' + data.email.split('@')[0],
            message: 'Login successful',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            message: 'Invalid credentials',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    } else if (path === '/api/auth/signup') {
      const data = await event.request.json();
      // Simple mock signup
      if (data.email && data.password && data.name) {
        return new Response(
          JSON.stringify({
            token: 'mock-jwt-token-' + Date.now(),
            userId: 'user-' + data.email.split('@')[0],
            message: 'Signup successful',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            message: 'Invalid signup data',
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }
  }

  // Handle CORS preflight requests
  if (event.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Default response for unhandled API routes
  return new Response(
    JSON.stringify({
      message: 'API endpoint not found',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
