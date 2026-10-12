# Changelog

All notable changes to the DevJournal project are documented in this file, structured by refactoring milestone.

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - Modern Angular 21 & Backend Revamp

### Milestone B5: Full Signals State Modernization
- **B5 Step 4: Streamlined Signals & Elimination of Residual Streams**
  - Refactored `JournalComponent` to read `journalService.journals` signal directly, eliminating `toSignal()` dependency.
  - Completely deleted legacy `journals$` `BehaviorSubject` and its secondary synchronization write from `JournalService`.
  - Added unit tests to `authGuard` simulating page refreshes with tokens present and absent in `sessionStorage`.
  - Added unit test to `DashboardComponent` verifying `userName` fallback never retains stale `sessionStorage` or profile state across logout and re-login.
  - Verified 35/35 frontend tests, production build, 27 backend tests, and 5-flow production smoke test.

- **B5 Step 3: Dashboard, Settings, and authGuard Signal Migration**
  - Converted `DashboardComponent` to pure `computed()` signals for all derived state (`userName`, `totalJournals`, `draftCount`, `activities`, `lastActivityDate`, `formattedLastActivityDate`).
  - Converted `SettingsComponent` to signals, removing `authSubscription` and `profileSubscription` memory leak vectors.
  - Converted `authGuard` to synchronously evaluate `authService.isAuthenticated()` rather than an RxJS observable pipe.
  - Completely deleted unconsumed `BehaviorSubject` streams (`loggedIn`, `_currentUserProfile`, `isLoggedIn()`, `currentUserProfile$`) from `AuthService`.
  - Kept 0 unnecessary `effect()` calls; verified 32/32 frontend tests.

- **B5 Step 2: JournalService and JournalComponent Signals Adoption**
  - Introduced fine-grained signals (`journals`, `isLoading`, `error`) and `computed()` derived queries (`publishedJournals`, `draftJournals`, `totalCount`, `publishedCount`, `draftCount`) to `JournalService`.
  - Refactored `JournalComponent` to use `computed()` for `normalizedEntries`, filter views (`all`, `published`, `drafts`), sort orders (`date`, `tag`, `category`), and count badges with 0 `effect()` calls.
  - Verified 30/30 frontend tests and 5-flow production smoke test.

- **B5 Step 1: AuthService and NavbarComponent Signals Foundation**
  - Introduced `isAuthenticated`, `currentUserProfile`, and `userDisplayName` signals to `AuthService`.
  - Converted `NavbarComponent` to consume `authService.isAuthenticated` and managed collapse state with `signal()` and a justified reset `effect()`.
  - Verified 29/29 frontend tests and 5-flow production smoke test.

---

### Milestone B4.7: Angular 20 and 21 Upgrades & Dependency Alignment
- **Step 2 (Angular 21)**
  - Upgraded `@angular/*` core and `@angular/cdk`, `@angular/material` from v20 to v21 (Angular 21.2.25).
  - Maintained Node 20 / 22 runtime compatibility and verified zone.js polyfills.
  - Verified 29/29 frontend tests and production build.
- **TinyMCE Cleanup**
  - Removed retired plugins (`print`, `paste`, `hr`) from TinyMCE initialization in `add-journal.component.html`, eliminating 404 console warnings.
- **Step 1 (Angular 20)**
  - Upgraded `@angular/*` core and CDK/Material from v19 to v20.
  - Verified clean builds, test suites, and compatibility with `@tinymce/tinymce-angular@9.0.0`.

---

### Milestone B4.6: Modern Application Builder Migration
- Migrated `angular.json` build executor from `@angular-devkit/build-angular:browser` to `@angular-devkit/build-angular:application`.
- Migrated dev server to Vite-powered runtime (`@angular-devkit/build-angular:dev-server`).
- Switched to esbuild bundle pipeline, reducing production build times and optimizing initial transfer size.
- Aligned `tsconfig.json` with `esModuleInterop: true` and verified clean asset serving for TinyMCE skins.

---

### Milestone B4.5: Angular 19 Upgrade
- Upgraded `@angular/*` core and CDK/Material from v18 to v19.
- Upgraded TypeScript to 5.8.
- Upgraded `ngx-markdown` to v19 and `marked` to v15.
- Verified standalone component defaults and HTTP client provider modernizations.

---

### Milestone B4: Angular 18 Upgrade
- Upgraded `@angular/*` core and CDK/Material from v17 to v18.
- Upgraded TypeScript to 5.5.
- Fixed collision-safe tracking expressions in template collections.

---

### Milestone B3: Built-in Control Flow Migration
- Migrated all 11 component templates from legacy structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`) to native Angular 17+ control flow syntax (`@if`, `@for`, `@empty`).
- Implemented robust `track` expressions (`track entry._id ?? $index`, `track $index`) across journal lists, chat bubbles, and resource recommendation feeds.

---

### Milestone B2: Angular 17 Upgrade
- Upgraded `@angular/*` core and CDK/Material from v16 to v17.
- Upgraded TypeScript to 5.4.
- Upgraded `ngx-markdown` to v17 and `marked` to v12.

---

### Milestone B1: Standalone Architecture Modernization
- Converted all components to standalone (`standalone: true` / v19+ default).
- Converted route guards and HTTP interceptors to functional primitives (`authGuard`, `authInterceptor`).
- Replaced legacy `AppModule` with `bootstrapApplication(AppComponent, appConfig)` in `main.ts`.

---

### Track A: Backend Hardening & API Reliability
- **Security:** Integrated `helmet`, configured strict CORS origin whitelisting (`FRONTEND_URL`), and added `express-rate-limit` to authentication and AI routes.
- **Authentication:** Standardized JWT verification and consolidated password hashing on `bcryptjs`.
- **Validation & Sanitization:** Added MongoDB query sanitization and HTML sanitization for journal contents.
- **AI Integration:** Enhanced Google Gemini API (`@google/generative-ai`) error handling and fallback dev tips.
- **Testing:** Implemented automated integration tests with Jest and Supertest, expanding test coverage to 27 passing tests across 8 suites.
