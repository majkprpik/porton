import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import 'handsontable/dist/handsontable.full.min.css';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeHr from '@angular/common/locales/hr';
import { environment } from './environments/environment';
import './app/firebase/firebase.init';

registerLocaleData(localeEn);
registerLocaleData(localeHr);

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
  ],
}).catch((err) => console.error(err));

if ('serviceWorker' in navigator && environment.production) {
  navigator.serviceWorker.register('ngsw-worker.js')
    .then(() => {
      console.log('Angular service worker registered');
      return navigator.serviceWorker.register('firebase-messaging-sw.js');
    })
    .then(() => console.log('Firebase Messaging SW registered'))
    .catch(err => console.error('SW registration failed:', err));
}