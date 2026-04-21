import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AppointmentCard from '../components/AppointmentCard';

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getDateStrip(centerDate) {
  const days = [];
  for (let i = -3; i <= 7; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

const DOW_NL = ['Zo','Ma','Di','Wo','Do','Vr','Za'];

export default function DayView() {
  const { kapper }   = useAuth();
  const [selected, setSelected] = useState(new Date());
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  async function load(date) {
    if (!kapper) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('kapperId', '==', kapper.id),
        where('date', '==', formatDate(date)),
        orderBy('time')
      );
      const snap = await getDocs(q);
      setAppts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(selected); }, [selected, kapper]);

  const strip    = getDateStrip(selected);
  const todayStr = formatDate(new Date());

  const dateLabel = selected.toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const confirmed = appts.filter(a => a.status === 'confirmed');
  const cancelled = appts.filter(a => a.status === 'cancelled');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dagweergave</h1>
        <p>{dateLabel}</p>
      </div>

      {/* Date strip */}
      <div className="date-strip">
        {strip.map(d => {
          const ds  = formatDate(d);
          const isActive = ds === formatDate(selected);
          const isToday  = ds === todayStr;
          return (
            <button
              key={ds}
              className={`date-chip ${isActive ? 'active' : ''}`}
              onClick={() => setSelected(new Date(d))}
            >
              <span className="dow">{DOW_NL[d.getDay()]}</span>
              <span className="num" style={isToday && !isActive ? {color:'var(--gold)'} : {}}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:'2rem'}}>
          <div className="spinner" style={{margin:'0 auto'}} />
        </div>
      ) : appts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>Geen afspraken op deze dag.</p>
        </div>
      ) : (
        <>
          {confirmed.length > 0 && (
            <>
              <span className="section-label">
                {confirmed.length} {confirmed.length === 1 ? 'afspraak' : 'afspraken'}
              </span>
              {confirmed.map(a => (
                <AppointmentCard key={a.id} appt={a} onUpdate={() => load(selected)} />
              ))}
            </>
          )}
          {cancelled.length > 0 && (
            <>
              <span className="section-label" style={{marginTop:'1.5rem',color:'var(--danger)'}}>
                Geannuleerd ({cancelled.length})
              </span>
              {cancelled.map(a => (
                <AppointmentCard key={a.id} appt={a} onUpdate={() => load(selected)} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
