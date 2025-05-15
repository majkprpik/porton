import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {  
  private readonly STORAGE_KEY = 'username';
  private usernameSubject = new BehaviorSubject<string | null>(this.getStoredUsername());
  public userProfile = new BehaviorSubject<any>({});

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private profileService: ProfileService
  ) {
    // this.initializeTestUsers();
    // this.createRealUsers();
  }

  private async initializeTestUsers(): Promise<void> {
    try {
      await this.createTestUsers();
      console.log('Test users initialization completed');
    } catch (error) {
      console.error('Failed to initialize test users:', error);
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      if (data.user) {
        localStorage.setItem(this.STORAGE_KEY, email);
        localStorage.setItem('profileId', data.user.id)
        this.usernameSubject.next(email);
        this.userProfile.next(await this.profileService.fetchProfileById(data.user.id));
        // save to local storage
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile.value));
        console.log('userProfile', this.userProfile.value);
        // Wait for navigation to complete
        // TODO VEDRAN: if user without home than go to tasks(?)
        await this.router.navigate(['/home']);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabaseService.getClient().auth.signOut();
      localStorage.removeItem(this.STORAGE_KEY);
      this.usernameSubject.next(null);
      this.userProfile.next(null);
      // Wait for navigation to complete
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation to login even if signOut fails
      await this.router.navigate(['/auth/login']);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getStoredUsername();
  }

  getStoredUsername(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  getStoredUserId(){
    return localStorage.getItem('profileId');
  }

  getUsername() {
    return this.usernameSubject.asObservable();
  }

  /**
   * Creates 10 test users in the application
   * @returns Promise that resolves to an array of created user IDs or null if operation failed
   */
  async createTestUsers(): Promise<string[] | null> {
    try {
      const userIds: string[] = [];
      
      // In a real application, you would typically create users through a secure backend API
      // This is a simplified version for demonstration purposes
      for (let i = 1; i <= 10; i++) {
        const email = `vedran${i}@gmail.com`;
        
        // Using signUp instead of admin.createUser which requires admin privileges
        const { data, error } = await this.supabaseService.getClient().auth.signUp({
          email: email,
          password: 'test123', // More secure password
          options: {
            data: {
              display_name: `User ${i}`,
              role: i <= 2 ? 'admin' : 'user' // First two users are admins
            }
          }
        });
        
        if (error) {
          console.error(`Error creating user ${i}:`, error);
          continue;
        }
        
        if (data.user) {
          userIds.push(data.user.id);
          console.log(`Created user: ${email}`);
        }
      }
      
      return userIds.length > 0 ? userIds : null;
    } catch (error) {
      console.error('Error creating test users:', error);
      return null;
    }
  }

  // za majstora zadaci
  // odlasci/dolasci - vide svi? ureduje recepcija, matej, customer service
  // pregled - svi mogu videti
    

  async createRealUsers(): Promise<string[] | null> {
    const users = [
      { name: 'Matej Adrić', role: 'voditelj_kampa', password: 'NzW3dj' }, // rezervacije(unos), dnevni list
      { name: 'Marko Sovulj', role: 'savjetnik_uprave', password: 'uNgVn1' }, // rezervacije, 
      { name: 'Mirela Dronjić', role: 'voditelj_recepcije', password: '2Az84E' }, // rezervacije(unos)
      { name: 'Elena Rudan', role: 'prodaja', password: 't3Wd6N' }, // rezervacije(unos)
      { name: 'Simona Gjeorgievska', role: 'prodaja', password: 'u2Xe7P' }, // rezervacije(unos)
      { name: 'Mia Lukić', role: 'voditelj_domacinstva', password: 'v1Yf8Q' }, // rezervacije, dnevni list
      { name: 'Mila Malivuk', role: 'recepcija', password: 'aYqv9A' }, // rezervacije
      { name: 'Ana Perak', role: 'recepcija', password: 'p9Xm2K' }, // rezervacije
      { name: 'Mina Cvejić', role: 'recepcija', password: 'k8DN4U' }, // rezervacije
      { name: 'Mauro Boljunčić', role: 'kucni_majstor', password: 'f2Ip8A' }, // pregled, zadaci, 
      { name: 'Damir Zaharija', role: 'customer_service', password: 'r7Yb5L' },
      { name: 'Ivica Nagel', role: 'nocni_recepcioner', password: 's4Vc8M' },
      { name: 'Liudmyla Babii', role: 'sobarica', password: 'w5Zg9R' },
      { name: 'Iryna Kara', role: 'sobarica', password: 'x4Ah0S' },
      { name: 'Tetiana Leonenko', role: 'sobarica', password: 'y3Bi1T' },
      { name: 'Iuliia Myronova', role: 'sobarica', password: 'z2Cj2U' },
      { name: 'Jasenka Savković Cvet', role: 'sobarica', password: 'a1Dk3V' },
      { name: 'Nataliia Vladimyrova', role: 'sobarica', password: 'b6El4W' },
      { name: 'Slavica Petković', role: 'sobarica', password: 'c5Fm5X' },
      { name: 'Jelena Kaluđer', role: 'sobarica', password: 'd4Gn6Y' },
      { name: 'Sandi Maružin', role: 'terase', password: 'e3Ho7Z' },
      { name: 'Đani Guštin', role: 'kucni_majstor', password: 'g1Jq9B' },
      { name: 'Dražen Pendeš', role: 'kucni_majstor', password: 'h5Kr0C' },
      { name: 'Ivo Pranjić', role: 'odrzavanje', password: 'i4Ls1D' },
      { name: 'Daniel Begzić', role: 'odrzavanje', password: 'j3Mt2E' },
    ];
  
    const normalizeEmail = (name: string) =>
      name.toLowerCase().replace(/[^a-z0-9]/g, '').concat('@porton.com');
  
    try {
      const userIds: string[] = [];
  
      for (const user of users) {
        const email = normalizeEmail(user.name);
        
        const { data, error } = await this.supabaseService.getAdminClient().auth.admin.createUser({
          email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            display_name: user.name,
            role: user.role
          }
        });
  
        if (error) {
          console.error(`Error creating ${user.name}:`, error.message);
          continue;
        }
  
        if (data.user) {
          userIds.push(data.user.id);
          console.log(`Created: ${user.name} (${email})`);
        }
      }
  
      return userIds.length > 0 ? userIds : null;
    } catch (error) {
      console.error('Error creating users:', error);
      return null;
    }
  }
}
