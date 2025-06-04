import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTydRl3H4QRltinhOFs-jRWiXEkHVcKwA",
  authDomain: "ems-angular-ems278.firebaseapp.com",
  projectId: "ems-angular-ems278",
  storageBucket: "ems-angular-ems278.firebasestorage.app",
  messagingSenderId: "320591789548",
  appId: "1:320591789548:web:5e688b2a71fb173a9b94c9"
};


export const appConfig: ApplicationConfig = {

  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(()=>getFirestore()),
    provideAuth(() => getAuth()),
    provideFirebaseApp(() => initializeApp(firebaseConfig))]
};
