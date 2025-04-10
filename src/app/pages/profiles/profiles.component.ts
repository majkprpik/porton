import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';
import { Profile } from '../service/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profiles',
  imports: [CommonModule],
  template: `
    <h1>Profile Management</h1>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let profile of profiles">
          <td>{{ profile.first_name }}</td>
          <td>{{ profile.phone_number }}</td>
          <td>{{ profile.role }}</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [
    `table { width: 100%; border-collapse: collapse; }
     th, td { border: 1px solid #ddd; padding: 8px; }
     th { background-color: #f4f4f4; }
    `
  ]
})
export class ProfilesComponent implements OnInit {
  profiles: Profile[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.profiles$.subscribe(profiles => {
      this.profiles = profiles;
    });
  }
}
