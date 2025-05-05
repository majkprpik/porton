import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WorkGroupService } from './work-group.service';
import { BehaviorSubject, catchError, from, Observable, throwError } from 'rxjs';
import { DataService, Profile } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  $staffToAdd = new BehaviorSubject<any>(null);
  $staffToRemove = new BehaviorSubject<any>(null);

  constructor(
    private supabase: SupabaseService,
    private workGroupService: WorkGroupService,
    private dataService: DataService
  ) {}

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
   * Update a profile
   * @param profile Profile to update
   * @returns Observable of updated Profile
   */
  updateProfile(profile: Profile): Observable<Profile> {
    return from(this.saveProfile(profile)).pipe(
      catchError(error => {
        console.error(`Error updating profile with ID ${profile.id}:`, error);
        return throwError(() => new Error(`Failed to update profile with ID ${profile.id}`));
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

  /**
   * Save a profile to Supabase
   * @param profile Profile to save
   * @returns Promise of saved Profile
   */
  private async saveProfile(profile: Profile): Promise<Profile> {
    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          // is_cleaning_staff: profile.is_cleaning_staff,
          // is_available: profile.is_available
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(`Error saving profile with ID ${profile.id} to Supabase:`, error);
      throw error;
    }
  }

  public async getAllProfilesByRole(role: string){
    try{
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('profiles')
        .select('*')
        .eq('role', role)

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching profiles from Supabase:', error);
      return [];
    }
  }

  public async getProfileByRepairTaskId(repairTaskId: number){
    let existingWorkGroupTask = await this.workGroupService.getWorkGroupTasksByTaskId(repairTaskId);

    if(Object.keys(existingWorkGroupTask).length > 0){
      let existingWorkGroupProfile = await this.dataService.getWorkGroupProfilesByWorkGroupId(existingWorkGroupTask.work_group_id);
      return existingWorkGroupProfile[0].profile_id;
    }
    
    return "";
  }
}
