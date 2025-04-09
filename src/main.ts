import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import 'handsontable/dist/handsontable.full.min.css';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
