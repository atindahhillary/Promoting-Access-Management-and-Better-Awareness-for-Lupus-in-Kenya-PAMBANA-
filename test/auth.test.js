import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeProfile, verify, legacyVerify, derive, checkRegistration, waitSeconds } from '../public/auth.js';

const ok = { name: 'Amina', pin: '4821', pin2: '4821', adult: true, consent: true };

test('a profile never stores the PIN and verifies only the right one', async () => {
  const p = await makeProfile(ok, Date.UTC(2026, 10, 3));
  assert.equal(p.name, 'Amina');
  assert.equal(p.created, '2026-11-03');
  assert.doesNotMatch(JSON.stringify(p), /4821/);
  assert.equal(await verify(p, '4821'), true);
  assert.equal(await verify(p, '4822'), false);
  assert.equal(await verify(p, ''), false);
});

test('each profile has its own salt, so equal PINs hash differently', async () => {
  const a = await makeProfile(ok), b = await makeProfile(ok);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.equal(await derive('4821', a.salt), a.hash);
});

test('registration accepts a good form', () => assert.deepEqual(checkRegistration(ok), []));

test('registration rejects each problem separately', () => {
  assert.deepEqual(checkRegistration({ ...ok, name: ' ' }), ['name']);
  assert.deepEqual(checkRegistration({ ...ok, name: 'a@b.com' }), ['name']);
  assert.deepEqual(checkRegistration({ ...ok, name: '0712 345 678' }), ['name']);
  assert.deepEqual(checkRegistration({ ...ok, name: '<b>x</b>' }), ['name']);
  assert.deepEqual(checkRegistration({ ...ok, pin: '12', pin2: '12' }), ['pin']);
  assert.deepEqual(checkRegistration({ ...ok, pin: 'abcd', pin2: 'abcd' }), ['pin']);
  assert.deepEqual(checkRegistration({ ...ok, pin2: '9999' }), ['match']);
  assert.deepEqual(checkRegistration({ ...ok, adult: false }), ['adult']);
  assert.deepEqual(checkRegistration({ ...ok, consent: false }), ['consent']);
  assert.equal(checkRegistration({}).length, 4);
});

test('nicknames in other scripts and with spaces are fine', () => {
  for (const n of ['Wanjiru W', 'Otieno', "Mary-Jane O'Neil", 'Amina 7']) assert.deepEqual(checkRegistration({ ...ok, name: n }), [], n);
});

test('wrong-PIN tries are slowed after five, up to five minutes', () => {
  const t0 = 1_000_000;
  assert.equal(waitSeconds(4, t0, t0), 0);
  assert.equal(waitSeconds(5, t0, t0), 30);
  assert.equal(waitSeconds(5, t0, t0 + 10_000), 20);
  assert.equal(waitSeconds(5, t0, t0 + 31_000), 0);
  assert.equal(waitSeconds(8, t0, t0), 60);
  assert.equal(waitSeconds(100, t0, t0), 300);
});

test('a PIN saved by an older build still verifies, so it can be migrated and not dropped', async () => {
  const old = createHash('sha256').update('pambana:7391').digest('hex');
  assert.equal(await legacyVerify(old, '7391'), true);
  assert.equal(await legacyVerify(old, '7392'), false);
  assert.equal(await legacyVerify('', '7391'), false);
});
