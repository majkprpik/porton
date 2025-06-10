import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, catchError, from, Observable, throwError } from 'rxjs';
import { DataService, Profile, ProfileRole } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  $staffToAdd = new BehaviorSubject<any>(null);
  $staffToRemove = new BehaviorSubject<any>(null);
  $profileForLocalStorage = new BehaviorSubject<any>(null);
  $profileModalData = new BehaviorSubject<any>(null);
  profiles: Profile[] = [];
  profileRoles: ProfileRole[] = [];

  translationMap: { [key: string]: string } = {
    "Uprava": "Management",
    "Savjetnik uprave": "Management consultant",
    "Voditelj recepcije": "Reception manager",
    "Recepcija": "Reception",
    "Voditelj kampa": "Camp manager",
    "Voditelj domacinstva": "Household manager",
    "Sobarica": "Housekeeper",
    "Odrzavanje": "Maintenance",
    "Prodaja": "Sales",
    "Terasar": "Deck maintenance",
    "Kucni majstor": "House technician",
    "Nocna recepcija": "Night reception",
    "Korisnicka sluzba": "Customer service",
    "Ostalo": "Other"
  };

  constructor(
    private supabase: SupabaseService,
    private dataService: DataService
  ) {
    this.dataService.profiles$.subscribe(profiles => {
      this.profiles = profiles;
    }); 

    this.dataService.profileRoles$.subscribe(profileRole => {
      this.profileRoles = profileRole;
    });
  }

  findProfile(profileId: string){
    let foundUser = this.profiles.find(profile => profile.id == profileId);
    
    if(foundUser && !foundUser?.first_name){
      foundUser.first_name = this.profileRoles.find(profileRole => profileRole.id == foundUser.role_id)?.name + ' ' + 'user'
    }

    return foundUser
  }

  isHousekeeperOrHouseTechnician(profileId: string | null){
    if(profileId){
      const profile =  this.profiles.find(profile => profile.id == profileId);
      const profileRole = this.profileRoles.find(profileRole => profileRole.id == profile?.role_id);
  
      return profileRole?.name == 'Sobarica' || profileRole?.name == 'Kucni majstor';
    }

    return false;
  }

  /**
   * Get all profiles
   * @returns Observable of Profile array
   */
  getProfiles(): Observable<Profile[]> {
    return from(this.fetchProfiles()).pipe(
      catchError(error => {
        console.error('Error fetching profiles:', error);
        return throwError(() => new Error('Failed to fetch profiles'));
      })
    );
  }

  /**
   * Get a profile by ID
   * @param id Profile ID
   * @returns Observable of Profile
   */
  getProfileById(id: string): Observable<Profile> {
    return from(this.fetchProfileById(id)).pipe(
      catchError(error => {
        console.error(`Error fetching profile with ID ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch profile with ID ${id}`));
      })
    );
  }

  /**
   * Fetch all profiles from Supabase
   * @returns Promise of Profile array
   */
  private async fetchProfiles(): Promise<Profile[]> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching profiles from Supabase:', error);
      throw error;
    }
  }

  /**
   * Fetch a profile by ID from Supabase
   * @param id Profile ID
   * @returns Promise of Profile
   */
  public async fetchProfileById(id: string): Promise<Profile> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(`Error fetching profile with ID ${id} from Supabase:`, error);
      throw error;
    }
  }

  async deleteProfile(profileId: string){
    try {
      const { error } = await this.supabase.getClient()
        .schema('porton')
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting profile with ID ${profileId} to Supabase:`, error);
      return false;
    }
  }

  async setProfilePassword(profileId: string, password: string){
      try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('profiles')
        .update({
          password: password
        })
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(`Error setting password for profile ID ${profileId} to Supabase:`, error);
      throw error;
    }
  }
}
