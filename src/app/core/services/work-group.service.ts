import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LockedTeam, WorkGroup, WorkGroupProfile, WorkGroupTask } from '../models/data.models';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { DataService } from './data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

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
      this.dataService.workGroupProfiles$.pipe(nonNull()),
      this.dataService.workGroupTasks$.pipe(nonNull()),
      this.dataService.workGroups$.pipe(nonNull()),
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
      const { data: createdWorkGroup, error: createWorkGroupError } = await this.supabaseService.getClient()
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

      if(createdWorkGroup && !this.workGroups.find(wg => wg.work_group_id == createdWorkGroup.work_group_id)) {
        this.dataService.setWorkGroups([...this.workGroups, createdWorkGroup]);
      }

      return createdWorkGroup;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteWorkGroup(workGroupId: number){
    try{
      const { data: deletedWorkGroup, error: deleteWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .delete()
        .eq('work_group_id', workGroupId)
        .select()
        .single();

      if(deleteWorkGroupError) throw deleteWorkGroupError;

      if(deletedWorkGroup && deletedWorkGroup.work_group_id) {
        const filteredWorkGroups = this.workGroups.filter(wg => wg.work_group_id != deletedWorkGroup.work_group_id);
        this.dataService.setWorkGroups(filteredWorkGroups);
      }

      return deletedWorkGroup;
    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async updateWorkGroupToLocked(workGroupId: number){
    try{
      const { data: updatedWorkGroup, error: updateWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .update({
          is_locked: true
        })
        .eq('work_group_id', workGroupId)
        .select()
        .single();

      if(updateWorkGroupError) throw updateWorkGroupError;

      if(updatedWorkGroup && updatedWorkGroup.work_group_id){
        const workGroups = this.workGroups.map(wg => 
          wg.work_group_id === updatedWorkGroup.work_group_id ? updatedWorkGroup : wg
        );
        this.dataService.setWorkGroups(workGroups);
      }

      return updatedWorkGroup;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async createWorkGroupTask(workGroupId: number, taskId: number, index: number){
    try{
      const { data: createdWorkGroupTask, error: createWorkGroupTaskError } = await this.supabaseService.getClient()
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

      if(createdWorkGroupTask && !this.workGroupTasks.find(wgt => wgt.task_id == createdWorkGroupTask.task_id && wgt.work_group_id == createdWorkGroupTask.work_group_id)){
        this.dataService.setWorkGroupTasks([...this.workGroupTasks, createdWorkGroupTask]);
      }

      return createdWorkGroupTask;
    } catch (error){
      console.log(error);
      return null;
    }
  }

  async deleteAllWorkGroupTasksByWorkGroupId(workGroupId: number){
    try{
      const { data: deletedWorkGroupTasks, error: deleteWorkGroupTasksError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('work_group_id', workGroupId)
        .select();

      if(deleteWorkGroupTasksError) throw deleteWorkGroupTasksError;

      if(deletedWorkGroupTasks && deletedWorkGroupTasks.length) {
        const filteredWorkGroupTasks = this.workGroupTasks.filter(wgt => wgt.work_group_id !== workGroupId);
        this.dataService.setWorkGroupTasks(filteredWorkGroupTasks);
      }

      return deletedWorkGroupTasks;
    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async deleteWorkGroupTask(taskId: number){
    try{
      const { data: deletedWorkGroupTask, error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('task_id', taskId)
        .select()
        .single();

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError;

      if(deletedWorkGroupTask && deletedWorkGroupTask.task_id) {
        const filteredWorkGroupTasks = this.workGroupTasks.filter(wgt => wgt.task_id != deletedWorkGroupTask.task_id);
        this.dataService.setWorkGroupTasks(filteredWorkGroupTasks);
      }

      return deletedWorkGroupTask;
    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async deleteWorkGroupTasks(taskIds: number[]) {
    try {
      const { data: deletedWorkGroupTasks, error: deleteWorkGroupTasks } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .in('task_id', taskIds)
        .select(); 

      if (deleteWorkGroupTasks) throw deleteWorkGroupTasks;

      if (deletedWorkGroupTasks && deletedWorkGroupTasks.length) {
        const filteredWorkGroupTasks = this.workGroupTasks.filter(wgt => !taskIds.includes(wgt.task_id));
        this.dataService.setWorkGroupTasks(filteredWorkGroupTasks);
      }

      return deletedWorkGroupTasks;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteAllWorkGroupProfilesByWorkGroupId(workGroupId: number){
    try{
      const { data: deletedWorkGroupProfiles, error: deleteWorkGroupProfilesError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('work_group_id', workGroupId)
        .select();

      if(deleteWorkGroupProfilesError) throw deleteWorkGroupProfilesError;

      if(deletedWorkGroupProfiles && deletedWorkGroupProfiles.length){
        const filteredWorkGroupProfiles = this.workGroupProfiles.filter(wgp => wgp.work_group_id !== workGroupId);
        this.dataService.setWorkGroupProfiles(filteredWorkGroupProfiles);
      }

      return deletedWorkGroupProfiles;
    } catch(error) {
      console.log(error);
      return null;
    }
  }

  async createWorkGroupProfile(workGroupId: number, profileId: string){
    try{
      const { data: createdWorkGroupProfile, error: createWorkGroupProfileError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .insert({ 
          work_group_id: workGroupId,
          profile_id: profileId,
         })
        .select()
        .single();

      if(createWorkGroupProfileError) throw createWorkGroupProfileError;

      if(createdWorkGroupProfile && !this.workGroupProfiles.find(wgp => wgp.profile_id == createdWorkGroupProfile.profile_id && wgp.work_group_id == createdWorkGroupProfile.work_group_id)) {
        this.dataService.setWorkGroupProfiles([...this.workGroupProfiles, createdWorkGroupProfile]);
      }

      return createdWorkGroupProfile;
    } catch (error){
      console.log(error);
      return null;
    }
  }

  async getDbWorkGroupTaskIds(workGroupId: number): Promise<number[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .select('task_id')
        .eq('work_group_id', workGroupId);
      if (error) throw error;
      return data?.map((t: any) => t.task_id) ?? [];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getDbWorkGroupProfileIds(workGroupId: number): Promise<string[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .select('profile_id')
        .eq('work_group_id', workGroupId);
      if (error) throw error;
      return data?.map((p: any) => p.profile_id) ?? [];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async deleteWorkGroupTasksByWorkGroupIdAndTaskIds(workGroupId: number, taskIds: number[]) {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('work_group_id', workGroupId)
        .in('task_id', taskIds)
        .select();
      if (error) throw error;
      if (data?.length) {
        const removedTaskIds = data.map((t: any) => t.task_id);
        const filtered = this.workGroupTasks.filter(
          wgt => !(wgt.work_group_id === workGroupId && removedTaskIds.includes(wgt.task_id))
        );
        this.dataService.setWorkGroupTasks(filtered);
      }
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteWorkGroupProfilesByIds(workGroupId: number, profileIds: string[]) {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('work_group_id', workGroupId)
        .in('profile_id', profileIds)
        .select();
      if (error) throw error;
      if (data?.length) {
        const filtered = this.workGroupProfiles.filter(
          wgp => !(wgp.work_group_id === workGroupId && profileIds.includes(wgp.profile_id))
        );
        this.dataService.setWorkGroupProfiles(filtered);
      }
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private getFormattedDateTimeNowForSupabase(){
    const now = new Date();
    const isoString = now.toISOString();
  
    return isoString.replace('T', ' ').replace('Z', '+00');
  }
}
