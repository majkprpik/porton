import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-privacy-policy',
  imports: [
    TranslateModule
  ],
  template: `
    <div class="privacy-policy-container">
      <div class="header">
        <h1>
          {{ 'PRIVACY-POLICY.TITLE' | translate }}
        </h1>
      </div>
      <div class="text">
        {{ 'PRIVACY-POLICY.TEXT' | translate }} <b>vedran.prpic1&#64;gmail.com</b> 
      </div>
    </div>
  `,
  styles: `
    .privacy-policy-container{
      height: 90vh;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-sizing: border-box;
      margin: 20px;
      padding: 20px;
      overflow-y: auto;

      .header{
        width: 100%;
      }
    }

    .text{
      height: 87%;
      overflow-y: auto;
    }
  `
})
export class PrivacyPolicyComponent {

}
