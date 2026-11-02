// The service worker version is a hash of the site, so updates are never forgotten.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

export function versionOf() {
  const h = createHash('sha256');
  for (const f of readdirSync('public').filter(n => n !== 'sw.js').sort()) h.update(readFileSync(`public/${f}`));
  return `pambana-${h.digest('hex').slice(0, 8)}`;
}

if (process.argv[2] === 'write') {
  const sw = readFileSync('public/sw.js', 'utf8').replace(/VERSION = '.+?'/, `VERSION = '${versionOf()}'`);
  writeFileSync('public/sw.js', sw);
}
