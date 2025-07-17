import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import 'handsontable/dist/handsontable.full.min.css';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeHr from '@angular/common/locales/hr';
import './app/firebase/firebase.init';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { environment } from './environments/environment';

const firebaseConfig = {
  apiKey: environment.firebaseApiKey,
  authDomain: environment.firebaseAuthDomain,
  projectId: environment.firebaseProjectId,
  storageBucket: environment.firebaseStorageBucket,
  messagingSenderId: environment.firebaseMessagingSenderId,
  appId: environment.firebaseAppId,
  measurementId: environment.firebaseMeasurementId,
};

registerLocaleData(localeEn);
registerLocaleData(localeHr);

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideMessaging(() => getMessaging()),
  ],
}).catch((err) => console.error(err));

if ('serviceWorker' in navigator && environment.production) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(() => console.log('✅ Firebase Messaging SW registered'))
    .catch(err => console.error('🚫 SW registration failed:', err));
}