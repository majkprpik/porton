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
  role?: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number?: string | null;
  created_at?: string | null;
}

// Interface for work groups and related entities
export interface WorkGroup {
  work_group_id: number;
  created_at: string;
  is_locked: boolean;
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
  index?: number | null;
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
  index?: number | null; 
  is_unscheduled: boolean
}

export interface TeamTask {
  id: number; 
  house_number: number;
  task_type_name: string;
  progress_type_name: string;
  index: number | null;
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
  description?: string | null;
  arrival_time?: string | null;
  departure_time?: string | null;
}

// Interface for house status task
export interface HouseStatusTask {
  taskId: number;
  taskTypeId: number;
  taskTypeName: string;
  taskProgressTypeId: number;
  taskProgressTypeName: string;
  startTime: string | null;
  endTime: string | null;
  description: string | null;
  createdBy: string;
  createdAt: string;
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
  note_id: string,
  profile_id: string,
  note: string,
  time_sent: string,
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
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private workGroupsSubject = new BehaviorSubject<WorkGroup[]>([]);
  private workGroupProfilesSubject = new BehaviorSubject<WorkGroupProfile[]>([]);
  private workGroupTasksSubject = new BehaviorSubject<WorkGroupTask[]>([]);
  private profilesSubject = new BehaviorSubject<Profile[]>([]);
  private housesSubject = new BehaviorSubject<House[]>([]);
  private houseStatusesSubject = new BehaviorSubject<HouseStatus[]>([]);
  private authUsersSubject = new BehaviorSubject<Profile[]>([]);
  private notesSubject = new BehaviorSubject<Note[]>([]);

  // Public Observables
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  houseAvailabilityTypes$ = this.houseAvailabilityTypesSubject.asObservable();
  taskTypes$ = this.taskTypesSubject.asObservable();
  taskProgressTypes$ = this.taskProgressTypesSubject.asObservable();
  houseTypes$ = this.houseTypesSubject.asObservable();
  houseAvailabilities$ = this.houseAvailabilitiesSubject.asObservable();
  tasks$ = this.tasksSubject.asObservable();
  workGroups$ = this.workGroupsSubject.asObservable();
  workGroupProfiles$ = this.workGroupProfilesSubject.asObservable();
  workGroupTasks$ = this.workGroupTasksSubject.asObservable();
  profiles$ = this.profilesSubject.asObservable();
  houses$ = this.housesSubject.asObservable();
  houseStatuses$ = this.houseStatusesSubject.asObservable();
  authUsers$ = this.authUsersSubject.asObservable();
  notes$ = this.notesSubject.asObservable();
  
  $houseAvailabilitiesUpdate = new BehaviorSubject<any>('');
  $tasksUpdate = new BehaviorSubject<any>('');
  $workGroupTasksUpdate = new BehaviorSubject<any>('');
  $workGroupProfiles = new BehaviorSubject<any>('');
  $workGroupsUpdate = new BehaviorSubject<any>('');
  $notesUpdate = new BehaviorSubject<any>('');

  $areNotesLoaded = new BehaviorSubject<boolean>(false);

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

  // Method to enable/disable debug mode
  setDebug(enabled: boolean): void {
    this.debug = enabled;
    //console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
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
  private loadInitialData(): void {
    if (this.debug) {
      //console.log('[DataService] Loading initial data...');
    }
    // Load house statuses first
    this.loadHouseStatuses().subscribe();
    // Then load other data
    this.loadHouseAvailabilities().subscribe();
    this.loadTasks().subscribe();
    this.loadWorkGroups().subscribe();
    this.loadWorkGroupProfiles().subscribe();
    this.loadWorkGroupTasks().subscribe();
    this.loadProfiles().subscribe();
    this.loadHouses().subscribe();
    this.loadNotes().subscribe();
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

  // Method to set schema name
  setSchema(schemaName: string): void {
    this.schema = schemaName;
    if (this.debug) {
      //console.log(`[DataService] Schema changed to: ${schemaName}`);
    }
  }

  // Method to get schema name
  getSchema(): string {
    return this.schema;
  }

  updateWorkGroups(workGroups: WorkGroup[]){
    this.workGroupsSubject.next(workGroups);
  }

  updateTasksSubject(tasks: any){
    this.tasksSubject.next(tasks);
  }

  updateWorkGroupTasks(workGroupTasks: any){
    this.workGroupTasksSubject.next(workGroupTasks);
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
    console.log('getTaskProgressTypes called');

    // If we already have data cached in the subject, use it
    if (this.taskProgressTypesSubject.value.length > 0) {
      console.log('Using cached task progress types data');
      this.logData('Task Progress Types (cached)', this.taskProgressTypesSubject.value);
      this.loadingSubject.next(false);
      return this.taskProgressTypes$;
    }

    // Otherwise fetch from the server
    console.log('Fetching task progress types from server');
    return from(this.supabaseService.getData('task_progress_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          console.log('Got task progress types from server, count:', data.length);
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
    console.log('getHouseTypes called');

    // If we already have data cached in the subject, use it
    if (this.houseTypesSubject.value.length > 0) {
      console.log('Using cached house types data');
      this.logData('House Types (cached)', this.houseTypesSubject.value);
      this.loadingSubject.next(false);
      return this.houseTypes$;
    }

    // Otherwise fetch from the server
    console.log('Fetching house types from server');
    return from(this.supabaseService.getData('house_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          console.log('Got house types from server, count:', data.length);
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

  async getAllHouseAvailabilities(){
    try{
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('house_availabilities')
        .select('*');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching house number:', error);
      return [];
    }
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
          this.profilesSubject.next(data);
          this.logData('Profiles', data);
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

  // Method to create a new work group
  createWorkGroup(): Observable<WorkGroup | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.insertData('work_groups', {}, this.schema)).pipe(
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

  // Method to add a profile to a work group
  addProfileToWorkGroup(workGroupId: number, profileId: string): Observable<WorkGroupProfile | null> {
    this.loadingSubject.next(true);

    const workGroupProfile: WorkGroupProfile = {
      work_group_id: workGroupId,
      profile_id: profileId
    };

    return from(this.supabaseService.insertData('work_group_profiles', workGroupProfile, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentProfiles = this.workGroupProfilesSubject.value;
          this.workGroupProfilesSubject.next([...currentProfiles, data[0]]);
        }
      }),
      map((data) => (data ? data[0] : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to add a task to a work group
  addTaskToWorkGroup(workGroupId: number, taskId: number, index?: number): Observable<WorkGroupTask | null> {
    this.loadingSubject.next(true);

    const workGroupTask: WorkGroupTask = {
      work_group_id: workGroupId,
      task_id: taskId,
      index: index || null
    };

    return from(this.supabaseService.insertData('work_group_tasks', workGroupTask, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentTasks = this.workGroupTasksSubject.value;
          this.workGroupTasksSubject.next([...currentTasks, data[0]]);
        }
      }),
      map((data) => (data ? data[0] : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  
  async getWorkGroupByWorkGroupId(workGroupId: number): Promise<any>{
    try{
      const { data: existingWorkGroup, error: existingWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .select('*')
        .eq('work_group_id', workGroupId)
        .single();

      if(existingWorkGroupError) throw existingWorkGroupError;

      return existingWorkGroup;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getAllWorkGroups(): Promise<any>{
    try{
      const { data: existingWorkGroups, error: existingWorkGroupsError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .select('*');

      if(existingWorkGroupsError) throw existingWorkGroupsError;

      return existingWorkGroups;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getWorkGroupProfilesByWorkGroupId(workGroupId: number): Promise<any>{
    try{
      const { data: existingWorkGroup, error: existingWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .select('*')
        .eq('work_group_id', workGroupId);

      if(existingWorkGroupError) throw existingWorkGroupError;

      return existingWorkGroup;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getWorkGroupTasksByWorkGroupId(workGroupId: number){
    try{
      const { data: existingWorkGroupTask, error: existingWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .select('*')
        .eq('work_group_id', workGroupId);

      if(existingWorkGroupTaskError) throw existingWorkGroupTaskError;

      return existingWorkGroupTask;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getWorkGroupTasksByTaskId(taskId: number){
    try{
      const { data: existingWorkGroupTask, error: existingWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if(existingWorkGroupTaskError) throw existingWorkGroupTaskError;

      return existingWorkGroupTask;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  // Method to create a new profile
  createProfile(profile: Omit<Profile, 'id' | 'created_at'>): Observable<Profile | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.insertData('profiles', profile, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentProfiles = this.profilesSubject.value;
          this.profilesSubject.next([...currentProfiles, data[0]]);
          this.logData('Created Profile', data[0]);
        }
      }),
      map((data) => (data ? data[0] : null)),
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
          this.profilesSubject.next(updatedProfiles);
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
      'color_tint'
    ];
    
    // Create clean object with only valid fields
    const cleanSaveData: any = {};
    for (const field of validFields) {
      if (field in saveData) {
        cleanSaveData[field] = (saveData as any)[field];
      }
    }
    
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
      'color_tint'
    ];
    
    // Create clean object with only valid fields
    const cleanUpdateData: any = {};
    for (const field of validFields) {
      if (field in updateData) {
        cleanUpdateData[field] = (updateData as any)[field];
      }
    }
    
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
  }

  // Method to delete a house availability (reservation) from the backend
  deleteHouseAvailability(availabilityId: number): Observable<any> {
    this.loadingSubject.next(true);
    
    // Create the filter condition string
    const filterCondition = `house_availability_id = ${availabilityId}`;
    
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
  }

  async getHomesForDate(date: string): Promise<HouseStatus[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('house_statuses_view')
        .select('*');

      if (error) throw error;
      // Return the data directly as it already matches our interface
      return data || [];
    } catch (error) {
      console.error('Error fetching houses:', error);
      return [];
    }
  }

  async getHomesWithTodaysStartDate(){
    try {
      const today = new Date();
      const specificDateStr = today.toISOString().split('T')[0];

      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('house_availabilities')
        .select('*') 
        .eq('house_availability_start_date', specificDateStr)

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching houses for today: ', error);
      return [];
    }
  }

  async getHomesWithYesterdaysEndDate(){
    try {
      const today = new Date(); 
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      const specificDateStr = yesterday.toISOString().split('T')[0];

      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('house_availabilities')
        .select('*') 
        .eq('house_availability_end_date', specificDateStr)

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching houses for today: ', error);
      return [];
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

  async getHouseNumberByHouseId(houseId: number){
    try{
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('houses')
        .select('house_number')
        .eq('house_id', houseId)
        .single();

      if (error) throw error;

      return data ? data.house_number : null;
    } catch (error) {
      console.error('Error fetching house number:', error);
      return null;
    }
  }

  async getHouseIdByHouseNumber(houseNumber: string): Promise<number | null> {
    try{
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('houses')
        .select('house_id')
        .eq('house_number', houseNumber)
        .single();

      if (error) throw error;

      return data.house_id || null;
    } catch (error) {
      console.error('Error fetching house number:', error);
      return null;
    }
  }

  async getHomesWithRepairTasks(){
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('house_statuses_view')
        .select('*');

      if (error) throw error;

      let housesWithRepairTasks = data.flatMap(house => 
        house.housetasks
            .filter((houseTask: any) => houseTask.taskTypeName === "Popravak")
            .map((houseTask: any) => ({
                ...house,
                ...houseTask,
            }))
      );

      return housesWithRepairTasks;
    } catch (error) {
      console.error('Error fetching houses:', error);
      return [];
    }
  }

  // Method to create a new house
  createHouse(house: Omit<House, 'house_id'>): Observable<House | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.insertData('houses', house, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentHouses = this.housesSubject.value;
          this.housesSubject.next([...currentHouses, data[0]]);
          this.logData('Created House', data[0]);
        }
      }),
      map((data) => (data ? data[0] : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to update a house
  updateHouse(houseId: number, updates: Partial<Omit<House, 'house_id'>>): Observable<House | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.updateData('houses', updates, houseId.toString(), this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentHouses = this.housesSubject.value;
          const updatedHouses = currentHouses.map(house => 
            house.house_id === houseId ? { ...house, ...data[0] } : house
          );
          this.housesSubject.next(updatedHouses);
        }
      }),
      map((data) => (data ? data[0] : null)),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to refresh all data
  refreshData(): void {
    if (this.debug) {
      //console.log('[DataService] Refreshing all data...');
    }
    this.houseStatusesSubject.next([]);
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

  // Method to publish work groups (set all to locked)
  publishWorkGroups(workGroupIds: number[]): Observable<WorkGroup[] | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.updateByIds(
      'work_groups', 
      { is_locked: true }, 
      workGroupIds,
      'work_group_id',
      this.schema
    )).pipe(
      tap((data) => {
        if (data) {
          // Update only the specified work groups in the BehaviorSubject
          const currentGroups = this.workGroupsSubject.value;
          const updatedGroups = currentGroups.map(group => 
            workGroupIds.includes(group.work_group_id) 
              ? { ...group, is_locked: true }
              : group
          );
          this.workGroupsSubject.next(updatedGroups);
          this.logData('Published Work Groups', data);
        }
      }),
      map((data) => data || null),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  assignStaffToWorkGroup(profileId: string, workGroupId: number): Observable<WorkGroupProfile | null> {
    const assignment: WorkGroupProfile = {
      work_group_id: workGroupId,
      profile_id: profileId
    };

    return from(this.supabaseService.insertData('work_group_profiles', assignment, this.schema)).pipe(
      tap(result => {
        if (result) {
          const currentAssignments = this.workGroupProfilesSubject.value;
          this.workGroupProfilesSubject.next([...currentAssignments, assignment]);
        }
      }),
      map(data => data ? data[0] : null),
      catchError(error => {
        console.error('Error assigning staff to work group:', error);
        return throwError(() => error);
      })
    );
  }

  // Method to remove staff from work group
  removeStaffFromWorkGroup(profileId: string, workGroupId: number): Observable<any> {
    const filter = `profile_id = '${profileId}' AND work_group_id = ${workGroupId}`;

    return from(this.supabaseService.deleteData('work_group_profiles', filter, this.schema)).pipe(
      tap(() => {
        const currentAssignments = this.workGroupProfilesSubject.value;
        const updatedAssignments = currentAssignments.filter(
          assignment => !(assignment.profile_id === profileId && assignment.work_group_id === workGroupId)
        );
        this.workGroupProfilesSubject.next(updatedAssignments);
      }),
      catchError(error => {
        console.error('Error removing staff from work group:', error);
        return throwError(() => error);
      })
    );
  }

  // Method to remove task from work group
  removeTaskFromWorkGroup(workGroupId: number, taskId: number): Observable<any> {
    const filter = `work_group_id = ${workGroupId} AND task_id = ${taskId}`;

    return from(this.supabaseService.deleteData('work_group_tasks', filter, this.schema)).pipe(
      tap(() => {
        const currentTasks = this.workGroupTasksSubject.value;
        const updatedTasks = currentTasks.filter(
          task => !(task.work_group_id === workGroupId && task.task_id === taskId)
        );
        this.workGroupTasksSubject.next(updatedTasks);
      }),
      catchError(error => {
        console.error('Error removing task from work group:', error);
        return throwError(() => error);
      })
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

  async getTaskProgressTypeByTaskProgressId(taskProgressId: number){
    try{
      const { data: taskProgress, error: progressTypeIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('task_progress_types')
        .select('*')
        .eq('task_progress_type_id', taskProgressId)
        .single();

      if(progressTypeIdError) throw progressTypeIdError

      return taskProgress;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return null;
    }
  }

  
  async getAllHousesByTaskTypeName(taskTypeName: string){
    try{
      const today = new Date().toISOString().split('T')[0];
      let taskTypeId = await this.getTaskTypeIdByTaskName(taskTypeName);
      let mobileHomesForRepair;

      const { data: existingHouseIds, error: houseIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .select('house_id')
        .eq('task_type_id', taskTypeId)

      if(houseIdError) throw houseIdError

      const houseIdList = existingHouseIds.map(house => house.house_id);
      const homes = await this.getHomesForDate(today);
      mobileHomesForRepair = homes.filter((home: any) => houseIdList.includes(home.house_id));

      return mobileHomesForRepair;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return [];
    }
  }

  async getAllTaskTypes(){
    try {
      const { data: taskTypes, error: houseIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('task_types')
        .select('*')

      if (houseIdError) throw houseIdError;

      return taskTypes;
    } catch (error) {
      console.error('Error fetching task types:', error);
      return [];
    }
  }

  async getAllTasksByTaskTypeName(taskTypeName: string): Promise<HouseStatusTask[]>{
    try {
      let taskTypeId = await this.getTaskTypeIdByTaskName(taskTypeName);

      const { data: existingHouseIds, error: houseIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .select('*')
        .eq('task_type_id', taskTypeId)

      if (houseIdError) throw houseIdError;

      return existingHouseIds;
    } catch (error) {
      console.error('Error fetching houses:', error);
      return [];
    }
  }

  async getTaskByTaskId(taskId: number){
    try{
      const { data: task, error: taskTypeIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if(taskTypeIdError) throw taskTypeIdError

      return task;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return [];
    }
  }

  async getTaskTypeByTaskTypeId(taskTypeId: number){
    try{
      const { data: task, error: taskTypeIdError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('task_types')
        .select('*')
        .eq('task_type_id', taskTypeId)
        .single();

      if(taskTypeIdError) throw taskTypeIdError

      return task;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return [];
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

  getTaskById(taskId: number): Task | undefined {
    return this.tasksSubject.value.find(task => task.task_id === taskId);
  }

  getProfileById(profileId: string): Profile | undefined {
    return this.profilesSubject.value.find(profile => profile.id === profileId);
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

  // Method to update work group locked status
  updateWorkGroupLocked(workGroupId: number, isLocked: boolean): Observable<WorkGroup[] | null> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.updateByIds(
      'work_groups', 
      { is_locked: isLocked }, 
      [workGroupId],
      'work_group_id',
      this.schema
    )).pipe(
      tap((data) => {
        if (data) {
          // Update only the specified work group in the BehaviorSubject
          const currentGroups = this.workGroupsSubject.value;
          const updatedGroups = currentGroups.map(group => 
            group.work_group_id === workGroupId
              ? { ...group, is_locked: isLocked }
              : group
          );
          this.workGroupsSubject.next(updatedGroups);
          this.logData('Updated Work Group Lock Status', data);
        }
      }),
      map((data) => data || null),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Method to load house statuses
  loadHouseStatuses(): Observable<HouseStatus[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('house_statuses_view', this.schema)).pipe(
      tap((data) => {
        if (data) {
          // Parse the housetasks JSON string into actual objects
          const processedData = data.map(status => ({
            ...status,
            housetasks: status.housetasks ? JSON.parse(status.housetasks) : []
          }));
          this.houseStatusesSubject.next(processedData);
          this.logData('House Statuses', processedData);
        }
      }),
      map((data) => {
        if (data) {
          return data.map(status => ({
            ...status,
            housetasks: status.housetasks ? JSON.parse(status.housetasks) : []
          }));
        }
        return [];
      }),
      catchError((error) => {
        this.handleError(error);
        return of([]);
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Add method to refresh house statuses
  refreshHouseStatuses(): Observable<HouseStatus[]> {
    return this.loadHouseStatuses();
  }

  listenToDatabaseChanges(){
    this.supabaseService.getClient().channel('realtime:porton')
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE',
        schema: 'porton',
        table: 'house_availabilities'
      },
      async (payload: any) => {
        this.$houseAvailabilitiesUpdate.next(payload);
      }
    )
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE',
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
        this.$workGroupProfiles.next(payload);
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

  async getAllNotesForToday(){
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    try{
      const { data: notes, error: getNotesError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('notes')
        .select('*')
        .gte('time_sent', startOfDay)
        .lte('time_sent', endOfDay);

      if(getNotesError) throw getNotesError;

      return notes;
    } catch (error) {
      console.log(error);
      return null;
    }
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
}
