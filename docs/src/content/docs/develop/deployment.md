---
title: Deployment
description: Build and publish Drafter with Cloudflare Workers.
sidebar:
  order: 4
---

Drafter builds to static files in `dist/`. Cloudflare Workers serves those files at `drafter.johnhooks.io`. Modelling and document storage remain in the browser; hosting requires no database or application server.

## Connect GitHub

In Cloudflare Workers & Pages, create a Worker from the `johnhooks/drafter` GitHub repository with these settings:

| Setting | Value |
| --- | --- |
| Worker name | `drafter` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `pnpm build` |
| Deploy command | `pnpm exec wrangler deploy` |
| Build variable | `PNPM_VERSION=11.5.2` |

The `.node-version` file selects Node.js, and `pnpm-lock.yaml` records dependencies. Set the pnpm build variable before the first build so Cloudflare uses the workspace's package manager version.

The repository's `wrangler.jsonc` selects `dist/` and the custom domain. Deploy using the Cloudflare account that manages `johnhooks.io`. Cloudflare provisions the custom domain's DNS and HTTPS certificate. The Worker's stable `workers.dev` address also remains enabled.

Once connected, pushes to `main` build and publish the app automatically. Build logs and deployment history are available in the Worker's dashboard.

## Verify or deploy locally

Install dependencies with `pnpm install`, then check the production build and deployment configuration:

```shell
pnpm build
pnpm exec wrangler deploy --dry-run
```

To publish manually, authenticate to the account and deploy the build:

```shell
pnpm exec wrangler login
pnpm run deploy
```

The deployment contains the app only. `pnpm docs:build` builds this documentation separately in `docs/dist/`.
