# White Grain — publikimi me Vercel + Supabase

## 1. Krijo projektin Supabase

Në llogarinë tënde krijo një **projekt të ri për Whitegrain** (veçmas RideBJ).
Mbaje fjalëkalimin e databazës privat.

Te **SQL Editor**, ekzekuto fillimisht `supabase/setup.sql` (vetëm një herë), pastaj `supabase/seed.sql`.
Seed importon katër projektet ekzistuese. Fotot e tyre vazhdojnë të shërbehen nga faqja.

## 2. Krijo administratorin

Te **Authentication → Users → Add user**, krijo përdoruesin tënd me email dhe fjalëkalim, me email të konfirmuar.
Kopjo UUID e përdoruesit dhe ekzekuto në SQL Editor:

```sql
insert into public.admins(user_id) values ('UUID-E-PERDORUESIT');
```

Përdoruesit e tjerë nuk marrin akses administrimi. Në Auth settings çaktivizo regjistrimet publike nëse nuk të duhen.
Kërkesat janë të lexueshme vetëm nga administratorët; vizitorët mund vetëm të dërgojnë kërkesa të validuara.
Fotot në bucket `portfolio` janë publike; vetëm administratori mund të ngarkojë ose heqë skedarë.

## 3. Konfigurimi publik

Nga faqja Connect / API Keys e Supabase merr **Project URL** dhe **publishable key** (ose legacy `anon` key).
Mos përdor `service_role`, secret key ose fjalëkalimin e databazës në faqe.

Për provë lokale, plotëso `supabaseUrl` dhe `supabaseKey` në `config.js` me këto dy vlera publike.
Nis `python3 -m http.server 8000`. Faqja është te `/`, paneli te `/admin.html`.
Pa konfigurim faqja shfaq projektet lokale; formulari ofron email si alternativë dhe nuk pretendon dërgim.

## 4. GitHub dhe Vercel

Ngarko kodin në një repository të ri në GitHub. Mos ngarko `.env`, `.aws`, `.codex` ose `.agents`.
Në Vercel: **Add New → Project → importo repository**.
Framework: **Other**. `vercel.json` cakton build-in `node tools/build.mjs` dhe output-in `dist`.
Te **Environment Variables** shto:

- `SUPABASE_URL`: Project URL
- `SUPABASE_PUBLISHABLE_KEY`: publishable/anon key

Shtoji për Production dhe për Preview nëse do preview funksional. Kliko Deploy.
Build-i kopjon vetëm skedarët publikë dhe fotot në `dist`; SQL dhe dokumentacioni nuk publikohen.
Paneli online hapet te `https://ADRESA-JOTE.vercel.app/admin`.

## 5. Kontrolli para përdorimit

- Hyr në panel; krijo një draft me foto. Drafti nuk duhet të shfaqet në faqen publike.
- Publikoje dhe rifresko faqen; kontrollo galerinë dhe kërkimin.
- Dërgo një kërkesë test dhe shikoje te skeda Kërkesat në panel.
- Dil nga paneli dhe sigurohu që kërkesat nuk janë të aksesueshme pa hyrje.

Formulari ruan kërkesat në panel. Për aktivizimin e njoftimeve me email ndiq `EMAIL_SETUP.md`.
Ka honeypot dhe kufizim një kërkesë për email në minutë. Për spam të vazhdueshëm duhet CAPTCHA e verifikuar në server.
Fotot që hiqen nga një projekt mbeten në Storage për të mos fshirë aksidentalisht materiale të ripërdorura.
