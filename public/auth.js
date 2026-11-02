// Device-only profile. There is no server: the nickname and a salted PIN hash stay in
// this phone's storage. A PIN hides personal screens, it does not encrypt the data.
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const ITERATIONS = 100000;

export const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));

export async function derive(pin, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: ITERATIONS }, key, 256));
}

export async function makeProfile({ name, pin }, now = Date.now()) {
  const salt = newSalt();
  return { name: name.trim(), salt, hash: await derive(pin, salt), created: new Date(now).toLocaleDateString('en-CA') };
}

export async function verify(profile, pin) {
  const h = await derive(String(pin), profile.salt);
  let diff = h.length ^ profile.hash.length;
  for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ (profile.hash.charCodeAt(i) || 0);
  return diff === 0;
}

// Returns the list of problems, empty when the form can be accepted.
export function checkRegistration({ name = '', pin = '', pin2 = '', adult = false, consent = false }) {
  const errs = [];
  const n = name.trim();
  if (n.length < 2 || n.length > 24 || !/^[\p{L}\p{N}][\p{L}\p{N} '.-]*$/u.test(n) || n.includes('@') || (n.match(/\d/g) || []).length > 4) errs.push('name');
  if (!/^\d{4,8}$/.test(pin)) errs.push('pin');
  else if (pin !== pin2) errs.push('match');
  if (!adult) errs.push('adult');
  if (!consent) errs.push('consent');
  return errs;
}

// Slows down guessing: free tries, then a growing wait capped at 5 minutes.
export function waitSeconds(fails, lastFailAt, now = Date.now()) {
  if (fails < 5) return 0;
  const wait = Math.min(300, 30 * 2 ** Math.floor((fails - 5) / 3));
  return Math.max(0, Math.ceil(wait - (now - lastFailAt) / 1000));
}
