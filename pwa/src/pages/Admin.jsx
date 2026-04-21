import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection, getDocs, updateDoc, doc,
  addDoc, serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { kapper: me } = useAuth();
  const [kappers,   setKappers]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);

  // New kapper form
  const [newName,  setNewName]  = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [newRole,  setNewRole]  = useState('vast');

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'kappers'));
      setKappers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(kapperId, current) {
    await updateDoc(doc(db, 'kappers', kapperId), { active: !current });
    setKappers(prev => prev.map(k => k.id === kapperId ? { ...k, active: !current } : k));
  }

  async function handleAddKapper(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Maak Firebase Auth account aan
      const cred = await createUserWithEmailAndPassword(auth, newEmail, newPass);
      // Voeg kapper toe aan Firestore
      await addDoc(collection(db, 'kappers'), {
        uid:       cred.user.uid,
        name:      newName,
        email:     newEmail,
        role:      newRole,
        type:      newRole,
        active:    true,
        photo:     `https://picsum.photos/seed/${newName.toLowerCase()}/200/200`,
        createdAt: serverTimestamp(),
      });
      setShowAdd(false);
      setNewName(''); setNewEmail(''); setNewPass(''); setNewRole('vast');
      load();
      alert(`Kapper ${newName} toegevoegd!`);
    } catch (err) {
      alert('Fout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Beheer kappers en instellingen</p>
      </div>

      {/* Kappers overzicht */}
      <span className="section-label">Kappers ({kappers.length})</span>

      {loading ? (
        <div style={{textAlign:'center',padding:'1.5rem'}}>
          <div className="spinner" style={{margin:'0 auto'}} />
        </div>
      ) : (
        kappers.map(k => (
          <div className="kapper-admin-card" key={k.id}>
            <img
              src={k.photo || `https://picsum.photos/seed/${k.name}/200/200`}
              alt={k.name}
              className="kapper-admin-photo"
            />
            <div className="kapper-admin-info">
              <div className="kapper-admin-name">{k.name}</div>
              <div className="kapper-admin-role">
                {k.role || k.type}
                {k.id === me?.id && ' (jij)'}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.3rem'}}>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={k.active}
                  onChange={() => toggleActive(k.id, k.active)}
                />
                <span className="toggle-slider" />
              </label>
              <span style={{fontSize:'0.68rem',color:'var(--muted)'}}>
                {k.active ? 'Actief' : 'Inactief'}
              </span>
            </div>
          </div>
        ))
      )}

      {/* Kapper toevoegen */}
      <button
        className="btn btn-outline btn-full"
        style={{marginTop:'1rem'}}
        onClick={() => setShowAdd(!showAdd)}
      >
        {showAdd ? '✕ Annuleer' : '+ Nieuwe kapper toevoegen'}
      </button>

      {showAdd && (
        <form onSubmit={handleAddKapper} style={{marginTop:'1rem'}}>
          <div className="card">
            <span className="section-label">Nieuwe kapper</span>
            <div className="form-group">
              <label>Naam</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Voornaam"
                required
              />
            </div>
            <div className="form-group">
              <label>E-mailadres (login)</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="kapper@zakadebarber.be"
                required
              />
            </div>
            <div className="form-group">
              <label>Tijdelijk wachtwoord</label>
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Min. 8 tekens"
                minLength={8}
                required
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="vast">Vaste kracht</option>
                <option value="stagiair">Stagiair</option>
                <option value="jobstudent">Jobstudent</option>
                <option value="admin">Admin (zaakvoerder)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Aanmaken…' : 'Kapper aanmaken'}
            </button>
          </div>
        </form>
      )}

      {/* Info */}
      <div className="card" style={{marginTop:'1.5rem',borderColor:'rgba(201,168,76,0.3)'}}>
        <span className="section-label">💡 Tip: Jobstudent activeren</span>
        <p style={{fontSize:'0.85rem',color:'var(--muted)',lineHeight:1.6}}>
          Schakel de jobstudent (Samy) in of uit met de toggle. Enkel wanneer actief is hij zichtbaar en boekbaar op de website.
          Zet hem aan tijdens schoolvakanties en uit daarna.
        </p>
      </div>
    </div>
  );
}
