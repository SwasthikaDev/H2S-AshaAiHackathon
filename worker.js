/**
 * JobsForHer Foundation - Asha AI Chatbot
 * Cloudflare Worker for serving static files and handling API requests
 */

/**
 * The main request handler for the Cloudflare Worker
 */
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle incoming requests
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The response
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Handle API requests
    if (path.startsWith('/api')) {
      return await handleApiRequest(request);
    }

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    // Serve static assets
    return await handleStaticAsset(request, path);
  } catch (e) {
    console.error('Error handling request:', e);
    
    // If an error is thrown, return a 404 or appropriate error
    return new Response(`Not found: ${path}\n${e.message}`, {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

/**
 * Handle static asset requests
 * @param {Request} request - The incoming request
 * @param {string} path - The request path
 * @returns {Promise<Response>} - The response with the static asset
 */
async function handleStaticAsset(request, path) {
  // Default to index.html for root path
  const assetPath = path === '/' ? '/index.html' : path;
  
  // Map of content types based on file extensions
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  
  // Determine content type based on file extension
  const extension = assetPath.substring(assetPath.lastIndexOf('.') || 0);
  const contentType = contentTypes[extension] || 'text/plain';
  
  // Fix relative paths that start with ./
  let githubPath = assetPath;
  if (githubPath.startsWith('./')) {
    githubPath = githubPath.substring(1); // Remove the dot but keep the slash
  }
  
  // Fetch the asset from GitHub repository
  try {
    const response = await fetch(`https://raw.githubusercontent.com/SwasthikaDev/H2S-AshaAiHackathon/main/frontend${githubPath}`);
    
    if (response.ok) {
      // For text-based content
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        const content = await response.text();
        return new Response(content, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'max-age=3600',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } 
      // For binary content (images, etc.)
      else {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return new Response(arrayBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'max-age=86400', // Cache images longer
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } else {
      console.error(`File not found on GitHub: ${githubPath}, Status: ${response.status}`);
      
      // Try without the leading slash as a fallback
      if (githubPath.startsWith('/')) {
        const altPath = githubPath.substring(1);
        const altResponse = await fetch(`https://raw.githubusercontent.com/SwasthikaDev/H2S-AshaAiHackathon/main/frontend/${altPath}`);
        
        if (altResponse.ok) {
          if (contentType.startsWith('text/') || contentType === 'application/json') {
            const content = await altResponse.text();
            return new Response(content, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'max-age=3600',
                'Access-Control-Allow-Origin': '*'
              }
            });
          } else {
            const blob = await altResponse.blob();
            const arrayBuffer = await blob.arrayBuffer();
            return new Response(arrayBuffer, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'max-age=86400',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }
      }
      
      return new Response(`File not found: ${assetPath}`, {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error(`Error fetching ${githubPath}: ${error.message}`);
    return new Response(`Error fetching file: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Handle CORS preflight requests
 * @param {Request} request - The incoming request
 * @returns {Response} - The CORS response
 */
function handleCors(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Handle API requests
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The API response
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle authentication API
  if (path.startsWith('/api/auth')) {
    // For now, we'll mock the authentication API
    // In a real deployment, you'd connect to a database or external service
    if (path === '/api/auth/login' && request.method === 'POST') {
      try {
        const data = await request.json();
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
      } catch (e) {
        return new Response(
          JSON.stringify({
            message: 'Invalid request format',
            error: e.message
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
    } else if (path === '/api/auth/signup' && request.method === 'POST') {
      try {
        const data = await request.json();
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
      } catch (e) {
        return new Response(
          JSON.stringify({
            message: 'Invalid request format',
            error: e.message
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

  // Default response for unhandled API routes
  return new Response(
    JSON.stringify({
      message: 'API endpoint not found',
      path: path
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
