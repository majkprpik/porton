import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  BehaviorSubject,
  Observable,
  throwError,
  from,
  map,
  catchError,
  tap,
  combineLatest,
  of,
} from 'rxjs';

// Interfaces for enum types
export interface HouseAvailabilityType {
  house_availability_type_id: number;
  house_availability_type_name: string;
}

export interface TaskType {
  task_type_id: number;
  task_type_name: string;
}

export interface TaskProgressType {
  task_progress_type_id: number;
  task_progress_type_name: string;
}

export interface HouseType {
  house_type_id: number;
  house_type_name: string;
}

// Interface for houses
export interface House {
  house_id: number;
  house_number: number;
  house_name: string;
  house_type_id: number;
}

// Interface for profiles
export interface Profile {
  id: string; // uuid
  role_id: number | null;
  first_name: string | null;
  last_name: string | null;
  phone_number?: string | null;
  created_at?: string | null;
  password?: string;
}

// Interface for work groups and related entities
export interface WorkGroup {
  work_group_id: number;
  created_at: string;
  is_locked: boolean;
  is_repair: boolean;
}

export interface LockedTeam {
  id: string;
  name: string;
  members: Profile[];
  homes?: House[];
  tasks?: Task[];
  isLocked?: boolean;
  isPublished?: boolean;
}

export interface WorkGroupProfile {
  work_group_id: number;
  profile_id: string; // uuid
}

export interface WorkGroupTask {
  work_group_id: number;
  task_id: number;
  index: number;
}

// Interface for tasks
export interface Task {
  task_id: number;
  task_type_id: number;
  task_progress_type_id: number;
  house_id: number;
  house_number: number;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  index: number; 
  is_unscheduled: boolean
}

// Interface for house availabilities
export interface HouseAvailability {
  house_availability_id: number;
  house_id: number;
  house_availability_type_id: number;
  house_availability_start_date: string;
  house_availability_end_date: string;
  has_arrived: boolean;
  has_departed: boolean;
  last_name: string | null;
  reservation_number: string | null;
  reservation_length: number | null;
  prev_connected: boolean;
  next_connected: boolean;
  adults: number;
  babies: number;
  cribs: number;
  dogs_d: number;
  dogs_s: number;
  dogs_b: number;
  color_theme: number;
  color_tint: number;
  note?: string | null;
  arrival_time?: any;
  departure_time?: any;
}

// Interface for house status task
export interface HouseStatusTask {
  task_id: number;
  taskt_type_id: number;
  task_type_name: string;
  task_progress_type_id: number;
  task_progress_type_name: string;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
}

// Interface for house status from view
export interface HouseStatus {
  house_id: number;
  housename: string;
  housetypeid: number;
  housetypename: string;
  availabilityid: number | null;
  availabilityname: string | null;
  housetasks: HouseStatusTask[];
}

export interface Note {
  id: string,
  profile_id: string,
  note: string,
  time_sent: string,
  for_date?: string,
}

export interface RepairTaskComment {
  id: string;
  task_id: number;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface ProfileRole{
  id: number;
  name: string;
}

export interface Language {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Debug flag
  private debug = false;
  // Schema name for all tables
  private schema = 'porton';

  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // BehaviorSubjects for enum types and data
  private houseAvailabilityTypesSubject = new BehaviorSubject<HouseAvailabilityType[]>([]);
  private taskTypesSubject = new BehaviorSubject<TaskType[]>([]);
  private taskProgressTypesSubject = new BehaviorSubject<TaskProgressType[]>([]);
  private houseTypesSubject = new BehaviorSubject<HouseType[]>([]);
  private houseAvailabilitiesSubject = new BehaviorSubject<HouseAvailability[]>([]);
  private tempHouseAvailabilitiesSubject = new BehaviorSubject<HouseAvailability[]>([]);
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private workGroupsSubject = new BehaviorSubject<WorkGroup[]>([]);
  private workGroupProfilesSubject = new BehaviorSubject<WorkGroupProfile[]>([]);
  private workGroupTasksSubject = new BehaviorSubject<WorkGroupTask[]>([]);
  private profilesSubject = new BehaviorSubject<Profile[]>([]);
  private housesSubject = new BehaviorSubject<House[]>([]);
  private tempHousesSubject = new BehaviorSubject<House[]>([]);
  private authUsersSubject = new BehaviorSubject<Profile[]>([]);
  private notesSubject = new BehaviorSubject<Note[]>([]);
  private repairTaskCommentsSubject = new BehaviorSubject<RepairTaskComment[]>([]);
  private profileRolesSubject = new BehaviorSubject<ProfileRole[]>([]);

  // Public Observables
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  houseAvailabilityTypes$ = this.houseAvailabilityTypesSubject.asObservable();
  taskTypes$ = this.taskTypesSubject.asObservable();
  taskProgressTypes$ = this.taskProgressTypesSubject.asObservable();
  houseTypes$ = this.houseTypesSubject.asObservable();
  houseAvailabilities$ = this.houseAvailabilitiesSubject.asObservable();
  tempHouseAvailabilities$ = this.tempHouseAvailabilitiesSubject.asObservable();
  tasks$ = this.tasksSubject.asObservable();
  workGroups$ = this.workGroupsSubject.asObservable();
  workGroupProfiles$ = this.workGroupProfilesSubject.asObservable();
  workGroupTasks$ = this.workGroupTasksSubject.asObservable();
  profiles$ = this.profilesSubject.asObservable();
  houses$ = this.housesSubject.asObservable();
  tempHouses$ = this.tempHousesSubject.asObservable();
  authUsers$ = this.authUsersSubject.asObservable();
  notes$ = this.notesSubject.asObservable();
  repairTaskComments$ = this.repairTaskCommentsSubject.asObservable();
  profileRoles$ = this.profileRolesSubject.asObservable();
  
  $houseAvailabilitiesUpdate = new BehaviorSubject<any>('');
  $tempHouseAvailabilitiesUpdate = new BehaviorSubject<any>('');
  $tasksUpdate = new BehaviorSubject<any>('');
  $workGroupTasksUpdate = new BehaviorSubject<any>('');
  $workGroupProfilesUpdate = new BehaviorSubject<any>('');
  $workGroupsUpdate = new BehaviorSubject<any>('');
  $notesUpdate = new BehaviorSubject<any>('');
  $repairTaskCommentsUpdate = new BehaviorSubject<any>('');
  $profilesUpdate = new BehaviorSubject<any>('');

  $areNotesLoaded = new BehaviorSubject<boolean>(false);
  $areRepairTaskCommentsLoaded = new BehaviorSubject<boolean>(false);

  constructor(private supabaseService: SupabaseService) {
    // Load all enum types when service is initialized
    this.loadAllEnumTypes();
    // Load all data
    this.loadInitialData();
    this.listenToDatabaseChanges();
  }

  setTasks(tasks: Task[]){
    if(tasks){
      this.tasksSubject.next(tasks);
    }
  }

  setWorkGroups(workGroups: WorkGroup[]){
    if(workGroups){
      this.workGroupsSubject.next(workGroups);
    }
  }

  setWorkGroupTasks(workGroupTasks: WorkGroupTask[]){
    if(workGroupTasks){
      this.workGroupTasksSubject.next(workGroupTasks);
    }
  }

  setWorkGroupProfiles(workGroupProfiles: WorkGroupProfile[]){
    if(workGroupProfiles){
      this.workGroupProfilesSubject.next(workGroupProfiles);
    }
  }

  setHouseAvailabilites(houseAvailabilties: HouseAvailability[]){
    if(houseAvailabilties){
      this.houseAvailabilitiesSubject.next(houseAvailabilties);
    }
  }

  setTempHouseAvailabilities(tempHouseAvailabilities: HouseAvailability[]){
    if(tempHouseAvailabilities){
      this.tempHouseAvailabilitiesSubject.next(tempHouseAvailabilities);
    }
  }

  setProfiles(profiles: Profile[]){
    if(profiles){
      this.profilesSubject.next(profiles.filter(profile => profile.id != '11111111-1111-1111-1111-111111111111'));
    }
  }

  setProfileRoles(profileRoles: ProfileRole[]){
    if(profileRoles){
      this.profileRolesSubject.next(profileRoles);
    }
  }

  setNotes(notes: Note[]){
    if(notes){
      this.notesSubject.next(notes);
    }
  }

  private logData(source: string, data: any): void {
    if (this.debug) {
      //console.log(`[DataService] ${source}:`, data);
    }
  }

  private handleError(error: any): Observable<never> {
    const errorMessage = error.message || 'An error occurred';
    this.errorSubject.next(errorMessage);
    if (this.debug) {
      console.error('[DataService] Error:', errorMessage);
    }
    return throwError(() => error);
  }

  // Method to load all initial data
  loadInitialData(): void {
    if (this.debug) {
      //console.log('[DataService] Loading initial data...');
    }
    // Then load other data
    this.loadHouseAvailabilities().subscribe();
    this.loadTempHouseAvailabilities().subscribe();
    this.loadTasks().subscribe();
    this.loadWorkGroups().subscribe();
    this.loadWorkGroupProfiles().subscribe();
    this.loadWorkGroupTasks().subscribe();
    this.loadProfiles().subscribe();
    this.loadProfileRoles().subscribe();
    this.loadHouses().subscribe();
    this.loadTempHouses().subscribe();
    this.loadNotes().subscribe();
    this.loadRepairTaskComments().subscribe();
    // this.loadAuthUsers().subscribe();
  }

  // Method to load all enum types at once
  private loadAllEnumTypes(): void {
    if (this.debug) {
      //console.log('[DataService] Loading enum types...');
    }
    // Load house availability types first
    this.getHouseAvailabilityTypes().subscribe();
    // Then load other enum types
    this.getTaskTypes().subscribe();
    this.getTaskProgressTypes().subscribe();
    this.getHouseTypes().subscribe();
  }

  getHouseAvailabilityTypes(): Observable<HouseAvailabilityType[]> {
    this.loadingSubject.next(true);

    if (this.houseAvailabilityTypesSubject.value.length > 0) {
      this.logData('House Availability Types (cached)', this.houseAvailabilityTypesSubject.value);
      this.loadingSubject.next(false);
      return this.houseAvailabilityTypes$;
    }

    return from(this.supabaseService.getData('house_availability_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.houseAvailabilityTypesSubject.next(data);
          this.logData('House Availability Types (loaded)', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  getTaskTypes(): Observable<TaskType[]> {
    this.loadingSubject.next(true);

    if (this.taskTypesSubject.value.length > 0) {
      this.logData('Task Types (cached)', this.taskTypesSubject.value);
      this.loadingSubject.next(false);
      return this.taskTypes$;
    }

    return from(this.supabaseService.getData('task_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.taskTypesSubject.next(data);
          this.logData('Task Types (loaded)', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  getTaskProgressTypes(): Observable<TaskProgressType[]> {
    this.loadingSubject.next(true);

    // If we already have data cached in the subject, use it
    if (this.taskProgressTypesSubject.value.length > 0) {
      this.logData('Task Progress Types (cached)', this.taskProgressTypesSubject.value);
      this.loadingSubject.next(false);
      return this.taskProgressTypes$;
    }

    // Otherwise fetch from the server
    return from(this.supabaseService.getData('task_progress_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.taskProgressTypesSubject.next(data);
          this.logData('Task Progress Types (loaded)', data);
        } else {
          console.warn('Server returned no task progress types data');
        }
      }),
      map((data) => data || []),
      catchError((error) => {
        console.error('Error fetching task progress types:', error);
        return this.handleError(error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  getHouseTypes(): Observable<HouseType[]> {
    this.loadingSubject.next(true);

    // If we already have data cached in the subject, use it
    if (this.houseTypesSubject.value.length > 0) {
      console.log('Using cached house types data');
      this.logData('House Types (cached)', this.houseTypesSubject.value);
      this.loadingSubject.next(false);
      return this.houseTypes$;
    }

    // Otherwise fetch from the server
    return from(this.supabaseService.getData('house_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.houseTypesSubject.next(data);
          this.logData('House Types (loaded)', data);
        } else {
          console.warn('Server returned no house types data');
        }
      }),
      map((data) => data || []),
      catchError((error) => {
        console.error('Error fetching house types:', error);
        return this.handleError(error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadHouseAvailabilities(): Observable<HouseAvailability[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('house_availabilities', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.houseAvailabilitiesSubject.next(data);
          this.logData('House Availabilities', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }
  
  loadTempHouseAvailabilities(): Observable<HouseAvailability[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('temp_house_availabilities', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.tempHouseAvailabilitiesSubject.next(data);
          this.logData('Temp House Availabilities', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  async loadTasksFromDb(){
    try{
      
      this.loadingSubject.next(true);
      const { data: tasks, error: tasksError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .select('*');

      if(tasksError) throw tasksError

      this.tasksSubject.next(tasks);
      this.loadingSubject.next(false)

      return tasks;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      this.loadingSubject.next(false)
      return null;
    }
  }

  loadTasks(): Observable<Task[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('tasks', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.tasksSubject.next(data);
          this.logData('Tasks', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadWorkGroups(): Observable<WorkGroup[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('work_groups', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.workGroupsSubject.next(data);
          this.logData('Work Groups', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadWorkGroupProfiles(): Observable<WorkGroupProfile[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('work_group_profiles', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.workGroupProfilesSubject.next(data);
          this.logData('Work Group Profiles', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadWorkGroupTasks(): Observable<WorkGroupTask[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('work_group_tasks', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.workGroupTasksSubject.next(data);
          this.logData('Work Group Tasks', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadProfiles(): Observable<Profile[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('profiles', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.setProfiles(data);
          this.logData('Profiles', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadProfileRoles(): Observable<ProfileRole[]> {
    this.loadingSubject.next(true);

     return from(this.supabaseService.getData('profile_roles', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.setProfileRoles(data);
          this.logData('Profile roles', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadHouses(): Observable<House[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('houses', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.housesSubject.next(data);
          this.logData('Houses', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadTempHouses(): Observable<House[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('temp_houses', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.tempHousesSubject.next(data);
          this.logData('Temp Houses', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadNotes(): Observable<Note[]> { 
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('notes', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.notesSubject.next(data);
          this.logData('Notes', data);
          this.$areNotesLoaded.next(true);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadRepairTaskComments(): Observable<RepairTaskComment[]> { 
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('repair_task_comments', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.repairTaskCommentsSubject.next(data);
          this.logData('Repair task comments', data);
          this.$areRepairTaskCommentsLoaded.next(true);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to create a new work group
  createWorkGroup(isRepairWorkGroup: boolean): Observable<WorkGroup | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.insertData('work_groups', {is_repair: isRepairWorkGroup}, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentWorkGroups = this.workGroupsSubject.value;
          this.workGroupsSubject.next([...currentWorkGroups, data]);
          this.logData('Created Work Group', data);
        }
      }),
      map((data) => (data ? data : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to update a profile
  updateProfile(id: string, updates: Partial<Omit<Profile, 'id' | 'created_at'>>): Observable<Profile | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.updateData('profiles', updates, `id = '${id}'`, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentProfiles = this.profilesSubject.value;
          const updatedProfiles = currentProfiles.map(profile => 
            profile.id === id ? { ...profile, ...data[0] } : profile
          );
          this.setProfiles(updatedProfiles);
        }
      }),
      map((data) => (data ? data[0] : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to save a house availability to the backend
  saveHouseAvailability(reservation: HouseAvailability): Observable<HouseAvailability | null> {
    this.loadingSubject.next(true);
    
    // Remove house_availability_id if it's a new reservation (backend will generate it)
    const saveData = { ...reservation };
    if (saveData.house_availability_id && saveData.house_availability_id > 1000000) {
      // If it's a temporary ID (we used a large number), remove it
      delete (saveData as any).house_availability_id;
    }
    
    // Ensure we only include fields that exist in the house_availabilities table
    // Remove any fields that might be accidentally included but don't exist
    const validFields = [
      'house_availability_id',
      'house_id',
      'house_availability_type_id',
      'house_availability_start_date',
      'house_availability_end_date',
      'has_arrived',
      'has_departed',
      'last_name',
      'reservation_number',
      'reservation_length',
      'prev_connected',
      'next_connected',
      'adults',
      'babies',
      'cribs',
      'dogs_d',
      'dogs_s',
      'dogs_b',
      'color_theme',
      'color_tint',
      'note',
      'arrival_time',
      'departure_time'
    ];
    
    // Create clean object with only valid fields
    const cleanSaveData: any = {};
    for (const field of validFields) {
      if (field in saveData) {
        cleanSaveData[field] = (saveData as any)[field];
      }
    }

    if(reservation.house_id > 0){
      return from(this.supabaseService.insertData('house_availabilities', cleanSaveData, this.schema)).pipe(
        tap((data) => {
          if (data && data.length > 0) {
            // Update the local BehaviorSubject with the new data
            const currentAvailabilities = this.houseAvailabilitiesSubject.value;
            this.houseAvailabilitiesSubject.next([...currentAvailabilities, data[0]]);
            this.logData('Created House Availability', data[0]);
          }
        }),
        map((data) => (data && data.length > 0 ? data[0] : null)),
        catchError((error) => this.handleError(error)),
        tap(() => this.loadingSubject.next(false))
      );
    } else {
      return from(this.supabaseService.insertData('temp_house_availabilities', cleanSaveData, this.schema)).pipe(
        tap((data) => {
          if (data && data.length > 0) {
            // Update the local BehaviorSubject with the new data
            const currentTempAvailabilities = this.houseAvailabilitiesSubject.value;
            this.tempHouseAvailabilitiesSubject.next([...currentTempAvailabilities, data[0]]);
            this.logData('Created Temp House Availability', data[0]);
          }
        }),
        map((data) => (data && data.length > 0 ? data[0] : null)),
        catchError((error) => this.handleError(error)),
        tap(() => this.loadingSubject.next(false))
      );
    }
  }

  // Method to update an existing house availability (reservation)
  updateHouseAvailability(reservation: HouseAvailability): Observable<HouseAvailability | null> {
    this.loadingSubject.next(true);
    
    // Make sure we have a valid ID
    if (!reservation.house_availability_id) {
      console.error('Cannot update house availability without an ID');
      return throwError(() => new Error('Missing house_availability_id'));
    }
    
    // Create a copy of the reservation data for the update
    const updateData = { ...reservation };
    const availabilityId = updateData.house_availability_id;
    
    // Ensure we only include fields that exist in the house_availabilities table
    // Remove any fields that might be accidentally included but don't exist
    const validFields = [
      'house_availability_id',
      'house_id',
      'house_availability_type_id',
      'house_availability_start_date',
      'house_availability_end_date',
      'has_arrived',
      'has_departed',
      'last_name',
      'reservation_number',
      'reservation_length',
      'prev_connected',
      'next_connected',
      'adults',
      'babies',
      'cribs',
      'dogs_d',
      'dogs_s',
      'dogs_b',
      'color_theme',
      'color_tint',
      'note',
      'arrival_time',
      'departure_time'
    ];
    
    // Create clean object with only valid fields
    const cleanUpdateData: any = {};
    for (const field of validFields) {
      if (field in updateData) {
        cleanUpdateData[field] = (updateData as any)[field];
      }
    }

    if(reservation.house_id > 0){
      return from(this.supabaseService.updateData('house_availabilities', cleanUpdateData, availabilityId.toString(), this.schema)).pipe(
        tap((data) => {
          if (data && data.length > 0) {
            // Update the local BehaviorSubject with the updated data
            const currentAvailabilities = this.houseAvailabilitiesSubject.value;
            const updatedAvailabilities = currentAvailabilities.map(avail => 
              avail.house_availability_id === availabilityId ? data[0] : avail
            );
            this.houseAvailabilitiesSubject.next(updatedAvailabilities);
            this.logData('Updated House Availability', data[0]);
          }
        }),
        map((data) => (data && data.length > 0 ? data[0] : null)),
        catchError((error) => this.handleError(error)),
        tap(() => this.loadingSubject.next(false))
      );
    } else {
      return from(this.supabaseService.updateData('temp_house_availabilities', cleanUpdateData, availabilityId.toString(), this.schema)).pipe(
        tap((data) => {
          if (data && data.length > 0) {
            // Update the local BehaviorSubject with the updated data
            const currentTempAvailabilities = this.tempHouseAvailabilitiesSubject.value;
            const updatedTempAvailabilities = currentTempAvailabilities.map(avail => 
              avail.house_availability_id === availabilityId ? data[0] : avail
            );
            this.tempHouseAvailabilitiesSubject.next(updatedTempAvailabilities);
            this.logData('Updated Temp House Availability', data[0]);
          }
        }),
        map((data) => (data && data.length > 0 ? data[0] : null)),
        catchError((error) => this.handleError(error)),
        tap(() => this.loadingSubject.next(false))
      );
    }
  }

  // Method to delete a house availability (reservation) from the backend
  deleteHouseAvailability(availabilityId: number, houseId: number): Observable<any> {
    this.loadingSubject.next(true);
    
    // Create the filter condition string
    const filterCondition = `house_availability_id = ${availabilityId}`;

    if(houseId > 0){
      return from(this.supabaseService.deleteData('house_availabilities', filterCondition, this.schema)).pipe(
        tap((data) => {
          // Remove the deleted availability from local state
          const currentAvailabilities = this.houseAvailabilitiesSubject.value;
          const updatedAvailabilities = currentAvailabilities.filter(
            availability => availability.house_availability_id !== availabilityId
          );
          this.houseAvailabilitiesSubject.next(updatedAvailabilities);
          this.logData('Deleted House Availability', { house_availability_id: availabilityId });
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.loadingSubject.next(false))
      );
    } else {
      return from(this.supabaseService.deleteData('temp_house_availabilities', filterCondition, this.schema)).pipe(
        tap((data) => {
          // Remove the deleted availability from local state
          const currentTempAvailabilities = this.tempHouseAvailabilitiesSubject.value;
          const updatedTempAvailabilities = currentTempAvailabilities.filter(
            availability => availability.house_availability_id !== availabilityId
          );
          this.tempHouseAvailabilitiesSubject.next(updatedTempAvailabilities);
          this.logData('Deleted Temp House Availability', { house_availability_id: availabilityId });
        }),
        catchError((error) => this.handleError(error)),
        tap(() => this.loadingSubject.next(false))
      );
    }
  }

  async getHouseAvailabilityTypeByName(name: string){
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('house_availability_types')
        .select('*')
        .eq('house_availability_type_name', name)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating house availability:', error);
      return null;
    }
  }

  // Method to refresh all data
  refreshData(): void {
    if (this.debug) {
      //console.log('[DataService] Refreshing all data...');
    }
    this.houseAvailabilityTypesSubject.next([]);
    this.taskTypesSubject.next([]);
    this.taskProgressTypesSubject.next([]);
    this.houseTypesSubject.next([]);
    this.houseAvailabilitiesSubject.next([]);
    this.tasksSubject.next([]);
    this.workGroupsSubject.next([]);
    this.workGroupProfilesSubject.next([]);
    this.workGroupTasksSubject.next([]);
    this.profilesSubject.next([]);
    this.housesSubject.next([]);
    this.loadAllEnumTypes();
    this.loadInitialData();
  }

  // Method to create a new task
  createTask(task: Omit<Task, 'task_id' | 'created_at'>): Observable<Task | null> {
    this.loadingSubject.next(true);
    
    // Create a clean task object with properly set fields
    const taskToCreate = { ...task } as any; // Use any to bypass TypeScript checks for now
    
    // Handle location types
    if (taskToCreate.location_type === 'house' && taskToCreate.house_id) {
      // House type - need both house_id and house_number
      // Make sure house_number is set based on house_id if it isn't already
      if (!taskToCreate.house_number) {
        // Find the house number from the houses array
        const house = this.housesSubject.value.find(h => h.house_id === taskToCreate.house_id);
        if (house) {
          taskToCreate.house_number = house.house_number;
        }
      }
      // For house type, remove location_name as it's not needed
      delete taskToCreate.location_name;
    } else if (['building', 'parcel'].includes(taskToCreate.location_type || '')) {
      // For building or parcel, house_id and house_number should be null
      taskToCreate.house_id = null;
      taskToCreate.house_number = null;
    }

    return from(this.supabaseService.insertData('tasks', taskToCreate, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next([...currentTasks, data[0]]);
          this.logData('Created Task', data[0]);
        }
      }),
      map((data) => (data ? data[0] : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to update task progress type
  updateTaskProgressType(taskId: number, progressTypeId: number): Observable<Task | null> {
    this.loadingSubject.next(true);

    const updates = { task_progress_type_id: progressTypeId };

    return from(this.supabaseService.updateData('tasks', updates, taskId.toString(), this.schema)).pipe(
      tap((data) => {
        if (data) {
          // Update the tasks in the BehaviorSubject
          const currentTasks = this.tasksSubject.value;
          const updatedTasks = currentTasks.map(task => 
            task.task_id === taskId 
              ? { ...task, task_progress_type_id: progressTypeId }
              : task
          );
          this.tasksSubject.next(updatedTasks);
          this.logData('Updated Task Progress Type', data[0]);
        }
      }),
      map((data) => (data ? data[0] : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  async getTaskProgressTypeIdByTaskProgressTypeName(taskProgressTypeName: string){
    try{
      const { data: existingProgressTypeId, error: progressTypeIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('task_progress_types')
        .select('task_progress_type_id')
        .eq('task_progress_type_name', taskProgressTypeName)
        .single();

      if(progressTypeIdError) throw progressTypeIdError

      return existingProgressTypeId?.task_progress_type_id;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return null;
    }
  }

  async updateTaskProgressType1(taskId: number, taskProgressTypeId: number){
    try{
      this.loadingSubject.next(true);
      const { data: task, error: taskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .update({ task_progress_type_id: taskProgressTypeId })
        .eq('task_id', taskId)
        .select();

      if(taskError) throw taskError

      
      this.loadingSubject.next(false);
      return task;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      this.loadingSubject.next(false);
      return null;
    }
  }

  async getTaskTypeIdByTaskName(taskName: string){
    try{
      const { data: existingTaskTypeId, error: taskTypeIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('task_types')
        .select('task_type_id')
        .eq('task_type_name', taskName)
        .single();

      if(taskTypeIdError) throw taskTypeIdError

      return existingTaskTypeId?.task_type_id;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return null;
    }
  }
  
  getAssignedStaffForWorkGroup(workGroupId: number): Observable<Profile[]> {
    return combineLatest([
      this.workGroupProfiles$,
      this.profiles$
    ]).pipe(
      map(([assignments, profiles]) => {
        const assignedProfileIds = assignments
          .filter(assignment => assignment.work_group_id === workGroupId)
          .map(assignment => assignment.profile_id);
        
        return profiles.filter(profile => profile.id && assignedProfileIds.includes(profile.id));
      })
    );
  }

  // Method to delete work group
  deleteWorkGroup(workGroupId: number): Observable<any> {
    const filter = `work_group_id = ${workGroupId}`;

    return from(this.supabaseService.deleteData('work_groups', filter, this.schema)).pipe(
      tap(() => {
        const currentGroups = this.workGroupsSubject.value;
        const updatedGroups = currentGroups.filter(group => group.work_group_id !== workGroupId);
        this.workGroupsSubject.next(updatedGroups);
      }),
      catchError(error => {
        console.error('Error deleting work group:', error);
        return throwError(() => error);
      })
    );
  }

  listenToDatabaseChanges(){
    this.supabaseService.getClient().channel('realtime:porton')
    .on(
      'postgres_changes',
      { 
        event: '*',
        schema: 'porton',
        table: 'house_availabilities'
      },
      async (payload: any) => {
        this.$houseAvailabilitiesUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      { 
        event: '*',
        schema: 'porton',
        table: 'temp_house_availabilities'
      },
      async (payload: any) => {
        this.$tempHouseAvailabilitiesUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      { 
        event: '*',
        schema: 'porton',
        table: 'tasks'
      },
      async (payload: any) => {
        this.$tasksUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'work_group_tasks'
      },
      async (payload: any) => {
        this.$workGroupTasksUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'work_group_profiles'
      },
      async (payload: any) => {
        this.$workGroupProfilesUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'work_groups'
      },
      async (payload: any) => {
        this.$workGroupsUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'notes'
      },
      async (payload: any) => {
        this.$notesUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'repair_task_comments'
      },
      async (payload: any) => {
        this.$repairTaskCommentsUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'profiles'
      },
      async (payload: any) => {
        this.$profilesUpdate.next(payload);
      }
    )
    .subscribe();
  }

  // Method to load authenticated users
  loadAuthUsers(): Observable<Profile[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('users', 'auth')).pipe(
      tap((data) => {
        if (data) {
          this.authUsersSubject.next(data);
          this.logData('Authenticated Users', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to create a new task progress type
  createTaskProgressType(type: TaskProgressType): Observable<TaskProgressType | null> {
    this.loadingSubject.next(true);
    
    return from(this.supabaseService.insertData('task_progress_types', type, this.schema)).pipe(
      tap((data: any) => {
        if (data) {
          // Update the taskProgressTypes in the BehaviorSubject
          const currentTypes = this.taskProgressTypesSubject.value;
          const newType = data as TaskProgressType;
          this.taskProgressTypesSubject.next([...currentTypes, newType]);
          this.logData('Created Task Progress Type', data);
        }
      }),
      map((data: any) => data as TaskProgressType || null),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to update a task progress type
  updateTaskProgressType2(type: TaskProgressType): Observable<TaskProgressType | null> {
    this.loadingSubject.next(true);
    
    return from(this.supabaseService.updateData(
      'task_progress_types', 
      { task_progress_type_name: type.task_progress_type_name }, 
      type.task_progress_type_id.toString(), 
      this.schema
    )).pipe(
      tap((data: any) => {
        if (data && data.length > 0) {
          // Update the taskProgressTypes in the BehaviorSubject
          const currentTypes = this.taskProgressTypesSubject.value;
          const updatedTypes = currentTypes.map(t => 
            t.task_progress_type_id === type.task_progress_type_id ? type : t
          );
          this.taskProgressTypesSubject.next(updatedTypes);
          this.logData('Updated Task Progress Type', data[0]);
        }
      }),
      map((data: any) => (data && data.length > 0 ? data[0] as TaskProgressType : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to delete a task progress type
  deleteTaskProgressType(id: number): Observable<any> {
    this.loadingSubject.next(true);
    
    return from(this.supabaseService.deleteData('task_progress_types', id, this.schema)).pipe(
      tap((data) => {
        // Update the taskProgressTypes in the BehaviorSubject
        const currentTypes = this.taskProgressTypesSubject.value;
        const updatedTypes = currentTypes.filter(t => t.task_progress_type_id !== id);
        this.taskProgressTypesSubject.next(updatedTypes);
        this.logData('Deleted Task Progress Type', { id });
      }),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to create a new house type
  createHouseType(type: HouseType): Observable<HouseType | null> {
    this.loadingSubject.next(true);
    console.log('Creating house type:', type);
    
    return from(this.supabaseService.insertData('house_types', type, this.schema)).pipe(
      tap((data: any) => {
        if (data) {
          // Update the houseTypes in the BehaviorSubject
          const currentTypes = this.houseTypesSubject.value;
          const newType = data as HouseType;
          console.log('Added new house type to subject:', newType);
          console.log('Current types count:', currentTypes.length);
          const updatedTypes = [...currentTypes, newType];
          console.log('New types count:', updatedTypes.length);
          this.houseTypesSubject.next(updatedTypes);
          this.logData('Created House Type', data);
        } else {
          console.warn('No data received from create house type');
        }
      }),
      map((data: any) => data as HouseType || null),
      catchError((error) => {
        console.error('Error in createHouseType:', error);
        return this.handleError(error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to update a house type
  updateHouseType(type: HouseType): Observable<HouseType | null> {
    this.loadingSubject.next(true);
    console.log('Updating house type:', type);
    
    return from(this.supabaseService.updateData(
      'house_types', 
      { house_type_name: type.house_type_name }, 
      type.house_type_id.toString(), 
      this.schema
    )).pipe(
      tap((data: any) => {
        if (data && data.length > 0) {
          // Update the houseTypes in the BehaviorSubject
          const currentTypes = this.houseTypesSubject.value;
          console.log('Current types count:', currentTypes.length);
          const updatedTypes = currentTypes.map(t => 
            t.house_type_id === type.house_type_id ? type : t
          );
          console.log('Updated house type with id:', type.house_type_id);
          this.houseTypesSubject.next(updatedTypes);
          this.logData('Updated House Type', data[0]);
        } else {
          console.warn('No data or empty array received from update house type');
        }
      }),
      map((data: any) => (data && data.length > 0 ? data[0] as HouseType : null)),
      catchError((error) => {
        console.error('Error in updateHouseType:', error);
        return this.handleError(error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to delete a house type
  deleteHouseType(id: number): Observable<any> {
    this.loadingSubject.next(true);
    console.log('Deleting house type with id:', id);
    
    return from(this.supabaseService.deleteData('house_types', id, this.schema)).pipe(
      tap(() => {
        // Update the houseTypes in the BehaviorSubject
        const currentTypes = this.houseTypesSubject.value;
        console.log('Current types count:', currentTypes.length);
        const updatedTypes = currentTypes.filter(t => t.house_type_id !== id);
        console.log('New types count after deletion:', updatedTypes.length);
        this.houseTypesSubject.next(updatedTypes);
        this.logData('Deleted House Type', { id });
      }),
      catchError((error) => {
        console.error('Error in deleteHouseType:', error);
        return this.handleError(error);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  async getStoredImagesForTask(taskId: number){
    try {
      const folderPath = 'task-' + taskId;

      const { data: files, error: listError } = await this.supabaseService.getClient()
        .storage
        .from('damage-reports-images')
        .list(folderPath);

      if (listError) throw listError;

      return files;
    } catch(error) {
      console.log('Error fetching images: ' + error)
      return null;
    }
  }

  async getPublicUrlForImage(filePath: string) {
    try {
      const response: any = await this.supabaseService
        .getClient()
        .storage
        .from('damage-reports-images')
        .getPublicUrl(filePath);
  
      if (response && response.data && response.data.publicUrl) {
        return response.data.publicUrl;
      }
  
      if (response && response.error) {
        console.error('Error getting public URL:', response.error);
        return null;
      }
  
      console.error('Public URL not found or unknown error');
      return null;
  
    } catch (error) {
      console.error('Error getting public URL:', error);
      return null;
    }
  }
}
