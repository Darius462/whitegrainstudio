# Njoftimet me email — White Grain

Kërkesat vazhdojnë të ruhen në Supabase. Njoftimi dërgohet nga funksioni Vercel
`/api/inquiry-notification`, pasi Supabase njofton një INSERT në tabelën `inquiries`.
Dështimi i emailit nuk e humbet kërkesën në panel. Dërgimi nuk është aktiv vetëm nga publikimi i kodit.

## 1. Resend

Krijo llogari në https://resend.com me **whitegrainstudio@gmail.com**.
Pa domain të verifikuar, dërguesi test `onboarding@resend.dev` mund të dërgojë vetëm
te emaili i llogarisë Resend. Për njoftimet tona destinacioni është fiks ky email.
Ky është përdorim i dërguesit test; për përdorim të plotë verifiko domainin tënd dhe ndrysho INQUIRY_EMAIL_FROM.
Te API Keys krijo një key me leje dërgimi. Mos e vendos në config.js ose GitHub.

## 2. Vercel → Project → Settings → Environment Variables

Shto vetëm për **Production**:

- `RESEND_API_KEY`: çelësi privat nga Resend.
- `INQUIRY_WEBHOOK_SECRET`: një sekret i ri rastësor, minimumi 32 karaktere.
  Mund ta gjenerosh lokalisht me `openssl rand -hex 32`; ruaje vetëm në Vercel dhe te webhook-u Supabase.
- `INQUIRY_EMAIL_FROM`: opsionale. Për testim lëre pa vendosur; përdoret `White Grain Studio <onboarding@resend.dev>`.
  Kur verifikon domainin, vendos p.sh. `White Grain Studio <njoftime@DOMAINI-YT>`.

Kryej Redeploy pasi të kesh shtuar variablat. Sekretet nuk përfshihen në build-in publik.

## 3. Supabase → Database → Webhooks → Create webhook

- Name: `whitegrain_inquiry_email`
- Table: `public.inquiries`
- Event: vetëm `INSERT`
- Type: HTTP Request
- Method: POST
- URL: `https://whitegrainstudio.vercel.app/api/inquiry-notification`
- Timeout: `10000` ms
- HTTP Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer SEKRETI_I_NJEJTE_SI_NE_VERCEL`

Ruaje. Mos e vendos sekretin në query string ose në kodin publik.
Mos krijo webhook të dytë për të njëjtën tabelë/event.

## 4. Verifikimi real

Dërgo një kërkesë test nga faqja, kontrollo panelin, Resend → Emails dhe inbox/spam të Whitegrain.
Statusi 200 i funksionit do të thotë që Resend e pranoi emailin, jo domosdoshmërisht që u dorëzua në inbox.
Nëse dështon, shiko Vercel Function Logs dhe historikun `net._http_response` në Supabase SQL Editor.
Webhook-u nuk ka këtu një radhë të garantuar ridërgimi. Për dështime kontrollo panelin;
mos ripërsërit INSERT vetëm për të ridërguar emailin. Resend deduplikon të njëjtën ID kërkese për 24 orë.
Kërkesat e krijuara përpara aktivizimit nuk njoftohen automatikisht.
