import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDr8rNtDwlzYyH7z-HHfTrJLFxGM42Xq8o",
  authDomain: "meosjourney.firebaseapp.com",
  projectId: "meosjourney",
  storageBucket: "meosjourney.firebasestorage.app",
  messagingSenderId: "970080094795",
  appId: "1:970080094795:web:d7f2edf9fd30d9d24fa8c4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
