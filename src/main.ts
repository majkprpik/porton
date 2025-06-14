import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import 'handsontable/dist/handsontable.full.min.css';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeHr from '@angular/common/locales/hr';

registerLocaleData(localeEn);
registerLocaleData(localeHr);
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
