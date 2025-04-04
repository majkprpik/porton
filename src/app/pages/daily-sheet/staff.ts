import { Component } from '@angular/core';
import { StaffGroups } from './staff-groups';

@Component({
  selector: 'app-staff',
  imports: [StaffGroups],
  template: `
    <app-staff-groups></app-staff-groups>
  `,
  styles: ``
})
export class StaffComponent {

} 