import { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AppointmentCard({ appt, onUpdate }) {
  const [showMove, setShowMove] = useState(false);
  const [moveTime, setMoveTime] = useState('');
  const [note,     setNote]     = useState(appt.note || '');
  const [loading,  setLoading]  = useState(false);

  async function handleCancel() {
    if (!window.confirm(`Afspraak van ${appt.clientName} annuleren?`)) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', appt.id), { status: 'cancelled' });
      onUpdate?.();
    } catch (err) {
      alert('Annuleren mislukt: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMove() {
    if (!moveTime) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', appt.id), { time: moveTime });
      setShowMove(false);
      onUpdate?.();
    } catch (err) {
      alert('Verplaatsen mislukt: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote() {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', appt.id), { internalNote: note });
      alert('Notitie opgeslagen.');
    } catch (err) {
      alert('Fout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const cancelled = appt.status === 'cancelled';

  return (
    <div className={`appt-card ${cancelled ? 'cancelled' : ''}`}>
      <div className="appt-time">
        <span className="hour">{appt.time}</span>
        <span className="ampm">{appt.serviceDuration}min</span>
      </div>
      <div className="appt-info">
        <div className="appt-client">
          {appt.clientName}
          {cancelled && <span style={{color:'var(--danger)',fontSize:'0.75rem',marginLeft:'0.5rem'}}> (geannuleerd)</span>}
        </div>
        <div className="appt-service">
          {appt.serviceName}
          {appt.note && <span style={{marginLeft:'0.5rem',color:'var(--warning)'}}>💬</span>}
        </div>
        {!cancelled && (
          <div className="appt-actions">
            <a href={`tel:${appt.clientPhone}`} className="appt-tel">
              📞 {appt.clientPhone}
            </a>
            <button className="appt-btn" onClick={() => setShowMove(!showMove)} disabled={loading}>
              🔄 Verplaats
            </button>
            <button className="appt-btn danger" onClick={handleCancel} disabled={loading}>
              ✕ Annuleer
            </button>
          </div>
        )}

        {/* Verplaats form */}
        {showMove && !cancelled && (
          <div style={{marginTop:'0.75rem', display:'flex', gap:'0.5rem', alignItems:'center'}}>
            <input
              type="time"
              value={moveTime}
              onChange={e => setMoveTime(e.target.value)}
              style={{
                background:'var(--surface)',border:'1px solid var(--border)',
                color:'var(--text)',borderRadius:'6px',padding:'0.4rem 0.5rem',
                fontFamily:'inherit',fontSize:'0.88rem'
              }}
            />
            <button className="btn btn-primary" style={{padding:'0.4rem 1rem',fontSize:'0.82rem'}} onClick={handleMove} disabled={loading}>
              OK
            </button>
          </div>
        )}

        {/* Interne notitie */}
        {!cancelled && (
          <div style={{marginTop:'0.75rem'}}>
            <input
              type="text"
              placeholder="Interne notitie (niet zichtbaar voor klant)…"
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={handleSaveNote}
              style={{
                width:'100%',background:'var(--surface)',border:'1px solid var(--border)',
                borderRadius:'6px',padding:'0.4rem 0.75rem',color:'var(--text)',
                fontFamily:'inherit',fontSize:'0.82rem'
              }}
            />
          </div>
        )}

        {/* Klantopmerking */}
        {appt.note && (
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--muted)',fontStyle:'italic'}}>
            💬 "{appt.note}"
          </div>
        )}
      </div>
    </div>
  );
}
