# Ordaro web

Next.js App Router UI for Ordaro. The browser talks only to this app. Route handlers under `/api/auth` call `ordaro-backend` and keep access and refresh tokens in httpOnly cookies.

## Run

```powershell
corepack pnpm install
corepack pnpm dev
```

The installed `pnpm.exe` on this machine is blocked by Device Guard. `corepack pnpm` is the command that works.

Copy `.env.example` to `.env.local` if the API is not on `http://localhost:8080`.

## OpenAPI client

`src/lib/api/schema.ts` is generated from `openapi/backend.json`, which is the springdoc document from the backend (`springdoc-openapi` 3.1.1, Boot 4.1).

```powershell
cd ../ordaro-backend
./mvnw -Dtest=OpenApiExportTest test
Copy-Item target/openapi.json ../ordaro-web/openapi/backend.json
cd ../ordaro-web
corepack pnpm openapi
```
