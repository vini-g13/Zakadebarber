import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AppointmentCard from '../components/AppointmentCard';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function Dashboard() {
  const { kapper }  = useAuth();
  const [appts, setAppts]   = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!kapper) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('kapperId', '==', kapper.id),
        where('date', '==', today()),
        where('status', '==', 'confirmed'),
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

  useEffect(() => { load(); }, [kapper]);

  const now     = new Date();
  const upcoming = appts.filter(a => a.time >= `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
  const past     = appts.filter(a => a.time <  `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);

  const dateLabel = now.toLocaleDateString('nl-BE', { weekday:'long', day:'numeric', month:'long' });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Goedendag, {kapper?.name || 'Kapper'} 👋</h1>
        <p>{dateLabel}</p>
      </div>

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-tile">
          <span className="num">{appts.length}</span>
          <span className="lbl">Vandaag</span>
        </div>
        <div className="stat-tile">
          <span className="num">{upcoming.length}</span>
          <span className="lbl">Nog te doen</span>
        </div>
        <div className="stat-tile">
          <span className="num">{past.length}</span>
          <span className="lbl">Afgewerkt</span>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>
          <div className="spinner" style={{margin:'0 auto'}} />
        </div>
      ) : appts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎉</div>
          <p>Geen afspraken meer vandaag. Geniet van de rust!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <span className="section-label">Komende afspraken</span>
              {upcoming.map(a => (
                <AppointmentCard key={a.id} appt={a} onUpdate={load} />
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <span className="section-label" style={{marginTop:'1.5rem'}}>Eerder vandaag</span>
              {past.map(a => (
                <AppointmentCard key={a.id} appt={a} onUpdate={load} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
