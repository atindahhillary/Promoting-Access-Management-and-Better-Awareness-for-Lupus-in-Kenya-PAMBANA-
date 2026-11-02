// The Warrior Companion: a scripted, bilingual guide. No AI model, no network.
// It asks questions and answers from fixed wording that reviewers can sign off.
// STATUS: DRAFT wording, same review rules as content.js. It never diagnoses,
// scores, or gives doses, and danger signs and self-harm are always checked first.
import { TIPS, MYTHS, RED_FLAGS, LFA_PHONE, LFA_INTL } from './content.js';
import { diaryFlag } from './logic.js';

export const NAME = { en: 'The Warrior Companion', sw: 'Mwenza Shujaa' };
const SCALE = { en: ['Fine', 'Mild', 'Bad', 'Very bad'], sw: ['Sawa', 'Kidogo', 'Mbaya', 'Mbaya sana'] };
const tr = lang => (en, sw) => (lang === 'sw' ? sw : en);
const msg = (text, chips) => ({ text, chips });
const chip = (t, id, en, sw) => ({ id, label: t(en, sw) });
const link = (label, href) => ({ label, href });

const ENC = {
  en: ['Pambana! You are doing better than you think.', 'Every check-in is a step. Pambana!', 'You have faced hard days before. Pambana!', 'Small wins count. Pambana!'],
  sw: ['Pambana! Unafanya vizuri kuliko unavyofikiri.', 'Kila ukaguzi ni hatua. Pambana!', 'Umevuka siku ngumu kabla. Pambana!', 'Ushindi mdogo unahesabika. Pambana!'],
};

const SW_WORDS = /\b(na|ya|wa|ni|nina|sina|naumwa|nimechoka|habari|asante|sawa|shida|uchovu|maumivu|naomba|tafadhali|mimi|kwa|hapana|ndio|ndiyo|dawa|leo|jana|sijui|nataka|nahitaji|mambo|jambo|hujambo|kikundi|msaada|nisaidie|kwaheri|ninaogopa|naogopa|huzuni|upweke|je)\b/g;
const EN_WORDS = /\b(the|and|is|are|i|my|me|you|am|have|has|tired|pain|help|thanks|thank|yes|no|please|medicine|feel|feeling|what|how|why|can|do|not|want|need|hello|hi|group|sad|alone)\b/g;

export function detectLang(text, fallback) {
  const s = String(text).toLowerCase();
  const sw = (s.match(SW_WORDS) || []).length, en = (s.match(EN_WORDS) || []).length;
  return sw > en ? 'sw' : en > sw ? 'en' : fallback;
}

const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim();

const SELF_HARM = /(kill myself|end my life|want to die|suicid|self.?harm|hurt myself|kujiua|kujidhuru|sitaki kuishi|nataka kufa|nimechoka kuishi)/;
const DANGER = /(seiz|\bfits?\b|convuls|degedege|confus|kuchanganyik|chest pain|maumivu ya kifua|kifua|breath|kupumua|coughing blood|kukohoa damu|bleeding|kutokwa damu|damu kwenye mkojo|mkojo wa damu|faint|collaps|kuzimia|stroke|face droop|upande mmoja|fever|homa|very little urine|uvimbe wa uso|uvimbe wa miguu|miguu kuvimba|uso kuvimba|swollen (face|leg)|blurred|ukungu)/;
const INTENTS = [
  ['thanks', /(thank|asante|shukran)/],
  ['bye', /(\bbye\b|goodbye|kwaheri|tutaonana)/],
  ['who', /(who are you|what are you|what can you do|wewe ni nani|unafanya nini|unaweza nini)/],
  ['diagnose', /(do i have|am i sick|diagnos|nina lupus|je nina|i think i have)/],
  ['meds', /(medicin|tablet|\bpills?\b|\bdose|dozi|dawa|hydroxy|plaquenil|prednis|steroid|methotrex|mycophen|azathio)/],
  ['baby', /(pregnan|\bbaby\b|conceiv|family planning|mimba|mjamzito|mtoto|uzazi)/],
  ['sad', /(\bsad\b|\blow\b|depress|lonely|\balone\b|anxious|worried|scared|afraid|stress|huzuni|upweke|peke yangu|wasiwasi|naogopa|msongo|hopeless)/],
  ['tired', /(tired|fatigue|exhaust|brain fog|forget|memory|uchovu|nimechoka|kusahau|kumbukumbu|usingizi|\bsleep)/],
  ['joint', /(joint|\bpain|\bache|maumivu|viungo|mgongo|mikono)/],
  ['sun', /(\bsun\b|sunscreen|\bjua\b|kivuli)/],
  ['food', /(\bfood|\bdiet|\beat\b|\bsalt|chakula|lishe|chumvi)/],
  ['groups', /(\bgroups?\b|\bhub|meeting|\bpeer|support|kikundi|mkutano|vikundi|wenzangu)/],
  ['quiz', /(quiz|myth|\bgame|maswali|mchezo|imani potofu)/],
  ['tip', /(\btips?\b|advice|ushauri|kidokezo|\blearn|jifunze)/],
  ['checkin', /(check.?in|ukaguzi|hali yangu|how am i|nijaze)/],
  ['help', /(\bhelp|msaada|nisaidie)/],
  ['hello', /^(hi|hello|hey|habari|mambo|jambo|sasa|hujambo|salama|niaje)\b/],
];

const STEPS = ['overall', 'fatigue', 'joints', 'urgent', 'skin', 'missed', 'ranout'];

function mainChips(t) {
  return [chip(t, 'checkin', 'Check-in', 'Ukaguzi'), chip(t, 'tip', 'A tip', 'Kidokezo'), chip(t, 'quiz', 'Myth quiz', 'Maswali'), chip(t, 'feel', 'How I feel', 'Ninavyohisi'), chip(t, 'groups', 'Groups', 'Vikundi')];
}

function scaleChips(t, step) {
  return SCALE[t('en', 'sw')].map((label, i) => ({ id: `ci:${step}:${i}`, label }));
}

function yesNo(t, step) {
  return [chip(t, `ci:${step}:1`, 'Yes', 'Ndiyo'), chip(t, `ci:${step}:0`, 'No', 'Hapana')];
}

function ask(t, lang, data, step) {
  const q = {
    overall: t('How are you overall today?', 'Hali yako kwa jumla leo?'),
    fatigue: t('How tired do you feel?', 'Unahisi uchovu kiasi gani?'),
    joints: t('And your joints, any pain or swelling?', 'Na viungo vyako, maumivu au uvimbe?'),
    skin: t('Any new rash, mouth sores or hair loss?', 'Upele mpya, vidonda mdomoni au nywele kunyonyoka?'),
    missed: t('How many doses of your medicine did you miss this week?', 'Dozi ngapi za dawa ulikosa wiki hii?'),
    ranout: t('Did you run out of medicine, or could you not afford it?', 'Dawa ziliisha, au hukuweza kuzinunua?'),
  };
  if (step === 'urgent') {
    const left = RED_FLAGS.filter(f => !data.urgent.includes(f.id));
    const first = !data.urgent.length;
    return msg(first ? t('Any of these danger signs this week? Tap one, or none.', 'Dalili hizi za hatari wiki hii? Chagua moja, au hakuna.') : t('Anything else from the list?', 'Kuna nyingine kwenye orodha?'),
      [{ id: first ? 'ci:urgent:none' : 'ci:urgent:done', label: first ? t('None of these', 'Hakuna') : t('That is all', 'Hiyo tu') }, ...left.map(f => ({ id: `ci:urgent:${f.id}`, label: f[lang] }))]);
  }
  if (step === 'missed') return msg(q.missed, [chip(t, 'ci:missed:0', '0', '0'), chip(t, 'ci:missed:1-2', '1 to 2', '1 hadi 2'), chip(t, 'ci:missed:3+', '3 or more', '3 au zaidi')]);
  if (step === 'skin' || step === 'ranout') return msg(q[step], yesNo(t, step));
  return msg(q[step], scaleChips(t, step));
}

function emergency(t) {
  return msg(t('This is a danger sign. Please go to a health facility today and do not wait. I cannot call for help and I am not an emergency service.', 'Hii ni dalili ya hatari. Tafadhali nenda kituo cha afya leo, usisubiri. Siwezi kuita msaada na mimi si huduma ya dharura.'),
    [chip(t, 'cg:yes', 'I can go now', 'Naweza kwenda sasa'), chip(t, 'cg:no', 'I cannot get there', 'Siwezi kufika')]);
}

function flagMessage(t, flag, session) {
  if (flag === 'today') return emergency(t);
  const text = {
    clinic: t('Please book a clinic visit soon and show your check-ins. I have added this one for you.', 'Tafadhali panga kwenda kliniki hivi karibuni na uonyeshe ukaguzi wako. Nimeongeza huu.'),
    peer: t('Please talk to your peer champion or clinic this week about your medicine. I have added this check-in.', 'Tafadhali ongea na kiongozi wa kikundi au kliniki wiki hii kuhusu dawa zako. Nimeongeza ukaguzi huu.'),
    none: t('Thank you, I have added this check-in. This is not a health check. If you feel worse, use Get help.', 'Asante, nimeongeza ukaguzi huu. Hiki si kipimo cha afya. Ukijisikia vibaya zaidi, tumia Msaada.'),
  }[flag];
  const enc = ENC[session.lang][session.n++ % ENC[session.lang].length];
  return msg(`${text} ${enc}`, mainChips(t));
}

function entryOf(data, ctx) {
  return { date: ctx.today, overall: data.overall, fatigue: data.fatigue, joints: data.joints, urgent: data.urgent, newSkin: data.skin === 1, missed: data.missed, ranOut: data.ranout === 1 };
}

function checkinStart(session, t, lang, lead) {
  const s = { ...session, flow: 'checkin', step: 'overall', data: { urgent: [] } };
  return { session: s, messages: [...(lead ? [msg(lead)] : []), ask(t, lang, s.data, 'overall')] };
}

function checkinAnswer(session, ctx, t, lang, step, val) {
  const data = { ...session.data, urgent: [...session.data.urgent] };
  let ackText = '';
  if (step === 'urgent') {
    if (val === 'none' || val === 'done') { /* move on */ } else if (RED_FLAGS.some(f => f.id === val) && !data.urgent.includes(val)) {
      data.urgent.push(val);
      const s = { ...session, data, step: 'urgent' };
      return { session: s, messages: [msg(t('Thank you for telling me. That is a danger sign, so please do not wait to get care today.', 'Asante kwa kuniambia. Hiyo ni dalili ya hatari, kwa hiyo usisubiri kupata huduma leo.')), ask(t, lang, data, 'urgent')] };
    }
  } else if (step === 'overall' || step === 'fatigue' || step === 'joints') {
    data[step] = +val;
    if (step === 'overall') ackText = +val >= 2 ? t('I am sorry it is a hard day. Thank you for telling me.', 'Pole kwa siku ngumu. Asante kwa kuniambia.') : t('Good to hear. Let us keep going.', 'Vizuri kusikia. Tuendelee.');
  } else if (step === 'skin' || step === 'ranout') data[step] = +val;
  else if (step === 'missed') data.missed = val;
  const next = STEPS[STEPS.indexOf(step) + 1];
  if (next) return { session: { ...session, data, step: next }, messages: [...(ackText ? [msg(ackText)] : []), ask(t, lang, data, next)] };
  const entry = entryOf(data, ctx);
  const flag = diaryFlag(entry);
  const done = { ...session, flow: flag === 'today' ? 'canGo' : null, step: null, data: {} };
  return { session: done, entry, flag, messages: [flagMessage(t, flag, done)] };
}

function tip(session, t, lang) {
  const list = TIPS[lang];
  const s = { ...session, flow: null, n: session.n + 1 };
  return { session: s, messages: [msg(list[session.n % list.length], [chip(t, 'tip', 'Another tip', 'Kidokezo kingine'), chip(t, 'checkin', 'Check-in', 'Ukaguzi'), chip(t, 'quiz', 'Myth quiz', 'Maswali'), chip(t, 'done', 'That is enough', 'Inatosha')])] };
}

function quiz(session, t, lang) {
  const i = session.n % MYTHS.length;
  const s = { ...session, flow: 'quiz', quizIdx: i, n: session.n + 1 };
  return { session: s, messages: [msg(t('Myth or fact? "', 'Imani potofu au ukweli? "') + MYTHS[i][lang][0] + '"', [chip(t, 'q:true', 'True', 'Kweli'), chip(t, 'q:false', 'False', 'Si kweli')])] };
}

function quizAnswer(session, t, lang, val) {
  const fact = MYTHS[session.quizIdx][lang][1];
  const lead = val === 'false' ? t('Right! ', 'Sawa kabisa! ') : t('Many people think so, but it is a myth. ', 'Wengi hufikiri hivyo, lakini ni imani potofu. ');
  return { session: { ...session, flow: null }, messages: [msg(lead + fact, [chip(t, 'quiz', 'Another one', 'Nyingine'), chip(t, 'tip', 'A tip', 'Kidokezo'), chip(t, 'done', 'That is enough', 'Inatosha')])] };
}

function feelStart(session, t) {
  return { session: { ...session, flow: 'feel' }, messages: [msg(t('How is your heart today?', 'Moyo wako uko vipi leo?'), [chip(t, 'f:ok', 'Okay', 'Sawa'), chip(t, 'f:tired', 'Tired', 'Nimechoka'), chip(t, 'f:low', 'Low', 'Huzuni'), chip(t, 'f:alone', 'Alone', 'Peke yangu')])] };
}

function feelAnswer(session, ctx, t, val) {
  const m = ctx.meeting ? ctx.meeting : '';
  const text = {
    ok: t('I am glad. Celebrate small wins today. Pambana!', 'Nafurahi. Sherehekea ushindi mdogo leo. Pambana!'),
    tired: t('Tiredness is common with lupus, and it is real. Rest when you need to, and tell your clinician if it gets worse.', 'Uchovu ni kawaida kwa wenye lupus, na ni wa kweli. Pumzika unapohitaji, na umwambie daktari ukizidi.'),
    low: t('Thank you for telling me. Talking helps. If it feels heavy for days, please tell your clinician or someone you trust.', 'Asante kwa kuniambia. Kuongea kunasaidia. Ikiwa inakuwa nzito kwa siku nyingi, mwambie daktari au mtu unayemwamini.'),
    alone: t(`You are not alone. LFA peer groups are people who live this too.${m ? ` Next meeting: ${m}.` : ''}`, `Hauko peke yako. Vikundi vya LFA ni watu wanaoishi hivi pia.${m ? ` Mkutano ujao: ${m}.` : ''}`),
  }[val] || '';
  return { session: { ...session, flow: null }, messages: [msg(text, [chip(t, 'groups', 'My group', 'Kikundi changu'), chip(t, 'tip', 'A tip', 'Kidokezo'), chip(t, 'done', 'That is enough', 'Inatosha')])] };
}

function groups(session, ctx, t) {
  const when = ctx.meeting ? t(` The next meeting is ${ctx.meeting}.`, ` Mkutano ujao ni ${ctx.meeting}.`) : '';
  return { session: { ...session, flow: null }, messages: [msg(t(`LFA meets in person on the last Saturday of every month.${when} Call ${LFA_PHONE} for time and place.`, `LFA hukutana Jumamosi ya mwisho ya kila mwezi.${when} Piga ${LFA_PHONE} kupata saa na mahali.`),
    [link(t('Call LFA', 'Piga LFA'), `tel:${LFA_INTL}`), link(t('Peer hubs', 'Vikundi'), '#/hub'), chip(t, 'tip', 'A tip', 'Kidokezo')])] };
}

function meds(session, t) {
  return { session: { ...session, flow: 'meds' }, messages: [msg(t('I cannot tell you what to take or change a dose. Keep taking your medicine exactly as your clinician told you, and do not stop on your own.', 'Siwezi kukuambia dawa ya kutumia wala kubadilisha dozi. Endelea kutumia dawa kama daktari alivyokuelekeza, na usiache mwenyewe.')),
    msg(t('Have you missed any doses this week?', 'Umekosa dozi yoyote wiki hii?'), [chip(t, 'm:0', 'None', 'Hakuna'), chip(t, 'm:1-2', '1 to 2', '1 hadi 2'), chip(t, 'm:3+', '3 or more', '3 au zaidi')])] };
}

function medsAnswer(session, t, val) {
  const text = {
    '0': t('Well done. Keep it up.', 'Hongera. Endelea hivyo.'),
    '1-2': t('It happens. Linking your tablets to a daily habit can help. If you keep missing doses, tell your clinic.', 'Hutokea. Kuunganisha dawa na kazi ya kila siku kunaweza kusaidia. Ukiendelea kukosa, mwambie kliniki.'),
    '3+': t('Thank you for telling me. Please tell your clinic or peer champion this week. If you ran out or cannot afford them, say so too, because they can help find a way.', 'Asante kwa kuniambia. Tafadhali mwambie kliniki au kiongozi wa kikundi wiki hii. Ikiwa dawa ziliisha au huwezi kuzinunua, waambie pia, kwa sababu wanaweza kusaidia.'),
  }[val] || '';
  return { session: { ...session, flow: null }, messages: [msg(text, mainChips(t))] };
}

function goAnswer(session, t, val) {
  const text = val === 'yes'
    ? t('Good. Please go now, take someone with you if you can, and bring your medicines. Tell the staff about your lupus.', 'Vizuri. Tafadhali nenda sasa, nenda na mtu ukiweza, na ubebe dawa zako. Waambie wahudumu kuhusu lupus yako.')
    : t(`Please ask a neighbour, family member or community health promoter to help you get there. You can also call LFA on ${LFA_PHONE} in office hours, but that cannot replace emergency care.`, `Tafadhali mwombe jirani, ndugu au mhudumu wa afya ya jamii akusaidie kufika. Unaweza pia kupiga LFA ${LFA_PHONE} saa za kazi, lakini hilo haliwezi kuchukua nafasi ya huduma ya dharura.`);
  return { session: { ...session, flow: null }, messages: [msg(text, [link(t('Call LFA', 'Piga LFA'), `tel:${LFA_INTL}`), link(t('Danger signs', 'Dalili za hatari'), '#/help')])] };
}

function crisis(session, t) {
  return { session: { ...session, flow: null }, messages: [msg(t(`I am really glad you told me. I am only a guided companion, so I cannot give you the support you deserve right now. Please tell someone you trust now, or go to the nearest hospital. If you are in danger, do not be alone. You can also call LFA on ${LFA_PHONE}.`, `Nafurahi sana umeniambia. Mimi ni mwenza wa kuongoza tu, kwa hiyo siwezi kukupa msaada unaostahili sasa hivi. Tafadhali mwambie mtu unayemwamini sasa, au nenda hospitali iliyo karibu. Ukiwa hatarini, usiwe peke yako. Unaweza pia kupiga LFA ${LFA_PHONE}.`),
    [link(t('Call LFA', 'Piga LFA'), `tel:${LFA_INTL}`), chip(t, 'cg:yes', 'I will go to a hospital', 'Nitaenda hospitali')])] };
}

function say(session, t, text, chips) {
  return { session: { ...session, flow: null }, messages: [msg(text, chips || mainChips(t))] };
}

const ANSWER = {
  scale: s => { const x = norm(s); if (/(very bad|terrible|worst|mbaya sana|vibaya sana)/.test(x)) return 3; if (/(bad|mbaya|vibaya)/.test(x)) return 2; if (/(mild|little|kidogo|kiasi)/.test(x)) return 1; if (/(fine|good|okay|well|great|sawa|vizuri|nzuri)/.test(x)) return 0; return null; },
  yn: s => { const x = norm(s); if (/^(yes|yeah|yep|ndio|ndiyo|ndiyo)\b/.test(x)) return 1; if (/^(no|nope|hapana|la)\b/.test(x)) return 0; return null; },
  missed: s => { const x = norm(s); const n = parseInt(x, 10); if (Number.isNaN(n)) return /(none|hakuna)/.test(x) ? '0' : null; return n === 0 ? '0' : n <= 2 ? '1-2' : '3+'; },
};

function intentReply(session, ctx, t, lang, intent) {
  switch (intent) {
    case 'hello': return checkinStart(session, t, lang, t(`Habari${ctx.name ? ` ${ctx.name}` : ''}! Good to see you.`, `Habari${ctx.name ? ` ${ctx.name}` : ''}! Nafurahi kukuona.`));
    case 'thanks': return say(session, t, t('You are welcome. I am here whenever you want to talk. Pambana!', 'Karibu. Niko hapa wakati wowote unapotaka kuongea. Pambana!'));
    case 'bye': return say(session, t, t('Take care. Come back any time. Pambana!', 'Jitunze. Rudi wakati wowote. Pambana!'), [chip(t, 'checkin', 'Check-in', 'Ukaguzi')]);
    case 'who': return say(session, t, t('I am The Warrior Companion. I am a guided helper, not a doctor and not a person. I can do a check-in with you, share tips, play a myth quiz, and point you to groups. Nothing you say leaves this phone.', 'Mimi ni Mwenza Shujaa. Ni msaidizi wa kuongoza, si daktari wala mtu. Naweza kufanya ukaguzi nawe, kutoa vidokezo, kucheza maswali ya imani potofu, na kukuelekeza kwenye vikundi. Hakuna unachosema kinachoondoka kwenye simu hii.'));
    case 'diagnose': return say(session, t, t('I cannot tell whether you have lupus. Only a clinician can, after an exam and tests. If you have joint pain with a rash, mouth sores, hair loss or fever for 4 weeks or more, see a clinician and tell them. Danger signs need a hospital the same day.', 'Siwezi kukuambia kama una lupus. Daktari pekee anaweza, baada ya uchunguzi na vipimo. Ukiwa na maumivu ya viungo pamoja na upele, vidonda mdomoni, nywele kunyonyoka au homa kwa wiki 4 au zaidi, muone daktari na umwambie. Dalili za hatari zinahitaji hospitali siku hiyo hiyo.'), [link(t('Danger signs', 'Dalili za hatari'), '#/help'), link(t('Learn', 'Jifunze'), '#/learn')]);
    case 'meds': return meds(session, t);
    case 'baby': return say(session, t, t('Planning a baby, or think you might be pregnant? Please talk to your clinician first. Some lupus medicines harm a baby and others must continue, so do not stop any on your own.', 'Unapanga mtoto, au unadhani una mimba? Tafadhali ongea na daktari kwanza. Dawa fulani za lupus humdhuru mtoto na nyingine ziendelee, kwa hiyo usiache yoyote mwenyewe.'));
    case 'sad': return feelStart(session, t);
    case 'tired': return feelAnswer(session, ctx, t, 'tired');
    case 'joint': return say(session, t, t('Joint pain or swelling is worth telling your clinician about. Please ask before buying painkillers from a shop, because some are hard on the kidneys. Do you want to do a check-in so you can show it?', 'Maumivu au uvimbe wa viungo ni vyema umwambie daktari. Tafadhali uliza kabla ya kununua dawa za maumivu dukani, kwa sababu baadhi huumiza figo. Unataka kufanya ukaguzi ili uuonyeshe?'), [chip(t, 'checkin', 'Yes, check-in', 'Ndiyo, ukaguzi'), chip(t, 'tip', 'A tip', 'Kidokezo')]);
    case 'sun': return say(session, t, t('Sun can trigger lupus in people of all skin colours. Use shade, a hat and long sleeves, and sunscreen if you can.', 'Jua linaweza kuchochea lupus kwa watu wa rangi zote za ngozi. Kaa kivulini, vaa kofia na mikono mirefu, na sunscreen ukiweza.'));
    case 'food': return say(session, t, t('I do not have reviewed diet advice yet, so I will not guess. Please ask your clinician or a nutritionist.', 'Sina ushauri wa lishe uliokaguliwa bado, kwa hiyo sitakisia. Tafadhali muulize daktari au mtaalamu wa lishe.'));
    case 'groups': return groups(session, ctx, t);
    case 'quiz': return quiz(session, t, lang);
    case 'tip': return tip(session, t, lang);
    case 'checkin': return checkinStart(session, t, lang);
    case 'help': return say(session, t, t('For danger signs, go to a hospital the same day. I can also open the danger signs list for you.', 'Kwa dalili za hatari, nenda hospitali siku hiyo hiyo. Naweza pia kukufungulia orodha ya dalili za hatari.'), [link(t('Danger signs', 'Dalili za hatari'), '#/help'), link(t('Call LFA', 'Piga LFA'), `tel:${LFA_INTL}`)]);
    default: return say(session, t, t('I may have missed that. Tap one, or tell me in your own words how you feel.', 'Huenda sijaelewa. Chagua moja, au niambie kwa maneno yako unavyohisi.'));
  }
}

export function open(ctx) {
  const lang = ctx.lang, t = tr(lang);
  const session = { flow: null, step: null, data: {}, n: 0, lang, quizIdx: 0 };
  const hello = msg(t(`Habari${ctx.name ? ` ${ctx.name}` : ''}! I am ${NAME.en}. I am a guided helper, not a doctor and not a person, and nothing we say leaves this phone.`, `Habari${ctx.name ? ` ${ctx.name}` : ''}! Mimi ni ${NAME.sw}. Ni msaidizi wa kuongoza, si daktari wala mtu, na hakuna tunachosema kinachoondoka kwenye simu hii.`));
  if (ctx.checkedInToday) return { session, messages: [hello, msg(t('You have already checked in today. What would you like to do?', 'Umeshajaza ukaguzi leo. Ungependa kufanya nini?'), mainChips(t))] };
  const s = { ...session, flow: 'checkin', step: 'overall', data: { urgent: [] } };
  return { session: s, messages: [hello, msg(t('Pambana! Let us start. ', 'Pambana! Tuanze. ') + ask(t, lang, s.data, 'overall').text, ask(t, lang, s.data, 'overall').chips)] };
}

// input: { chip: id } or { text }. Returns { session, messages, entry?, flag? }.
export function respond(session, input, ctx) {
  const text = String(input.text || '').slice(0, 300);
  const lang = input.chip ? session.lang : detectLang(text, session.lang || ctx.lang);
  const t = tr(lang);
  let s = { ...session, lang };

  if (input.chip) {
    const id = input.chip;
    let m;
    if ((m = /^ci:(\w+):(.*)$/.exec(id)) && s.flow === 'checkin' && s.step === m[1]) return checkinAnswer(s, ctx, t, lang, m[1], m[2]);
    if ((m = /^q:(true|false)$/.exec(id)) && s.flow === 'quiz') return quizAnswer(s, t, lang, m[1]);
    if ((m = /^f:(\w+)$/.exec(id))) return feelAnswer(s, ctx, t, m[1]);
    if ((m = /^m:(.+)$/.exec(id))) return medsAnswer(s, t, m[1]);
    if ((m = /^cg:(yes|no)$/.exec(id))) return goAnswer(s, t, m[1]);
    if (id === 'done') return say(s, t, t('Okay. I am here whenever you want to talk. Pambana!', 'Sawa. Niko hapa wakati wowote unapotaka kuongea. Pambana!'), [chip(t, 'checkin', 'Check-in', 'Ukaguzi'), chip(t, 'tip', 'A tip', 'Kidokezo')]);
    return intentReply(s, ctx, t, lang, id);
  }

  const x = norm(text);
  if (!x) return say(s, t, t('I am listening. Tap one, or type a few words.', 'Ninasikiliza. Chagua moja, au andika maneno machache.'));
  if (SELF_HARM.test(x)) return crisis(s, t);
  if (DANGER.test(x)) return { session: { ...s, flow: 'canGo' }, messages: [emergency(t)] };

  if (s.flow === 'checkin') {
    const step = s.step;
    const v = step === 'urgent' ? (/(none|no|hakuna|hapana)/.test(x) ? 'none' : null)
      : step === 'missed' ? ANSWER.missed(x)
      : step === 'skin' || step === 'ranout' ? ANSWER.yn(x)
      : ANSWER.scale(x);
    if (v !== null && v !== undefined) return checkinAnswer(s, ctx, t, lang, step, String(v));
  } else if (s.flow === 'quiz') {
    const v = ANSWER.yn(x) ?? (/(false|si kweli|myth)/.test(x) ? 0 : /(true|kweli|fact)/.test(x) ? 1 : null);
    if (v !== null) return quizAnswer(s, t, lang, v === 0 ? 'false' : 'true');
  } else if (s.flow === 'canGo') {
    const v = ANSWER.yn(x);
    if (v !== null) return goAnswer(s, t, v ? 'yes' : 'no');
  } else if (s.flow === 'meds') {
    const v = ANSWER.missed(x);
    if (v !== null) return medsAnswer(s, t, v);
  }

  for (const [name, re] of INTENTS) if (re.test(x)) return intentReply(s, ctx, t, lang, name);
  if (s.flow === 'checkin') {
    const again = ask(t, lang, s.data, s.step);
    return { session: s, messages: [msg(t('Please tap one of the choices so I can record it.', 'Tafadhali chagua mojawapo ili niweze kurekodi.')), again] };
  }
  return intentReply(s, ctx, t, lang, 'unknown');
}
