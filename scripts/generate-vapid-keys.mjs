// Generates a VAPID key pair for Web Push (base64url, the format browsers and
// @block65/webcrypto-web-push expect). Run with: npm run vapid
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);
const raw = new Uint8Array(await crypto.subtle.exportKey("raw", publicKey));
const jwk = await crypto.subtle.exportKey("jwk", privateKey);
const b64url = (bytes) => Buffer.from(bytes).toString("base64url");

console.log(`VAPID_PUBLIC_KEY=${b64url(raw)}`);
console.log(`VAPID_PRIVATE_KEY=${jwk.d}`);
