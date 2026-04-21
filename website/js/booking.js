// ============================================================
// ZAKADEBARBER — Boekingssysteem
// ============================================================
import { db } from './firebase-config.js';
import {
  collection, query, where, getDocs, addDoc,
  Timestamp, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── State ─────────────────────────────────────────────────
const state = {
  currentStep:    1,
  totalSteps:     5,
  selectedKapper: null,
  selectedDienst: null,
  selectedDate:   null,
  selectedSlot:   null,
  calYear:        new Date().getFullYear(),
  calMonth:       new Date().getMonth(),
  bookedSlots:    [],
  blockedSlots:   [],
  kappers:        [],
  diensten:       [],
};

// ─── Placeholder data (fallback als Firestore leeg is) ─────
const PLACEHOLDER_KAPPERS = [
  { id: 'k1', name: 'Amine', role: 'Vaste kracht', photo: 'https://picsum.photos/seed/barber1/200/200', type: 'vast', active: true },
  { id: 'k2', name: 'Yassin', role: 'Vaste kracht', photo: 'https://picsum.photos/seed/barber2/200/200', type: 'vast', active: true },
  { id: 'k3', name: 'Ilias',  role: 'Stagiair',     photo: 'https://picsum.photos/seed/barber3/200/200', type: 'stagiair', active: true },
  { id: 'k4', name: 'Samy',   role: 'Jobstudent',   photo: 'https://picsum.photos/seed/barber4/200/200', type: 'jobstudent', active: false },
];

const PLACEHOLDER_DIENSTEN = [
  { id: 'd1', name: 'Knippen',                 duration: 30, price: 15 },
  { id: 'd2', name: 'Knippen + Baard',          duration: 50, price: 22 },
  { id: 'd3', name: 'Baard trimmen',            duration: 20, price: 10 },
  { id: 'd4', name: 'Knippen (kind < 12j)',     duration: 25, price: 12 },
  { id: 'd5', name: 'Fade / Dégradé',           duration: 45, price: 18 },
  { id: 'd6', name: 'Scheren (klassiek)',        duration: 30, price: 15 },
];

// Werkuren (ma-za, zon gesloten) — te overschrijven via Firestore
const WORKING_HOURS = { start: '09:00', end: '18:30' };
const SLOT_DURATION_MIN = 30; // minuten per slot
const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // ma=1 ... za=6

// ─── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadKappers();
  await loadDiensten();
  renderKappers();
  renderDiensten();
  renderProgressBar();
  initNavButtons();
  initCalendar();
});

// ─── Data loading ───────────────────────────────────────────
async function loadKappers() {
  try {
    const snap = await getDocs(collection(db, 'kappers'));
    if (!snap.empty) {
      state.kappers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      state.kappers = PLACEHOLDER_KAPPERS;
    }
  } catch {
    state.kappers = PLACEHOLDER_KAPPERS;
  }
}

async function loadDiensten() {
  try {
    const snap = await getDocs(collection(db, 'services'));
    if (!snap.empty) {
      state.diensten = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      state.diensten = PLACEHOLDER_DIENSTEN;
    }
  } catch {
    state.diensten = PLACEHOLDER_DIENSTEN;
  }
}

async function loadBoekingen(kapperId, dateStr) {
  state.bookedSlots = [];
  state.blockedSlots = [];
  try {
    const [bookSnap, blockSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'appointments'),
        where('kapperId', '==', kapperId),
        where('date', '==', dateStr),
        where('status', '==', 'confirmed')
      )),
      getDocs(query(
        collection(db, 'blockedSlots'),
        where('kapperId', '==', kapperId),
        where('date', '==', dateStr)
      ))
    ]);
    state.bookedSlots  = bookSnap.docs.map(d => d.data().time);
    state.blockedSlots = blockSnap.docs.map(d => d.data().time);
  } catch (err) {
    console.warn('Kon boekingen niet laden:', err);
  }
}

// ─── Render helpers ─────────────────────────────────────────
function renderKappers() {
  const grid = document.getElementById('kappers-grid');
  if (!grid) return;
  grid.innerHTML = state.kappers.map(k => `
    <div class="kapper-card ${k.active ? '' : 'disabled'}"
         data-id="${k.id}"
         ${!k.active ? 'title="Momenteel niet beschikbaar"' : ''}
         onclick="${k.active ? `selectKapper('${k.id}')` : ''}">
      <img src="${k.photo}" alt="${k.name}" class="kapper-photo" loading="lazy">
      <div class="kapper-name">${k.name}</div>
      <span class="kapper-role">${k.role}</span>
    </div>
  `).join('');
}

function renderDiensten() {
  const grid = document.getElementById('diensten-select-grid');
  if (!grid) return;
  grid.innerHTML = state.diensten.map(d => `
    <div class="dienst-select-card" data-id="${d.id}" onclick="selectDienst('${d.id}')">
      <div class="dienst-select-info">
        <h4>${d.name}</h4>
        <span>⏱ ${d.duration} min</span>
      </div>
      <div class="dienst-select-price">€${d.price}</div>
    </div>
  `).join('');
}

function renderProgressBar() {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((s, i) => {
    const n = i + 1;
    s.classList.remove('active', 'done');
    if (n < state.currentStep)      s.classList.add('done');
    else if (n === state.currentStep) s.classList.add('active');
  });
}

// ─── Step navigation ─────────────────────────────────────────
function initNavButtons() {
  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => goToStep(state.currentStep - 1));
  });
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateCurrentStep()) goToStep(state.currentStep + 1);
    });
  });

  document.getElementById('btn-submit')?.addEventListener('click', submitBooking);
}

function validateCurrentStep() {
  switch (state.currentStep) {
    case 1:
      if (!state.selectedKapper) { showToast('Kies eerst een kapper.', 'error'); return false; }
      return true;
    case 2:
      if (!state.selectedDienst) { showToast('Kies eerst een dienst.', 'error'); return false; }
      return true;
    case 3:
      if (!state.selectedDate) { showToast('Kies eerst een datum.', 'error'); return false; }
      if (!state.selectedSlot) { showToast('Kies eerst een tijdslot.', 'error'); return false; }
      return true;
    case 4:
      return validateForm();
    default:
      return true;
  }
}

function validateForm() {
  const naam  = document.getElementById('f-naam')?.value.trim();
  const email = document.getElementById('f-email')?.value.trim();
  const tel   = document.getElementById('f-tel')?.value.trim();
  const priv  = document.getElementById('f-privacy')?.checked;

  if (!naam)  { showToast('Vul je naam in.', 'error'); return false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Vul een geldig e-mailadres in.', 'error'); return false;
  }
  if (!tel)   { showToast('Vul je telefoonnummer in.', 'error'); return false; }
  if (!priv)  { showToast('Ga akkoord met de privacyverklaring.', 'error'); return false; }
  return true;
}

function goToStep(step) {
  if (step < 1 || step > state.totalSteps) return;

  // Verberg huidig step
  document.querySelector(`.booking-step[data-step="${state.currentStep}"]`)?.classList.remove('active');

  state.currentStep = step;

  // Toon nieuw step
  document.querySelector(`.booking-step[data-step="${step}"]`)?.classList.add('active');

  if (step === 5) renderSummary();
  renderProgressBar();

  // Scroll naar boekingsblok
  document.getElementById('boeken')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Selecties ───────────────────────────────────────────────
window.selectKapper = function(id) {
  state.selectedKapper = state.kappers.find(k => k.id === id) || null;
  document.querySelectorAll('.kapper-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });
};

window.selectDienst = function(id) {
  state.selectedDienst = state.diensten.find(d => d.id === id) || null;
  document.querySelectorAll('.dienst-select-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });
};

// ─── Kalender ────────────────────────────────────────────────
function initCalendar() {
  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');

  prevBtn?.addEventListener('click', () => {
    state.calMonth--;
    if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCalendar();
  });
  nextBtn?.addEventListener('click', () => {
    state.calMonth++;
    if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCalendar();
  });

  renderCalendar();
}

function renderCalendar() {
  const monthLabel = document.getElementById('cal-month-label');
  const grid       = document.getElementById('cal-grid');
  if (!grid) return;

  const months = ['Januari','Februari','Maart','April','Mei','Juni',
                  'Juli','Augustus','September','Oktober','November','December'];
  monthLabel.textContent = `${months[state.calMonth]} ${state.calYear}`;

  const today    = new Date();
  today.setHours(0,0,0,0);
  const firstDay = new Date(state.calYear, state.calMonth, 1);
  const lastDay  = new Date(state.calYear, state.calMonth + 1, 0);
  let startDow = firstDay.getDay(); // 0=sun
  // Maak ma=0
  startDow = (startDow + 6) % 7;

  let html = '';
  // Lege cellen voor begin
  for (let i = 0; i < startDow; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(state.calYear, state.calMonth, d);
    const dow  = date.getDay(); // 0=sun
    const isPast     = date < today;
    const isToday    = date.getTime() === today.getTime();
    const isWorkday  = WORKING_DAYS.includes(dow);
    const dateStr    = formatDate(date);
    const isSelected = state.selectedDate === dateStr;

    let cls = 'cal-day';
    if (isPast || !isWorkday)    cls += ' past';
    if (isToday)                 cls += ' today';
    if (isSelected)              cls += ' selected';

    const clickable = !isPast && isWorkday;
    html += `<div class="${cls}" ${clickable ? `onclick="selectDate('${dateStr}')"` : ''}>${d}</div>`;
  }

  grid.innerHTML = html;
}

window.selectDate = async function(dateStr) {
  state.selectedDate = dateStr;
  state.selectedSlot = null;
  renderCalendar();

  const slotsWrap = document.getElementById('slots-wrap');
  if (slotsWrap) {
    slotsWrap.innerHTML = '<div class="slots-empty"><div class="loader"><span></span><span></span><span></span></div></div>';
  }

  if (state.selectedKapper) {
    await loadBoekingen(state.selectedKapper.id, dateStr);
  }
  renderSlots();
};

function renderSlots() {
  const wrap = document.getElementById('slots-wrap');
  if (!wrap) return;

  if (!state.selectedDate) {
    wrap.innerHTML = '<div class="slots-empty">Kies eerst een datum.</div>';
    return;
  }

  const slots = generateSlots(WORKING_HOURS.start, WORKING_HOURS.end, SLOT_DURATION_MIN);
  if (!slots.length) {
    wrap.innerHTML = '<div class="slots-empty">Geen slots beschikbaar.</div>';
    return;
  }

  wrap.innerHTML = `<div class="slots-grid">${
    slots.map(t => {
      const isBooked  = state.bookedSlots.includes(t);
      const isBlocked = state.blockedSlots.includes(t);
      const taken     = isBooked || isBlocked;
      const isSelected = state.selectedSlot === t;
      let cls = 'slot-btn';
      if (taken)       cls += isBooked ? ' booked' : ' blocked';
      if (isSelected)  cls += ' selected';
      return `<button class="${cls}" ${taken ? 'disabled' : `onclick="selectSlot('${t}')"`}>${t}</button>`;
    }).join('')
  }</div>`;
}

window.selectSlot = function(time) {
  state.selectedSlot = time;
  document.querySelectorAll('.slot-btn').forEach(b => {
    b.classList.toggle('selected', b.textContent.trim() === time);
  });
};

function generateSlots(start, end, durationMin) {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const endMin = eh * 60 + em;
  while (h * 60 + m + durationMin <= endMin) {
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    m += durationMin;
    if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
  }
  return slots;
}

// ─── Samenvatting ─────────────────────────────────────────────
function renderSummary() {
  const k = state.selectedKapper;
  const d = state.selectedDienst;
  const naam  = document.getElementById('f-naam')?.value.trim();
  const email = document.getElementById('f-email')?.value.trim();
  const tel   = document.getElementById('f-tel')?.value.trim();
  const nota  = document.getElementById('f-nota')?.value.trim();

  const rows = [
    ['Kapper',     k?.name || '-'],
    ['Dienst',     d?.name || '-'],
    ['Datum',      state.selectedDate ? formatDateNL(state.selectedDate) : '-'],
    ['Tijdstip',   state.selectedSlot || '-'],
    ['Duur',       d ? `${d.duration} min` : '-'],
    ['Prijs',      d ? `€${d.price}` : '-', 'gold'],
    ['Naam',       naam  || '-'],
    ['E-mail',     email || '-'],
    ['Telefoon',   tel   || '-'],
    ...(nota ? [['Opmerking', nota]] : []),
  ];

  const summaryEl = document.getElementById('booking-summary-rows');
  if (summaryEl) {
    summaryEl.innerHTML = rows.map(([label, val, cls]) =>
      `<div class="summary-row">
        <span class="summary-label">${label}</span>
        <span class="summary-value ${cls || ''}">${val}</span>
      </div>`
    ).join('');
  }
}

// ─── Boeking insturen ─────────────────────────────────────────
async function submitBooking() {
  const btn = document.getElementById('btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Even geduld…'; }

  const naam  = document.getElementById('f-naam').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const tel   = document.getElementById('f-tel').value.trim();
  const nota  = document.getElementById('f-nota')?.value.trim() || '';
  const k = state.selectedKapper;
  const d = state.selectedDienst;

  const token = generateToken();

  const booking = {
    kapperId:          k.id,
    kapperName:        k.name,
    serviceId:         d.id,
    serviceName:       d.name,
    serviceDuration:   d.duration,
    servicePrice:      d.price,
    date:              state.selectedDate,
    time:              state.selectedSlot,
    clientName:        naam,
    clientEmail:       email,
    clientPhone:       tel,
    note:              nota,
    status:            'confirmed',
    cancellationToken: token,
    createdAt:         serverTimestamp(),
  };

  try {
    await addDoc(collection(db, 'appointments'), booking);
    // Verberg booking form, toon succes
    document.querySelector('.booking-wrapper')?.classList.add('hidden');
    const success = document.getElementById('booking-success');
    if (success) {
      success.classList.add('visible');
      document.getElementById('success-name').textContent = naam;
      document.getElementById('success-details').textContent =
        `${formatDateNL(state.selectedDate)} om ${state.selectedSlot} bij ${k.name} — ${d.name}`;
    }
    showToast('Boeking bevestigd! Je ontvangt een bevestigingsmail.', 'success');
  } catch (err) {
    console.error(err);
    showToast('Er ging iets mis. Probeer opnieuw of bel ons.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Bevestig boeking'; }
  }
}

// ─── Annulering via token ─────────────────────────────────────
(async function handleCancellation() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('cancel');
  if (!token) return;

  try {
    const snap = await getDocs(query(
      collection(db, 'appointments'),
      where('cancellationToken', '==', token),
      where('status', '==', 'confirmed')
    ));
    if (snap.empty) {
      showToast('Afspraak niet gevonden of al geannuleerd.', 'error');
      return;
    }
    const docRef = snap.docs[0].ref;
    const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await updateDoc(docRef, { status: 'cancelled' });
    showToast('Je afspraak is succesvol geannuleerd.', 'success');
    // Remove token from URL
    window.history.replaceState({}, '', window.location.pathname);
  } catch (err) {
    console.error(err);
    showToast('Annuleren mislukt. Neem contact op.', 'error');
  }
})();

// ─── Hulpfuncties ─────────────────────────────────────────────
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function formatDateNL(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const days = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
  const months = ['januari','februari','maart','april','mei','juni',
                  'juli','augustus','september','oktober','november','december'];
  const date = new Date(y, m-1, d);
  return `${days[date.getDay()]} ${d} ${months[m-1]} ${y}`;
}

function generateToken() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
