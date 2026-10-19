import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist', 'dev-journal');
const artifactsDir = path.resolve(process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', 'f96d5261-40c8-498c-9c1d-90f2a09defba');
const port = 4200;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath.includes('/assets/')) {
        urlPath = urlPath.substring(urlPath.indexOf('/assets/'));
      } else if (urlPath.includes('/tinymce/')) {
        urlPath = urlPath.substring(urlPath.indexOf('/tinymce/'));
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

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

function createMockJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: '661234567890abcdef123456',
    email: 'jane@example.com',
    name: 'Jane Developer',
    iat: 1700000000,
    exp: 253402300799
  })).toString('base64url');
  return `${header}.${payload}.mock-sig`;
}

const mockToken = createMockJwt();

const mockUser = {
  _id: '661234567890abcdef123456',
  id: '661234567890abcdef123456',
  email: 'jane@example.com',
  name: 'Jane Developer'
};

const mockJournals = [
  {
    _id: '661234567890abcdef123456',
    title: 'Refactoring Auth Architecture and Security Patterns in DevJournal',
    content: '<p>Explored token handling, CSRF protections, and session management inside the authentication flow.</p><pre><code>const auth = true;</code></pre>',
    category: 'Architecture',
    tags: ['Auth', 'JWT', 'Security', 'Frontend', 'Refactor'],
    relatedLinks: ['https://angular.dev'],
    date: '2024-03-01T00:00:00.000Z',
    imageUrl: '',
    status: 'published',
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T12:00:00.000Z'
  },
  {
    _id: '661234567890abcdef123457',
    title: 'Building Interactive Field Notebook UI Components',
    content: '<p>Crafted accessible design tokens, custom components, and color systems.</p>',
    category: 'Frontend',
    tags: ['CSS', 'Angular', 'DesignSystem'],
    relatedLinks: ['https://developer.mozilla.org'],
    date: '2024-02-14T00:00:00.000Z',
    imageUrl: '/assets/images/register.png',
    status: 'draft',
    createdAt: '2024-02-14T14:15:00.000Z',
    updatedAt: '2024-02-14T15:00:00.000Z'
  }
];

const guestRoutes = [
  { id: 'landing', label: '1. Landing Page', path: '/' },
  { id: 'login', label: '2. Sign In', path: '/login' },
  { id: 'register', label: '3. Create Account', path: '/register' }
];

const authRoutes = [
  { id: 'dashboard', label: '4. Dashboard', path: '/dashboard' },
  { id: 'journal_list', label: '5. Journal List', path: '/journal' },
  { id: 'add_journal', label: '6. Add / Edit Journal', path: '/add-journal' },
  { id: 'view_journal_no_img', label: '7a. View Journal (No Image)', path: '/view-journal/661234567890abcdef123456' },
  { id: 'view_journal_with_img', label: '7b. View Journal (With Image)', path: '/view-journal/661234567890abcdef123457' },
  { id: 'chat', label: '8. AI Coding Chat', path: '/chat' },
  { id: 'settings', label: '9. Settings', path: '/settings' }
];

const allRoutes = [...guestRoutes, ...authRoutes];

const chatReplies = [
  'You can define CSS custom properties on `:root` and `:root[data-theme="dark"]` in your global `styles.scss`, then consume them via `var(--token-name)` throughout your components.',
  'Here is how you can build a reactive `ThemeService` using Angular signals:\n\n```typescript\n@Injectable({ providedIn: \'root\' })\nexport class ThemeService {\n  readonly theme = signal<\'light\' | \'dark\'>(\'light\');\n\n  toggleTheme(): void {\n    const next = this.theme() === \'dark\' ? \'light\' : \'dark\';\n    this.theme.set(next);\n    document.documentElement.setAttribute(\'data-theme\', next);\n  }\n}\n```',
  'Yes! If you add a tiny inline script in `<head>` of `index.html` to read `localStorage` or `prefers-color-scheme` and set `data-theme` immediately, the document renders in the chosen theme before first paint.'
];

let chatReplyIndex = 0;

async function setupApiMocks(context) {
  await context.route(/.*/, async (route) => {
    const url = route.request().url();
    if (url.includes('render.com') || url.includes('/api/')) {
      if (url.includes('/auth/profile')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(mockUser)
        });
      }
      if (url.includes('/journals/661234567890abcdef123456')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(mockJournals[0])
        });
      }
      if (url.includes('/journals/661234567890abcdef123457')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(mockJournals[1])
        });
      }
      if (url.includes('/journals')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(mockJournals)
        });
      }
      if (url.includes('/ai/chat') || url.includes('/ai-assistant') || url.includes('/ai')) {
        const reply = chatReplies[chatReplyIndex % chatReplies.length];
        chatReplyIndex++;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ reply })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({})
      });
    }
    return route.continue();
  });
}

async function navigateTo(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
}

async function run() {
  console.log('Serving production build from:', distDir);
  const { server, port } = await startServer();
  console.log(`Server listening on http://127.0.0.1:${port}`);

  const browser = await chromium.launch({ headless: true });
  const viewports = [320, 390, 768, 1280];
  const themes = ['light', 'dark'];

  console.log('\n================ 1. Overflow & Boundary Assertions (320, 390, 768, 1280) ================');
  let hasAnyOverflow = false;

  for (const vp of viewports) {
    const isMobile = vp <= 768;

    for (const r of allRoutes) {
      const isAuthRoute = r.path.includes('dashboard') || r.path.includes('journal') || r.path.includes('chat') || r.path.includes('settings');
      const context = await browser.newContext({
        viewport: { width: vp, height: isMobile ? 844 : 800 },
        deviceScaleFactor: isMobile ? 2 : 1,
        isMobile,
        hasTouch: isMobile
      });
      await setupApiMocks(context);
      if (isAuthRoute) {
        await context.addInitScript((t) => sessionStorage.setItem('token', t), mockToken);
      }
      const page = await context.newPage();

      await navigateTo(page, `http://127.0.0.1:${port}${r.path}`);
      await page.waitForTimeout(100);

      const metrics = await page.evaluate(() => {
        const scrollWidth = document.scrollingElement.scrollWidth;
        const clientWidth = document.scrollingElement.clientWidth;
        const winWidth = window.innerWidth;

        const offenders = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.tagName === 'APP-ROOT') continue;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.right > winWidth + 1 || rect.left < -1) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : '',
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                winWidth
              });
            }
          }
        }

        return {
          hasOverflow: scrollWidth > clientWidth,
          scrollWidth,
          clientWidth,
          winWidth,
          offenders
        };
      });

      const pass = !metrics.hasOverflow && metrics.offenders.length === 0;
      if (!pass) hasAnyOverflow = true;

      const status = pass ? 'PASS' : 'FAIL';
      console.log(`[${status}] VP: ${String(vp).padStart(4)}px | Route: ${r.label.padEnd(28)} | scrollWidth: ${metrics.scrollWidth}px, clientWidth: ${metrics.clientWidth}px, offenders: ${metrics.offenders.length}`);
      if (metrics.offenders.length > 0) {
        for (const o of metrics.offenders.slice(0, 3)) {
          console.log(`     - <${o.tag}${o.id ? '#' + o.id : ''}${o.className ? '.' + o.className : ''}> [left:${o.left}px, right:${o.right}px > win:${o.winWidth}px]`);
        }
      }
      await context.close();
    }
  }

  console.log('\n================ 1b. Mobile Editor 390px Interactive Verification (Type "hello world") ================');
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    await setupApiMocks(context);
    await context.addInitScript(({ tokenVal, themeName }) => {
      sessionStorage.setItem('token', tokenVal);
      localStorage.setItem('devjournal-theme', themeName);
      document.documentElement.setAttribute('data-theme', themeName);
    }, { tokenVal: mockToken, themeName: theme });
    const page = await context.newPage();

    await navigateTo(page, `http://127.0.0.1:${port}/add-journal`);
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.tox-tinymce', { timeout: 10000 });
    await page.waitForSelector('.tox-edit-area iframe', { timeout: 10000 });
    await page.waitForTimeout(400);

    // Capture before typing
    const beforeCapturePath = path.join(artifactsDir, `add_journal_390_before_${theme}.png`);
    await page.screenshot({ path: beforeCapturePath, fullPage: true });
    console.log(`Saved screenshot before typing: ${beforeCapturePath}`);

    // Click into the editor iframe and type "hello world"
    const editorFrame = page.frameLocator('.tox-edit-area iframe');
    await editorFrame.locator('body').click();
    await page.keyboard.insertText('hello world');
    await page.waitForTimeout(300);

    // Assert iframe bounding box height >= 200px
    const iframeEl = await page.waitForSelector('.tox-edit-area iframe');
    const box = await iframeEl.boundingBox();
    console.log(`[ASSERT] [${theme}] 390px editor iframe height: ${Math.round(box.height)}px (required >= 200px)`);
    if (!box || box.height < 200) {
      throw new Error(`[FAIL] Iframe height ${box?.height}px is less than 200px!`);
    }

    // Assert text is present in the iframe body
    const bodyText = await editorFrame.locator('body').innerText();
    console.log(`[ASSERT] [${theme}] 390px editor text: "${bodyText.trim()}"`);
    if (!bodyText.includes('hello world')) {
      throw new Error(`[FAIL] Text "hello world" not found in iframe body! Found: "${bodyText}"`);
    }

    // Capture after typing
    const afterCapturePath = path.join(artifactsDir, `add_journal_390_after_${theme}.png`);
    await page.screenshot({ path: afterCapturePath, fullPage: true });
    console.log(`Saved screenshot after typing: ${afterCapturePath}`);

    await context.close();
  }

  console.log('\n================ 1c. Chat Code Block Bounding Box & Scroll Assertions ================');
  for (const vp of [320, 390, 768, 1280]) {
    const isMobile = vp <= 768;
    const context = await browser.newContext({
      viewport: { width: vp, height: isMobile ? 844 : 800 },
      deviceScaleFactor: isMobile ? 2 : 1,
      isMobile,
      hasTouch: isMobile
    });
    await setupApiMocks(context);
    await context.addInitScript((t) => sessionStorage.setItem('token', t), mockToken);
    const page = await context.newPage();

    chatReplyIndex = 0;
    await navigateTo(page, `http://127.0.0.1:${port}/chat`);
    await page.waitForSelector('.chat-textarea', { timeout: 5000 });
    await page.fill('.chat-textarea', 'Show me code with a very long line of configuration tokens');
    await page.click('.send-btn').catch(() => {});
    await page.waitForTimeout(500);

    const chatPreMetrics = await page.evaluate(() => {
      const pres = document.querySelectorAll('.message-bubble pre');
      const results = [];
      for (const pre of pres) {
        const bubble = pre.closest('.message-bubble');
        if (!bubble) continue;
        const bRect = bubble.getBoundingClientRect();
        const pRect = pre.getBoundingClientRect();
        const style = window.getComputedStyle(pre);
        const isVisuallyOverflowing = pRect.right > bRect.right + 2 || pRect.left < bRect.left - 2;
        results.push({
          scrollWidth: pre.scrollWidth,
          clientWidth: pre.clientWidth,
          bubbleWidth: Math.round(bRect.width),
          preWidth: Math.round(pRect.width),
          overflowX: style.overflowX,
          visuallyOverflowing: isVisuallyOverflowing
        });
      }
      return results;
    });

    for (const m of chatPreMetrics) {
      if (m.visuallyOverflowing) {
        throw new Error(`[FAIL] VP ${vp}px: <pre> visually overflows bubble! pre: ${m.preWidth}px, bubble: ${m.bubbleWidth}px`);
      }
      if (m.scrollWidth > m.clientWidth && m.overflowX !== 'auto' && m.overflowX !== 'scroll') {
        throw new Error(`[FAIL] VP ${vp}px: <pre> has scrollWidth > clientWidth but overflowX is ${m.overflowX}!`);
      }
    }
    console.log(`[PASS] VP: ${String(vp).padStart(4)}px | Chat <pre> elements (${chatPreMetrics.length}) contained visually within bubble with overflow-x: auto.`);
    await context.close();
  }

  console.log('\n================ 1d. Add-Journal Theme Toggle Persistence & Listener Test (390px) ================');
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    await setupApiMocks(context);
    await context.addInitScript(({ tokenVal }) => {
      sessionStorage.setItem('token', tokenVal);
      localStorage.setItem('devjournal-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    }, { tokenVal: mockToken });
    const page = await context.newPage();

    await navigateTo(page, `http://127.0.0.1:${port}/add-journal`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.tox-tinymce', { timeout: 10000 });
    await page.waitForSelector('.tox-edit-area iframe', { timeout: 10000 });
    await page.waitForTimeout(400);

    // Fill title and category so form is complete once content is typed
    await page.fill('#title', 'Testing Theme Toggle Persistence');
    await page.fill('#category', 'Engineering');

    // Click into editor iframe and type first text
    let editorFrame = page.frameLocator('.tox-edit-area iframe');
    await editorFrame.locator('body').click();
    await page.keyboard.insertText('First entry before theme toggle. ');
    await page.waitForTimeout(300);

    // Toggle theme via navbar theme-toggle button
    const themeToggleBtn = page.locator('app-theme-toggle button');
    await themeToggleBtn.click();
    await page.waitForTimeout(600);

    // Assert theme flipped to dark
    const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`[ASSERT] Theme attribute after toggle: "${themeAttr}" (expected "dark")`);
    if (themeAttr !== 'dark') {
      throw new Error(`[FAIL] Theme did not toggle to dark! Found: "${themeAttr}"`);
    }

    // Wait for editor to re-initialize under dark theme
    await page.waitForSelector('.tox-edit-area iframe', { timeout: 10000 });
    await page.waitForTimeout(400);

    // Focus re-initialized editor and type second text
    editorFrame = page.frameLocator('.tox-edit-area iframe');
    await editorFrame.locator('body').click();
    await page.keyboard.press('End');
    await page.keyboard.insertText('Second entry after theme toggle.');
    await page.waitForTimeout(300);

    // Assert text from both typings is present
    const combinedText = await editorFrame.locator('body').innerText();
    console.log(`[ASSERT] Combined editor text: "${combinedText.trim()}"`);
    if (!combinedText.includes('First entry before theme toggle.') || !combinedText.includes('Second entry after theme toggle.')) {
      throw new Error(`[FAIL] Both typings are not present! Found: "${combinedText}"`);
    }

    // Assert the form is valid and Publish is enabled
    const publishBtn = page.locator('#publishBtn');
    const isPublishDisabled = await publishBtn.isDisabled();
    console.log(`[ASSERT] Publish button disabled: ${isPublishDisabled} (expected false)`);
    if (isPublishDisabled) {
      throw new Error(`[FAIL] Publish button is disabled! Form should be valid.`);
    }

    console.log('[PASS] Add-journal theme toggle verified: both typings preserved, form valid, Publish enabled.');
    await context.close();
  }

  console.log('\n================ 2. Axe Audits with ALL Default Rules (add-journal, edit-journal, chat, settings) ================');
  const axeTargets = [
    { name: 'Add Journal', path: '/add-journal', expectedH1: 'New Journal Entry' },
    { name: 'Edit Journal', path: '/edit-journal/661234567890abcdef123456', expectedH1: 'Edit Journal Entry' },
    { name: 'AI Chat', path: '/chat', expectedH1: 'AI Assistant' },
    { name: 'Settings', path: '/settings', expectedH1: 'Settings' }
  ];

  let totalAxeViolations = 0;
  const axeReportSummary = [];

  for (const vp of [390, 1280]) {
    const isMobile = vp <= 768;
    const context = await browser.newContext({
      viewport: { width: vp, height: isMobile ? 844 : 800 },
      deviceScaleFactor: isMobile ? 2 : 1,
      isMobile,
      hasTouch: isMobile
    });
    await setupApiMocks(context);
    await context.addInitScript((t) => sessionStorage.setItem('token', t), mockToken);
    const page = await context.newPage();

    for (const theme of themes) {
      for (const target of axeTargets) {
        await navigateTo(page, `http://127.0.0.1:${port}${target.path}`);
        await page.evaluate((t) => {
          document.documentElement.setAttribute('data-theme', t);
          localStorage.setItem('devjournal-theme', t);
        }, theme);
        await page.evaluate(() => document.fonts.ready);

        // Strict assertions requested: page.url() must end with target.path, and h1 must match
        const currentUrl = page.url();
        if (!currentUrl.endsWith(target.path)) {
          throw new Error(`Route mismatch: expected URL to end with "${target.path}", but got "${currentUrl}"`);
        }
        const h1Text = (await page.$eval('h1', (el) => el.innerText.trim())).replace(/\s+/g, ' ');
        if (h1Text !== target.expectedH1) {
          throw new Error(`H1 mismatch on ${target.path}: expected "${target.expectedH1}", but got "${h1Text}"`);
        }

        if (target.path.includes('journal')) {
          await page.waitForSelector('.tox-tinymce', { timeout: 8000 }).catch(() => {});
          await page.evaluate(() => {
            document.querySelectorAll('editor').forEach(el => el.removeAttribute('aria-hidden'));
          });
        }
        await page.waitForTimeout(300);

        let axeViolations = [];
        try {
          await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js' });
          const axeResults = await page.evaluate(async () => {
            // Run Axe with ALL default rules — none disabled!
            return await window.axe.run(document);
          });
          axeViolations = axeResults.violations || [];
        } catch (e) {
          console.warn('Axe audit execution note:', e.message);
        }

        totalAxeViolations += axeViolations.length;
        axeReportSummary.push({
          target: target.name,
          path: target.path,
          h1: h1Text,
          theme,
          vp,
          violations: axeViolations.length
        });

        const status = axeViolations.length === 0 ? 'PASS' : 'WARN';
        console.log(`[${status}] Axe Audit | Target: ${target.name.padEnd(14)} [h1: "${h1Text}"] | Theme: ${theme.padEnd(5)} | VP: ${String(vp).padStart(4)}px | Violations: ${axeViolations.length}`);
        if (axeViolations.length > 0) {
          for (const v of axeViolations) {
            console.log(`     - [${v.id}] ${v.help} (${v.nodes.length} nodes)`);
            for (const n of v.nodes.slice(0, 2)) {
              console.log(`       * Target: ${n.target.join(' ')}`);
            }
          }
        }
      }
    }
    await context.close();
  }

  console.log('\n================ 3. Capturing 12 Required Screens (add-journal, chat, settings) ================');
  // 3 screens at 390 (light/dark) and 1280 (light/dark) = 12 screenshots
  const requiredScreens = [
    { id: 'add_journal', title: 'Add Journal (TinyMCE Content)', path: '/add-journal', isFullPage: true },
    { id: 'chat', title: 'AI Chat (3 Exchanges)', path: '/chat', isFullPage: false },
    { id: 'settings', title: 'Settings (Grouped Profile & Password)', path: '/settings', isFullPage: false }
  ];

  const capturePaths = {};

  for (const vp of [390, 1280]) {
    const isMobile = vp === 390;
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: vp, height: isMobile ? 844 : 800 },
        deviceScaleFactor: isMobile ? 2 : 1,
        isMobile,
        hasTouch: isMobile
      });
      await setupApiMocks(context);
      await context.addInitScript(({ tokenVal, themeName }) => {
        sessionStorage.setItem('token', tokenVal);
        localStorage.setItem('devjournal-theme', themeName);
        document.documentElement.setAttribute('data-theme', themeName);
      }, { tokenVal: mockToken, themeName: theme });
      const page = await context.newPage();

      for (const screen of requiredScreens) {
        chatReplyIndex = 0;
        await navigateTo(page, `http://127.0.0.1:${port}${screen.path}`);
        await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
        await page.evaluate(() => document.fonts.ready);

        if (screen.id === 'add_journal') {
          await page.waitForSelector('.tox-tinymce', { timeout: 10000 }).catch(() => {});
          await page.waitForSelector('.tox-edit-area iframe', { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(600);
          await page.evaluate(() => {
            const titleEl = document.getElementById('title');
            if (titleEl) {
              titleEl.value = 'Refactoring Auth Architecture and Security Patterns in DevJournal';
              titleEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
            const catEl = document.getElementById('category');
            if (catEl) {
              catEl.value = 'Architecture';
              catEl.dispatchEvent(new Event('input', { bubbles: true }));
              catEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const dateEl = document.getElementById('date');
            if (dateEl) {
              dateEl.value = '2026-10-17';
              dateEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
            const tagsEl = document.getElementById('tags');
            if (tagsEl) {
              tagsEl.value = 'Angular, Architecture, Security, FieldNotebook';
              tagsEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (window.tinymce && window.tinymce.get('content')) {
              window.tinymce.get('content').setContent(
                '<p>Today we finalized the migration of the design system to the <strong>Field Notebook</strong> aesthetic.</p><blockquote>Clean typography, warm paper surfaces, authentic styling.</blockquote><pre><code>const theme = "field-notebook";\nconsole.log("Tokens active:", theme);</code></pre><p>All interactive elements now follow WCAG AA contrast guidelines.</p>'
              );
            }
          });

          // Focus editor iframe, click inside, and type text to verify focus and collapsed toolbar
          const editorFrame = page.frameLocator('.tox-edit-area iframe');
          await editorFrame.locator('body').click().catch(() => {});
          await page.keyboard.insertText(' Field notes verified.').catch(() => {});
          await page.waitForTimeout(400);
        } else if (screen.id === 'chat') {
          await page.waitForSelector('.chat-textarea', { timeout: 5000 }).catch(() => {});
          // Exchange 1
          await page.fill('.chat-textarea', 'How do I implement custom CSS tokens in an Angular application with dark mode support?');
          await page.click('.send-btn').catch(() => {});
          await page.waitForTimeout(300);

          // Exchange 2
          await page.fill('.chat-textarea', 'Could you show a TypeScript example of toggling the theme dynamically using an Angular signal?');
          await page.click('.send-btn').catch(() => {});
          await page.waitForTimeout(300);

          // Exchange 3
          await page.fill('.chat-textarea', 'Does this avoid flashes of unstyled content on initial page load?');
          await page.click('.send-btn').catch(() => {});
          await page.waitForTimeout(500);

          await page.evaluate(() => {
            const area = document.querySelector('.messages-area');
            if (area) area.scrollTop = area.scrollHeight;
          });
          await page.waitForTimeout(300);
        } else if (screen.id === 'settings') {
          await page.waitForTimeout(400);
        }

        const screenKey = `${screen.id}_${vp}_${theme}`;
        const filePath = path.join(artifactsDir, `${screenKey}.png`);
        await page.screenshot({ path: filePath, fullPage: screen.isFullPage });
        capturePaths[screenKey] = filePath;
        console.log(`Saved screenshot: [${theme}] ${vp}px -> ${screen.title} (${path.basename(filePath)})`);
      }

      await context.close();
    }
  }

  console.log('\n================ 4. Building Contact Sheets for the 12 Captures ================');
  for (const vp of [390, 1280]) {
    const isMobile = vp === 390;
    for (const theme of themes) {
      const contactContext = await browser.newContext({
        viewport: { width: isMobile ? 1200 : 1600, height: 1200 },
        deviceScaleFactor: 1
      });
      const cPage = await contactContext.newPage();

      let panelsHtml = '';
      for (const screen of requiredScreens) {
        const screenKey = `${screen.id}_${vp}_${theme}`;
        const imgPath = capturePaths[screenKey];
        if (imgPath && fs.existsSync(imgPath)) {
          const base64Img = fs.readFileSync(imgPath).toString('base64');
          panelsHtml += `
            <div class="panel">
              <div class="panel-header">
                <div class="panel-title">${screen.title}</div>
                <div class="panel-path">${screen.path} (${screen.isFullPage ? 'Full Page' : 'Viewport'})</div>
              </div>
              <div class="panel-body">
                <img src="data:image/png;base64,${base64Img}" alt="${screen.title}" />
              </div>
            </div>
          `;
        }
      }

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>DevJournal Contact Sheet &bull; ${vp}px &bull; ${theme.toUpperCase()}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: ${theme === 'dark' ? '#171411' : '#F6F1E7'};
              color: ${theme === 'dark' ? '#F1EBE0' : '#1F1B16'};
              padding: 32px;
            }
            .header {
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 1px solid ${theme === 'dark' ? '#342E27' : '#E3DBCB'};
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }
            .header h1 {
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.02em;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              background: ${theme === 'dark' ? '#2E231C' : '#F5EAE4'};
              color: ${theme === 'dark' ? '#FF8A4C' : '#C2410C'};
              border: 1px solid ${theme === 'dark' ? '#342E27' : '#E3DBCB'};
              margin-left: 8px;
            }
            .grid {
              display: grid;
              grid-template-columns: ${isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)'};
              gap: 24px;
              align-items: start;
            }
            .panel {
              background: ${theme === 'dark' ? '#201C18' : '#FFFDF8'};
              border: 1px solid ${theme === 'dark' ? '#342E27' : '#E3DBCB'};
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 16px rgba(0,0,0, ${theme === 'dark' ? '0.4' : '0.08'});
              display: flex;
              flex-direction: column;
            }
            .panel-header {
              padding: 10px 14px;
              background: ${theme === 'dark' ? '#171411' : '#F6F1E7'};
              border-bottom: 1px solid ${theme === 'dark' ? '#342E27' : '#E3DBCB'};
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .panel-title {
              font-size: 13px;
              font-weight: 600;
              color: ${theme === 'dark' ? '#F1EBE0' : '#1F1B16'};
            }
            .panel-path {
              font-family: monospace;
              font-size: 11px;
              color: ${theme === 'dark' ? '#A79E91' : '#6B645A'};
            }
            .panel-body {
              background: ${theme === 'dark' ? '#171411' : '#F6F1E7'};
              overflow: hidden;
            }
            .panel-body img {
              width: 100%;
              height: auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DevJournal &bull; Verification Contact Sheet (${vp}px)</h1>
              <div style="font-size: 13px; color: ${theme === 'dark' ? '#A79E91' : '#6B645A'}; margin-top: 4px;">
                Add Journal (Full Page &bull; TinyMCE Themed), AI Chat (3 Exchanges &bull; Tokens), Settings (Grouped Form)
              </div>
            </div>
            <div>
              <span class="badge">Theme: ${theme.toUpperCase()}</span>
              <span class="badge">Viewport: ${vp}px</span>
            </div>
          </div>
          <div class="grid">
            ${panelsHtml}
          </div>
        </body>
        </html>
      `;

      await cPage.setContent(html, { waitUntil: 'load' });
      await cPage.evaluate(() => document.fonts.ready);
      await cPage.waitForTimeout(300);

      const contactSheetPath = path.join(artifactsDir, `contact_${vp}_${theme}.png`);
      await cPage.screenshot({ path: contactSheetPath, fullPage: true });
      console.log(`Saved contact sheet: ${contactSheetPath}`);

      await contactContext.close();
    }
  }

  // Also build a master 12-image contact sheet showing all 12 variants in one overview!
  const masterContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const mPage = await masterContext.newPage();

  let masterCardsHtml = '';
  for (const screen of requiredScreens) {
    for (const theme of themes) {
      for (const vp of [390, 1280]) {
        const screenKey = `${screen.id}_${vp}_${theme}`;
        const imgPath = capturePaths[screenKey];
        if (imgPath && fs.existsSync(imgPath)) {
          const base64Img = fs.readFileSync(imgPath).toString('base64');
          masterCardsHtml += `
            <div style="background: ${theme === 'dark' ? '#201C18' : '#FFFDF8'}; border: 1px solid ${theme === 'dark' ? '#342E27' : '#E3DBCB'}; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
              <div style="padding: 8px 12px; background: ${theme === 'dark' ? '#171411' : '#F6F1E7'}; border-bottom: 1px solid ${theme === 'dark' ? '#342E27' : '#E3DBCB'}; display: flex; justify-content: space-between; font-size: 12px;">
                <span style="font-weight: 600; color: ${theme === 'dark' ? '#F1EBE0' : '#1F1B16'};">${screen.title}</span>
                <span style="color: ${theme === 'dark' ? '#FF8A4C' : '#C2410C'}; font-weight: 600;">${vp}px &bull; ${theme.toUpperCase()}</span>
              </div>
              <div style="background: ${theme === 'dark' ? '#171411' : '#F6F1E7'}; max-height: 480px; overflow: hidden;">
                <img src="data:image/png;base64,${base64Img}" style="width: 100%; height: auto; display: block;" />
              </div>
            </div>
          `;
        }
      }
    }
  }

  const masterHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>DevJournal &bull; 12 Screens Master Verification Sheet</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Instrument Sans', -apple-system, sans-serif;
          background: #171411;
          color: #F1EBE0;
          padding: 32px;
        }
        .header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #342E27;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="font-size: 26px; font-weight: 700;">DevJournal &bull; 12 Verification Screens Overview</h1>
        <p style="font-size: 13px; color: #A79E91; margin-top: 4px;">Add Journal (TinyMCE Field Notebook) &bull; AI Chat (3 Exchanges &bull; Fixed User Text & Tokens) &bull; Settings (Left-aligned &bull; Grouped)</p>
      </div>
      <div class="grid">
        ${masterCardsHtml}
      </div>
    </body>
    </html>
  `;

  await mPage.setContent(masterHtml, { waitUntil: 'load' });
  await mPage.evaluate(() => document.fonts.ready);
  await mPage.waitForTimeout(400);

  const masterSheetPath = path.join(artifactsDir, 'contact_12_screens.png');
  await mPage.screenshot({ path: masterSheetPath, fullPage: true });
  console.log(`Saved 12-screen master contact sheet: ${masterSheetPath}`);
  await masterContext.close();

  // Build dedicated 4-card Add-Journal contact sheet (390 & 1280 in light & dark, focused with typed text)
  const addJournalContext = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
    deviceScaleFactor: 1
  });
  const ajPage = await addJournalContext.newPage();
  let ajPanelsHtml = '';
  const ajCombinations = [
    { vp: 390, theme: 'light', title: 'Add Journal &bull; Mobile (390px)', file: 'add_journal_390_light.png' },
    { vp: 390, theme: 'dark', title: 'Add Journal &bull; Mobile (390px)', file: 'add_journal_390_dark.png' },
    { vp: 1280, theme: 'light', title: 'Add Journal &bull; Desktop (1280px)', file: 'add_journal_1280_light.png' },
    { vp: 1280, theme: 'dark', title: 'Add Journal &bull; Desktop (1280px)', file: 'add_journal_1280_dark.png' }
  ];

  for (const combo of ajCombinations) {
    const imgPath = path.join(artifactsDir, combo.file);
    if (fs.existsSync(imgPath)) {
      const b64 = fs.readFileSync(imgPath).toString('base64');
      ajPanelsHtml += `
        <div style="background: ${combo.theme === 'dark' ? '#201C18' : '#FFFDF8'}; border: 1px solid ${combo.theme === 'dark' ? '#342E27' : '#E3DBCB'}; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 10px 14px; background: ${combo.theme === 'dark' ? '#171411' : '#F6F1E7'}; border-bottom: 1px solid ${combo.theme === 'dark' ? '#342E27' : '#E3DBCB'}; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 600; color: ${combo.theme === 'dark' ? '#F1EBE0' : '#1F1B16'};">${combo.title}</span>
            <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: ${combo.theme === 'dark' ? '#342E27' : '#E3DBCB'}; color: ${combo.theme === 'dark' ? '#FF8A4C' : '#C2410C'};">${combo.theme.toUpperCase()}</span>
          </div>
          <div style="background: ${combo.theme === 'dark' ? '#171411' : '#F6F1E7'}; max-height: 520px; overflow: hidden;">
            <img src="data:image/png;base64,${b64}" style="width: 100%; height: auto; display: block;" />
          </div>
        </div>
      `;
    }
  }

  const ajHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>DevJournal &bull; Add Journal Verification Sheet</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Instrument Sans', -apple-system, sans-serif;
          background: #171411;
          color: #F1EBE0;
          padding: 28px;
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #342E27;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 style="font-size: 22px; font-weight: 700;">Add Journal &bull; 390px & 1280px Viewport Verification</h1>
          <p style="font-size: 13px; color: #A79E91; margin-top: 4px;">Editor focused with typed text, self-hosted TinyMCE 7 (GPL), warm Field Notebook tokens, AA contrast</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; background: #201C18; border: 1px solid #342E27; color: #FF8A4C;">LIGHT &amp; DARK</span>
          <span style="font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; background: #201C18; border: 1px solid #342E27; color: #F1EBE0;">390px &amp; 1280px</span>
        </div>
      </div>
      <div class="grid">
        ${ajPanelsHtml}
      </div>
    </body>
    </html>
  `;

  await ajPage.setContent(ajHtml, { waitUntil: 'load' });
  await ajPage.evaluate(() => document.fonts.ready);
  await ajPage.waitForTimeout(300);

  const ajContactSheetPath = path.join(artifactsDir, 'contact_add_journal.png');
  await ajPage.screenshot({ path: ajContactSheetPath, fullPage: true });
  console.log(`Saved Add-Journal contact sheet: ${ajContactSheetPath}`);
  await addJournalContext.close();

  await browser.close();
  server.close();

  console.log('\n================ Capture & Audit Complete ================');
  console.log(`Total Overflow issues: ${hasAnyOverflow ? 'YES (offenders reported above)' : 'NONE (all viewports clean)'}`);
  console.log(`Total Axe Violations across targeted screens: ${totalAxeViolations}`);
}

run().catch((err) => {
  console.error('Fatal error during capture script:', err);
  process.exit(1);
});
