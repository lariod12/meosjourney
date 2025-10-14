import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDr8rNtDwlzYyH7z-HHfTrJLFxGM42Xq8o",
  authDomain: "meosjourney.firebaseapp.com",
  projectId: "meosjourney",
  storageBucket: "meosjourney.firebasestorage.app",
  messagingSenderId: "970080094795",
  appId: "1:970080094795:web:d7f2edf9fd30d9d24fa8c4",
  measurementId: "G-V0MrThDSeM"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
