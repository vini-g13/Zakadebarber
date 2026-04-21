/**
 * ZAKADEBARBER — Firebase Cloud Functions
 * Verstuurt bevestigings- en annuleringsmails via SendGrid.
 *
 * Setup:
 *   firebase functions:secrets:set SENDGRID_API_KEY
 *   firebase functions:secrets:set FROM_EMAIL   (bv. info@zakadebarber.be)
 *   firebase functions:secrets:set SITE_URL     (bv. https://zakadebarber.be)
 */

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const admin  = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const FROM_EMAIL       = defineSecret('FROM_EMAIL');
const SITE_URL         = defineSecret('SITE_URL');

// ─── Bevestigingsmail bij nieuwe boeking ──────────────────
exports.onNewAppointment = onDocumentCreated(
  {
    document: 'appointments/{appointmentId}',
    secrets: [SENDGRID_API_KEY, FROM_EMAIL, SITE_URL],
  },
  async (event) => {
    const appt = event.data.data();
    if (!appt || !appt.clientEmail) return;

    sgMail.setApiKey(SENDGRID_API_KEY.value());

    const cancelUrl = `${SITE_URL.value()}/?cancel=${appt.cancellationToken}`;
    const dateNL    = formatDateNL(appt.date);

    const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#111111;padding:28px 32px;text-align:center;">
      <h1 style="color:#c9a84c;font-family:Georgia,serif;margin:0;font-size:24px;">ZakaDeBarber</h1>
      <p style="color:#9e9e9e;margin:6px 0 0;font-size:13px;">Bevestiging van jouw afspraak</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:16px;color:#333;">Dag <strong>${appt.clientName}</strong>,</p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        Je afspraak is bevestigd! Hieronder vind je alle details.
      </p>

      <!-- Details -->
      <div style="background:#f9f9f9;border-left:4px solid #c9a84c;border-radius:4px;padding:20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#888;padding:5px 0;width:120px;">Kapper</td>
              <td style="color:#111;font-weight:bold;">${appt.kapperName}</td></tr>
          <tr><td style="color:#888;padding:5px 0;">Dienst</td>
              <td style="color:#111;font-weight:bold;">${appt.serviceName}</td></tr>
          <tr><td style="color:#888;padding:5px 0;">Datum</td>
              <td style="color:#111;font-weight:bold;">${dateNL}</td></tr>
          <tr><td style="color:#888;padding:5px 0;">Tijdstip</td>
              <td style="color:#111;font-weight:bold;">${appt.time}</td></tr>
          <tr><td style="color:#888;padding:5px 0;">Duur</td>
              <td style="color:#111;font-weight:bold;">${appt.serviceDuration} minuten</td></tr>
          <tr><td style="color:#888;padding:5px 0;">Prijs</td>
              <td style="color:#c9a84c;font-weight:bold;">€${appt.servicePrice}</td></tr>
        </table>
      </div>

      <!-- Adres -->
      <p style="font-size:14px;color:#555;line-height:1.6;">
        📍 <strong>Adres:</strong> Voorbeeldstraat 1, 0000 Stad<br>
        🚗 Parkeren aan de achterkant van het gebouw.
      </p>

      <!-- Annuleerlink -->
      <div style="background:#fff8e6;border:1px solid #e8c97e;border-radius:6px;padding:16px;margin:24px 0;font-size:13px;color:#5a4200;">
        Kan je niet komen? <a href="${cancelUrl}" style="color:#c9a84c;font-weight:bold;">Annuleer hier je afspraak</a> zodat we het slot voor iemand anders vrijgeven.
      </div>

      <p style="font-size:13px;color:#aaa;">
        Vragen? Stuur ons een WhatsApp via <a href="https://wa.me/32XXXXXXXXX" style="color:#c9a84c;">+32 0 000 00 00</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#111111;padding:16px 32px;text-align:center;">
      <p style="color:#555;font-size:12px;margin:0;">
        © 2025 ZakaDeBarber · BTW BE0000.000.000 ·
        <a href="${SITE_URL.value()}/privacy.html" style="color:#c9a84c;">Privacybeleid</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await sgMail.send({
        to:      appt.clientEmail,
        from:    { email: FROM_EMAIL.value(), name: 'ZakaDeBarber' },
        subject: `✅ Afspraak bevestigd — ${appt.serviceName} op ${dateNL} om ${appt.time}`,
        html,
      });
      console.log('Bevestigingsmail verstuurd naar', appt.clientEmail);
    } catch (err) {
      console.error('Mail fout:', err.response?.body || err.message);
    }
  }
);

// ─── Annuleringsmail bij statuswijziging ──────────────────
exports.onAppointmentCancelled = onDocumentUpdated(
  {
    document: 'appointments/{appointmentId}',
    secrets: [SENDGRID_API_KEY, FROM_EMAIL, SITE_URL],
  },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();

    // Alleen bij wijziging naar 'cancelled'
    if (before.status === after.status) return;
    if (after.status !== 'cancelled') return;
    if (!after.clientEmail) return;

    sgMail.setApiKey(SENDGRID_API_KEY.value());

    const dateNL = formatDateNL(after.date);

    const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#111111;padding:28px 32px;text-align:center;">
      <h1 style="color:#c9a84c;font-family:Georgia,serif;margin:0;font-size:24px;">ZakaDeBarber</h1>
      <p style="color:#9e9e9e;margin:6px 0 0;font-size:13px;">Annulering van jouw afspraak</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#333;">Dag <strong>${after.clientName}</strong>,</p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        Je afspraak op <strong>${dateNL}</strong> om <strong>${after.time}</strong>
        bij <strong>${after.kapperName}</strong> (${after.serviceName}) is geannuleerd.
      </p>
      <p style="color:#555;font-size:14px;line-height:1.7;">
        Wil je een nieuwe afspraak inplannen?
        <a href="${SITE_URL.value()}/#boeken" style="color:#c9a84c;font-weight:bold;">Boek hier opnieuw</a>.
      </p>
      <p style="font-size:13px;color:#aaa;margin-top:24px;">
        Vragen? Stuur ons een WhatsApp via <a href="https://wa.me/32XXXXXXXXX" style="color:#c9a84c;">+32 0 000 00 00</a>.
      </p>
    </div>
    <div style="background:#111111;padding:16px 32px;text-align:center;">
      <p style="color:#555;font-size:12px;margin:0;">© 2025 ZakaDeBarber</p>
    </div>
  </div>
</body>
</html>`;

    try {
      await sgMail.send({
        to:      after.clientEmail,
        from:    { email: FROM_EMAIL.value(), name: 'ZakaDeBarber' },
        subject: `❌ Afspraak geannuleerd — ${after.serviceName} op ${dateNL}`,
        html,
      });
      console.log('Annuleringsmail verstuurd naar', after.clientEmail);
    } catch (err) {
      console.error('Mail fout:', err.response?.body || err.message);
    }
  }
);

// ─── Hulpfunctie ──────────────────────────────────────────
function formatDateNL(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const days   = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
  const months = ['januari','februari','maart','april','mei','juni',
                  'juli','augustus','september','oktober','november','december'];
  const date = new Date(y, m-1, d);
  return `${days[date.getDay()]} ${d} ${months[m-1]} ${y}`;
}
