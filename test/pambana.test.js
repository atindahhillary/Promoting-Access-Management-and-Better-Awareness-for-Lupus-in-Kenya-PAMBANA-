import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { versionOf } from './stamp.js';
import { ussd, smsReply, nextStep, diaryFlag, mergeEntry, clinicSummary, hubLine, parseHubLine, collectHubReports, hubTotals, suppress, reportsCsv } from '../public/logic.js';
import * as C from '../public/content.js';

const NEUTRAL = /lupus|sle\b|autoimmune|hiv|vvu/i;
const GSM = /^[\x0A\x0D\x20-\x5A\x61-\x7A?!.,:;'()/+*#=%&-]*$/;
const allUssd = () => {
  const out = [];
  for (const l of ['1', '2']) {
    out.push(ussd(l));
    for (const a of ['1', '2', '3', '4', '5', '9']) {
      out.push(ussd(`${l}*${a}`));
      for (const b of ['0', '1', '2', '3', '4', '5', '9']) out.push(ussd(`${l}*${a}*${b}`));
    }
  }
  for (let w = 0; w < 10; w++) out.push(ussd('1*2', w), ussd('2*2', w));
  return [ussd(''), ...out];
};
const allSms = () => [
  ...Object.values(C.CHECKIN), ...Object.values(C.DANGER_SMS), ...C.TIPS.en, ...C.TIPS.sw,
  ...['1', '2', 'DHARURA', 'PUMZIKA', 'STOP', 'ANZA', 'x'].flatMap(k => ['sw', 'en'].map(l => smsReply(k, l).reply)),
];

test('every USSD screen starts CON or END, fits 182 characters, and hides the condition', () => {
  for (const s of allUssd()) {
    assert.match(s, /^(CON|END) /);
    assert.ok(s.length <= 182, `${s.length}: ${s}`);
    assert.doesNotMatch(s, NEUTRAL);
  }
});

test('every SMS fits one GSM-7 segment and hides the condition', () => {
  for (const s of allSms()) {
    assert.ok(s.length <= 160, `${s.length}: ${s}`);
    assert.match(s, GSM);
    assert.doesNotMatch(s, NEUTRAL);
  }
});

test('danger menu always ends in go-to-hospital text', () => {
  for (const n of ['1', '2', '3', '4', '5']) assert.equal(ussd(`1*1*${n}`), `END ${C.DANGER_SMS.sw}`);
});

test('USSD back returns to the menu and danger signs stay reachable', () => {
  assert.equal(ussd('2*1*0'), ussd('2'));
  assert.equal(ussd('2*1*0*1'), ussd('2*1'));
  assert.match(ussd('2*1*0*1*3'), /^END Go to a hospital/);
});

test('unknown SMS text still points to hospital', () => {
  for (const l of ['en', 'sw']) assert.match(smsReply('hello', l).reply, /hospital/);
});

test('a later same-day save cannot erase a danger sign', () => {
  const am = { date: '2026-11-02', urgent: ['chest'], newSkin: true, ranOut: false };
  const pm = { date: '2026-11-02', urgent: [], newSkin: false, ranOut: true };
  const m = mergeEntry(am, pm);
  assert.deepEqual([m.urgent, m.newSkin, m.ranOut], [['chest'], true, true]);
  assert.equal(mergeEntry({ date: '2026-11-01', urgent: ['chest'] }, pm), pm);
});

test('clinic summary uses words, not scores or raw ids', () => {
  const labels = { feeling: 'Overall', tired: 'Tired', joints: 'Joints', missed: 'Missed', ranOut: 'Ran out', newSkin: 'New rash', scale: ['Fine', 'Mild', 'Bad', 'Very bad'], flag: () => 'Chest pain' };
  const s = clinicSummary([{ date: '2026-11-02', overall: 3, fatigue: 0, joints: 1, urgent: ['chest'], newSkin: true, missed: '0' }], labels);
  assert.match(s, /Overall: Very bad/);
  assert.match(s, /Chest pain/);
  assert.match(s, /New rash/);
  assert.doesNotMatch(s, /\/3/);
});

test('dose figures appear only in clinician and specialist tiers', () => {
  const dose = /\d\s*mg/;
  for (const c of C.MANUAL) for (const k of ['core', 'chp', 'nurse']) for (const line of c[k]) assert.doesNotMatch(line, dose, line);
  for (const x of [...C.LEARN, ...C.TIPS.en]) assert.doesNotMatch(JSON.stringify(x), dose);
});

test('invalid USSD input ends the session', () => assert.match(ussd('7'), /^END/));

test('a problem or emergency reply queues a person; ok, pause and stop do not', () => {
  for (const k of ['2', '2.', 'shida', 'DHARURA', 'DHARURA!', ' damu ', 'homa', 'nakohoa damu']) assert.equal(smsReply(k).queue, true, k);
  for (const k of ['1', 'PUMZIKA', 'STOP', 'hello']) assert.equal(smsReply(k).queue, false, k);
});

test('danger signs override everything in the referral step', () => {
  assert.equal(nextStep({ danger: ['fever'], areas: [] }).level, 'today');
  assert.equal(nextStep({ danger: ['fever'], areas: ['skin', 'joints'] }).level, 'today');
  assert.equal(nextStep({ areas: ['skin', 'joints'] }), C.NEXT_STEPS.twoWeeks);
  assert.equal(nextStep({ areas: ['skin'], concern: true }), C.NEXT_STEPS.supervisor);
  assert.equal(nextStep({ areas: ['skin'] }), C.NEXT_STEPS.routine);
  assert.equal(nextStep({ areas: ['kidney'] }), C.NEXT_STEPS.supervisor);
  assert.equal(nextStep({ areas: ['chest'] }), C.NEXT_STEPS.supervisor);
  assert.equal(nextStep({ concern: true }), C.NEXT_STEPS.supervisor);
  assert.equal(nextStep({}), C.NEXT_STEPS.routine);
});

test('referral results never diagnose and carry no score', () => {
  for (const s of Object.values(C.NEXT_STEPS)) for (const l of ['en', 'sw']) {
    assert.doesNotMatch(s[l].body, /you have lupus|you do not have|una lupus|\d+\s*%/i);
  }
});

test('diary flags', () => {
  assert.equal(diaryFlag({ urgent: ['fever'], overall: 0 }), 'today');
  for (const k of ['overall', 'fatigue', 'joints']) assert.equal(diaryFlag({ urgent: [], [k]: 3 }), 'clinic', k);
  assert.equal(diaryFlag({ urgent: [], overall: 2 }), 'none');
  assert.equal(diaryFlag({ urgent: [], newSkin: true }), 'clinic');
  assert.equal(diaryFlag({ urgent: [], missed: '3+' }), 'peer');
  assert.equal(diaryFlag({ urgent: [], ranOut: true }), 'peer');
});

test('hub lines round-trip and bad ones are rejected', () => {
  const line = hubLine({ code: 'KSM', month: '2026-11', attended: 14, fresh: 2, followUp: 3, shortage: true });
  assert.deepEqual(parseHubLine(line), { code: 'KSM', month: '2026-11', attended: 14, fresh: 2, followUp: 3, shortage: true });
  for (const bad of ['', 'HUB XXX 2026-11 1 0 0 0', 'HUB KSM 2026-13 1 0 0 0', 'HUB KSM 2026-11 1 5 0 0', 'HUB KSM 2026-11 1 0 5 0', 'HUB KSM 2026-11 a 0 0 0', 'HUB KSM 2026-11 =1 0 0 0', 'Jane has lupus']) {
    assert.equal(parseHubLine(bad), null, bad);
  }
});

test('a resent report replaces the earlier one and nonsense is reported', () => {
  const { reports, rejected } = collectHubReports('HUB KSM 2026-11 14 2 3 0\nHUB KSM 2026-11 16 2 3 1\nHUB NBO 2026-11 10 1 1 0\nrubbish');
  assert.equal(reports.length, 2);
  assert.deepEqual(rejected, ['rubbish']);
  const s = hubTotals(reports);
  assert.equal(s.attended, 26);
  assert.equal(s.shortages, 1);
  assert.equal(s.hubs.size, 2);
  assert.ok(reportsCsv(reports).startsWith('hub,month'));
});

test('small counts are suppressed, zero is not', () => {
  assert.deepEqual([0, 1, 4, 5].map(suppress), ['0', '<5', '<5', '5']);
});

test('public files use no em dashes, no fabricated prevalence, no funder or media branding', () => {
  for (const f of readdirSync('public').filter(n => /\.(js|html|css|webmanifest)$/.test(n))) {
    const s = readFileSync(`public/${f}`, 'utf8');
    assert.doesNotMatch(s, /—/, f);
    assert.doesNotMatch(s, /700,000|Global Equity|Citizen TV|NTV|KTN/, f);
  }
});

test('the installed app identity hides the condition', () => {
  const m = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.doesNotMatch(JSON.stringify(m), NEUTRAL);
});

test('service worker version matches the current files', () => {
  assert.equal(readFileSync('public/sw.js', 'utf8').match(/VERSION = '(.+?)'/)[1], versionOf());
});

test('every precached file exists', () => {
  const sw = readFileSync('public/sw.js', 'utf8');
  const files = JSON.parse(sw.match(/FILES = (\[.*?\])/s)[1].replace(/'/g, '"'));
  for (const f of files.filter(x => x !== '/')) assert.ok(existsSync(`public${f}`), f);
});
