import * as C from './content.js';
import { makeProfile, verify, checkRegistration, waitSeconds } from './auth.js';
import { NAME as BOT, open as openChat, respond as chatRespond } from './companion.js';
import { ussd, smsReply, nextStep, diaryFlag, mergeEntry, hubLine, collectHubReports, hubTotals, suppress, reportsCsv, clinicSummary } from './logic.js';

const KEY = 'pambana.v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
let state = { lang: 'sw', theme: 'auto', entries: [], visits: [], hub: [], profile: null, auth: { fails: 0, last: 0 }, reports: '', ...load() };
delete state.pin; // older builds kept a bare PIN; profiles replace it
let saveFailed = false;
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); saveFailed = false; } catch { saveFailed = true; }
  showDraft();
  return !saveFailed;
};
let lastResult = null; // kept so a danger message survives a re-render

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el = document) => el.querySelector(s);
const main = () => $('#main');
const t = pair => esc(pair[state.lang] ?? pair.en);
const today = () => new Date().toLocaleDateString('en-CA');

const L = {
  home: { en: 'Home', sw: 'Mwanzo' }, checkin: { en: 'Check-in', sw: 'Hali yangu' }, help: { en: 'Get help', sw: 'Msaada' }, learn: { en: 'Learn', sw: 'Jifunze' }, more: { en: 'More', sw: 'Zaidi' },
  tagline: { en: 'Know the warning signs, keep track of how you are, and reach people who understand. You are not fighting alone.', sw: 'Jua dalili za hatari, fuatilia hali yako, na uwafikie wanaokuelewa. Hupigani peke yako.' },
  who: { en: 'What do you need today?', sw: 'Unahitaji nini leo?' },
  noPhone: { en: 'No smartphone? PAMBANA is designed to work by SMS and USSD on any phone. Those services start once a licensed provider is in place.', sw: 'Huna simu janja? PAMBANA imeundwa kufanya kazi kwa SMS na USSD kwenye simu yoyote. Huduma hizi zitaanza baada ya kupata mtoa huduma aliyeidhinishwa.' },
  privacy: { en: 'Your check-ins stay on this phone. PAMBANA has no online accounts and no patient database.', sw: 'Taarifa zako zinabaki kwenye simu hii. PAMBANA haina akaunti za mtandaoni wala hifadhidata ya wagonjwa.' },
  saveFail: { en: 'Warning: this phone could not save your last change.', sw: 'Tahadhari: simu hii haikuweza kuhifadhi mabadiliko yako.' },
  back: { en: 'Back', sw: 'Rudi' }, save: { en: 'Save', sw: 'Hifadhi' },
};
const l = k => esc(L[k][state.lang]);
function showDraft() { const b = $('#draft'); b.textContent = saveFailed ? L.saveFail[state.lang] : ''; b.hidden = !saveFailed; }

const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  check: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  alert: 'M12 3l9 16H3L12 3zM12 10v4M12 17.5v.01',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  health: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11zM8 11h2l1-2 2 4 1-2h2',
  users: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.01',
  go: 'M7 17L17 7M9 7h8v8',
  user: 'M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  chat: 'M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12zM8.5 12h.01M12 12h.01M15.5 12h.01',
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

const CARDS = [
  ['#/checkin', { en: 'I live with lupus', sw: 'Ninaishi na lupus' }, { en: 'Weekly check-in and a summary for your clinic', sw: 'Ukaguzi wa wiki na muhtasari wa kliniki' }],
  ['#/learn', { en: 'I am worried, or I care for someone', sw: 'Nina wasiwasi, au namhudumia mtu' }, { en: 'Plain facts, myths and when to act', sw: 'Ukweli, imani potofu na wakati wa kuchukua hatua' }],
  ['#/refer', { en: 'I am a health worker', sw: 'Mimi ni mhudumu wa afya' }, { en: 'Referral checklist and the Care Manual', sw: 'Orodha ya rufaa na Mwongozo wa Huduma' }],
  ['#/hub', { en: 'I run a peer hub', sw: 'Naongoza kikundi' }, { en: 'Send your monthly numbers in one tap', sw: 'Tuma namba za mwezi kwa kubonyeza mara moja' }],
  ['#/phone', { en: 'I use a basic phone', sw: 'Natumia simu ya kawaida' }, { en: 'Try the SMS and USSD service', sw: 'Jaribu huduma ya SMS na USSD' }],
  ['#/team', { en: 'I work with LFA', sw: 'Nafanya kazi na LFA' }, { en: 'Hub totals and project indicators', sw: 'Jumla za vikundi na viashiria' }],
];

// Last Saturday of the month, as LFA's in-person meeting; time and venue are not published.
function nextMeeting(now = new Date()) {
  for (let m = now.getMonth(); ; m++) {
    const d = new Date(now.getFullYear(), m + 1, 0);
    d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
    if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) return d;
  }
}

function weekStrip() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const done = new Set(state.entries.map(e => e.date));
  const loc = state.lang === 'sw' ? 'sw-KE' : 'en-KE';
  return `<div class="week" role="group" aria-label="${state.lang === 'sw' ? 'Wiki hii' : 'This week'}">${[...Array(7)].map((_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = d.toLocaleDateString('en-CA');
    const cls = `${done.has(iso) ? 'done' : ''} ${iso === today() ? 'now' : ''}`;
    const label = `${d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' })}${done.has(iso) ? `, ${state.lang === 'sw' ? 'umejaza' : 'checked in'}` : ''}`;
    return `<a href="#/checkin" class="${cls}" aria-label="${esc(label)}"><span>${state.lang === 'sw' ? ['Jtatu', 'Jnne', 'Jtano', 'Alh', 'Ijm', 'Jmosi', 'Jpili'][i] : esc(d.toLocaleDateString(loc, { weekday: 'short' }))}</span><b>${d.getDate()}</b><i class="dot"></i></a>`;
  }).join('')}</div>`;
}

function home() {
  const sw = state.lang === 'sw';
  const unlocked = !locked();
  const who = unlocked ? state.profile?.name || '' : '';
  const last = unlocked ? state.entries.at(-1) : undefined;
  const m = nextMeeting();
  const loc = sw ? 'sw-KE' : 'en-KE';
  const tile = (h, ic, a, b) => `<a class="tile" href="${h}"><span class="ico">${icon(ic)}</span><strong>${esc(a)}</strong><span class="s">${esc(b)}</span><span class="go">${icon('go')}</span></a>`;
  return `<div class="greet"><span class="avatar" aria-hidden="true">${esc((who || 'P')[0].toUpperCase())}</span><div><small>${sw ? 'Habari' : 'Hello'}${who ? `, ${esc(who)}` : ''}</small><strong>${sw ? 'Karibu PAMBANA' : 'Welcome to PAMBANA'}</strong></div></div>
    <section class="banner"><p class="hook"><b>Pambana!</b> <span>${sw ? 'Tushinde pamoja.' : 'Fight on, and overcome together.'}</span></p>
      <h1 tabindex="-1">${esc(C.FULL_NAME)}</h1><p>${l('tagline')}</p><a class="btn danger" href="#/help">${l('help')}</a></section>
    <p class="credit">${sw ? 'Picha: Raymond Kiunga, Siku ya Lupus Duniani 2026, Nairobi' : 'Photo: Raymond Kiunga, World Lupus Day 2026, Nairobi'}</p>
    ${unlocked ? weekStrip() : ''}
    <nav class="quick" aria-label="${l('who')}">
      <a href="#/checkin"><span class="ico">${icon('check')}</span>${l('checkin')}</a>
      <a href="#/companion"><span class="ico">${icon('chat')}</span>${sw ? 'Mwenza' : 'Companion'}</a>
      <a href="#/learn"><span class="ico">${icon('book')}</span>${l('learn')}</a>
      <a href="#/refer"><span class="ico">${icon('health')}</span>${sw ? 'Wahudumu' : 'Health workers'}</a></nav>
    <h2>${sw ? 'Mkutano ujao wa kikundi' : 'Next group meeting'}</h2>
    <div class="meet"><div class="when"><b>${m.getDate()}</b><span>${esc(m.toLocaleDateString(loc, { month: 'short' }))}</span></div>
      <div><strong>${esc(m.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong>
      <p>${sw ? 'LFA hukutana Jumamosi ya mwisho ya kila mwezi. Piga' : 'LFA meets on the last Saturday of every month. Call'} <a href="tel:${C.LFA_INTL}">${C.LFA_PHONE}</a> ${sw ? 'kupata saa na mahali.' : 'for time and place.'}</p></div></div>
    <h2>${sw ? 'Ukaguzi wako wa mwisho' : 'Your last check-in'}</h2>
    ${last ? `<div class="stat3"><div>${t(Q.overall)}<b>${esc(SCALE[state.lang][last.overall])}</b></div><div>${t(Q.fatigue)}<b>${esc(SCALE[state.lang][last.fatigue])}</b></div><div>${t(Q.joints)}<b>${esc(SCALE[state.lang][last.joints])}</b></div></div>
      <p class="note">${esc(last.date)}. ${esc(FLAG_TEXT.none[state.lang])}</p>` : `<p class="note">${unlocked ? `${sw ? 'Bado hujajaza. Dakika moja kwa wiki inatosha.' : 'None yet. One minute a week is enough.'} <a href="#/checkin">${l('checkin')}</a>` : `<a href="#/account">${sw ? 'Ingia ili uone ukaguzi wako' : 'Log in to see your check-ins'}</a>`}</p>`}
    <h2>${l('who')}</h2>
    <div class="grid2">${tile('#/hub', 'users', sw ? 'Naongoza kikundi' : 'I run a peer hub', sw ? 'Tuma namba za mwezi' : 'Send monthly numbers')}
      ${tile('#/phone', 'phone', sw ? 'Natumia simu ya kawaida' : 'I use a basic phone', sw ? 'SMS na USSD' : 'SMS and USSD')}
      ${tile('#/team', 'chart', sw ? 'Nafanya kazi na LFA' : 'I work with LFA', sw ? 'Jumla na viashiria' : 'Totals and indicators')}
      ${state.profile ? tile('#/account', unlocked ? 'user' : 'lock', unlocked ? (sw ? 'Wasifu wangu' : 'My profile') : (sw ? 'Ingia' : 'Log in'), sw ? 'Faragha, kwenye simu hii' : 'Private, on this phone') : tile('#/account', 'user', sw ? 'Fungua wasifu' : 'Create a profile', sw ? 'Jina na PIN, hakuna barua pepe' : 'Nickname and PIN, no email')}</div>
    <section class="band"><h2>${sw ? 'Hauko peke yako' : 'You are not alone'}</h2><p>${sw ? 'Vikundi vya wenzao vinavyoongozwa na watu wanaoishi na lupus vinaanza katika matawi 10 ya LFA.' : 'Peer groups led by people who live with lupus are starting across LFA\'s 10 chapters.'}</p>
      <div class="btns"><a class="btn" href="#/hub">${sw ? 'Vikundi' : 'Peer hubs'}</a><a class="btn ghost" href="tel:${C.LFA_INTL}">${sw ? 'Piga LFA' : 'Call LFA'}</a></div></section>
    <p class="note">${l('noPhone')}</p><p class="note">${l('privacy')}</p>`;
}

function helpView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${sw ? 'Nenda hospitali leo ukiona' : 'Go to hospital today for'}</h1>
    <ul class="flags">${C.RED_FLAGS.map(f => `<li>${t(f)}</li>`).join('')}</ul>
    <p class="alert">${sw ? 'Huduma hii si ya dharura na hakuna anayeifuatilia kwa wakati halisi. Usisubiri jibu.' : 'This service cannot respond to emergencies and is not watched in real time. Do not wait for a reply.'}</p>
    <a class="btn" href="tel:${C.LFA_INTL}">${sw ? 'Piga LFA saa za kazi' : 'Call LFA in office hours'}: ${C.LFA_PHONE}</a>
    <h2>${sw ? 'Muone daktari ndani ya siku 7' : 'See a clinician within 7 days'}</h2>
    <ul>${C.WITHIN_7.map(f => `<li>${t(f)}</li>`).join('')}</ul>`;
}

function learnView() {
  const sw = state.lang === 'sw';
  const facts = C.LEARN.map(x => { const [h, b] = x[state.lang]; return `<details><summary>${esc(h)}</summary><p>${esc(b)}</p></details>`; }).join('');
  const myths = C.MYTHS.map(x => { const [m, f] = x[state.lang]; return `<div class="myth"><p class="mythq">${sw ? 'Si kweli' : 'Myth'}: ${esc(m)}</p><p>${esc(f)}</p></div>`; }).join('');
  return `<h1 tabindex="-1">${l('learn')}</h1><img class="photo" src="/img/learn.jpg" width="640" height="427" loading="lazy" alt="${sw ? 'Watu wakisikiliza katika kikao cha Siku ya Lupus Duniani' : 'People listening at a World Lupus Day session'}"><p class="credit">${sw ? 'Picha: Raymond Kiunga' : 'Photo: Raymond Kiunga'}</p>${facts}<h2>${sw ? 'Imani potofu' : 'Myths'}</h2>${myths}`;
}

const SCALE = { en: ['Fine', 'Mild', 'Bad', 'Very bad'], sw: ['Sawa', 'Kidogo', 'Mbaya', 'Mbaya sana'] };
const Q = {
  overall: { en: 'How are you overall?', sw: 'Hali yako kwa jumla?' }, fatigue: { en: 'Tiredness', sw: 'Uchovu' }, joints: { en: 'Joint pain or swelling', sw: 'Maumivu au uvimbe wa viungo' },
  urgent: { en: 'Any of these this week?', sw: 'Chochote kati ya hivi wiki hii?' }, newSkin: { en: 'New rash, mouth sores or hair loss', sw: 'Upele mpya, vidonda mdomoni au nywele kunyonyoka' },
  missed: { en: 'Doses missed this week', sw: 'Dozi ulizokosa wiki hii' }, ranOut: { en: 'Ran out of medicine or could not afford it', sw: 'Dawa ziliisha au hukuweza kuzinunua' },
};
const scale = name => `<fieldset><legend>${t(Q[name])}</legend><div class="seg">${SCALE[state.lang].map((s, i) => `<label><input type="radio" name="${name}" value="${i}" required><span>${esc(s)}</span></label>`).join('')}</div></fieldset>`;


function checkinView() {
  const sw = state.lang === 'sw';
  const last = state.entries.at(-1);
  const hist = state.entries.slice(-8).reverse().map(e => `<li>${esc(e.date)}: ${esc(SCALE[state.lang][e.overall])}${e.urgent.length ? ` (${sw ? 'dalili ya hatari' : 'danger sign noted'})` : ''}</li>`).join('');
  return `<h1 tabindex="-1">${l('checkin')}</h1><p>${sw ? 'Dakika moja kwa wiki inatosha. Inabaki kwenye simu hii.' : 'One minute a week is enough. It stays on this phone.'}</p>
    <form id="diary">${scale('overall')}${scale('fatigue')}${scale('joints')}
    <fieldset><legend>${t(Q.urgent)}</legend>${C.RED_FLAGS.map(f => `<label class="check"><input type="checkbox" name="urgent" value="${f.id}"><span>${t(f)}</span></label>`).join('')}
    <label class="check"><input type="checkbox" name="newSkin"><span>${t(Q.newSkin)}</span></label></fieldset>
    <fieldset><legend>${t(Q.missed)}</legend><div class="seg">${['0', '1-2', '3+'].map(v => `<label><input type="radio" name="missed" value="${v}" required><span>${v}</span></label>`).join('')}</div></fieldset>
    <label class="check"><input type="checkbox" name="ranOut"><span>${t(Q.ranOut)}</span></label>
    <button class="btn">${l('save')}</button></form><div id="flag" role="status"></div>
    ${hist ? `<h2>${sw ? 'Wiki zilizopita' : 'Past weeks'}</h2><ul>${hist}</ul>` : ''}
    <h2>${sw ? 'Ziara ya kliniki' : 'Clinic visit'}</h2>
    <form id="visit" class="row"><label>BP <input name="bp" placeholder="120/80" pattern="[0-9]{2,3}/[0-9]{2,3}"></label><label>${sw ? 'Uzito kg' : 'Weight kg'} <input name="kg" inputmode="decimal" pattern="[0-9]{2,3}(\\.[0-9])?"></label><button class="btn ghost">${l('save')}</button></form>
    ${state.visits.length ? `<ul>${state.visits.slice(-4).reverse().map(v => `<li>${esc(v.date)}: BP ${esc(v.bp || '-')}, ${esc(v.kg || '-')} kg</li>`).join('')}</ul>` : ''}
    <h2>${sw ? 'Data yangu' : 'My data'}</h2>
    <div class="btns"><button id="summary" class="btn ghost" ${last ? '' : 'disabled'}>${sw ? 'Muhtasari wa kliniki' : 'Clinic summary'}</button>
    <button id="wipe" class="btn ghost">${sw ? 'Futa yote' : 'Erase everything'}</button></div>
    <pre id="out" hidden></pre>
    <p class="note">${sw ? 'PIN inaficha skrini zako tu, haisimbi data. Ukifuta data ya kivinjari, taarifa zitapotea.' : 'Your PIN only hides your screens. It does not encrypt the data. Clearing browser data erases your check-ins.'}</p>`;
}

const FLAG_TEXT = {
  today: { en: 'Go to a health facility today. Do not wait.', sw: 'Nenda kituo cha afya leo. Usisubiri.' },
  clinic: { en: 'Please book a clinic visit soon and show your summary.', sw: 'Tafadhali panga kwenda kliniki hivi karibuni na uonyeshe muhtasari.' },
  peer: { en: 'Talk to your peer champion or clinic this week about your medicine.', sw: 'Ongea na kiongozi wa kikundi au kliniki wiki hii kuhusu dawa zako.' },
  none: { en: 'This is not a health check. If you feel worse, use Get help.', sw: 'Hiki si kipimo cha afya. Ukijisikia vibaya zaidi, tumia Msaada.' },
};

function referView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${sw ? 'Orodha ya rufaa' : 'Referral checklist'}</h1>
    <p>${sw ? 'Tumia kwa mtu ambaye ni mgonjwa au anauliza tu. Hii si kipimo cha ugonjwa, na haihifadhi chochote.' : 'Use only for someone who is unwell or asks. This does not diagnose, and nothing here is saved.'}</p>
    <form id="refer"><fieldset><legend>${sw ? 'Hatua 1: Dalili za hatari' : 'Step 1: Danger signs'}</legend>${C.RED_FLAGS.map(f => `<label class="check"><input type="checkbox" name="danger" value="${f.id}"><span>${t(f)}</span></label>`).join('')}</fieldset>
    <fieldset><legend>${sw ? 'Hatua 2: Shida za wiki 4 au zaidi, au zinazorudi, bila sababu inayojulikana' : 'Step 2: Problems lasting 4 weeks or more, or that keep returning, with no known cause'}</legend>${C.BODY_AREAS.map(f => `<label class="check"><input type="checkbox" name="areas" value="${f.id}"><span>${t(f)}</span></label>`).join('')}</fieldset>
    <label class="check"><input type="checkbox" name="concern"><span>${sw ? 'Ndugu ana lupus, au nina wasiwasi mkubwa' : 'Family history of lupus, or I am very concerned'}</span></label>
    <button class="btn">${sw ? 'Hatua inayofuata' : 'Next step'}</button></form><div id="step" role="status"></div>
    <h2>${sw ? 'Kumbukumbu kwa mhudumu' : 'Pocket lines'}</h2><ul>${C.CHP_LINES.map(x => `<li>${t(x)}</li>`).join('')}</ul>
    <a class="btn ghost" href="#/manual">${sw ? 'Fungua Mwongozo wa Huduma' : 'Open the Lupus Care Manual'}</a>`;
}

function manualView() {
  const tier = sessionStorage.getItem('tier') || 'chp';
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">Lupus Care Manual</h1>
    <p class="alert">${sw ? 'Kwa wahudumu wa afya. Usibadilishe dawa kutokana na ukurasa huu.' : 'For health workers. Do not change medicine from this page.'}</p><p>${sw ? 'Rasimu kwa Kiingereza kwanza. Sura zitatafsiriwa baada ya kukaguliwa.' : 'Working draft of the ten core chapters. Choose your role.'}</p>
    <div class="seg tiers">${Object.entries(C.TIERS).map(([k, v]) => `<button class="tier ${k === tier ? 'on' : ''}" data-tier="${k}" aria-pressed="${k === tier}">${esc(v)}</button>`).join('')}</div>
    ${C.MANUAL.map((c, i) => `<details ${i === 0 ? 'open' : ''}><summary>${i + 1}. ${esc(c.title)}</summary><ul>${c.core.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${c[tier].length ? `<p class="tierhead">${esc(C.TIERS[tier])}</p><ul>${c[tier].map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>`).join('')}
    <h2>Sources</h2><ul class="small">${C.SOURCES.map(([n, u]) => `<li><a href="${esc(u)}" rel="noopener">${esc(n)}</a></li>`).join('')}</ul>
    <button class="btn ghost" id="print">${sw ? 'Chapisha' : 'Print'}</button>`;
}

function hubView() {
  const sw = state.lang === 'sw';
  const month = today().slice(0, 7);
  return `<h1 tabindex="-1">${sw ? 'Ripoti ya kikundi' : 'Hub report'}</h1>
    <p>${sw ? 'Namba tu. Usiandike majina. Rejista ya majina inabaki kwenye karatasi kwa kiongozi wa kikundi.' : 'Numbers only. Never add names. The register stays on paper with the champion.'}</p>
    <form id="hubform" class="stack">
    <label>${sw ? 'Kikundi' : 'Hub'} <select name="code" required>${C.HUBS.map(h => `<option value="${h.code}">${esc(h.name)}</option>`).join('')}</select></label>
    <label>${sw ? 'Mwezi' : 'Month'} <input type="month" name="month" value="${month}" required></label>
    <label>${sw ? 'Waliohudhuria' : 'Attended'} <input type="number" name="attended" min="0" max="999" inputmode="numeric" required></label>
    <label>${sw ? 'Wapya' : 'New members'} <input type="number" name="fresh" min="0" max="999" inputmode="numeric" required></label>
    <label>${sw ? 'Wanaohitaji kufuatiliwa' : 'Need follow-up'} <input type="number" name="followUp" min="0" max="999" inputmode="numeric" required></label>
    <label class="check"><input type="checkbox" name="shortage"><span>${sw ? 'Kuna uhaba wa dawa' : 'Medicine shortage reported'}</span></label>
    <button class="btn">${sw ? 'Andaa ripoti' : 'Prepare report'}</button></form><p id="huberr" role="alert"></p><div id="hubout"></div>
    ${state.hub.length ? `<h2>${sw ? 'Zilizoandaliwa kwenye simu hii' : 'Prepared on this phone'}</h2><ul>${state.hub.slice(-6).reverse().map(x => `<li><code>${esc(x)}</code></li>`).join('')}</ul>` : ''}
    <img class="photo" src="/img/hub.jpg" width="640" height="427" loading="lazy" alt="${sw ? 'Kikundi cha wenzao cha LFA kikikutana' : 'An LFA peer support group meeting'}"><p class="credit">${sw ? 'Picha: Raymond Kiunga' : 'Photo: Raymond Kiunga'}</p>
    <h2>${sw ? 'Vikundi vinavyopendekezwa' : 'Proposed hubs'}</h2>
    <p class="note">${sw ? 'Kutoka matawi ya LFA. Bado inasubiri uthibitisho wa LFA.' : 'From LFA\'s listed chapters. Order and placement await LFA\'s confirmation.'}</p>
    <ul>${[1, 2, 3].map(w => `<li>${sw ? 'Awamu' : 'Wave'} ${w}: ${C.HUBS.filter(h => h.wave === w).map(h => esc(h.name)).join(', ')}</li>`).join('')}</ul>`;
}

function phoneView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${sw ? 'SMS na USSD' : 'SMS and USSD'}</h1>
    <p>${sw ? 'Huu ni mfano wa majaribio tu. Hakuna kinachotumwa. Huduma halisi itaendeshwa na mtoa huduma aliyeidhinishwa nchini Kenya.' : 'A simulator only. Nothing is sent. The real service will run with a licensed provider in Kenya.'}</p>
    <div class="phones">
    <section class="phone"><h2>USSD</h2><pre id="ussd" aria-live="polite"></pre><form id="ussdf" class="row"><input id="ussdi" inputmode="numeric" aria-label="USSD input" autocomplete="off"><button class="btn ghost">${sw ? 'Tuma' : 'Send'}</button><button class="btn ghost" type="button" id="ussdr">${sw ? 'Anza' : 'Restart'}</button></form></section>
    <section class="phone"><h2>SMS</h2><div id="sms" aria-live="polite"></div><form id="smsf" class="row"><input id="smsi" aria-label="SMS reply" autocomplete="off" placeholder="1, 2, DHARURA, PUMZIKA, STOP"><button class="btn ghost">${sw ? 'Jibu' : 'Reply'}</button></form></section>
    </div>
    <p class="note">${sw ? 'Ujumbe hautaji jina la ugonjwa, kwa sababu simu nyingi hutumiwa na watu kadhaa.' : 'Messages never name the condition, because many phones are shared.'}</p>
    <button class="btn ghost" id="pack">${sw ? 'Pakua maudhui kwa mtoa huduma' : 'Download content pack for the provider'}</button>`;
}

function teamView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${sw ? 'Timu ya LFA' : 'LFA team'}</h1>
    <p>${sw ? 'Bandika ripoti za vikundi. Zinabaki kwenye kifaa hiki.' : 'Paste hub report lines from SMS or WhatsApp. They stay on this device.'}</p>
    <label class="stack">${sw ? 'Ripoti' : 'Reports'} <textarea id="reports" rows="6" placeholder="HUB KSM 2026-11 14 2 3 0">${esc(state.reports)}</textarea></label>
    <div class="btns"><button id="calc" class="btn">${sw ? 'Hesabu' : 'Calculate'}</button><button id="demo" class="btn ghost">${sw ? 'Tumia data ya mfano' : 'Load sample data'}</button><button id="csv" class="btn ghost">CSV</button></div>
    <div id="totals" role="status"></div>
    <h2>${sw ? 'Viashiria vya mradi' : 'Project indicators'}</h2>
    <p class="note">${sw ? 'Hakuna kilichopimwa bado. Kila kiashiria kinahitaji msingi wa kuanzia.' : 'Nothing is measured yet. Each indicator needs a baseline before it can be reported.'}</p>
    <div class="scroll"><table><thead><tr><th>Indicator</th><th>What must be captured</th><th>Where it comes from</th></tr></thead><tbody>${C.INDICATORS.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function moreView() {
  const sw = state.lang === 'sw';
  const items = [['#/companion', 'chat', BOT[state.lang]], ['#/refer', 'health', sw ? 'Wahudumu wa afya' : 'Health workers'], ['#/hub', 'users', sw ? 'Ripoti ya kikundi' : 'Hub report'], ['#/phone', 'phone', 'SMS / USSD'], ['#/team', 'chart', sw ? 'Timu ya LFA' : 'LFA team'], ['#/about', 'info', sw ? 'Kuhusu' : 'About']];
  return `<h1 tabindex="-1">${l('more')}</h1><div class="grid2">${items.map(([h, ic, n]) => `<a class="tile" href="${h}"><span class="ico">${icon(ic)}</span><strong>${esc(n)}</strong><span class="go">${icon('go')}</span></a>`).join('')}</div>`;
}

function aboutView() {
  return `<h1 tabindex="-1">${esc(C.FULL_NAME)}</h1>
    <p>A patient-led project of the Lupus Foundation of Africa. It joins four parts: a co-created mobile tool, county peer support hubs, a tiered Lupus Care Manual, and evidence led by patient stories.</p>
    <h2>What we know, and do not know</h2>
    <ul><li>Nobody has measured how many Kenyans have lupus. Global rates suggest tens of thousands, not hundreds of thousands.</li>
    <li>Kenya has very few rheumatologists, around a dozen for more than 50 million people, so early care falls to frontline workers.</li>
    <li>Diagnosis is often delayed. African studies report delays of 15 months or more. A Kenyan baseline still has to be measured.</li></ul>
    <h2>Your privacy</h2>
    <ul><li>No online accounts, cookies or tracking. A profile is only a nickname and PIN kept on your phone.</li><li>Check-ins stay on your phone until you share or erase them.</li><li>Hub reports contain counts only, and public figures hide counts under 5.</li><li>For adults only in this release.</li></ul>
    <h2>Status</h2>
    <p>This is a pilot draft. It gives information and next steps, and it never diagnoses, scores or advises on doses. Clinical review, Kiswahili review and data protection steps must finish before use with real patients.</p>
    <p>Contact: <a href="tel:${C.LFA_INTL}">${C.LFA_PHONE}</a>, <a href="https://lupusfa.org" rel="noopener">lupusfa.org</a></p>`;
}

// Device-only profile: register and log in on this phone, with no server. Help and
// danger signs are never behind it.
const auth = { ok: false };
const locked = () => !!state.profile && !auth.ok;
const blank = () => ({ entries: [], visits: [], hub: [], profile: null, auth: { fails: 0, last: 0 }, reports: '' });

function eraseAll() {
  const sw = state.lang === 'sw';
  if (!confirm(sw ? 'Futa data yote na wasifu kwenye simu hii?' : 'Erase all data and your profile on this phone?')) return;
  try { localStorage.removeItem(KEY); } catch { /* storage blocked: nothing to erase */ }
  state = { ...state, ...blank() }; auth.ok = false; lastResult = null; chat = null; save(); location.hash = '#/'; render();
}

function loginView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${sw ? 'Karibu tena' : 'Welcome back'}, ${esc(state.profile.name)}</h1>
    <p>${sw ? 'Weka PIN yako ili kuona taarifa zako. Msaada na dalili za hatari hazihitaji kuingia.' : 'Enter your PIN to see your information. Help and danger signs never need a login.'}</p>
    <form id="login" class="stack"><label>PIN <input id="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" required></label><button class="btn">${sw ? 'Ingia' : 'Log in'}</button></form>
    <p id="loginerr" role="alert"></p>
    <div class="btns"><a class="btn danger" href="#/help">${l('help')}</a><button id="forgot" class="btn ghost">${sw ? 'Umesahau PIN? Futa yote' : 'Forgot PIN? Erase everything'}</button></div>`;
}

function bindLogin() {
  const sw = state.lang === 'sw';
  const out = $('#loginerr');
  $('#forgot').onclick = eraseAll;
  $('#login').onsubmit = async e => {
    e.preventDefault();
    const wait = waitSeconds(state.auth.fails, state.auth.last);
    if (wait) { out.textContent = sw ? `Subiri sekunde ${wait} kisha ujaribu tena.` : `Please wait ${wait} seconds and try again.`; return; }
    if (await verify(state.profile, $('#pin').value)) { auth.ok = true; state.auth = { fails: 0, last: 0 }; save(); render(); return; }
    state.auth = { fails: state.auth.fails + 1, last: Date.now() }; save();
    $('#pin').value = '';
    const w = waitSeconds(state.auth.fails, state.auth.last);
    out.textContent = (sw ? 'PIN si sahihi.' : 'Wrong PIN.') + (w ? (sw ? ` Subiri sekunde ${w}.` : ` Please wait ${w} seconds.`) : '');
  };
}

function registerView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${sw ? 'Fungua wasifu wako wa siri' : 'Create your private profile'}</h1>
    <p>${sw ? 'Hakuna barua pepe, namba ya simu wala akaunti ya mtandaoni. Jina lako la utani na PIN vinabaki kwenye simu hii tu. Msaada na dalili za hatari hazihitaji wasifu.' : 'No email, phone number or online account. Your nickname and PIN stay on this phone only. Help and danger signs never need a profile.'}</p>
    <form id="register" class="stack" novalidate>
      <label>${sw ? 'Jina la utani' : 'Nickname'} <input name="name" maxlength="24" autocomplete="off" required></label>
      <label>${sw ? 'PIN (namba 4 hadi 8)' : 'PIN (4 to 8 digits)'} <input name="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" required></label>
      <label>${sw ? 'Rudia PIN' : 'Repeat PIN'} <input name="pin2" type="password" inputmode="numeric" maxlength="8" autocomplete="off" required></label>
      <label class="check"><input type="checkbox" id="showpin"><span>${sw ? 'Onyesha PIN' : 'Show PIN'}</span></label>
      <label class="check"><input type="checkbox" name="adult"><span>${sw ? 'Nina umri wa miaka 18 au zaidi' : 'I am 18 or older'}</span></label>
      <label class="check"><input type="checkbox" name="consent"><span>${sw ? 'Naelewa taarifa zangu zinabaki kwenye simu hii, na nikisahau PIN njia pekee ni kufuta kila kitu.' : 'I understand my information stays on this phone, and if I forget my PIN the only way back in is to erase everything.'}</span></label>
      <p id="regerr" role="alert"></p>
      <button class="btn">${sw ? 'Fungua wasifu' : 'Create profile'}</button>
    </form>
    <a class="btn ghost" href="#/">${sw ? 'Endelea bila wasifu' : 'Continue without a profile'}</a>`;
}

function bindRegister() {
  const sw = state.lang === 'sw';
  const MSG = {
    name: sw ? 'Tumia jina la utani la herufi 2 hadi 24. Usiweke barua pepe wala namba ya simu.' : 'Use a nickname of 2 to 24 characters. No email or phone number.',
    pin: sw ? 'PIN iwe namba 4 hadi 8.' : 'PIN must be 4 to 8 digits.',
    match: sw ? 'PIN mbili hazilingani.' : 'The two PINs do not match.',
    adult: sw ? 'PAMBANA ni ya watu wazima, miaka 18 na zaidi, kwa sasa. Ukiwa mdogo, ongea na mzazi au daktari, au piga LFA.' : 'PAMBANA is for adults, 18 and over, for now. If you are younger, please talk to a parent or clinician, or call LFA.',
    consent: sw ? 'Tafadhali thibitisha kwamba umeelewa.' : 'Please confirm that you understand.',
  };
  const form = $('#register');
  $('#showpin').onchange = e => { form.pin.type = form.pin2.type = e.target.checked ? 'text' : 'password'; };
  form.onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(form);
    const errs = checkRegistration({ name: f.get('name'), pin: f.get('pin'), pin2: f.get('pin2'), adult: f.has('adult'), consent: f.has('consent') });
    $('#regerr').textContent = errs.map(k => MSG[k]).join(' ');
    if (errs.length) return;
    state.profile = await makeProfile({ name: f.get('name'), pin: f.get('pin') });
    state.auth = { fails: 0, last: 0 };
    auth.ok = true;
    save();
    location.hash = '#/';
    render();
  };
}

function profileView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${esc(state.profile.name)}</h1>
    <p>${sw ? 'Wasifu wa siri kwenye simu hii tangu' : 'Private profile on this phone since'} ${esc(state.profile.created)}.</p>
    <div class="btns"><a class="btn" href="#/checkin">${l('checkin')}</a><a class="btn ghost" href="#/companion">${esc(BOT[state.lang])}</a></div>
    <h2>${sw ? 'Usalama' : 'Security'}</h2>
    <div class="btns"><button id="logout" class="btn ghost">${sw ? 'Toka' : 'Log out'}</button><button id="erase" class="btn ghost">${sw ? 'Futa wasifu na data yote' : 'Erase profile and all data'}</button></div>
    <p class="note">${sw ? 'PIN inaficha skrini zako tu, haisimbi data. Simu ikipotea au ukifuta data ya kivinjari, taarifa zitapotea.' : 'Your PIN only hides your screens. It does not encrypt the data. If the phone is lost or browser data is cleared, your information is lost.'}</p>`;
}

function bindProfile() {
  $('#logout').onclick = () => { auth.ok = false; chat = null; location.hash = '#/'; render(); };
  $('#erase').onclick = eraseAll;
}

const accountView = () => (!state.profile ? registerView() : locked() ? loginView() : profileView());
function bindAccount() { if (!state.profile) bindRegister(); else if (locked()) bindLogin(); else bindProfile(); }

// The Warrior Companion: scripted, bilingual, and kept in memory only (never stored or sent).
let chat = null;
const chatCtx = () => ({
  name: locked() ? '' : state.profile?.name || '', lang: state.lang, today: today(),
  meeting: nextMeeting().toLocaleDateString(state.lang === 'sw' ? 'sw-KE' : 'en-KE', { weekday: 'long', day: 'numeric', month: 'long' }),
  checkedInToday: state.entries.at(-1)?.date === today(),
});

function companionView() {
  const sw = state.lang === 'sw';
  return `<h1 tabindex="-1">${esc(BOT[state.lang])}</h1>
    <p class="note">${sw ? 'Msaidizi wa kuongoza, si daktari wala mtu. Mazungumzo hayahifadhiwi wala kutumwa popote. Kwa dharura, nenda hospitali.' : 'A guided helper, not a doctor and not a person. Chats are not saved or sent anywhere. In an emergency, go to a hospital.'}</p>
    <div id="chat" class="chat" role="log" aria-live="polite" aria-label="${esc(BOT[state.lang])}"></div>
    <div id="chips" class="chips"></div>
    <form id="chatform" class="row"><input id="chatin" maxlength="300" autocomplete="off" aria-label="${sw ? 'Andika ujumbe' : 'Type a message'}" placeholder="${sw ? 'Andika hapa, kwa Kiswahili au English' : 'Type here, in English or Kiswahili'}"><button class="btn">${sw ? 'Tuma' : 'Send'}</button></form>
    <div class="btns"><a class="btn danger" href="#/help">${l('help')}</a><button id="chatreset" class="btn ghost">${sw ? 'Mazungumzo mapya' : 'New chat'}</button></div>`;
}

function bindCompanion() {
  const sw = state.lang === 'sw';
  const paint = () => {
    const log = $('#chat');
    log.replaceChildren(...chat.log.map(b => { const p = document.createElement('p'); p.className = `bubble ${b.who === 'bot' ? 'in' : 'out'}`; p.textContent = b.text; return p; }));
    log.scrollTop = log.scrollHeight;
    $('#chips').replaceChildren(...chat.chips.map(c => {
      const el = document.createElement(c.href ? 'a' : 'button');
      el.className = 'chip'; el.textContent = c.label;
      if (c.href) el.href = c.href; else { el.type = 'button'; el.onclick = () => send({ chip: c.id }, c.label); }
      return el;
    }));
  };
  const pushBot = messages => { for (const m of messages) chat.log.push({ who: 'bot', text: m.text }); chat.chips = messages.at(-1)?.chips || []; };
  const send = (input, shown) => {
    chat.log.push({ who: 'you', text: shown });
    const r = chatRespond(chat.session, input, chatCtx());
    chat.session = r.session;
    if (r.entry) {
      const merged = mergeEntry(state.entries.at(-1), r.entry);
      if (merged !== r.entry) state.entries.pop();
      state.entries.push(merged);
      if (!save()) r.messages.push({ text: sw ? 'Sikuweza kuhifadhi ukaguzi huu kwenye simu hii. Tafadhali jaribu tena kwenye ukurasa wa Hali yangu.' : 'I could not save this check-in on your phone. Please try again on the Check-in page.', chips: r.messages.at(-1).chips });
    }
    pushBot(r.messages);
    paint();
  };
  if (!chat) { const r = openChat(chatCtx()); chat = { session: r.session, log: [], chips: [] }; pushBot(r.messages); }
  paint();
  $('#chatform').onsubmit = e => {
    e.preventDefault();
    const v = $('#chatin').value.trim();
    if (!v) return;
    $('#chatin').value = '';
    send({ text: v }, v);
  };
  $('#chatreset').onclick = () => { chat = null; render(false); };
}

const ROUTES = { '': home, account: accountView, companion: companionView, help: helpView, learn: learnView, checkin: checkinView, refer: referView, manual: manualView, hub: hubView, phone: phoneView, team: teamView, more: moreView, about: aboutView };

function render(focus = true) {
  const route = location.hash.replace(/^#\/?/, '');
  document.documentElement.lang = state.lang;
  const standalone = matchMedia('(display-mode: standalone)').matches;
  document.title = route === '' && !standalone ? C.FULL_NAME : 'PAMBANA';
  showDraft();
  $('#lang').textContent = state.lang === 'sw' ? 'English' : 'Kiswahili';
  $('#theme').textContent = { auto: 'Auto', light: state.lang === 'sw' ? 'Mwanga' : 'Light', dark: state.lang === 'sw' ? 'Giza' : 'Dark' }[state.theme];
  $('#theme').setAttribute('aria-label', state.lang === 'sw' ? 'Badilisha mwanga' : 'Change theme');
  document.documentElement.dataset.theme = state.theme;
  const tabs = [['#/', 'home', 'home'], ['#/checkin', 'checkin', 'check'], ['#/help', 'help', 'alert'], ['#/learn', 'learn', 'book'], ['#/more', 'more', 'more']];
  const nav = tabs.map(([h, k, ic]) => `<a href="${h}" ${location.hash === h || (!location.hash && h === '#/') ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l(k)}</span></a>`).join('');
  $('#tabs').innerHTML = nav; $('#topnav').innerHTML = nav;
  const guarded = locked() && ['checkin', 'companion'].includes(route);
  main().innerHTML = guarded ? loginView() : (ROUTES[route] || home)();
  if (guarded) bindLogin(); else bind(route);
  const ac = $('#acct');
  ac.innerHTML = icon(locked() ? 'lock' : 'user');
  ac.setAttribute('aria-label', !state.profile ? (state.lang === 'sw' ? 'Fungua wasifu au ingia' : 'Create a profile or log in') : locked() ? (state.lang === 'sw' ? 'Ingia' : 'Log in') : `${state.lang === 'sw' ? 'Wasifu' : 'Profile'}: ${state.profile.name}`);
  const result = lastResult?.route === route && $(lastResult.target);
  if (result) { result.className = lastResult.cls; result.innerHTML = lastResult.html; }
  if (focus) scrollTo(0, 0);
  if (focus || document.activeElement === document.body) $('h1', main())?.focus({ preventScroll: true });
}

const download = (name, body, type = 'text/plain') => {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([body], { type })), download: name });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

function showResult(route, target, cls, html, urgent) {
  lastResult = { route, target, cls, html };
  const box = $(target);
  box.className = cls;
  box.setAttribute('role', urgent ? 'alert' : 'status');
  box.innerHTML = html;
  box.tabIndex = -1;
  box.focus({ preventScroll: true });
  box.scrollIntoView({ block: 'center' });
}

function bind(route) {
  const sw = state.lang === 'sw';
  if (route === 'checkin') bindCheckin(sw);
  if (route === 'refer') {
    $('#refer').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const s = nextStep({ danger: f.getAll('danger'), areas: f.getAll('areas'), concern: f.has('concern') });
      showResult('refer', '#step', `result ${s.level}`, `<h2>${esc(s[state.lang].title)}</h2><p>${esc(s[state.lang].body)}</p>`, s.level === 'today');
    };
  }
  if (route === 'manual') {
    main().querySelectorAll('[data-tier]').forEach(b => { b.onclick = () => { sessionStorage.setItem('tier', b.dataset.tier); render(false); }; });
    $('#print').onclick = () => { main().querySelectorAll('details').forEach(d => { d.open = true; }); print(); };
  }
  if (route === 'hub') {
    $('#hubform').onsubmit = e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      if (+f.fresh > +f.attended || +f.followUp > +f.attended) { $('#huberr').textContent = sw ? 'Wapya na wanaofuatiliwa hawawezi kuzidi waliohudhuria.' : 'New members and follow-ups cannot exceed attendance.'; return; }
      $('#huberr').textContent = '';
      const line = hubLine({ ...f, shortage: 'shortage' in f });
      state.hub.push(line); save();
      const body = encodeURIComponent(line);
      $('#hubout').innerHTML = `<p><code>${esc(line)}</code></p><div class="btns"><a class="btn" href="sms:${C.LFA_INTL}?body=${body}">SMS</a><a class="btn ghost" href="https://wa.me/${C.LFA_INTL.slice(1)}?text=${body}" rel="noopener">WhatsApp</a></div>`;
    };
  }
  if (route === 'companion') bindCompanion();
  if (route === 'account') bindAccount();
  if (route === 'phone') bindPhone(sw);
  if (route === 'team') bindTeam(sw);
}

function bindCheckin(sw) {
  $('#wipe').onclick = eraseAll;
  navigator.storage?.persist?.().catch(() => {});
  $('#diary').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const entry = { date: today(), overall: +f.get('overall'), fatigue: +f.get('fatigue'), joints: +f.get('joints'), urgent: f.getAll('urgent'), newSkin: f.has('newSkin'), missed: f.get('missed'), ranOut: f.has('ranOut') };
    const merged = mergeEntry(state.entries.at(-1), entry);
    if (merged !== entry) state.entries.pop();
    state.entries.push(merged);
    const stored = save();
    const flag = diaryFlag(merged);
    lastResult = null;
    render(false);
    showResult('checkin', '#flag', `result ${flag === 'today' ? 'today' : flag === 'none' ? 'routine' : 'soon'}`, `<p>${stored ? (sw ? 'Imehifadhiwa.' : 'Saved.') : (sw ? 'Haikuhifadhiwa kwenye simu hii.' : 'Could not save on this phone.')} ${t(FLAG_TEXT[flag])}</p>${flag === 'today' ? `<a class="btn danger" href="#/help">${l('help')}</a>` : ''}`, flag === 'today');
  };
  $('#visit').onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (!f.bp && !f.kg) return;
    state.visits.push({ date: today(), bp: f.bp, kg: f.kg }); save(); render(false);
  };
  $('#summary').onclick = () => {
    const pre = $('#out');
    const raw = q => q[state.lang];
    const labels = { feeling: raw(Q.overall), tired: raw(Q.fatigue), joints: raw(Q.joints), missed: raw(Q.missed), ranOut: raw(Q.ranOut), newSkin: raw(Q.newSkin), scale: SCALE[state.lang], flag: id => raw(C.RED_FLAGS.find(f => f.id === id)) };
    pre.textContent = `PAMBANA\n${clinicSummary(state.entries, labels)}\n${state.visits.slice(-4).map(v => `${v.date}: BP ${v.bp || '-'}, ${v.kg || '-'} kg`).join('\n')}`;
    pre.hidden = false;
  };
}

function bindPhone(sw) {
  let path = [];
  const week = Math.floor(Date.now() / 6048e5);
  const show = () => { const r = ussd(path.join('*'), week); $('#ussd').textContent = r.slice(4); $('#ussdf button').disabled = r.startsWith('END'); };
  show();
  $('#ussdf').onsubmit = e => { e.preventDefault(); const v = $('#ussdi').value.trim(); if (v) path.push(v); $('#ussdi').value = ''; show(); };
  $('#ussdr').onclick = () => { path = []; show(); };
  const log = $('#sms');
  const push = (who, text) => { const p = document.createElement('p'); p.className = `bubble ${who}`; p.textContent = text; log.append(p); log.scrollTop = log.scrollHeight; };
  push('in', C.CHECKIN[state.lang]);
  $('#smsf').onsubmit = e => {
    e.preventDefault();
    const v = $('#smsi').value.trim(); if (!v) return;
    push('out', v); $('#smsi').value = '';
    const r = smsReply(v, state.lang);
    push('in', r.reply);
    if (r.queue) push('sys', sw ? 'Mfano: mhudumu wa LFA ataarifiwa kupiga simu.' : 'Simulation: a named LFA responder would be asked to call.');
  };
  $('#pack').onclick = () => download('pambana-sms-ussd-pack.json', JSON.stringify({ status: 'DRAFT, needs clinical and Kiswahili sign-off', checkin: C.CHECKIN, danger: C.DANGER_SMS, tips: C.TIPS }, null, 2), 'application/json');
}

function bindTeam(sw) {
  const run = sample => {
    if (!sample) { state.reports = $('#reports').value; save(); }
    const { reports, rejected } = collectHubReports(sample || state.reports);
    const s = hubTotals(reports);
    $('#totals').innerHTML = `<div class="stats">${[[sw ? 'Vikundi' : 'Hubs reporting', s.hubs.size], [sw ? 'Ripoti' : 'Reports', s.sessions], [sw ? 'Mahudhurio' : 'Attendances', s.attended], [sw ? 'Wapya' : 'New members', s.fresh], [sw ? 'Ufuatiliaji' : 'Follow-ups', s.followUp], [sw ? 'Uhaba wa dawa' : 'Shortage reports', s.shortages]].map(([k, v]) => `<div><b>${esc(k === (sw ? 'Vikundi' : 'Hubs reporting') || k === (sw ? 'Ripoti' : 'Reports') ? v : suppress(v))}</b><span>${k}</span></div>`).join('')}</div>
      <p class="note">${sw ? 'Namba chini ya 5 zimefichwa.' : 'Counts under 5 are hidden.'}</p>
      ${rejected.length ? `<p role="alert">${sw ? 'Hazikusomeka' : 'Could not read'}: ${rejected.map(esc).join('; ')}</p>` : ''}`;
    return reports;
  };
  $('#calc').onclick = () => run();
  $('#demo').onclick = () => { run('HUB NBO 2026-10 18 3 4 0\nHUB KSM 2026-10 14 2 3 1\nHUB MSA 2026-10 11 2 2 0'); $('#totals').insertAdjacentHTML('afterbegin', `<p class="alert">${sw ? 'Hii ni data ya mfano, si matokeo halisi.' : 'This is sample data, not real results.'}</p>`); };
  $('#csv').onclick = () => download('pambana-hub-reports.csv', reportsCsv(run()), 'text/csv');
}

$('#lang').onclick = () => { state.lang = state.lang === 'sw' ? 'en' : 'sw'; if (chat) chat.session.lang = state.lang; save(); render(false); };
$('#theme').onclick = () => { state.theme = { auto: 'light', light: 'dark', dark: 'auto' }[state.theme]; save(); render(false); };
$('.skip').onclick = e => { e.preventDefault(); main().focus(); };
addEventListener('storage', e => { if (e.key === KEY) { state = { ...state, ...blank(), ...load() }; render(false); } });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || !state.profile || !auth.ok) return;
  auth.ok = false; chat = null;
  if (!$('#diary input:checked')) render(false);
});
addEventListener('hashchange', () => render());
render(false);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
