// Pure logic shared by the app and the tests. No DOM, no storage, no network.
import { HUBS, TIPS, NEXT_STEPS, DANGER_SMS, LFA_PHONE } from './content.js';

// Africa's Talking USSD convention: `text` is the *-joined history of inputs.
// Menu copy never names the condition, because a shared phone can show it.
const U = {
  sw: {
    main: 'PAMBANA\n1 Dalili za hatari\n2 Ushauri wa wiki\n3 Vikundi\n4 Ongea na mtu\n5 Simamisha ujumbe',
    danger: 'Nenda hospitali LEO ukipata:\n1 Degedege au kuchanganyikiwa\n2 Kifua au kupumua\n3 Homa\n4 Uvimbe au mkojo\n5 Kutokwa damu\n0 Rudi',
    dangerEnd: DANGER_SMS.sw,
    tipEnd: 'Bonyeza tena kwa ushauri mwingine.',
    hubs: 'Vikundi vinavyopendekezwa:\n',
    person: `Piga ${LFA_PHONE} saa za kazi. Huduma hii si ya dharura.`,
    stop: 'Tuma PUMZIKA kusimamisha kwa wiki 4, au STOP kuacha kabisa.',
    bad: 'Chaguo si sahihi. Piga tena.',
  },
  en: {
    main: 'PAMBANA\n1 Danger signs\n2 Tip of the week\n3 Groups\n4 Talk to a person\n5 Stop messages',
    danger: 'Go to hospital TODAY for:\n1 Fits or confusion\n2 Chest or breathing\n3 Fever\n4 Swelling or urine\n5 Bleeding\n0 Back',
    dangerEnd: DANGER_SMS.en,
    tipEnd: 'Dial again for another tip.',
    hubs: 'Proposed groups:\n',
    person: `Call ${LFA_PHONE} in office hours. This is not an emergency service.`,
    stop: 'Send PUMZIKA to pause for 4 weeks, or STOP to end.',
    bad: 'Invalid choice. Please dial again.',
  },
};

export function ussd(text = '', weekNumber = 0) {
  const steps = text.split('*').filter(s => s !== '');
  if (!steps.length) return 'CON PAMBANA\n1 Kiswahili\n2 English';
  const lang = { 1: 'sw', 2: 'en' }[steps[0]];
  if (!lang) return 'END Chaguo si sahihi / Invalid choice.';
  const u = U[lang];
  // 0 means back, so it cancels the choice before it.
  const path = [];
  for (const s of steps.slice(1)) { if (s === '0') path.pop(); else path.push(s); }
  if (!path.length) return `CON ${u.main}`;
  const [choice, sub] = path;
  if (choice === '1') {
    if (sub === undefined) return `CON ${u.danger}`;
    return ['1', '2', '3', '4', '5'].includes(sub) ? `END ${u.dangerEnd}` : `END ${u.bad}`;
  }
  if (choice === '2') return `END ${TIPS[lang][weekNumber % TIPS[lang].length]}`;
  if (choice === '3') return `END ${u.hubs}${HUBS.map(h => h.name).slice(0, 10).join(', ')}`;
  if (choice === '4') return `END ${u.person}`;
  if (choice === '5') return `END ${u.stop}`;
  return `END ${u.bad}`;
}

const SMS = {
  sw: {
    ok: 'Asante. Tuko pamoja. PUMZIKA kusimamisha, STOP kuacha.',
    problem: 'Asante kwa kutuambia. Tutakupigia simu siku ya kazi. Ikiwa ni dharura, nenda hospitali sasa.',
    paused: 'Tumesimamisha kwa wiki 4. Tuma ANZA kurudi.',
    stopped: 'Umeondolewa. Tuma ANZA kurudi wakati wowote.',
    start: 'Karibu tena PAMBANA. Tutakutumia ujumbe mara moja kwa wiki.',
    help: 'Jibu 1 sawa, 2 shida, PUMZIKA kusimamisha, STOP kuacha. Ikiwa ni dharura nenda hospitali sasa.',
  },
  en: {
    ok: 'Thank you. We are with you. PUMZIKA to pause, STOP to end.',
    problem: 'Thanks for telling us. We will call you on a working day. If this is an emergency go to hospital now.',
    paused: 'Paused for 4 weeks. Send ANZA to come back.',
    stopped: 'You are removed. Send ANZA to return at any time.',
    start: 'Welcome back to PAMBANA. We will send one message a week.',
    help: 'Reply 1 OK, 2 problem, PUMZIKA to pause, STOP to end. If this is an emergency go to hospital now.',
  },
};

// `queue: true` means a named person must follow up. Nothing here is advice
// beyond the fixed reviewed text, and the patient's words are never kept.
export function smsReply(text, lang = 'sw') {
  const s = SMS[lang];
  const key = String(text).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (key === '1' || key === 'SAWA') return { reply: s.ok, queue: false };
  if (key === '2' || key === 'SHIDA') return { reply: s.problem, queue: true };
  if (/DHARURA|HOSPITALI|DAMU|HOMA|EMERGENCY/.test(key)) return { reply: DANGER_SMS[lang], queue: true };
  if (['PUMZIKA', 'PAUSE'].includes(key)) return { reply: s.paused, queue: false };
  if (['STOP', 'ACHA'].includes(key)) return { reply: s.stopped, queue: false };
  if (['ANZA', 'START'].includes(key)) return { reply: s.start, queue: false };
  return { reply: s.help, queue: false };
}

// A next step, never a score or a verdict. Danger signs always win.
export function nextStep({ danger = [], areas = [], concern = false }) {
  if (danger.length) return NEXT_STEPS.today;
  if (areas.length >= 2) return NEXT_STEPS.twoWeeks;
  if (concern || areas.some(a => ['kidney', 'chest'].includes(a))) return NEXT_STEPS.supervisor;
  return NEXT_STEPS.routine;
}

// Returns 'today', 'clinic', 'peer' or 'none'. 'none' must never be shown as
// reassurance: the app says nothing about being fine.
export function diaryFlag(entry) {
  if (!entry) return 'none';
  if (entry.urgent?.length) return 'today';
  if ([entry.overall, entry.fatigue, entry.joints].includes(3) || entry.newSkin) return 'clinic';
  if (entry.missed === '3+' || entry.ranOut) return 'peer';
  return 'none';
}

const HUB_LINE = /^HUB\s+([A-Z]{3})\s+(\d{4}-(?:0[1-9]|1[0-2]))\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+([01])$/;

export function hubLine({ code, month, attended, fresh, followUp, shortage }) {
  return `HUB ${code} ${month} ${attended} ${fresh} ${followUp} ${shortage ? 1 : 0}`;
}

export function parseHubLine(line) {
  const m = HUB_LINE.exec(String(line).trim().toUpperCase());
  if (!m) return null;
  const [, code, month, a, n, f, s] = m;
  if (!HUBS.some(h => h.code === code)) return null;
  const attended = +a, fresh = +n, followUp = +f;
  if (fresh > attended || followUp > attended) return null;
  return { code, month, attended, fresh, followUp, shortage: s === '1' };
}

// One report per hub and month; a resend replaces the earlier one.
export function collectHubReports(text) {
  const reports = new Map();
  const rejected = [];
  for (const raw of String(text).split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const r = parseHubLine(raw);
    if (r) reports.set(`${r.code}|${r.month}`, r);
    else rejected.push(raw.trim());
  }
  return { reports: [...reports.values()], rejected };
}

export function hubTotals(reports) {
  return reports.reduce((t, r) => ({
    sessions: t.sessions + 1,
    attended: t.attended + r.attended,
    fresh: t.fresh + r.fresh,
    followUp: t.followUp + r.followUp,
    shortages: t.shortages + (r.shortage ? 1 : 0),
    hubs: t.hubs.add(r.code),
  }), { sessions: 0, attended: 0, fresh: 0, followUp: 0, shortages: 0, hubs: new Set() });
}

// Small counts can identify a person in a county, so public figures hide 1 to 4.
export const suppress = n => (n > 0 && n < 5 ? '<5' : String(n));

export function reportsCsv(reports) {
  const rows = reports.map(r => [r.code, r.month, r.attended, r.fresh, r.followUp, r.shortage ? 1 : 0].join(','));
  return ['hub,month,attended,new,follow_up,medicine_shortage', ...rows].join('\n');
}

// Same-day saves merge, so a later blank form can never erase a danger sign.
export function mergeEntry(earlier, entry) {
  if (earlier?.date !== entry.date) return entry;
  return { ...entry, urgent: [...new Set([...earlier.urgent, ...entry.urgent])], newSkin: earlier.newSkin || entry.newSkin, ranOut: earlier.ranOut || entry.ranOut };
}

export function clinicSummary(entries, labels) {
  const lines = entries.slice(-8).map(e => {
    const bits = [`${labels.feeling}: ${labels.scale[e.overall]}`, `${labels.tired}: ${labels.scale[e.fatigue]}`, `${labels.joints}: ${labels.scale[e.joints]}`];
    if (e.urgent?.length) bits.push(...e.urgent.map(labels.flag));
    if (e.newSkin) bits.push(labels.newSkin);
    if (e.missed && e.missed !== '0') bits.push(`${labels.missed} ${e.missed}`);
    if (e.ranOut) bits.push(labels.ranOut);
    return `${e.date}: ${bits.join('; ')}`;
  });
  return lines.join('\n');
}
