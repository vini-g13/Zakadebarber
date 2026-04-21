# ZakaDeBarber — Volledige Website + PWA

Een professionele kapperszaak-website met online boekingssysteem en een PWA-app voor kappers.

---

## Projectstructuur

```
/website          → Publieke klantenwebsite (HTML/CSS/JS)
/pwa              → Kappers beheers-app (React + Vite + PWA)
/functions        → Firebase Cloud Functions (e-mails via SendGrid)
firebase.json     → Firebase configuratie
firestore.rules   → Firestore beveiligingsregels
firestore.indexes.json → Firestore query-indexen
README.md         → Dit bestand
```

---

## Stap 1 — Firebase project aanmaken

1. Ga naar [console.firebase.google.com](https://console.firebase.google.com)
2. Klik op **"Project toevoegen"**
3. Geef het project een naam (bv. `zakadebarber`)
4. Activeer **Google Analytics** (optioneel, mag overgeslagen worden)
5. Klik **"Project aanmaken"**

### Firestore activeren
1. In Firebase console: **Firestore Database** → **Database aanmaken**
2. Kies **Production mode** (de `firestore.rules` regelt de toegang)
3. Kies een locatie (bv. `europe-west1` voor België)

### Authentication activeren
1. **Authentication** → **Aan de slag**
2. Schakel **E-mail/wachtwoord** in als aanmeldmethode

### Firebase Config ophalen
1. **Projectinstellingen** → **Jouw apps** → **Web app toevoegen** (icoon `</>`)
2. Kopieer het `firebaseConfig` object
3. Vul het in op BEIDE locaties:
   - `website/js/firebase-config.js`
   - `pwa/src/firebase.js`

---

## Stap 2 — Firebase CLI installeren & deployen

```bash
# Installeer Firebase CLI
npm install -g firebase-tools

# Inloggen
firebase login

# In de projectmap:
firebase use --add     # kies jouw project-ID
```

### Firestore regels & indexes deployen
```bash
firebase deploy --only firestore
```

---

## Stap 3 — E-mails configureren (SendGrid)

1. Maak een gratis account aan op [sendgrid.com](https://sendgrid.com)
2. Ga naar **Settings → API Keys → Create API Key** (Full Access)
3. Sla de API key op
4. Verifieer je afzender-e-mailadres via **Sender Authentication**

### Secrets instellen
```bash
firebase functions:secrets:set SENDGRID_API_KEY
# Voer de SendGrid API key in

firebase functions:secrets:set FROM_EMAIL
# Voer je geverifieerde e-mailadres in (bv. info@zakadebarber.be)

firebase functions:secrets:set SITE_URL
# Voer de URL van de website in (bv. https://zakadebarber.be)
```

### Functions deployen
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## Stap 4 — Website deployen

De website is statisch HTML/CSS/JS en kan op elk hosting platform.

### Via Firebase Hosting
```bash
# In de root van het project:
firebase deploy --only hosting:website
```

### Of via een gewone webhost
Upload de `/website` map naar je FTP/hosting provider.

**Belangrijk:** De website gebruikt ES modules (`type="module"`). Zorg dat je server de juiste MIME types serveert, of gebruik een lokale server voor ontwikkeling:
```bash
cd website
npx serve .
```

---

## Stap 5 — PWA bouwen & deployen

```bash
cd pwa
npm install
npm run build    # genereert /pwa/dist
npm run preview  # lokaal testen
```

### Via Firebase Hosting deployen
```bash
# Vanuit de root:
firebase deploy --only hosting:pwa
```

### Lokaal ontwikkelen
```bash
cd pwa
npm run dev    # start op http://localhost:3000
```

---

## Stap 6 — Kappers aanmaken in Firebase

### Via de Admin PWA (aanbevolen)
1. Maak eerst handmatig de **admin**-kapper aan in Firebase Auth:
   - Firebase Console → Authentication → Gebruiker toevoegen
   - E-mail: `admin@zakadebarber.be`, wachtwoord naar keuze
2. Voeg het admin-profiel toe in Firestore:
   - Collection: `kappers`
   - Document ID: het UID van de aangemelde gebruiker
   - Velden:
     ```json
     {
       "name": "Jouw naam",
       "email": "admin@zakadebarber.be",
       "role": "admin",
       "type": "vast",
       "active": true,
       "photo": "https://picsum.photos/seed/admin/200/200"
     }
     ```
3. Log in op de PWA met het admin-account
4. Ga naar **Admin** → voeg de andere kappers toe

### Kapper 4 (jobstudent) activeren
- Log in als admin in de PWA
- Ga naar **Admin**
- Gebruik de toggle naast de jobstudent om hem actief/inactief te zetten
- Enkel actieve kappers zijn zichtbaar en boekbaar op de website

---

## Stap 7 — PWA installeren op smartphone (kappers)

### Android (Chrome)
1. Open de PWA-URL in Chrome
2. Klik op het menu (⋮) → **"Toevoegen aan startscherm"**
3. De app verschijnt als icoon op het startscherm

### iPhone (Safari)
1. Open de PWA-URL in Safari
2. Tik op het deel-icoon (⬆️) → **"Zet op beginscherm"**
3. Bevestig → de app staat op het startscherm

---

## Placeholders invullen

Zoek en vervang de volgende placeholders na de setup:

| Placeholder | Locatie | Waarde |
|-------------|---------|--------|
| `JOUW_API_KEY` | `website/js/firebase-config.js`, `pwa/src/firebase.js` | Firebase API key |
| `JOUW_PROJECT_ID` | Idem + `.firebaserc` | Firebase project ID |
| `Voorbeeldstraat 1, 0000 Stad` | `website/index.html`, `functions/index.js` | Echt adres |
| `+32 0 000 00 00` | `website/index.html` | Echt telefoonnummer |
| `https://wa.me/32XXXXXXXXX` | `website/index.html`, `functions/index.js` | WhatsApp link |
| `info@zakadebarber.be` | `website/privacy.html`, `functions/index.js` | Echt e-mailadres |
| `https://instagram.com/kappersnaam` | `website/index.html` | Instagram URL |
| `https://tiktok.com/@kappersnaam` | `website/index.html` | TikTok URL |
| `BTW BE0000.000.000` | `website/index.html`, `privacy.html` | Echt BTW-nummer |
| Google Maps embed | `website/index.html` | Echte embed code |
| Foto's (picsum.photos) | `website/index.html` | Echte foto's |
| Logo | `website/index.html` (favicon) | `logo.png` toevoegen |

---

## Prijzen & diensten aanpassen

De diensten staan als **placeholders** in:
- `website/js/booking.js` → `PLACEHOLDER_DIENSTEN` array
- `website/index.html` → de diensten-sectie (HTML)

Voeg de echte diensten toe als Firestore collection `services`:
```json
{
  "name": "Knippen",
  "duration": 30,
  "price": 15
}
```
De website en PWA laden ze automatisch uit Firestore.

---

## Ontwikkeling lokaal draaien

```bash
# Website (open in browser)
cd website
npx serve .

# PWA (React dev server)
cd pwa
npm install && npm run dev

# Firebase Emulators (Firestore + Functions lokaal)
firebase emulators:start
```

---

## Technische stack

| Laag | Technologie |
|------|-------------|
| Website | HTML5, CSS3, Vanilla JS (ES Modules) |
| PWA | React 18, Vite, vite-plugin-pwa |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| E-mails | Firebase Cloud Functions + SendGrid |
| Hosting | Firebase Hosting |
| Push notifications | Firebase Cloud Messaging (FCM) |

---

## Vragen of problemen?

Neem contact op via WhatsApp of e-mail (zie contactpagina van de website).
