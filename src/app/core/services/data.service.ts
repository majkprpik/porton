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
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  House, 
  HouseAvailability, 
  HouseType, 
  Note,
  Profile, 
  ProfileRole, 
  ProfileWorkDay, 
  ProfileWorkSchedule, 
  RepairTaskComment, 
  Task, 
  TaskProgressType, 
  TaskType, 
  WorkGroup, 
  WorkGroupProfile, 
  WorkGroupTask 
} from '../models/data.models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private debug = false;
  private schema = 'porton';

  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

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
  private profileWorkScheduleSubject = new BehaviorSubject<ProfileWorkSchedule[]>([]);
  private profileWorkDaysSubject = new BehaviorSubject<ProfileWorkDay[]>([]);

  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
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
  profileWorkSchedule$ = this.profileWorkScheduleSubject.asObservable();
  profileWorkDays$ = this.profileWorkDaysSubject.asObservable();
  
  $houseAvailabilitiesUpdate = new BehaviorSubject<any>('');
  $tempHouseAvailabilitiesUpdate = new BehaviorSubject<any>('');
  $tasksUpdate = new BehaviorSubject<any>('');
  $workGroupTasksUpdate = new BehaviorSubject<any>('');
  $workGroupProfilesUpdate = new BehaviorSubject<any>('');
  $workGroupsUpdate = new BehaviorSubject<any>('');
  $notesUpdate = new BehaviorSubject<any>('');
  $repairTaskCommentsUpdate = new BehaviorSubject<any>('');
  $profilesUpdate = new BehaviorSubject<any>('');
  $profileWorkScheduleUpdate = new BehaviorSubject<any>('');
  $profileWorkDaysUpdate = new BehaviorSubject<any>('');

  $areNotesLoaded = new BehaviorSubject<boolean>(false);
  $areRepairTaskCommentsLoaded = new BehaviorSubject<boolean>(false);

  private realtimeChannel: RealtimeChannel | null = null;

  constructor(private supabaseService: SupabaseService) {
    this.loadAllEnumTypes();
    this.loadInitialData();
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

  //filter deleted user
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

  setFullWorkSchedule(fullWorkSchedule: ProfileWorkSchedule[]){
    if(fullWorkSchedule){
      this.profileWorkScheduleSubject.next(fullWorkSchedule);
    }
  }

  setProfileWorkDays(fullWorkDay: ProfileWorkDay[]){
    if(fullWorkDay){
      this.profileWorkDaysSubject.next(fullWorkDay);
    }
  }

  setRepairTaskComments(repairTaskComments: RepairTaskComment[]){
    if(repairTaskComments){
      this.repairTaskCommentsSubject.next(repairTaskComments);
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

  loadInitialData(): void {
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
    this.getHouseTypes().subscribe();
    this.loadNotes().subscribe();
    this.loadRepairTaskComments().subscribe();
    this.loadProfileWorkSchedule().subscribe();
    this.loadProfileWorkDays().subscribe();
    // this.loadAuthUsers().subscribe();
  }

  private loadAllEnumTypes(): void {
    this.getTaskTypes().subscribe();
    this.getTaskProgressTypes().subscribe();
    this.getHouseTypes().subscribe();
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

    if (this.taskProgressTypesSubject.value.length > 0) {
      this.logData('Task Progress Types (cached)', this.taskProgressTypesSubject.value);
      this.loadingSubject.next(false);
      return this.taskProgressTypes$;
    }

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

    if (this.houseTypesSubject.value.length > 0) {
      console.log('Using cached house types data');
      this.logData('House Types (cached)', this.houseTypesSubject.value);
      this.loadingSubject.next(false);
      return this.houseTypes$;
    }

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

  loadHouseAvailabilities(): Observable<HouseAvailability[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('house_availabilities', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.setHouseAvailabilites(data);
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
          this.setTempHouseAvailabilities(data);
          this.logData('Temp House Availabilities', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadTasks(): Observable<Task[]> {
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('tasks', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.setTasks(data);
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
          this.setWorkGroups(data);
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
          this.setWorkGroupProfiles(data);
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
          this.setWorkGroupTasks(data);
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
          this.setNotes(data);
          this.logData('Notes', data);
          this.$areNotesLoaded.next(true);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  loadProfileWorkSchedule(){
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('profile_work_schedule', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.profileWorkScheduleSubject.next(data);
          this.logData('Profile work schedule', data);
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

  loadProfileWorkDays(){
    this.loadingSubject.next(true);

    return from(this.supabaseService.getData('profile_work_days', this.schema)).pipe(
      tap((data) => {
        if (data) {
          this.profileWorkDaysSubject.next(data);
          this.logData('Profile work days', data);
        }
      }),
      map((data) => data || []),
      catchError((error) => this.handleError(error)),
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

  getRealtimeChannel(){
    return this.realtimeChannel;
  }

  listenToDatabaseChanges(){
    console.log('Database listening called! Realtime channel: ', this.realtimeChannel);
    if (this.realtimeChannel) return;

    this.realtimeChannel = this.supabaseService.getClient().channel('porton')
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
        console.log('Task payload: ', payload);
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
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'profile_work_schedule'
      },
      async (payload: any) => {
        console.log('Work schedule payload: ', payload);
        this.$profileWorkScheduleUpdate.next(payload);
      }
    ).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'porton',
        table: 'profile_work_days'
      },
      async (payload: any) => {
        this.$profileWorkDaysUpdate.next(payload);
      }
    )
    .subscribe();

    console.log('New realtime channel: ', this.realtimeChannel);
  }

  async unsubscribeFromRealtime() {
    if (this.realtimeChannel) {
      console.log('Unsubscribing from realtime channel...');
      await this.supabaseService.getClient().removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}
