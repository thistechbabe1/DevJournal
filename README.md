# DevJournal 📓✨

> An AI-augmented full-stack engineering journal that transforms daily development logging into searchable, actionable insights with intelligent summaries, tagging, and contextual mentoring.

---

## 📸 Screenshots

*Screenshots coming soon.*

---

## ⚡ Features

- **📝 Rich-Text WYSIWYG Journaling:** Craft notes, technical retrospectives, and architecture logs using TinyMCE with code blocks, typography, and formatted lists.
- **🤖 Contextual AI Insights:** Automated sentiment analysis, key concept extraction, actionable advice, and curated resource links powered by the Google Gemini API (`gemini-2.5-flash`).
- **💬 Interactive AI Chat Mentor:** Markdown-rendered coding dialogue with syntax-highlighted code fences and one-click copy buttons.
- **🏷️ Structured Organization:** Tagging, categories, date-based indexing, and instant client-side filtering (`all`, `published`, `drafts`).
- **📄 Client-Side PDF Compilation:** Single-click high-fidelity document generation powered by `html2pdf.js` with sanitized markup rendering.
- **🔒 Hardened Authentication:** Stateless JSON Web Token (JWT) authentication, bcryptjs password hashing, rate limiting, and HTTP request interceptors.
- **🩺 Lightweight Health Check:** Unauthenticated `GET /health` endpoint returning `200 {status: "ok"}` mounted before rate limiters for uptime monitors and keep-alive pingers.

---

## 🏛️ Architecture Overview

DevJournal follows a decoupled architecture designed for high maintainability, type safety, and modern runtime efficiency:

```
┌────────────────────────────────────────────────────────┐
│                   Angular 21 Client                    │
│  • Standalone Components (0 NgModules)                 │
│  • Fine-Grained Signals & computed() State Management   │
│  • Built-in Control Flow (@if, @for, @let)              │
│  • esbuild Application Builder (@angular/build)        │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (JWT Bearer)
┌───────────────────────────▼────────────────────────────┐
│                  Node.js / Express API                 │
│  • Security: Helmet, CORS Whitelisting, Rate-Limiting  │
│  • Express Routes, Controllers & Middleware Architecture│
│  • Health Check: GET /health (unthrottled uptime ping) │
│  • MongoDB & Mongoose Schema Validation                │
│  • Cloudinary Media Storage & Google Gemini 2.5 Flash   │
└────────────────────────────────────────────────────────┘
```

### Modern Angular 21 Architecture Highlights
- **100% Standalone Component Architecture:** Eliminated legacy `AppModule` and feature modules in favor of modular standalone components with direct provider injection (`bootstrapApplication()`, `provideRouter()`, `provideHttpClient()`).
- **Fine-Grained Signals State Management:** Core services (`AuthService`, `JournalService`) and components (`NavbarComponent`, `JournalComponent`, `DashboardComponent`, `SettingsComponent`) manage state through signals (`signal()`, `computed()`), removing leaky `Subscription` lifecycles.
- **Built-in Control Flow:** Fully migrated templates from structural directives (`*ngIf`, `*ngFor`) to native `@if` and `@for` with collision-safe tracking expressions (`track entry._id ?? $index`).
- **High-Performance Application Builder:** Powered by Vite dev server and esbuild bundling (`@angular/build:application`), delivering sub-second hot reloads and optimized production chunks.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `>= 20.19.0` (Recommended: `v20.19.x` or `v22.12.x`)
- **npm:** `>= 10.0.0`
- **MongoDB:** Local instance or MongoDB Atlas connection URI

### 1. Repository Setup
```bash
git clone https://github.com/thistechbabe1/DevJournal.git
cd DevJournal
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB credentials, JWT secret, and Gemini API key
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# Open http://localhost:4200 in your browser
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/devjournal` |
| `JWT_SECRET` | Secret key for JWT signing | `super-secret-key-min-32-chars` |
| `JWT_EXPIRES_IN` | Token expiration duration | `24h` |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) | `http://localhost:4200,https://devjournal.netlify.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSy...` |

### Frontend Configuration (`frontend/src/environments/`)
- `environment.ts`: `apiUrl: 'http://localhost:5000/api'`
- `environment.prod.ts`: `apiUrl: 'https://devjournal.onrender.com/api'`

---

## 🧪 Testing & Verification

### Frontend Tests (Karma + Chrome Headless)
```bash
cd frontend
npm test -- --watch=false --browsers=ChromeHeadless
```
Runs 35 unit specs covering standalone components, route guards with simulated storage refresh, signals reactivity, and computed filtering.

### Frontend Production Build
```bash
cd frontend
npm run build
```
Generates production artifacts to `dist/dev-journal` using the modern application builder.

### Backend Tests (Jest)
```bash
cd backend
npm test
```
Runs 28 integration tests across 9 suites covering authentication middleware, JWT validation, MongoDB sanitization, rate limiting, health checks, and CORS compliance.

---

## 💡 Key Architectural Decisions & Learnings

### 1. `computed()` over `effect()`
In adopting Angular Signals, an explicit architectural principle was maintained: **derive state synchronously via `computed()` and avoid `effect()` for application state**.
- State derivations such as filtered journal lists, draft/published counts, sorted activity feeds, and user profile fallbacks are pure functions of source signals. Modeling them with `computed()` guarantees glitch-free evaluation without unnecessary change detection cycles.
- Across the entire frontend, only a single `effect()` was retained (in `NavbarComponent`), where a user-mutable UI toggle (`isCollapsed`) needs a side-effect reset to `true` when authentication state transitions to `false`.

### 2. Incremental Dual-State Migration Strategy
Rather than attempting a high-risk "big bang" rewrite of all components from RxJS Observables to Signals:
- Services (`AuthService`, `JournalService`) temporarily maintained synchronized dual streams (`signal` alongside `BehaviorSubject`) during intermediate migration steps.
- This allowed consuming components (`NavbarComponent`, `JournalComponent`, `DashboardComponent`, `SettingsComponent`, and `authGuard`) to be modernized and verified slice-by-slice.
- Once the final consumer of each `BehaviorSubject` was modernized, the legacy streams and synchronization writes were cleanly excised in dedicated commits.

### 3. Step-by-Step Major Version Upgrade Ladder
Upgrading Angular from v16 across six major versions to v21 was conducted one major version at a time (`v16 -> v17 -> v18 -> v19 -> v20 -> v21`):
- Every step validated peer dependencies (`typescript`, `zone.js`, `ngx-markdown`, `marked`), retired plugins (e.g., TinyMCE's obsolete `print`, `paste`, `hr`), and asserted identical test passing counts before proceeding.
- Breaking build tools were addressed in isolated milestones (such as the Angular 19+ application builder migration) rather than compounded with framework version bumps.

---

## 📜 Licences and Credits

- **DevJournal**: Licensed under the GNU General Public License v2.0 or later ([`LICENSE`](file:///c:/Users/HP/Documents/Github/DevJournal/LICENSE)).
- **TinyMCE**: Self-hosted under the GNU General Public License v2.0 or later (`GPL-2.0-or-later`, `license_key: 'gpl'`). Rich text editor assets are bundled locally without cloud API dependencies or remote tracking.
- **Third-Party Open Source Software**: DevJournal builds upon standard permissive open source libraries (Angular, Bootstrap, Marked, Express, Mongoose, and related ecosystems) licensed under MIT, Apache-2.0, 0BSD, and BSD-2-Clause.
