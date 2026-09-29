const crypto = require('crypto');

let cached = null;

/**
 * JWT signing secret: JWT_SECRET env var if set, otherwise a random secret
 * generated once and persisted in Netlify Blobs so tokens survive cold starts.
 */
async function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (cached) return cached;
  const { getStore } = await import('@netlify/blobs');
  const store = getStore('app-secrets');
  let secret = await store.get('jwt-secret');
  if (!secret) {
    secret = crypto.randomBytes(48).toString('hex');
    await store.set('jwt-secret', secret, { onlyIfNew: true });
    secret = (await store.get('jwt-secret')) || secret;
  }
  cached = secret;
  return secret;
}

module.exports = { getJwtSecret };
