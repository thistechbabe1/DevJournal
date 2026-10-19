import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendRequire = createRequire(path.join(rootDir, 'backend', 'package.json'));
const mongoose = backendRequire('mongoose');
const { MongoMemoryServer } = backendRequire('mongodb-memory-server');
const distDir = path.join(rootDir, 'frontend', 'dist', 'dev-journal');
const assetsDir = path.join(rootDir, 'frontend', 'src', 'assets', 'images');
const distAssetsDir = path.join(distDir, 'assets', 'images');

const STATIC_PORT = 4210;
const API_PORT = 5002;

// Import backend app and models
const app = backendRequire('./app.js');
const User = backendRequire('./models/User.js');
const Journal = backendRequire('./models/Journal.js');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath.includes('/assets/')) {
        urlPath = urlPath.substring(urlPath.indexOf('/assets/'));
      }
      let filePath = path.join(distDir, urlPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexPath = path.join(distDir, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      }
    });

    server.listen(STATIC_PORT, () => resolve(server));
  });
}

async function main() {
  console.log('--- 1. Starting In-Memory Mongo Database ---');
  process.env.NODE_ENV = 'development';
  process.env.FRONTEND_URL = 'http://localhost:4210';
  process.env.JWT_SECRET = 'preview_demo_jwt_secret_token_123';
  process.env.JWT_EXPIRES_IN = '24h';

  const mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 }
  });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  console.log('--- 2. Starting Real Express Backend on port', API_PORT, '---');
  const apiServer = await new Promise((resolve) => {
    const s = app.listen(API_PORT, () => resolve(s));
  });

  console.log('--- 3. Seeding Real Demo Account & Journals in MongoDB ---');
  const demoEmail = 'alex.rivera@example.com';
  const demoPassword = 'Password123!';

  // Create demo user
  const demoUser = await User.create({
    name: 'Alex Rivera',
    email: demoEmail,
    password: demoPassword
  });

  // Seed journals with varied categories and tags
  const seededJournals = [
    {
      user: demoUser._id,
      title: 'Decoupled route guards with Angular signals',
      content: '<p>Refactored our authorization pipeline to use functional signal-based CanActivateFn guards. Eliminated class-based state boilerplate and achieved instantaneous client-side navigation.</p>',
      category: 'Architecture',
      date: new Date('2026-10-14T09:30:00Z'),
      tags: ['Angular', 'Signals', 'Architecture'],
      status: 'published'
    },
    {
      user: demoUser._id,
      title: 'Investigating Redux race conditions during auth token renewal',
      content: '<p>Resolved a subtle race condition where concurrent dispatchers requested fresh access tokens simultaneously. Introduced an async queue mutex and unified pending promises.</p>',
      category: 'Frontend',
      date: new Date('2026-10-12T14:15:00Z'),
      tags: ['Redux', 'TypeScript', 'Bugfix'],
      status: 'published'
    },
    {
      user: demoUser._id,
      title: 'Optimizing PostgreSQL composite indexes for read throughput',
      content: '<p>Analyzed slow query plans across multi-tenant journal filters. Adding composite B-tree indexes across (userId, category, createdAt) dropped p99 query latency from 240ms to 8ms.</p>',
      category: 'Database',
      date: new Date('2026-10-10T11:00:00Z'),
      tags: ['Postgres', 'SQL', 'Performance'],
      status: 'published'
    },
    {
      user: demoUser._id,
      title: 'Building resilient microservices with circuit breakers',
      content: '<p>Integrated circuit breaker patterns for our external downstream API dependencies. Tested cascading timeout scenarios under 40% simulated packet loss; system remained responsive throughout.</p>',
      category: 'Backend',
      date: new Date('2026-10-08T16:45:00Z'),
      tags: ['Node', 'Resilience', 'Microservices'],
      status: 'published'
    }
  ];

  for (const j of seededJournals) {
    await Journal.create(j);
  }

  // Obtain real login JWT token from Express auth route
  const loginRes = await fetch(`http://localhost:${API_PORT}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: demoEmail, password: demoPassword })
  });
  const loginData = await loginRes.json();
  const realToken = loginData.token;
  console.log('Seeded demo user authenticated. Token acquired successfully.');

  console.log('--- 4. Starting Static Server from dist ---');
  const staticServer = await startStaticServer();

  console.log('--- 5. Capturing Real App Screenshots with Playwright ---');
  const browser = await chromium.launch({ headless: true });

  const themes = ['light', 'dark'];
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 675 },
      deviceScaleFactor: 1
    });

    // Proxy requests from frontend environment apiUrl to real local Express backend
    await context.route(/.*render\.com\/api\/.*/, async (route) => {
      const origUrl = route.request().url();
      const pathSuffix = origUrl.substring(origUrl.indexOf('/api/'));
      const target = `http://localhost:${API_PORT}${pathSuffix}`;
      const method = route.request().method();
      const headers = { ...route.request().headers() };
      delete headers['host'];

      console.log(`[API Intercept] ${method} ${pathSuffix}`);

      try {
        const fetchOpts = {
          method,
          headers
        };
        const postData = route.request().postDataBuffer();
        if (method !== 'GET' && method !== 'HEAD' && postData) {
          fetchOpts.body = postData;
        }

        const res = await fetch(target, fetchOpts);
        const buffer = await res.arrayBuffer();
        await route.fulfill({
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: Buffer.from(buffer)
        });
      } catch (err) {
        console.error(`[API Proxy Error] ${target}:`, err);
        await route.abort();
      }
    });

    const page = await context.newPage();
    page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));

    // Pre-seed storage before navigation by using addInitScript
    await context.addInitScript(({ tok, thm }) => {
      sessionStorage.setItem('token', tok);
      localStorage.setItem('devjournal-theme', thm);
      document.documentElement.setAttribute('data-theme', thm);
    }, { tok: realToken, thm: theme });

    // Navigate to /journal page with real seeded entries
    console.log(`Navigating to /journal for theme: ${theme}`);
    await page.goto(`http://localhost:${STATIC_PORT}/journal`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log(`Arrived at: ${page.url()}`);
    await page.evaluate((thm) => {
      document.documentElement.setAttribute('data-theme', thm);
    }, theme);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);

    // Capture screenshot to PNG buffer
    const pngBuffer = await page.screenshot({ fullPage: false });

    // Convert to WebP in Chromium canvas
    let quality = 0.82;
    let webpBuffer;
    let webpBase64;

    while (quality >= 0.5) {
      webpBase64 = await page.evaluate(async ({ pngData, q }) => {
        const img = new Image();
        await new Promise((res) => { img.onload = res; img.src = pngData; });
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 675;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1200, 675);
        return canvas.toDataURL('image/webp', q).split(',')[1];
      }, { pngData: `data:image/png;base64,${pngBuffer.toString('base64')}`, q: quality });

      webpBuffer = Buffer.from(webpBase64, 'base64');
      if (webpBuffer.length <= 80 * 1024) {
        break;
      }
      quality -= 0.05;
    }

    const outPath = path.join(assetsDir, `app-preview-${theme}.webp`);
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(outPath, webpBuffer);

    // Also copy to dist if dist exists
    fs.mkdirSync(distAssetsDir, { recursive: true });
    fs.writeFileSync(path.join(distAssetsDir, `app-preview-${theme}.webp`), webpBuffer);

    const sizeKb = (webpBuffer.length / 1024).toFixed(1);
    console.log(`Generated app-preview-${theme}.webp: ${sizeKb} KB (Quality: ${quality.toFixed(2)}, limit <= 80 KB)`);

    await context.close();

    // Now capture mobile portrait crop (390x520)
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 520 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    });

    await mobileContext.route(/.*render\.com\/api\/.*/, async (route) => {
      const origUrl = route.request().url();
      const pathSuffix = origUrl.substring(origUrl.indexOf('/api/'));
      const target = `http://localhost:${API_PORT}${pathSuffix}`;
      const method = route.request().method();
      const headers = { ...route.request().headers() };
      delete headers['host'];

      try {
        const fetchOpts = { method, headers };
        const postData = route.request().postDataBuffer();
        if (method !== 'GET' && method !== 'HEAD' && postData) {
          fetchOpts.body = postData;
        }

        const res = await fetch(target, fetchOpts);
        const buffer = await res.arrayBuffer();
        await route.fulfill({
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: Buffer.from(buffer)
        });
      } catch (err) {
        await route.abort();
      }
    });

    const mobilePage = await mobileContext.newPage();
    await mobileContext.addInitScript(({ tok, thm }) => {
      sessionStorage.setItem('token', tok);
      localStorage.setItem('devjournal-theme', thm);
      document.documentElement.setAttribute('data-theme', thm);
    }, { tok: realToken, thm: theme });

    console.log(`Navigating mobilePage to /journal for theme: ${theme}`);
    await mobilePage.goto(`http://localhost:${STATIC_PORT}/journal`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForLoadState('networkidle').catch(() => {});
    console.log(`Mobile arrived at: ${mobilePage.url()}`);
    await mobilePage.evaluate((thm) => {
      document.documentElement.setAttribute('data-theme', thm);
    }, theme);
    await mobilePage.evaluate(() => document.fonts.ready);
    await mobilePage.waitForTimeout(1000);

    const mobilePngBuffer = await mobilePage.screenshot({ fullPage: false });

    let mobileQuality = 0.82;
    let mobileWebpBuffer;
    let mobileWebpBase64;

    while (mobileQuality >= 0.5) {
      mobileWebpBase64 = await mobilePage.evaluate(async ({ pngData, q }) => {
        const img = new Image();
        await new Promise((res) => { img.onload = res; img.src = pngData; });
        const canvas = document.createElement('canvas');
        canvas.width = 390;
        canvas.height = 520;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 390, 520);
        return canvas.toDataURL('image/webp', q).split(',')[1];
      }, { pngData: `data:image/png;base64,${mobilePngBuffer.toString('base64')}`, q: mobileQuality });

      mobileWebpBuffer = Buffer.from(mobileWebpBase64, 'base64');
      if (mobileWebpBuffer.length <= 60 * 1024) {
        break;
      }
      mobileQuality -= 0.05;
    }

    const mobileOutPath = path.join(assetsDir, `app-preview-mobile-${theme}.webp`);
    fs.writeFileSync(mobileOutPath, mobileWebpBuffer);
    fs.writeFileSync(path.join(distAssetsDir, `app-preview-mobile-${theme}.webp`), mobileWebpBuffer);

    const mobileSizeKb = (mobileWebpBuffer.length / 1024).toFixed(1);
    console.log(`Generated app-preview-mobile-${theme}.webp: ${mobileSizeKb} KB (Quality: ${mobileQuality.toFixed(2)}, limit <= 60 KB)`);

    await mobileContext.close();
  }

  await browser.close();
  staticServer.close();
  apiServer.close();
  await mongoose.disconnect();
  await mongoServer.stop();

  console.log('--- 6. Completed Demo Preview Generation ---');
}

main().catch((err) => {
  console.error('Error generating previews:', err);
  process.exit(1);
});
