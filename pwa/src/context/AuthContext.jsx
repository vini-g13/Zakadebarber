import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [kapper,  setKapper]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Laad kapper-profiel uit Firestore
        const ref = doc(db, 'kappers', firebaseUser.uid);
        const snap = await getDoc(ref);
        setKapper(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } else {
        setUser(null);
        setKapper(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const ref  = doc(db, 'kappers', cred.user.uid);
    const snap = await getDoc(ref);
    setKapper(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setKapper(null);
  }

  return (
    <AuthContext.Provider value={{ user, kapper, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
