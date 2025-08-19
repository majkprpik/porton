import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Profile, ProfileRole, ProfileRoles, RepairTaskComment } from '../models/data.models';
import { DataService } from './data.service';

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
    private dataService: DataService,
  ) {
    combineLatest([
      this.dataService.profiles$,
      this.dataService.profileRoles$
    ]).subscribe(([profiles, profileRoles]) => {
      this.profiles = profiles;
      this.profileRoles = profileRoles;
    });
  }

  getProfileRoleNameById(roleId: number){
    return this.profileRoles.find(role => role.id == roleId)!.name;
  }

  getProfileNameForComment(comment: RepairTaskComment){
    return this.profiles.find(profile => profile.id == comment.user_id)?.first_name;
  }

  getProfileById(profileId: string | undefined | null){
    if(!profileId) return;

    let profile = this.profiles.find(profile => profile.id == profileId);
    if(!profile) return;
    
    if(!profile?.first_name){
      profile.first_name = this.profileRoles.find(profileRole => profileRole.id == profile.role_id)?.name + ' ' + 'user'
    }

    return profile;
  }

  isHousekeeper(profileId: string | null){
    if(profileId && this.profiles.length > 0 && this.profileRoles.length > 0){
      const profile = this.profiles.find(profile => profile.id == profileId);
      const profileRole = this.profileRoles.find(profileRole => profileRole.id == profile?.role_id);
  
      return profileRole?.name == ProfileRoles.Sobarica || profileRole?.name == ProfileRoles.Terasar;
    }

    return false;
  }

  isHouseTechnician(profileId: string | null){
    if(profileId && this.profiles.length > 0 && this.profileRoles.length > 0){
      const profile = this.profiles.find(profile => profile.id == profileId);
      const profileRole = this.profileRoles.find(profileRole => profileRole.id == profile?.role_id);
  
      return profileRole?.name == ProfileRoles.KucniMajstor || profileRole?.name == ProfileRoles.Odrzavanje;
    }

    return false;
  }

  isCustomerService(profileId: string | null){
    if(profileId && this.profiles.length > 0 && this.profileRoles.length > 0){
      const profile = this.profiles.find(profile => profile.id == profileId);
      const profileRole = this.profileRoles.find(profileRole => profileRole.id == profile?.role_id);
  
      return profileRole?.name == ProfileRoles.KorisnickaSluzba;
    }

    return false;
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
