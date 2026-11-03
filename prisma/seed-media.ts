/**
 * Legacy helper: previously uploaded public/audio + public/covers to MinIO.
 *
 * Current seed uploads covers and audio from seed-albums/ inside prisma/seed.ts
 * (`npm run db:seed`). Prefer that path.
 *
 * Kept only so old docs/commands mentioning this file fail clearly.
 */
console.error(
  "prisma/seed-media.ts is retired. Use: node scripts/prepare-seed-albums.mjs && npm run db:seed",
);
process.exit(1);
