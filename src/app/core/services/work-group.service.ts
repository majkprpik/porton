import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LockedTeam, WorkGroup, WorkGroupProfile, WorkGroupTask } from '../models/data.models';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { DataService } from './data.service';

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
  workGroups: WorkGroup[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private dataService: DataService,
  ) {
    combineLatest([
      this.dataService.workGroupProfiles$,
      this.dataService.workGroupTasks$,
      this.dataService.workGroups$,
    ])
    .subscribe(([workGroupProfiles, workGroupTasks, workGroups]) => {
      this.workGroupProfiles = workGroupProfiles;
      this.workGroupTasks = workGroupTasks;
      this.workGroups = workGroups;
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

  async createWorkGroup(isRepair: boolean): Promise<any>{
    try{
      const { data: newWorkGroup, error: createWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .insert({ 
          created_at: this.getFormattedDateTimeNowForSupabase(),
          is_locked: false,
          is_repair: isRepair,
         })
        .select()
        .single();

      if(createWorkGroupError) throw createWorkGroupError;

      if(newWorkGroup && !this.workGroups.find(wg => wg.work_group_id == newWorkGroup.work_group_id)) {
        this.dataService.setWorkGroups([...this.workGroups, newWorkGroup]);
      }

      return newWorkGroup;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteWorkGroup(workGroupId: number){
    try{
      const { data, error: deleteWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .delete()
        .eq('work_group_id', workGroupId)
        .select()
        .single();

      if(deleteWorkGroupError) throw deleteWorkGroupError;

      if(data && data.work_group_id) {
        const filteredWorkGroups = this.workGroups.filter(wg => wg.work_group_id != data.work_group_id);
        this.dataService.setWorkGroups(filteredWorkGroups);
      }

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async lockWorkGroup(workGroupId: number){
    try{
      const { data, error: updateWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .update({
          is_locked: true
        })
        .eq('work_group_id', workGroupId)
        .select()
        .single();

      if(updateWorkGroupError) throw updateWorkGroupError;

      if(data && data.work_group_id){
        const workGroups = this.workGroups.map(wg => wg.work_group_id === data.work_group_id ? data : wg);
        this.dataService.setWorkGroups(workGroups);
      }

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

      if(newWorkGroupTask && !this.workGroupTasks.find(wgt => wgt.task_id == newWorkGroupTask.task_id)){
        this.dataService.setWorkGroupTasks([...this.workGroupTasks, newWorkGroupTask]);
      }

      return newWorkGroupTask;
    } catch (error){
      console.log(error);
      return {};
    }
  }

  async deleteAllWorkGroupTasksByWorkGroupId(workGroupId: number){
    try{
      const { data, error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('work_group_id', workGroupId)
        .select();

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError;

      if(data && data.length) {
        const filteredWorkGroupTasks = this.workGroupTasks.filter(wgt => !data.some(t => t.task_id == wgt.task_id));
        this.dataService.setWorkGroupTasks(filteredWorkGroupTasks);
      }

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteWorkGroupTask(taskId: number){
    try{
      const { data, error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('task_id', taskId)
        .select()
        .single();

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError;

      if(data && data.task_id) {
        const filteredWorkGroupTasks = this.workGroupTasks.filter(wgt => wgt.task_id != data.task_id);
        this.dataService.setWorkGroupTasks(filteredWorkGroupTasks);
      }

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteWorkGroupTasks(taskIds: number[]) {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .in('task_id', taskIds)
        .select(); 

      if (error) throw error;

      if (data && data.length) {
        const filteredWorkGroupTasks = this.workGroupTasks.filter(wgt => !taskIds.includes(wgt.task_id));
        this.dataService.setWorkGroupTasks(filteredWorkGroupTasks);
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async deleteAllWorkGroupProfilesByWorkGroupId(workGroupId: number){
    try{
      const { data, error: deleteWorkGroupProfilesError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('work_group_id', workGroupId)
        .select();

      if(deleteWorkGroupProfilesError) throw deleteWorkGroupProfilesError;

      if(data && data.length){
        const filteredWorkGroupProfiles = this.workGroupProfiles.filter(wgp => !data.some(p => p.profile_id == wgp.profile_id));
        this.dataService.setWorkGroupProfiles(filteredWorkGroupProfiles);
      }

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

      if(newWorkGroupProfile && !this.workGroupProfiles.find(wgp => wgp.profile_id == newWorkGroupProfile.profile_id)) {
        this.dataService.setWorkGroupProfiles([...this.workGroupProfiles, newWorkGroupProfile]);
      }

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
