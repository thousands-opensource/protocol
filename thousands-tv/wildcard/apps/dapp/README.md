# Wildcard Collectibles DApp

## Getting Started
First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

---
## Wildcard Dapp Environments

- **`main` - Production-ready environment**
    - production environment - git branch `main` (protected branch)
    - URL: https://wildcard-dapp.vercel.app
- **`test` - Playtests**
    - preview environments - git branch `test`
    - URL: https://wildcard-dapp-git-test-wildcard-alliance.vercel.app/
- **`develop` - Internal development**
    - preview environments - git branch `develop`
    - URL: https://wildcard-dapp-git-develop-wildcard-alliance.vercel.app/

## Sentry Configs:
- View [Sentry Monitoring Dashboard](https://wildcard-alliance.sentry.io/projects/)
- To enable and configure logs to Sentry provider: `NEXT_PUBLIC_SENTRY_DSN`.
- Sentry is configured to `local` env by default. The Environment is configured by `getEnvironment`.
- When enabled, `console` errors are captured and sent to Sentry via `CaptureConsoleIntegration`.

## Monorepo .env configs
Configure environment variables for deployment with Turbo 2.0 on Vercel by setting them in `turbo.json`. For best practices on deployment, refer to [Turbo repo deployment best practices](https://turbo.build/repo/docs/crafting-your-repository/using-environment-variables#handling-env-files:~:text=and%20production%20builds.-,Best%20practices,-Use%20.env%20files).

```json
"build": {
    "env": [
        "NEXT_PUBLIC_API_KEY",
        "ALCHEMY_API_KEY",
        // List additional required variables here

```
"build": {
    "env": [
        "NEXT_PUBLIC_API_KEY",
        "DATABASE_URL",
        // Add other necessary environment variables here
    ],
}

```
