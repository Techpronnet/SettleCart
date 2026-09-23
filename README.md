# SettleCart Marketplace

Production-ready waiting-list landing page for **SettleCart**, an African multi-vendor connected commerce ecosystem that integrates digital storefronts, order orchestration, dispatch and delivery verification, and financial settlement.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router with Turbopack)
- **UI Library**: [React](https://react.dev/) 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 & CSS Custom Properties
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [AOS (Animate On Scroll)](https://michalsnik.github.io/aos/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Language**: TypeScript 5

---

## Project Structure

```
SettleCart/
├── frontend/
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── app/            # Next.js App Router (layout, page, API routes, globals.css)
│   │   └── components/     # Production UI components (Hero, Lifecycle, HowItWorks, etc.)
│   ├── .env.example        # Frontend environment variable template
│   ├── .gitignore          # Frontend ignore rules
│   ├── package.json        # Dependencies & project scripts
│   ├── package-lock.json   # Deterministic dependency lockfile
│   ├── tsconfig.json       # TypeScript configuration
│   └── next.config.ts      # Next.js configuration
├── .env.example            # Root environment variable template
├── .gitignore              # Root gitignore rules
└── README.md               # Repository documentation
```

---

## Local Development Setup

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

### Installation & Run

1. Clone the repository:
   ```bash
   git clone git@github.com:Techpronnet/SettleCart.git
   cd SettleCart/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env.local` inside the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical public URL of the application | `https://settle-cart.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Optional external backend API URL | *Empty* |

> **Note**: Frontend environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never store private credentials, database secrets, or private signing keys in client variables.

---

## Available Scripts

Run these scripts from within the `frontend/` directory:

- **`npm run dev`**: Starts local development server on port 3000.
- **`npm run build`**: Creates an optimized production build.
- **`npm run start`**: Runs the compiled production build locally.
- **`npm run lint`**: Checks codebase for linting errors with ESLint.

---

## Production Deployment (Vercel)

This repository is configured for automated deployments via Vercel with GitHub integration.

### Deployment Configuration

When importing or configuring the project on Vercel:

- **Framework Preset**: `Next.js`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (or Next.js default `next build`)
- **Output Directory**: `.next` (Next.js default)
- **Install Command**: `npm install`

Every push to the `main` branch automatically triggers a production deployment to `https://settle-cart.vercel.app`.

