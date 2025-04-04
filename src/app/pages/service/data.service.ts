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
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  created_at: string;
}

// Interface for work groups and related entities
export interface WorkGroup {
  work_group_id: number;
  created_at: string;
  is_locked: boolean;
}

export interface WorkGroupProfile {
  work_group_id: number;
  profile_id: string; // uuid
}

export interface WorkGroupTask {
  work_group_id: number;
  task_id: number;
  index: number | null;
}

// Interface for tasks
export interface Task {
  task_id: number;
  task_type_id: number;
  task_progress_type_id: number;
  house_id: number;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
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

  constructor(private supabase: SupabaseService) {
    // Load all enum types when service is initialized
    this.loadAllEnumTypes();
    // Load all data
    this.loadInitialData();
  }

  // Method to enable/disable debug mode
  setDebug(enabled: boolean): void {
    this.debug = enabled;
    console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  private logData(source: string, data: any): void {
    if (this.debug) {
      console.log(`[DataService] ${source}:`, data);
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
      console.log('[DataService] Loading initial data...');
    }
    // Load house availabilities first
    this.loadHouseAvailabilities().subscribe();
    // Then load other data
    this.loadTasks().subscribe();
    this.loadWorkGroups().subscribe();
    this.loadWorkGroupProfiles().subscribe();
    this.loadWorkGroupTasks().subscribe();
    this.loadProfiles().subscribe();
    this.loadHouses().subscribe();
  }

  // Method to load all enum types at once
  private loadAllEnumTypes(): void {
    if (this.debug) {
      console.log('[DataService] Loading enum types...');
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
      console.log(`[DataService] Schema changed to: ${schemaName}`);
    }
  }

  // Method to get schema name
  getSchema(): string {
    return this.schema;
  }

  getHouseAvailabilityTypes(): Observable<HouseAvailabilityType[]> {
    this.loadingSubject.next(true);

    if (this.houseAvailabilityTypesSubject.value.length > 0) {
      this.logData('House Availability Types (cached)', this.houseAvailabilityTypesSubject.value);
      this.loadingSubject.next(false);
      return this.houseAvailabilityTypes$;
    }

    return from(this.supabase.getData('house_availability_types', this.schema)).pipe(
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

    return from(this.supabase.getData('task_types', this.schema)).pipe(
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

    if (this.taskProgressTypesSubject.value.length > 0) {
      this.logData('Task Progress Types (cached)', this.taskProgressTypesSubject.value);
      this.loadingSubject.next(false);
      return this.taskProgressTypes$;
    }

    return from(this.supabase.getData('task_progress_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.taskProgressTypesSubject.next(data);
          this.logData('Task Progress Types (loaded)', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  getHouseTypes(): Observable<HouseType[]> {
    this.loadingSubject.next(true);

    if (this.houseTypesSubject.value.length > 0) {
      this.logData('House Types (cached)', this.houseTypesSubject.value);
      this.loadingSubject.next(false);
      return this.houseTypes$;
    }

    return from(this.supabase.getData('house_types', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.houseTypesSubject.next(data);
          this.logData('House Types (loaded)', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadHouseAvailabilities(): Observable<HouseAvailability[]> {
    this.loadingSubject.next(true);

    return from(this.supabase.getData('house_availabilities', this.schema)).pipe(
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

  loadTasks(): Observable<Task[]> {
    this.loadingSubject.next(true);

    return from(this.supabase.getData('tasks', this.schema)).pipe(
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

    return from(this.supabase.getData('work_groups', this.schema)).pipe(
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

    return from(this.supabase.getData('work_group_profiles', this.schema)).pipe(
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

    return from(this.supabase.getData('work_group_tasks', this.schema)).pipe(
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

    return from(this.supabase.getData('profiles', this.schema)).pipe(
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

    return from(this.supabase.getData('houses', this.schema)).pipe(
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

  // Method to create a new work group
  createWorkGroup(): Observable<WorkGroup | null> {
    this.loadingSubject.next(true);

    return from(this.supabase.insertData('work_groups', {}, this.schema)).pipe(
      tap((data) => {
        if (data) {
          const currentWorkGroups = this.workGroupsSubject.value;
          this.workGroupsSubject.next([...currentWorkGroups, data[0]]);
          this.logData('Created Work Group', data[0]);
        }
      }),
      map((data) => (data ? data[0] : null)),
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

    return from(this.supabase.insertData('work_group_profiles', workGroupProfile, this.schema)).pipe(
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

    return from(this.supabase.insertData('work_group_tasks', workGroupTask, this.schema)).pipe(
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

  // Method to create a new profile
  createProfile(profile: Omit<Profile, 'id' | 'created_at'>): Observable<Profile | null> {
    this.loadingSubject.next(true);

    return from(this.supabase.insertData('profiles', profile, this.schema)).pipe(
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

    return from(this.supabase.updateData('profiles', updates, `id = '${id}'`, this.schema)).pipe(
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

  // Method to create a new house
  createHouse(house: Omit<House, 'house_id'>): Observable<House | null> {
    this.loadingSubject.next(true);

    return from(this.supabase.insertData('houses', house, this.schema)).pipe(
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

    return from(this.supabase.updateData('houses', updates, houseId.toString(), this.schema)).pipe(
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
      console.log('[DataService] Refreshing all data...');
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

    return from(this.supabase.insertData('tasks', task, this.schema)).pipe(
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
}
