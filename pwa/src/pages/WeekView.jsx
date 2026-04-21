import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // monday=0
  d.setDate(d.getDate() - diff);
  d.setHours(0,0,0,0);
  return d;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const DOW_NL = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

export default function WeekView() {
  const { kapper }   = useAuth();
  const navigate     = useNavigate();
  const [monday, setMonday] = useState(getMondayOf(new Date()));
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);

  const week = Array.from({length:7}, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  async function load() {
    if (!kapper) return;
    setLoading(true);
    const dates = week.map(formatDate);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('kapperId', '==', kapper.id),
        where('date', 'in', dates),
        where('status', '==', 'confirmed')
      );
      const snap = await getDocs(q);
      const c = {};
      snap.docs.forEach(d => {
        const date = d.data().date;
        c[date] = (c[date] || 0) + 1;
      });
      setCounts(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [monday, kapper]);

  const todayStr = formatDate(new Date());

  function prevWeek() {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    setMonday(d);
  }
  function nextWeek() {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    setMonday(d);
  }

  const weekLabel = `${monday.toLocaleDateString('nl-BE',{day:'numeric',month:'short'})} — ${week[6].toLocaleDateString('nl-BE',{day:'numeric',month:'short',year:'numeric'})}`;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Weekweergave</h1>
        <p>{weekLabel}</p>
      </div>

      {/* Week navigation */}
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem',alignItems:'center'}}>
        <button className="btn btn-ghost" onClick={prevWeek} style={{padding:'0.5rem 1rem'}}>← Vorige</button>
        <button
          className="btn btn-ghost"
          onClick={() => setMonday(getMondayOf(new Date()))}
          style={{flex:1}}
        >
          Deze week
        </button>
        <button className="btn btn-ghost" onClick={nextWeek} style={{padding:'0.5rem 1rem'}}>Volgende →</button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:'2rem'}}>
          <div className="spinner" style={{margin:'0 auto'}} />
        </div>
      ) : (
        <div className="week-grid">
          {week.map((day, i) => {
            const ds      = formatDate(day);
            const count   = counts[ds] || 0;
            const isToday = ds === todayStr;
            return (
              <div
                key={ds}
                className={`week-col${isToday ? ' today' : ''}`}
                onClick={() => navigate(`/dag?date=${ds}`)}
                style={{cursor:'pointer'}}
              >
                <div className="week-col-header">{DOW_NL[i]}</div>
                <div className="week-col-date">{day.getDate()}</div>
                {count > 0 && (
                  <div className="week-dot" title={`${count} afspraken`}>
                    {count}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly summary */}
      <div className="card" style={{marginTop:'1rem'}}>
        <span className="section-label">Week totaal</span>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'0.9rem',color:'var(--muted)'}}>Bevestigde afspraken</span>
          <span style={{fontFamily:'Playfair Display,serif',fontSize:'1.5rem',color:'var(--gold)',fontWeight:700}}>
            {Object.values(counts).reduce((a, b) => a + b, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
