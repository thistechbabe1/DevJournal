/**
 * Keep-Alive Pinging Service
 * Prevents cloud hosting providers (e.g., Render free tier) from sleeping/idling
 * by issuing periodic HTTP GET requests to the public /health endpoint.
 */

let timer = null;

/**
 * Resolves the public target URL to ping.
 * Priority: RENDER_EXTERNAL_URL (auto-injected by Render) -> BACKEND_URL -> SERVER_URL
 */
const getTargetUrl = () => {
  const rawUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.SERVER_URL;
  if (!rawUrl) return null;

  // Clean trailing slashes and normalize
  const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
  return `${cleanUrl}/health`;
};

/**
 * Pings the specified endpoint with a timeout to avoid hangs.
 */
const pingServer = async (targetUrl) => {
  if (!targetUrl) return;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'DevJournal-KeepAlive/1.0',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (response.ok) {
      console.log(`[KeepAlive] Ping successful (${targetUrl}) - Status: ${response.status} at ${new Date().toISOString()}`);
    } else {
      console.warn(`[KeepAlive] Ping responded with status ${response.status} at ${new Date().toISOString()}`);
    }
  } catch (error) {
    console.warn(`[KeepAlive] Ping attempt failed at ${new Date().toISOString()}: ${error.message}`);
  }
};

/**
 * Starts the periodic keep-alive ping loop.
 */
const startKeepAlive = () => {
  const isExplicitlyEnabled = process.env.ENABLE_KEEP_ALIVE === 'true';
  const isProductionDefault = process.env.NODE_ENV === 'production' && process.env.ENABLE_KEEP_ALIVE !== 'false';

  if (!isExplicitlyEnabled && !isProductionDefault) {
    console.log('[KeepAlive] Service disabled (set ENABLE_KEEP_ALIVE=true or run in production to activate).');
    return;
  }

  const targetUrl = getTargetUrl();
  if (!targetUrl) {
    console.warn('[KeepAlive] Cannot start service: No public URL found (set RENDER_EXTERNAL_URL or BACKEND_URL).');
    return;
  }

  const intervalMinutes = parseInt(process.env.PING_INTERVAL_MINUTES, 10) || 14;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[KeepAlive] Service active. Pinging ${targetUrl} every ${intervalMinutes} minutes.`);

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {
    pingServer(targetUrl);
  }, intervalMs);

  // Unref timer so it does not block the Node process from exiting
  if (timer.unref) {
    timer.unref();
  }
};

/**
 * Stops the keep-alive timer.
 */
const stopKeepAlive = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[KeepAlive] Service stopped.');
  }
};

module.exports = {
  startKeepAlive,
  stopKeepAlive,
  pingServer,
  getTargetUrl,
};
