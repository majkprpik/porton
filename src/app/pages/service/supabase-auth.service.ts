import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {  
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl as string,
      environment.supabaseServiceKey as string
    );

    this.createUsers();
  }

  async createUsers() {
    const users = [
      { email: 'matej@porton.hr', password: 'password123', role: 'manager' },
      // Set default roles for other users
      { email: 'cleaning1@porton.hr', password: 'password123', role: 'cleaning'},
      { email: 'cleaning2@porton.hr', password: 'password123', role: 'cleaning'},
      // ... other cleaning users with role: 'cleaning'
      
      { email: 'repair1@porton.hr', password: 'password123', role: 'repair'},
      { email: 'repair2@porton.hr', password: 'password123', role: 'repair'},
      // ... other repair users with role: 'repair'
      
      { email: 'reception1@porton.hr', password: 'password123', role: 'reception'},
      { email: 'reception2@porton.hr', password: 'password123', role: 'reception'},
    ];

    for (const user of users) {
      try {
        const { data, error } = await this.supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (error) {
          console.error(`Failed to create user ${user.email}:`, error.message);
          continue;
        }

        console.log(`Created user ${user.email} with ID: ${data.user?.id}`);

        // Insert user role into profiles table
        // const { error: profileError } = await this.supabase
        //   .from('profiles')
        //   .insert({
        //     id: data.user?.id,
        //     role: user.role,
        //     email: user.email,  // Add email if it's required
        //     updated_at: new Date().toISOString()  // Add timestamp if it's required
        //   });

        // if (profileError) {
        //   console.error(`Failed to create profile for ${user.email}:`, profileError.message);
        // }
      } catch (err) {
        console.error(`Unexpected error for ${user.email}:`, err);
      }
    }
  }
}
