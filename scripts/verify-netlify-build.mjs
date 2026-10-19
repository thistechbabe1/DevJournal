import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist', 'dev-journal');
const netlifyTomlPath = path.join(rootDir, 'frontend', 'netlify.toml');
const redirectsPath = path.join(rootDir, 'frontend', 'src', '_redirects');

console.log('=== Verifying Netlify Build Output & SPA Redirect Configuration ===\n');

// 1. Verify dist output and tinymce assets
if (!fs.existsSync(distDir)) {
  console.error(`FAIL: Dist directory does not exist: ${distDir}`);
  process.exit(1);
}

const requiredFiles = [
  'tinymce/tinymce.min.js',
  'tinymce/models/dom/model.min.js',
  'tinymce/themes/silver/theme.min.js',
  'tinymce/icons/default/icons.min.js',
  'tinymce/skins/ui/oxide/skin.min.css',
  'tinymce/skins/ui/oxide-dark/skin.min.css',
  'tinymce/skins/content/default/content.min.css',
  'tinymce/skins/content/dark/content.min.css',
  'tinymce/plugins/help/plugin.min.js',
  'tinymce/plugins/codesample/plugin.min.js',
  'tinymce/plugins/wordcount/plugin.min.js',
  'tinymce/plugins/table/plugin.min.js',
  'tinymce/plugins/link/plugin.min.js',
  'tinymce/plugins/image/plugin.min.js',
  'tinymce/plugins/lists/plugin.min.js'
];

let filesMissing = 0;
for (const relPath of requiredFiles) {
  const fullPath = path.join(distDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] Missing required TinyMCE asset: ${relPath}`);
    filesMissing++;
  } else {
    const size = fs.statSync(fullPath).size;
    if (size === 0) {
      console.error(`[FAIL] TinyMCE asset is empty: ${relPath}`);
      filesMissing++;
    }
  }
}

if (filesMissing > 0) {
  console.error(`\nFAIL: ${filesMissing} required TinyMCE file(s) are missing or empty in dist.`);
  process.exit(1);
}
console.log(`[PASS] Core TinyMCE script and required assets verified in dist/dev-journal/tinymce.`);

// 2. Verify netlify.toml
if (!fs.existsSync(netlifyTomlPath)) {
  console.error(`FAIL: Missing netlify.toml at ${netlifyTomlPath}`);
  process.exit(1);
}

const netlifyTomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');

// Ensure publish directory points to dist/dev-journal
if (!/publish\s*=\s*["']dist\/dev-journal["']/.test(netlifyTomlContent)) {
  console.error(`FAIL: netlify.toml publish directory must be 'dist/dev-journal'`);
  process.exit(1);
}
console.log(`[PASS] netlify.toml publish directory is 'dist/dev-journal'.`);

// Ensure SPA fallback redirect exists
const hasRedirect = /from\s*=\s*["']\/\*["']/.test(netlifyTomlContent) &&
                    /to\s*=\s*["']\/index\.html["']/.test(netlifyTomlContent) &&
                    /status\s*=\s*200/.test(netlifyTomlContent);

if (!hasRedirect) {
  console.error(`FAIL: netlify.toml is missing SPA fallback redirect (/* -> /index.html 200).`);
  process.exit(1);
}

// CRITICAL ASSERTION: Ensure force = true is NOT set on SPA fallback.
// In Netlify, by default (force=false), requests matching an existing static file
// are served directly. Setting force=true causes Netlify to route EVERY request
// (including /tinymce/tinymce.min.js) to /index.html, breaking static assets.
if (/force\s*=\s*true/i.test(netlifyTomlContent)) {
  console.error(`FAIL: netlify.toml has 'force = true' which shadows existing static assets!`);
  process.exit(1);
}
console.log(`[PASS] netlify.toml SPA fallback has no 'force = true' (existing files take priority).`);

// 3. Verify _redirects file
if (fs.existsSync(redirectsPath)) {
  const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
  // In Netlify _redirects syntax, a trailing exclamation mark like 200! indicates a forced redirect
  if (/200!/.test(redirectsContent)) {
    console.error(`FAIL: _redirects has '200!' (force) which shadows static assets!`);
    process.exit(1);
  }
  console.log(`[PASS] _redirects file has no force flag (200 without '!').`);
}

console.log('\n=== All Netlify Build & Configuration Checks PASSED ===');
