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
    

  async createRealUsers() {
    const users = [
      { name: 'Matej Adrić', role: 'voditelj_kampa', password: 'NzW3dj' }, // pregled, rezervacije(unos), dnevni list, timovi, profili, statusi zadataka, tipovi kucica
      { name: 'Marko Sovulj', role: 'savjetnik_uprave', password: 'uNgVn1' }, // pregled, rezervacije, dnevni list, timovi 
      { name: 'Mirela Dronjić', role: 'voditelj_recepcije', password: '2Az84E' }, // pregled, rezervacije(unos)
      { name: 'Elena Rudan', role: 'prodaja', password: 't3Wd6N' }, // pregled, rezervacije(unos)
      { name: 'Simona Gjeorgievska', role: 'prodaja', password: 'u2Xe7P' }, // pregled, rezervacije(unos)
      { name: 'Mia Lukić', role: 'voditelj_domacinstva', password: 'v1Yf8Q' }, // pregled, rezervacije, dnevni list, timovi
      { name: 'Mila Malivuk', role: 'recepcija', password: 'aYqv9A' }, // pregled, rezervacije
      { name: 'Ana Perak', role: 'recepcija', password: 'p9Xm2K' }, // pregled, rezervacije
      { name: 'Mina Cvejić', role: 'recepcija', password: 'k8DN4U' }, // pregled, rezervacije
      { name: 'Mauro Boljunčić', role: 'kucni_majstor', password: 'f2Ip8A' }, // pregled, timovi
      { name: 'Damir Zaharija', role: 'customer_service', password: 'r7Yb5L' }, //pregled
      { name: 'Ivica Nagel', role: 'nocni_recepcioner', password: 's4Vc8M' }, //pregled
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
      { name: 'Deleted User', role: 'voditelj_recepcije', password: 'test123', id: '11111111-1111-1111-1111-111111111111' },
    ];
  
    for (const user of users) {
      this.createUser(user)
    }
  }

  async createUser(newUser: UserToRegister){
    try {      
      const userPayload: any = {
        email: this.normalizeEmail(newUser.name),
        password: newUser.password,
        email_confirm: true,
        phone: '',
        user_metadata: {
          first_name: newUser.name,
          last_name: '',
          role: newUser.role
        }
      };

      if (newUser.id) {
        userPayload.id = newUser.id;
      }

      const { data, error } = await this.supabaseService
        .getAdminClient()
        .auth.admin
        .createUser(userPayload);

      if (error) throw error;

      if (data.user) {
        this.profileService.setProfilePassword(data.user.id, newUser.password);
      }
  
      return data;
    } catch (error) {
      console.error('Error creating users:', error);
      return null;
    }
  }

  normalizeEmail (name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').concat('@porton.com');
  }

  generateRandomPassword(length = 6): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    
    const allChars = uppercase + lowercase + digits;
    
    // Ensure at least one of each type
    const requiredChars = [
      this.randomChar(uppercase),
      this.randomChar(lowercase),
      this.randomChar(digits),
    ];
 
   // Fill the rest randomly
    while (requiredChars.length < length) {
      requiredChars.push(this.randomChar(allChars));
    }
 
   // Shuffle the array
    const shuffled = this.shuffleArray(requiredChars);
    
    return shuffled.join('');
  }

  randomChar(chars: string): string {
      return chars[Math.floor(Math.random() * chars.length)];
  }

  shuffleArray(array: string[]): string[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export interface UserToRegister {
  id?: string;
  normalized_email?: string;
  password: string;
  email_confirm?: boolean;
  name: string;
  role: string;
}
