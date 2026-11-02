// All clinical wording lives here so reviewers can sign it off without reading code.
// STATUS: DRAFT. Needs rheumatologist, nephrology, obstetric and pharmacist sign-off,
// and native Kiswahili review, before any patient or health worker relies on it.

export const LFA_PHONE = '0142 851 978';
export const LFA_INTL = '+254142851978';
export const FULL_NAME = 'Promoting Access, Management, and Better Awareness for Lupus in Kenya (PAMBANA)';

// Chapters listed on the LFA site. Hub placement is proposed, for LFA to confirm.
export const HUBS = [
  { code: 'NBO', name: 'Nairobi', wave: 1 }, { code: 'KSM', name: 'Kisumu', wave: 1 },
  { code: 'MSA', name: 'Mombasa', wave: 1 }, { code: 'ELD', name: 'Eldoret', wave: 2 },
  { code: 'KBU', name: 'Kiambu', wave: 2 }, { code: 'KAK', name: 'Kakamega', wave: 2 },
  { code: 'KER', name: 'Kericho', wave: 2 }, { code: 'SYA', name: 'Siaya', wave: 3 },
  { code: 'HBY', name: 'Homa Bay', wave: 3 }, { code: 'TVT', name: 'Taita Taveta', wave: 3 },
];

// SMS and USSD copy: plain GSM-7, at most 160 characters, and never the condition's name.
export const DANGER_SMS = {
  sw: 'Nenda hospitali LEO, usisubiri. Huduma hii si ya dharura. Ukikwama, piga 0142 851 978 saa za kazi.',
  en: 'Go to a hospital TODAY, do not wait. This is not an emergency service. If stuck, call 0142 851 978 in office hours.',
};

export const CHECKIN = {
  sw: 'PAMBANA: Habari ya wiki hii? Jibu 1 sawa, 2 shida. PUMZIKA kusimamisha, STOP kuacha.',
  en: 'PAMBANA: How is your week? Reply 1 OK, 2 problem. PUMZIKA to pause, STOP to end.',
};

export const TIPS = {
  en: [
    'Take your daily medicine even on good days. Do not stop without asking your clinician.',
    'Do not stop your steroid tablets suddenly, even if you feel better. Your clinician will guide you.',
    'Strong sun can make you worse, whatever your skin colour. Use shade, a hat and long sleeves.',
    'Ask for a blood pressure and urine check at every clinic visit.',
    'Fever while on your medicines can be serious. Go to a health facility the same day.',
    'Planning a baby? Talk to your clinician first. Do not stop any medicine on your own.',
    'Ask your clinician about eye checks, and report any change in your sight.',
    'Feeling tired, low or alone is common. Talk to your group. You are not alone.',
    'Running low on medicine? Tell your clinic or group before it runs out.',
    'Ask before taking painkillers from a shop. Some are hard on the kidneys.',
  ],
  sw: [
    'Meza dawa zako kila siku hata ukijisikia vizuri. Usiache bila kumuuliza daktari.',
    'Usiache dawa za steroid ghafla, hata ukijisikia vizuri. Daktari atakuelekeza.',
    'Jua kali linaweza kukuzidishia hali, kwa kila rangi ya ngozi. Kaa kivulini, vaa kofia na mikono mirefu.',
    'Omba kupimwa shinikizo la damu na mkojo kila unapoenda kliniki.',
    'Homa ukiwa unatumia dawa inaweza kuwa hatari. Nenda kituo cha afya siku hiyo hiyo.',
    'Unapanga kupata mtoto? Ongea na daktari kwanza. Usiache dawa yoyote mwenyewe.',
    'Uliza daktari kuhusu vipimo vya macho, na ripoti mabadiliko ya kuona.',
    'Uchovu, huzuni au upweke ni kawaida. Ongea na kikundi chako. Hauko peke yako.',
    'Dawa zinaisha? Waambie kliniki au kikundi kabla hazijaisha.',
    'Uliza kabla ya kununua dawa za maumivu dukani. Baadhi huumiza figo.',
  ],
};

export const NEXT_STEPS = {
  today: {
    level: 'today',
    en: { title: 'Refer today', body: 'Send this person to a hospital that can admit, today. Stop the checklist. Follow up within 24 hours.' },
    sw: { title: 'Rufaa leo', body: 'Mpeleke mtu huyu hospitali inayoweza kumlaza, leo. Acha orodha hii. Fuatilia ndani ya saa 24.' },
  },
  twoWeeks: {
    level: 'soon',
    en: { title: 'Refer within 2 weeks', body: 'Refer to a facility with a laboratory for blood pressure, urine, blood count and creatinine, and an ANA test if available. Say: a clinician needs to check this.' },
    sw: { title: 'Rufaa ndani ya wiki 2', body: 'Mpe rufaa kituo chenye maabara kwa shinikizo la damu, mkojo, damu na creatinine, na ANA ikiwepo. Sema: daktari anahitaji kuangalia.' },
  },
  supervisor: {
    level: 'soon',
    en: { title: 'Talk to your supervisor', body: 'Discuss this person with your supervisor or the link facility before deciding on referral.' },
    sw: { title: 'Ongea na msimamizi', body: 'Jadili hali ya mtu huyu na msimamizi wako au kituo cha afya kabla ya kuamua rufaa.' },
  },
  routine: {
    level: 'routine',
    en: { title: 'No lupus referral for now', body: 'Give normal advice and ask them to return if things get worse or new problems start. This does not rule anything out.' },
    sw: { title: 'Hakuna rufaa ya lupus kwa sasa', body: 'Toa ushauri wa kawaida na mwambie arudi hali ikizidi au dalili mpya zikianza. Hii haimaanishi hana ugonjwa.' },
  },
};

export const RED_FLAGS = [
  { id: 'neuro', en: 'Fits, confusion, sudden strange behaviour, or a severe new headache', sw: 'Degedege, kuchanganyikiwa, tabia ya ajabu ghafla, au kichwa kuuma sana' },
  { id: 'stroke', en: 'Weakness on one side, face droop, loss of speech, or sudden loss of sight', sw: 'Udhaifu upande mmoja, uso kupinda, kupoteza usemi, au kupoteza kuona ghafla' },
  { id: 'chest', en: 'Chest pain, hard breathing, or coughing blood', sw: 'Maumivu ya kifua, shida ya kupumua, au kukohoa damu' },
  { id: 'fever', en: 'Fever while taking prednisolone or other lupus medicines', sw: 'Homa ukiwa unatumia prednisolone au dawa nyingine za lupus' },
  { id: 'kidney', en: 'New swelling of the face or legs; foamy, dark or bloody urine; very little urine', sw: 'Uvimbe mpya wa uso au miguu; mkojo wenye povu, mweusi au damu; mkojo mdogo sana' },
  { id: 'bleed', en: 'Bleeding gums or nose, new tiny skin spots, heavy bleeding, or very pale skin', sw: 'Fizi au pua kutoa damu, vidoa vipya kwenye ngozi, kutokwa damu nyingi, au weupe mkali' },
  { id: 'preg', en: 'Pregnant, with headache, blurred sight, upper belly pain or swelling', sw: 'Mjamzito, mwenye kichwa kuuma, kuona ukungu, maumivu ya tumbo la juu au uvimbe' },
  { id: 'leg', en: 'One swollen, painful leg', sw: 'Mguu mmoja kuvimba na kuuma' },
  { id: 'steroid', en: 'Vomiting and cannot keep prednisolone down, collapse, or very weak after stopping steroids', sw: 'Kutapika na kushindwa kumeza prednisolone, kuzimia, au udhaifu mkubwa baada ya kuacha steroid' },
];

export const WITHIN_7 = [
  { en: 'Protein or blood on a urine test, with no infection to explain it', sw: 'Protini au damu kwenye mkojo, bila maambukizi yanayoeleza' },
  { en: 'Blood pressure 140/90 or above on two readings', sw: 'Shinikizo la damu 140/90 au zaidi mara mbili' },
  { en: 'Pregnant, or a missed period', sw: 'Mjamzito, au umekosa hedhi' },
  { en: 'Ran out of medicine or stopped it', sw: 'Dawa zimeisha au umeacha' },
  { en: 'New severe rash, or hair loss that scars', sw: 'Upele mkali mpya, au nywele kunyonyoka na kuacha kovu' },
];

export const BODY_AREAS = [
  { id: 'joints', en: 'Joints: pain or swelling in several joints', sw: 'Viungo: maumivu au uvimbe katika viungo kadhaa' },
  { id: 'skin', en: 'Skin: rash on cheeks or nose, ears or scalp patches, skin that reacts to sun', sw: 'Ngozi: upele mashavuni au puani, mabaka masikioni au kichwani, ngozi inayoathiriwa na jua' },
  { id: 'mouth', en: 'Mouth or hair: repeated mouth sores, patchy hair loss', sw: 'Mdomo au nywele: vidonda vya mara kwa mara, nywele kunyonyoka' },
  { id: 'general', en: 'General: unexplained fever, or tiredness that stops daily work', sw: 'Mwili: homa isiyoelezeka, au uchovu unaozuia kazi za kila siku' },
  { id: 'kidney', en: 'Kidney or pressure: swollen legs or face, foamy urine, high blood pressure', sw: 'Figo au shinikizo: miguu au uso kuvimba, mkojo wa povu, shinikizo la juu' },
  { id: 'chest', en: 'Chest: pain when breathing in', sw: 'Kifua: maumivu unapovuta pumzi' },
  { id: 'blood', en: 'Blood or pregnancy: pale skin, easy bruising, repeated miscarriage, a past clot', sw: 'Damu au mimba: weupe, kuchubuka haraka, mimba kuharibika mara kwa mara, damu kuganda awali' },
  { id: 'mind', en: 'Mind: new memory trouble or unusual behaviour', sw: 'Akili: shida mpya ya kumbukumbu au tabia isiyo ya kawaida' },
];

export const LEARN = [
  { id: 'what', en: ['What it is', 'Lupus is a long-term illness where the body\'s defences attack its own organs. You cannot catch it from another person.'], sw: ['Ni nini', 'Lupus ni ugonjwa wa muda mrefu ambapo kinga ya mwili hushambulia viungo vyake. Haiambukizwi kutoka kwa mtu mwingine.'] },
  { id: 'treat', en: ['Living with treatment', 'There is no cure yet, but treatment can control lupus. Regular care helps protect your organs.'], sw: ['Kuishi na matibabu', 'Bado hakuna tiba ya kuponya lupus, lakini matibabu yanaweza kuidhibiti. Huduma ya kila mara husaidia kulinda viungo vyako.'] },
  { id: 'hcq', en: ['Hydroxychloroquine', 'Take it every day, even when you feel well. It helps prevent flares. Do not stop without asking your clinician.'], sw: ['Hydroxychloroquine', 'Meza kila siku, hata ukijisikia vizuri. Husaidia kuzuia lupus kupanda. Usiache bila kumuuliza daktari.'] },
  { id: 'pred', en: ['Prednisolone', 'Never stop it suddenly, even if you feel better. It can be dangerous. Your clinician will tell you how to reduce it.'], sw: ['Prednisolone', 'Usiache ghafla, hata ukijisikia vizuri. Inaweza kuwa hatari. Daktari atakuelekeza jinsi ya kupunguza dozi.'] },
  { id: 'sun', en: ['Sun', 'Sun can trigger lupus in people of all skin colours. Use shade, a hat and long sleeves. Use sunscreen if you can.'], sw: ['Jua', 'Jua linaweza kuchochea lupus kwa watu wa rangi zote za ngozi. Kaa kivulini, vaa kofia na mikono mirefu. Tumia sunscreen ukiweza.'] },
  { id: 'kidney', en: ['Kidneys', 'Lupus can harm the kidneys without pain. Ask for a blood pressure and urine check at your clinic visits.'], sw: ['Figo', 'Lupus inaweza kudhuru figo bila maumivu. Omba kupimwa shinikizo la damu na mkojo unapoenda kliniki.'] },
  { id: 'fever', en: ['Fever', 'Fever while on lupus medicines can mean a serious infection. Go to a health facility the same day.'], sw: ['Homa', 'Homa ukiwa unatumia dawa za lupus inaweza kuwa maambukizi makali. Nenda kituo cha afya siku hiyo hiyo.'] },
  { id: 'baby', en: ['Planning a baby', 'Talk to your clinician first. Some lupus medicines harm a baby, others must continue. Do not stop on your own.'], sw: ['Kupanga mtoto', 'Ongea na daktari kwanza. Dawa fulani za lupus humdhuru mtoto, nyingine ziendelee. Usiache mwenyewe.'] },
  { id: 'fp', en: ['Family planning', 'On mycophenolate, methotrexate or cyclophosphamide? Use reliable family planning. Missed a period? See your clinician at once.'], sw: ['Uzazi wa mpango', 'Unatumia mycophenolate, methotrexate au cyclophosphamide? Tumia uzazi wa mpango. Ukikosa hedhi, muone daktari mara moja.'] },
  { id: 'eyes', en: ['Eyes', 'Hydroxychloroquine can affect the eyes after years of use. Ask about eye checks and report vision changes. Do not stop on your own.'], sw: ['Macho', 'Hydroxychloroquine inaweza kuathiri macho baada ya miaka. Uliza kuhusu vipimo vya macho, ripoti mabadiliko. Usiache mwenyewe.'] },
  { id: 'alone', en: ['You are not alone', 'Feeling tired, low or alone is common with lupus. Talk to your clinician or peer group. You do not have to face it alone.'], sw: ['Hauko peke yako', 'Uchovu, huzuni au upweke ni kawaida kwa watu wenye lupus. Ongea na daktari au kikundi chako. Hauko peke yako.'] },
];

export const MYTHS = [
  { en: ['Lupus is contagious, a curse, or caused by HIV.', 'It is none of these. You cannot catch it from anyone.'], sw: ['Lupus huambukiza, ni laana, au husababishwa na VVU.', 'Si kweli. Huwezi kuipata kutoka kwa mtu mwingine.'] },
  { en: ['A negative ANA test means no lupus.', 'Not always. If a clinician is still concerned, assessment should continue.'], sw: ['ANA hasi inamaanisha huna lupus.', 'Si mara zote. Daktari akiendelea kuwa na wasiwasi, uchunguzi uendelee.'] },
  { en: ['Stop your medicine when you feel better.', 'Feeling better often means it is working. Stopping steroids suddenly can be dangerous.'], sw: ['Acha dawa ukijisikia vizuri.', 'Kujisikia vizuri mara nyingi ni dalili dawa inafanya kazi. Kuacha steroid ghafla ni hatari.'] },
  { en: ['Herbs can replace lupus medicine.', 'Lupus has no cure, herbal or otherwise. Speak to your clinician before adding anything.'], sw: ['Mitishamba inaweza kuchukua nafasi ya dawa.', 'Lupus haina tiba ya kuponya. Ongea na daktari kabla ya kuongeza chochote.'] },
  { en: ['Fever is just a flare.', 'Treat fever as a possible infection and go the same day.'], sw: ['Homa ni kupanda kwa lupus tu.', 'Chukulia homa kama maambukizi na uende siku hiyo hiyo.'] },
];

export const CHP_LINES = [
  { en: 'You do not diagnose lupus. Your job is to notice warning signs and refer. Say: a clinician needs to check this.', sw: 'Huwezi kutambua lupus wewe mwenyewe. Kazi yako ni kuona dalili za hatari na kumpa rufaa. Sema: daktari anahitaji kuangalia.' },
  { en: 'Think lupus: joint pain plus rash, mouth sores, hair loss or long fever, for 4 weeks or more, no known cause. Mostly young women.', sw: 'Fikiria lupus: maumivu ya viungo na upele, vidonda mdomoni, kunyonyoka nywele au homa, wiki 4 au zaidi. Hasa wanawake vijana.' },
  { en: 'On dark skin a lupus rash may look dark or purple, not red. Check cheeks, ears and scalp. Ask if sun makes it worse.', sw: 'Kwenye ngozi nyeusi upele wa lupus unaweza kuwa mweusi au zambarau. Angalia mashavu, masikio na kichwa. Uliza kuhusu jua.' },
  { en: 'Check blood pressure at every visit. Use a urine strip if you have one. High pressure, or protein or blood in urine: refer within 7 days.', sw: 'Pima shinikizo la damu kila ziara. Tumia kipimo cha mkojo kama kipo. Likiwa juu, au protini au damu kwenye mkojo: rufaa siku 7.' },
  { en: 'If malaria, TB or HIV tests are done and symptoms continue, refer again. Lupus can occur with other illness. Do not close the case.', sw: 'Vipimo vya malaria, TB au VVU vikifanywa na dalili zikiendelea, mpe rufaa tena. Lupus inaweza kuwepo pamoja na magonjwa mengine.' },
  { en: 'Follow up in 7 days. Did they reach the facility? Do they have medicine? Never tell anyone to stop or change lupus medicine.', sw: 'Fuatilia baada ya siku 7. Alifika kituoni? Ana dawa? Usimwambie mtu yeyote aache au abadilishe dawa za lupus.' },
];

export const TIERS = { chp: 'Community Health Promoter', nurse: 'Nurse or clinical officer', clinician: 'General clinician', specialist: 'Specialist' };

// The ten core chapters named in Work Package 2. Items marked (board decision)
// are proposals the clinical reviewers must settle.
export const MANUAL = [
  { title: 'Introduction to lupus', core: ['SLE is a long-term autoimmune disease that can affect any organ.', 'In sub-Saharan reviews 88 to 100% of patients were female, with mean age at diagnosis 28.8 to 39.2 years. Do not exclude men or children.', 'Infection, kidney and brain involvement are the main causes of death in African cohorts.'],
    chp: ['A disease this uncommon will be rare in your households. Know the danger signs and when to refer.'], nurse: ['Many young patients carry another label before lupus is recognised, including a psychiatric one.'], clinician: ['Childhood onset is associated with more nephritis and more severe disease.'], specialist: ['Include mentoring of early-career rheumatologists in supervision plans.'] },
  { title: 'Recognising symptoms and signs', core: ['Consider lupus when unexplained features involve two or more body systems.', 'Fatigue, skin and mouth findings and joint symptoms are often the first complaints.'],
    chp: ['Check cheeks, ears and scalp. On dark skin a rash may look dark or purple.'], nurse: ['Look for discoid lesions with a pale centre and dark border; scarring hair loss can be permanent.'], clinician: ['Malaria, TB, HIV and syphilis must be checked, but finding one does not rule lupus out.'], specialist: ['Local dermatology review and consented photographs are needed for skin-tone guidance.'] },
  { title: 'Screening and referral', core: ['Use the checklist only for someone who is unwell or asks. It is not for mass screening.', 'No screening tool has been validated in Africa, in Kiswahili, or for community use. This one is unvalidated.', 'Danger signs always come first.'],
    chp: ['Use the Refer tool. Say "you need a clinician to check this", never "you have lupus" or "you do not have lupus".'], nurse: ['Add blood pressure and urine dipstick. Protein 1+ or more, or blood, with no infection: refer within 7 days (board decision).'], clinician: ['Expect many referrals not to be lupus. Measure yield, not only referral counts.'], specialist: ['Agree county referral routes and sample-transport arrangements.'] },
  { title: 'Basic investigations and diagnosis', core: ['Only a clinician diagnoses. The 2019 EULAR/ACR criteria are for classification in research, not diagnosis.', 'ANA was positive in only about 80% of patients in Kenyan cohorts, so a negative ANA must not end the assessment when suspicion is high.'],
    chp: ['Blood pressure if you have a cuff. Urine strips are not in most kits.'], nurse: ['Level 2 and 3: blood pressure, dipstick, haemoglobin, pregnancy test, malaria and HIV tests, then refer. Only 36% of Level 2 facilities offer laboratory services.'], clinician: ['Level 4: haemogram, creatinine, urinalysis. Creatinine first appears on the laboratory schedule at Level 4. Send ANA by sample referral.'], specialist: ['Level 5 and 6: ANA, anti-dsDNA, complement, antiphospholipid tests, urine protein-creatinine ratio, biopsy.'] },
  { title: 'First management and key treatments', core: ['Treatment is started and changed only by a clinician. Patients must not change medicine from this page.', 'On the Kenya Essential Medicines List 2023 hydroxychloroquine starts at Level 4, so patients at lower levels cannot expect stock.'],
    chp: ['Never advise on doses. Ask only: do they have medicine, and are they taking it?'], nurse: ['Never stop steroids abruptly after longer use. Fever on immunosuppression is an infection until shown otherwise.'], clinician: ['Hydroxychloroquine for all patients unless contraindicated, at no more than 5 mg/kg real body weight a day.', 'Steroids bridge active disease: aim for 5 mg/day or less of prednisolone, and withdraw if possible.', 'Do not delay hydroxychloroquine because OCT is unavailable. Keep to 5 mg/kg, record start date and weight, and arrange eye review by year 5, sooner with kidney disease (board decision, WHO and KEML wording is stricter).', 'Check interaction with artemether-lumefantrine with a pharmacist. Do not delay malaria treatment.'], specialist: ['Nephritis: mycophenolate preferred, low-dose cyclophosphamide 500 mg IV every 2 weeks for 6 doses, and use available traditional therapy if recommended drugs are absent.'] },
  { title: 'Pain relief and adherence', core: ['Ask about missed doses without blame. Cost and stock-outs are common causes.', 'Patients should ask before buying painkillers. NSAIDs carry kidney risk in nephritis.'],
    chp: ['Ask: ran out, or could not afford it? Pass it to the hub or facility.'], nurse: ['Use monitored NSAIDs only after checking kidney function and blood pressure.'], clinician: ['Ibuprofen has been linked to aseptic meningitis in SLE.'], specialist: ['Review steroid-sparing therapy when steroids cannot be reduced.'] },
  { title: 'Barriers facing women and young people', core: ['Shared phones, disclosure, stigma, cost, travel and caring duties all affect care.', 'Pregnancy planning is part of lupus care, not a separate issue.'],
    chp: ['Keep health information private, even within a household.'], nurse: ['Stop mycophenolate more than 6 weeks and methotrexate 1 to 3 months before conception, with a clinician plan. Continue hydroxychloroquine.'], clinician: ['Estrogen is contraindicated with positive antiphospholipid antibodies or past clots. DMPA is not advised in positive patients or those at bone risk. If status is unknown, treat a clot or recurrent miscarriage history as positive until tested.'], specialist: ['Consider fertility protection with cyclophosphamide.'] },
  { title: 'Follow-up and monitoring', core: ['Every person with SLE and no known nephritis: proteinuria check every 6 to 12 months and at flares.', 'Blood pressure target under 130/80 should be considered.'],
    chp: ['Follow up 7 days after referral.'], nurse: ['Record blood pressure, urine and weight at each visit. Weight supports dosing.'], clinician: ['Plan bone protection on long-term steroids. Non-live vaccines are safe; avoid yellow fever vaccine generally and take advice on live vaccines.'], specialist: ['Continue nephritis therapy at least 3 to 5 years after complete response.'] },
  { title: 'Patient perspectives on living with lupus', core: ['This chapter will be written with the Patient Advisory Board. No patient voices have been invented for this draft.'], chp: [], nurse: [], clinician: [], specialist: [] },
  { title: 'Patient support and education', core: ['Connect every patient to a peer hub and to the Patient section of this tool.', 'Peer champions share lived experience. They never advise on medicines.'],
    chp: ['Share the check-in short code when it is live.'], nurse: ['Give the danger-signs card at every visit.'], clinician: ['Encourage patients to bring their clinic summary.'], specialist: ['Support hub education sessions.'] },
];

export const SOURCES = [
  ['KDIGO 2024 lupus nephritis guideline', 'https://kdigo.org/wp-content/uploads/2024/01/KDIGO-2024-Lupus-Nephritis-Guideline.pdf'],
  ['EULAR 2023 SLE recommendations (abstract)', 'https://ard.bmj.com/content/83/1/15.abstract'],
  ['ACR 2020 reproductive health guideline', 'https://assets.contentstack.io/v3/assets/bltee37abb6b278ab2c/blt7dd578c0b70b0024/6331cfe950c8e90e3bf511de/reproductive-health-rheumatic-and-musculoskeletal-disease-guideline-2020.pdf'],
  ['Kenya Essential Medicines List 2023', 'https://cdn.who.int/media/docs/default-source/essential-medicines/national-essential-medicines-lists-(neml)/afro_neml/kenya-2023.pdf?sfvrsn=5f922bbf_3&download=true'],
  ['Kenya Health Facility Census 2023', 'https://www.health.go.ke/sites/default/files/2024-01/Kenya%20Health%20Facility%20Census%20Report%20September%202023.pdf'],
  ['Tian et al 2023, global SLE epidemiology', 'https://ard.bmj.com/content/82/3/351.abstract'],
];

export const INDICATORS = [
  ['Time from first symptom to diagnosis', 'Retrospective recall at baseline; people diagnosed during the project at endline. Median, range and n.', 'Facility and hub survey, not this app'],
  ['Suspected and referred cases', 'Per facility and month: suspected, referred, completed, outcome.', 'Facility registers'],
  ['People on appropriate therapy', 'Needs a clinician-agreed definition, with a starting and target percentage.', 'Hub survey with consent'],
  ['Facilities adopting the Manual', 'Checklist: received, staff trained, in use on spot check.', 'Manual rollout log'],
  ['Quality of life and self-management', 'Named tool with same people pre and post. Instrument and licence to be confirmed.', 'Interviewer-led at hubs'],
  ['People reached', 'By channel and month, with social media reach reported separately.', 'Hub reports, events and SMS provider'],
];
