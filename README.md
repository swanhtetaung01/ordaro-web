# TrilloPOS web

Next.js App Router UI for TrilloPOS. The browser talks only to this app. Route handlers under `/api/auth` call `trillopos-backend` and keep access and refresh tokens in httpOnly cookies.

## Run

```powershell
corepack pnpm install
npm run dev
```

Device Guard on this machine blocks the installed `pnpm.exe`, and at times the `pnpm-native.exe` behind `corepack pnpm` as well. Running scripts needs no pnpm: `npm run dev` runs the same `dev` script from the installed `node_modules`. Start the backend first (see its README); then open http://localhost:3000.

Copy `.env.example` to `.env.local` if the API is not on `http://localhost:8080`.

## OpenAPI client

`src/lib/api/schema.ts` is generated from `openapi/backend.json`, which is the springdoc document from the backend (`springdoc-openapi` 3.1.1, Boot 4.1).

```powershell
cd ../trillopos-backend
./mvnw -Dtest=OpenApiExportTest test
Copy-Item target/openapi.json ../trillopos-web/openapi/backend.json
cd ../trillopos-web
corepack pnpm openapi
```
