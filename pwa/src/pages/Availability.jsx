import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, getDocs,
  addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const SLOTS = (() => {
  const s = [];
  for (let h = 9; h < 19; h++) {
    for (const m of [0, 30]) {
      s.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  return s;
})();

export default function Availability() {
  const { kapper }  = useAuth();
  const [date,      setDate]    = useState(formatDate(new Date()));
  const [blocks,    setBlocks]  = useState([]);
  const [newTime,   setNewTime] = useState('');
  const [newReason, setNewReason] = useState('');
  const [loading,   setLoading] = useState(false);

  async function load() {
    if (!kapper) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'blockedSlots'),
        where('kapperId', '==', kapper.id),
        where('date', '==', date)
      );
      const snap = await getDocs(q);
      setBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [date, kapper]);

  async function handleBlock() {
    if (!newTime) return alert('Kies een tijdslot.');
    setLoading(true);
    try {
      await addDoc(collection(db, 'blockedSlots'), {
        kapperId:  kapper.id,
        kapperName: kapper.name,
        date,
        time:      newTime,
        reason:    newReason || 'Geblokkeerd',
        createdAt: serverTimestamp(),
      });
      setNewTime('');
      setNewReason('');
      load();
    } catch (err) {
      alert('Fout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblock(blockId) {
    if (!window.confirm('Blokkering verwijderen?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'blockedSlots', blockId));
      load();
    } catch (err) {
      alert('Fout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const blockedTimes = blocks.map(b => b.time);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Beschikbaarheid</h1>
        <p>Blokkeer tijdslots — pauze, vakantie, ziek…</p>
      </div>

      {/* Datum kiezen */}
      <div className="form-group">
        <label>Datum</label>
        <input
          type="date"
          value={date}
          min={formatDate(new Date())}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* Blok toevoegen */}
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <span className="section-label">Tijdslot blokkeren</span>
        <div className="form-group">
          <label>Tijdslot</label>
          <select value={newTime} onChange={e => setNewTime(e.target.value)}>
            <option value="">— kies een slot —</option>
            {SLOTS.filter(s => !blockedTimes.includes(s)).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Reden (optioneel)</label>
          <input
            type="text"
            value={newReason}
            onChange={e => setNewReason(e.target.value)}
            placeholder="Bv. Lunchpauze, Vakantie, Ziek…"
          />
        </div>
        <button className="btn btn-danger btn-full" onClick={handleBlock} disabled={loading}>
          🔒 Blokkeer slot
        </button>
      </div>

      {/* Geblokkeerde slots */}
      <span className="section-label">
        Geblokkeerde slots op {new Date(date + 'T12:00').toLocaleDateString('nl-BE',{weekday:'long',day:'numeric',month:'long'})}
      </span>

      {loading ? (
        <div style={{textAlign:'center',padding:'1.5rem'}}>
          <div className="spinner" style={{margin:'0 auto'}} />
        </div>
      ) : blocks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <p>Alle slots zijn beschikbaar op deze dag.</p>
        </div>
      ) : (
        <div className="blocked-list">
          {blocks.sort((a,b) => a.time.localeCompare(b.time)).map(b => (
            <div className="blocked-item" key={b.id}>
              <div>
                <span className="blocked-time">{b.time}</span>
                <span className="blocked-reason"> — {b.reason}</span>
              </div>
              <button className="btn-unblock" onClick={() => handleUnblock(b.id)}>
                ✕ Vrijgeven
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
