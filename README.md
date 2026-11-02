# Promoting Access, Management, and Better Awareness for Lupus in Kenya (PAMBANA)

A low-cost, offline-first system from the Lupus Foundation of Africa for people living with lupus, frontline health workers and peer support hubs.

**Status: pilot draft.** Clinical content needs specialist sign-off and Kiswahili needs native review before use with real patients. The site is marked noindex until then.

## What it is

| User | What they get |
|---|---|
| Person with lupus | Weekly check-in stored only on their phone, clinic summary, danger signs |
| Caregiver or public | Plain facts and myths in Kiswahili and English |
| Health worker | Referral checklist that gives a next step, and the tiered Lupus Care Manual |
| Peer champion | Monthly counts sent by SMS or WhatsApp in one tap |
| LFA team | Hub totals with small numbers hidden, and indicator definitions |
| Basic phone user | SMS and USSD design with a simulator and an export pack |

## Rules the design must keep

- No identifiable health data on Vercel or any host outside Kenya. There are no accounts and no patient database.
- SMS, USSD, sender ID, keywords and the app icon never name the condition.
- No diagnosis, scores or dosing. Next steps only.
- Hub reports hold counts only. Public totals hide counts from 1 to 4.
- SMS and USSD run on a licensed Kenyan provider's platform, not through this host.
- Adults only in this release.

## Run and change it

No build step and no runtime dependencies. `public/` is the whole site.

```bash
npm test
```

```bash
npx serve public
```

All clinical wording is in `public/content.js`, so reviewers can sign it off without reading code. After changing any file, run `npm run stamp` so phones pick up the new version. A test fails if you forget.
