import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DataService, LockedTeam, WorkGroup, WorkGroupProfile, WorkGroupTask } from './data.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkGroupService {
  private activeGroupIdSubject = new BehaviorSubject<number | undefined>(undefined);
  private lockedTeams: LockedTeam[] = [];
  activeGroupId$ = this.activeGroupIdSubject.asObservable();
  $newGroupWhileGroupActive = new BehaviorSubject<boolean>(false);
  workGroupProfiles: WorkGroupProfile[] = [];
  workGroupTasks: WorkGroupTask[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private dataService: DataService,
  ) {
    this.dataService.workGroupProfiles$.subscribe(workGroupProfiles => {
      this.workGroupProfiles = workGroupProfiles;
    });

    this.dataService.workGroupTasks$.subscribe(workGroupTasks => {
      this.workGroupTasks = workGroupTasks;
    });
  }

  getWorkGroupTasksByWorkGroupId(workGroupId: number | undefined){
    return this.workGroupTasks.filter(wgt => wgt.work_group_id == workGroupId);
  }

  getWorkGroupProfilesByWorkGroupId(workGroupId: number | undefined){
    return this.workGroupProfiles.filter(wgp => wgp.work_group_id == workGroupId);
  }

  setActiveGroup(groupId: number | undefined) {
    this.activeGroupIdSubject.next(groupId);
  }

  getActiveGroup(): number | undefined {
    return this.activeGroupIdSubject.value;
  }

  setLockedTeams(lockedTeams: LockedTeam[]){
    this.lockedTeams = lockedTeams;
  }

  updateLockedTeam(updatedTeam: LockedTeam){
    const index = this.lockedTeams.findIndex(team => team.id == updatedTeam.id);
    if (index != -1) {
      this.lockedTeams[index] = updatedTeam;
    } else {
      this.lockedTeams.push(updatedTeam);
    }
  }

  getLockedTeams(){
    return this.lockedTeams;
  }

  getNumberOfRepairWorkGroups(workGroups: WorkGroup[]){
    let repairWorkGroupsCount = 0;

    workGroups.forEach(wg => {
      if(wg.is_repair){
        repairWorkGroupsCount++;
      }
    });

    return repairWorkGroupsCount;
  }

  getNumberOfCleaningWorkGroups(workGroups: WorkGroup[]){
    let cleaningWorkGroupsCount = 0;

    workGroups.forEach(wg => {
      if(!wg.is_repair){
        cleaningWorkGroupsCount++;
      }
    });

    return cleaningWorkGroupsCount;
  }

  async createWorkGroup(): Promise<any>{
    try{
      const { data: newWorkGroup, error: createWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .insert({ 
          created_at: this.getFormattedDateTimeNowForSupabase(),
          is_locked: false,
         })
        .select()
        .single();

      if(createWorkGroupError) throw createWorkGroupError;

      return newWorkGroup;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async lockWorkGroup(workGroupId: number){
    try{
      const { error: updateWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .update({
          is_locked: true
        })
        .eq('work_group_id', workGroupId);

      if(updateWorkGroupError) throw updateWorkGroupError

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async createWorkGroupTask(workGroupId: number, taskId: number, index: number){
    try{
      const { data: newWorkGroupTask, error: createWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .insert({ 
          work_group_id: workGroupId,
          task_id: taskId,
          index: index,
         })
        .select()
        .single();

      if(createWorkGroupTaskError) throw createWorkGroupTaskError;

      return newWorkGroupTask;
    } catch (error){
      console.log(error);
      return {};
    }
  }

  async deleteAllWorkGroupTasksByWorkGroupId(workGroupId: number){
    try{
      const { error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('work_group_id', workGroupId);

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteWorkGroupTask(taskId: number){
    try{
      const { error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('task_id', taskId);

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteAllWorkGroupProfilesByWorkGroupId(workGroupId: number){
    try{
      const { error: deleteWorkGroupProfilesError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('work_group_id', workGroupId);

      if(deleteWorkGroupProfilesError) throw deleteWorkGroupProfilesError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async createWorkGroupProfile(workGroupId: number, profileId: string){
    try{
      const { data: newWorkGroupProfile, error: newWorkGroupProfileError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .insert({ 
          work_group_id: workGroupId,
          profile_id: profileId,
         })
        .select()
        .single();

      if(newWorkGroupProfileError) throw newWorkGroupProfileError;

      return newWorkGroupProfile;
    } catch (error){
      console.log(error);
      return {};
    }
  }

  private getFormattedDateTimeNowForSupabase(){
    const now = new Date();
    const isoString = now.toISOString(); // Example: 2025-03-14T11:26:33.350Z
  
    // Convert to required format: "YYYY-MM-DD HH:MM:SS.ssssss+00"
    return isoString.replace('T', ' ').replace('Z', '+00');
  }
}
