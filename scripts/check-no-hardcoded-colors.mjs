import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'frontend', 'src', 'app');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.scss') || file.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(appDir);
let hasViolations = false;
const violations = [];

const patterns = [
  {
    name: 'hex',
    test: (line) => {
      // Strip HTML entities like &#123;, SVG references url(#...), href="#...", and router fragment="#..."
      const cleaned = line
        .replace(/&#[0-9a-zA-Z]+;/g, '')
        .replace(/url\(#[^)]+\)/g, '')
        .replace(/href=["']#[^"']*["']/g, '')
        .replace(/fragment=["'][^"']*["']/g, '')
        .replace(/id=["'][^"']*["']/g, '');
      return /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/.test(cleaned);
    }
  },
  {
    name: 'rgb()',
    test: (line) => /\brgba?\s*\(/.test(line)
  },
  {
    name: 'hsl()',
    test: (line) => /\bhsla?\s*\(/.test(line)
  },
  {
    name: 'linear-gradient',
    test: (line) => /\blinear-gradient\s*\(/.test(line)
  },
  {
    name: 'radial-gradient',
    test: (line) => /\bradial-gradient\s*\(/.test(line)
  },
  {
    name: 'background-clip: text',
    test: (line) => /\bbackground-clip\s*:\s*text\b/.test(line)
  },
  {
    name: 'text-fill-color',
    test: (line) => /(?:-webkit-)?text-fill-color\b/.test(line)
  }
];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Skip empty lines or comment-only lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    for (const p of patterns) {
      if (p.test(trimmed)) {
        hasViolations = true;
        violations.push({
          file: path.relative(rootDir, f).replace(/\\/g, '/'),
          line: idx + 1,
          rule: p.name,
          snippet: trimmed
        });
      }
    }
  });
}

console.log('--- Checking for hardcoded colors in component SCSS/HTML ---');
if (hasViolations) {
  console.error(`FAILED: Found ${violations.length} hardcoded color violation(s) across component files:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.rule}] -> ${v.snippet}`);
  }
  process.exit(1);
} else {
  console.log(`PASSED: All ${files.length} component files are free of hardcoded colors, gradients, and text clipping.`);
  process.exit(0);
}
