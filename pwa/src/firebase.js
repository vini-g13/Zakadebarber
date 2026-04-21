// ============================================================
// FIREBASE CONFIGURATIE — zelfde project als de website
// ============================================================
import { initializeApp }   from 'firebase/app';
import { getFirestore }    from 'firebase/firestore';
import { getAuth }         from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            'JOUW_API_KEY',
  authDomain:        'JOUW_PROJECT_ID.firebaseapp.com',
  projectId:         'JOUW_PROJECT_ID',
  storageBucket:     'JOUW_PROJECT_ID.appspot.com',
  messagingSenderId: 'JOUW_SENDER_ID',
  appId:             'JOUW_APP_ID',
};

const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);

// Push notifications (optioneel — werkt enkel via HTTPS)
export let messaging = null;
isSupported().then(supported => {
  if (supported) messaging = getMessaging(app);
});
