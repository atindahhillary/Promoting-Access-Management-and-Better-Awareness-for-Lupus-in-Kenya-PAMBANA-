import test from 'node:test';
import assert from 'node:assert/strict';
import { open, respond, detectLang, NAME } from '../public/companion.js';

const ctx = (o = {}) => ({ name: 'Amina', lang: 'en', today: '2026-11-03', meeting: 'Saturday 28 November', checkedInToday: false, ...o });
const texts = r => r.messages.map(m => m.text).join(' ');
const chipId = (r, pattern) => r.messages.at(-1).chips.find(c => pattern.test(c.id))?.id;

function checkin(answers, lang = 'en') {
  let r = open(ctx({ lang }));
  for (const a of answers) {
    const id = r.messages.at(-1).chips.find(c => c.id.endsWith(`:${a[1]}`) && c.id.startsWith(`ci:${a[0]}:`))?.id;
    assert.ok(id, `no chip for ${a} in ${JSON.stringify(r.messages.at(-1).chips.map(c => c.id))}`);
    r = respond(r.session, { chip: id }, ctx({ lang }));
  }
  return r;
}

test('it opens by asking a question, in the user language', () => {
  const en = open(ctx());
  assert.match(texts(en), /Warrior Companion/);
  assert.ok(en.messages.at(-1).chips.length >= 4);
  const sw = open(ctx({ lang: 'sw' }));
  assert.match(texts(sw), /Mwenza Shujaa/);
  assert.equal(NAME.en, 'The Warrior Companion');
});

test('a returning user is offered choices, not a repeat check-in', () => {
  const r = open(ctx({ checkedInToday: true }));
  assert.match(texts(r), /already checked in/);
  assert.ok(chipId(r, /^quiz$/));
});

test('a full chat check-in produces a diary entry and no reassurance beyond fixed text', () => {
  const r = checkin([['overall', 1], ['fatigue', 1], ['joints', 0], ['urgent', 'none'], ['skin', 0], ['missed', '0'], ['ranout', 0]]);
  assert.deepEqual(r.entry, { date: '2026-11-03', overall: 1, fatigue: 1, joints: 0, urgent: [], newSkin: false, missed: '0', ranOut: false });
  assert.equal(r.flag, 'none');
  assert.match(texts(r), /not a health check/);
});

test('a very bad joint score asks for a clinic visit', () => {
  const r = checkin([['overall', 0], ['fatigue', 0], ['joints', 3], ['urgent', 'none'], ['skin', 0], ['missed', '0'], ['ranout', 0]]);
  assert.equal(r.flag, 'clinic');
});

test('choosing a danger sign records it and ends in the emergency message', () => {
  let r = open(ctx());
  for (const [step, v] of [['overall', 0], ['fatigue', 0], ['joints', 0]]) r = respond(r.session, { chip: `ci:${step}:${v}` }, ctx());
  r = respond(r.session, { chip: 'ci:urgent:chest' }, ctx());
  assert.match(texts(r), /danger sign/);
  r = respond(r.session, { chip: 'ci:urgent:done' }, ctx());
  for (const [step, v] of [['skin', 0], ['missed', '0']]) r = respond(r.session, { chip: `ci:${step}:${v}` }, ctx());
  r = respond(r.session, { chip: 'ci:ranout:0' }, ctx());
  assert.deepEqual(r.entry.urgent, ['chest']);
  assert.equal(r.flag, 'today');
  assert.match(texts(r), /go to a health facility today/);
  assert.ok(chipId(r, /^cg:no$/));
});

test('danger words in either language, even mid-flow, beat everything', () => {
  const s = open(ctx()).session;
  for (const t of ['I have chest pain', 'nina degedege', 'my face is swollen and I have a fever', 'homa kali', 'I cannot breathe', 'nimekohoa damu kukohoa damu']) {
    const r = respond(s, { text: t }, ctx());
    assert.match(texts(r), /danger sign|dalili ya hatari/, t);
    assert.ok(chipId(r, /^cg:/), t);
  }
});

test('self-harm gets a human-first reply, never a menu or a joke', () => {
  for (const t of ['I want to die', 'nataka kufa', 'I want to kill myself']) {
    const r = respond(open(ctx()).session, { text: t }, ctx());
    assert.match(texts(r), /trust|unayemwamini/, t);
    assert.ok(r.messages.at(-1).chips.some(c => c.href?.startsWith('tel:')), t);
    assert.doesNotMatch(texts(r), /Pambana/, t);
  }
});

test('it answers in Swahili when the user writes Swahili, and back to English', () => {
  assert.equal(detectLang('habari, nina uchovu na maumivu', 'en'), 'sw');
  assert.equal(detectLang('I am so tired and have pain', 'sw'), 'en');
  assert.equal(detectLang('ok', 'sw'), 'sw');
  const r = respond(open(ctx()).session, { text: 'nina huzuni na wasiwasi' }, ctx());
  assert.match(texts(r), /Moyo wako/);
});

test('medicine questions never give a dose and ask about missed doses', () => {
  const r = respond(open(ctx()).session, { text: 'how much prednisolone should I take' }, ctx());
  assert.match(texts(r), /cannot tell you what to take/);
  assert.match(texts(r), /missed any doses/);
  const after = respond(r.session, { chip: 'm:3+' }, ctx());
  assert.match(texts(after), /peer champion/);
});

test('"do I have lupus" is refused kindly and points to a clinician', () => {
  const r = respond(open(ctx()).session, { text: 'do I have lupus?' }, ctx());
  assert.match(texts(r), /cannot tell whether you have lupus/);
  assert.match(texts(r), /clinician/);
});

test('myth quiz rewards the right answer and teaches the wrong one', () => {
  let r = respond(open(ctx({ checkedInToday: true })).session, { chip: 'quiz' }, ctx());
  assert.match(texts(r), /Myth or fact/);
  const right = respond(r.session, { chip: 'q:false' }, ctx());
  assert.match(texts(right), /^Right!/);
  const wrong = respond(r.session, { chip: 'q:true' }, ctx());
  assert.match(texts(wrong), /it is a myth/);
});

test('typing an answer works as well as tapping', () => {
  let r = open(ctx());
  r = respond(r.session, { text: 'mbaya sana' }, ctx());
  assert.match(r.messages.at(-1).text, /tired/);
  assert.equal(r.session.data.overall, 3);
  r = respond(r.session, { text: 'blah blah' }, ctx());
  assert.match(texts(r), /tap one/);
});

test('unknown input offers choices', () => {
  const r = respond(open(ctx({ checkedInToday: true })).session, { text: 'zzz qqq' }, ctx());
  assert.match(texts(r), /missed that/);
  assert.ok(r.messages.at(-1).chips.length >= 4);
});

test('nothing the companion says contains doses, scores or a diagnosis', () => {
  const everything = [];
  let s = open(ctx()).session;
  const inputs = ['hello', 'thanks', 'bye', 'who are you', 'do I have lupus', 'my medicine', 'baby', 'sad', 'tired', 'joint pain', 'sun', 'food', 'groups', 'quiz', 'tip', 'help', 'zzz'];
  for (const lang of ['en', 'sw']) for (const t of inputs) {
    const r = respond({ ...s, lang }, { text: t }, ctx({ lang }));
    everything.push(texts(r), ...r.messages.flatMap(m => (m.chips || []).map(c => c.label)));
    for (const id of ['tip', 'quiz', 'groups', 'feel']) everything.push(texts(respond({ ...s, lang }, { chip: id }, ctx({ lang }))));
  }
  for (const line of everything) {
    assert.doesNotMatch(line, /\d\s*mg|mg\/kg|—/, line);
    assert.doesNotMatch(line, /(?<!whether |if )you (do not )?have lupus|(?<!kama )una lupus\b/i, line);
    assert.doesNotMatch(line, /\d\s*\/\s*3\b/, line);
  }
});

test('chips are short enough to tap and every one has an id or a link', () => {
  const r = open(ctx());
  for (const c of r.messages.at(-1).chips) assert.ok((c.id || c.href) && c.label.length <= 90);
});
