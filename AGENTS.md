# SettleCart Development & UI Guardrails

## 1. Mobile Navigation & Fixed Overlays
- **No Fixed Overlays Inside `backdrop-filter`**: Any element with `backdrop-filter` (e.g., `backdrop-blur-*`) creates a new containing block for `position: fixed` child elements in CSS. Never nest full-screen mobile drawers, dialogs, or modals inside `<header>` or blur wrappers.
- **Sibling Positioning**: Always render full-screen overlays as direct sibling elements (wrapped in a React Fragment `<> ... </>`) to ensure `fixed inset-0` attaches to the true root viewport (`window`).

## 2. Design System & Iconography
- **No Native OS Emojis in UI**: Do not use colorful native system emojis for category tags, badges, or list items.
- **Font Awesome v4.7 & Lucide Vector Icons**: Use Font Awesome v4.7 (`fa fa-*`) or Lucide icons wrapped in consistent badge containers (e.g., `w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center`).
- **Restrained Status Elements**: Avoid floating colored dots or gradient blobs on cards or brand marks unless tied to active user telemetry. Keep brand typography clean and editorial.

## 3. Serverless Filesystem & API Safety
- **Vercel Lambda Read-Only Filesystem**: On Vercel serverless functions, `process.cwd()` is strictly read-only. Any file writes must target `/tmp` (`process.env.VERCEL ? "/tmp" : process.cwd()`) or use external databases.
- **Runtime Data Exclusion**: Never commit runtime-generated data files (e.g., `waitlist_entries.json`). Ensure they are untracked and excluded in `.gitignore`.

## 4. Git & Deployment Operations
- **Single-Command Execution**: Avoid chaining multiple destructive or unsandboxed commands (`&&`, `;`). Execute staging and checks sandboxed, and run only remote network pushes unsandboxed.
- **SSH Authentication**: Use SSH remote URLs (`git@github.com:...`) when local SSH keys are present to prevent interactive credential prompts.

