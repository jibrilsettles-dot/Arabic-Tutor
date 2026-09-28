// Web Push using only Web Crypto + fetch, so it runs on Cloudflare Workers.
// Payload encryption: RFC 8291 (aes128gcm). Authorization: RFC 8292 (VAPID).

const enc = new TextEncoder();

export interface VapidKeys {
  subject: string;
  /** Uncompressed P-256 public key, base64url (65 bytes). */
  publicKey: string;
  /** P-256 private scalar "d", base64url (32 bytes). */
  privateKey: string;
}

export interface Subscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** An ASCII label followed by a zero byte, as the RFCs' "info" strings require. */
function label(text: string) {
  return concat(enc.encode(text), new Uint8Array([0]));
}

async function hkdf(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, length: number) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8);
  return new Uint8Array(bits);
}

/** RFC 8291 message encryption for one push subscription. */
export async function encryptPayload(sub: Subscription, plaintext: Uint8Array, recordSize = 4096) {
  const uaPublic = b64urlDecode(sub.keys.p256dh);
  const authSecret = b64urlDecode(sub.keys.auth);

  const serverKeys = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, serverKeys.privateKey, 256),
  );

  const ikm = await hkdf(authSecret, ecdhSecret, concat(label("WebPush: info"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, label("Content-Encoding: aes128gcm"), 16);
  const nonce = await hkdf(salt, ikm, label("Content-Encoding: nonce"), 12);

  // Single record: plaintext, then the 0x02 "last record" delimiter.
  if (plaintext.length + 1 + 16 > recordSize) throw new Error("Push payload too large");
  const padded = concat(plaintext, new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded));

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, recordSize);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, ciphertext);
}

/** RFC 8292 VAPID Authorization header value for an endpoint. */
export async function vapidAuthorization(endpoint: string, vapid: VapidKeys) {
  const pub = b64urlDecode(vapid.publicKey);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: b64urlEncode(pub.slice(1, 33)),
      y: b64urlEncode(pub.slice(33, 65)),
      d: vapid.privateKey,
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlEncode(
    enc.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: vapid.subject,
      }),
    ),
  );
  const unsigned = `${header}.${claims}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned)),
  );
  return `vapid t=${unsigned}.${b64urlEncode(signature)}, k=${vapid.publicKey}`;
}

/** Encrypts and delivers one notification. Returns the push service's response. */
export async function sendWebPush(
  sub: Subscription,
  data: unknown,
  vapid: VapidKeys,
  options: { ttl?: number; urgency?: "very-low" | "low" | "normal" | "high" } = {},
) {
  const body = await encryptPayload(sub, enc.encode(JSON.stringify(data)));
  return fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidAuthorization(sub.endpoint, vapid),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(options.ttl ?? 60 * 60 * 12),
      Urgency: options.urgency ?? "normal",
    },
    body,
  });
}
