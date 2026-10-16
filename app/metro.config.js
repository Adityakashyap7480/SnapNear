const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// Local web: Expo has no Vite-style proxy. Forward API + the owner panel so
// empty EXPO_PUBLIC_* URLs (same-origin) work like production / Vercel.
const backend = (process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_DEV_BACKEND || 'http://localhost:5000').replace(
  /\/$/,
  ''
);
const adminDev = (process.env.EXPO_DEV_ADMIN || 'http://localhost:5175').replace(/\/$/, '');

const isApiPath = (url = '') => {
  const path = url.split('?')[0];
  return path === '/api' || path.startsWith('/api/') || path === '/socket.io' || path.startsWith('/socket.io/');
};

const isAdminPath = (url = '') => {
  const path = url.split('?')[0];
  return path === '/admin' || path.startsWith('/admin/');
};

const silentLogger = {
  info() {},
  warn() {},
  error(...args) {
    console.error('[proxy]', ...args);
  },
};

function makeProxy(target, pathCheck, offlineMessage) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    pathFilter: (pathname) => pathCheck(pathname),
    logger: silentLogger,
    on: {
      error(err, req, res) {
        console.error(`[proxy] ${req?.method} ${req?.url} -> ${target} failed:`, err.code || err.message);
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: offlineMessage }));
        }
      },
    },
  });
}

const previousEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const middleware = previousEnhance ? previousEnhance(metroMiddleware, server) : metroMiddleware;
    // pathFilter is required with ws:true so Metro's /hot HMR socket is NOT proxied
    const apiProxy = makeProxy(backend, isApiPath, 'Backend unreachable. Start backend with: cd backend && npm run dev');
    const adminProxy = makeProxy(
      adminDev,
      isAdminPath,
      'Admin app unreachable. Start it with: cd admin && npm run dev'
    );
    return (req, res, next) => {
      const url = req.url || '';
      if (isAdminPath(url)) return adminProxy(req, res, next);
      if (isApiPath(url)) return apiProxy(req, res, next);
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: './src/global.css' });
