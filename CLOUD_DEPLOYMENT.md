# SERJAFAN Cloud Deployment

This project is now configured to run with a cloud libSQL/Turso database while keeping `local.db` as a development fallback.

## 1. Create Cloud Database

Recommended provider: Turso.

Create a database in Turso, then copy:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## 2. Configure Environment Variables

For production hosting, set:

```env
TURSO_DATABASE_URL=libsql://your-database-your-org.turso.io
TURSO_AUTH_TOKEN=your-token
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=https://your-production-domain.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Keep `DB_FILE_NAME=file:local.db` only for local development.

## 3. Push Schema To Cloud

After the cloud env variables are set locally or in the deployment shell:

```bash
npm run db:push
```

## 4. Seed Initial Data

For demo/initial data:

```bash
npm run db:seed
```

Run this only once per database unless you intentionally want to reinsert demo records.

## 5. Deploy App

Recommended app hosting:

- Vercel for Next.js
- Turso for database
- Cloudinary, UploadThing, or Supabase Storage for future partner document uploads

The app no longer depends on `local.db` when `TURSO_DATABASE_URL` is configured.
