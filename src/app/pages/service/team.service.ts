import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WorkGroupService } from '../service/work-group.service';
import { BehaviorSubject } from 'rxjs';
import { DataService, House, LockedTeam, Profile, Task } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private lockedTeams = new BehaviorSubject<LockedTeam[]>([]);
  lockedTeams$ = this.lockedTeams.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private workGroupService: WorkGroupService,
    private dataService: DataService,
  ) {
    // Load teams from Supabase when service initializes
    this.loadTeamsFromSupabase();
  }

  private async loadTeamsFromSupabase() {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get all work groups created today
      const { data: workGroups, error: workGroupsError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (workGroupsError) throw workGroupsError;
      if (!workGroups || workGroups.length === 0) {
        // If no teams in Supabase for today, use an empty array
        this.lockedTeams.next([]);
        return;
      }

      // For each work group, get its members and tasks
      const teams: LockedTeam[] = [];
      
      for (const workGroup of workGroups) {
        // Get members (profiles) for this work group
        const { data: members, error: membersError } = await this.supabaseService.getClient()
          .schema('porton')
          .from('work_group_profiles')
          .select('profile_id')
          .eq('work_group_id', workGroup.work_group_id);
        
        if (membersError) throw membersError;
        
        // Get profiles details
        const staffMembers: Profile[] = [];
        if (members && members.length > 0) {
          const profileIds = members.map(m => m.profile_id);
          const { data: profiles, error: profilesError } = await this.supabaseService.getClient()
            .schema('porton')
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', profileIds);
          
          if (profilesError) throw profilesError;
          
          if (profiles) {
            profiles.forEach(profile => {
              staffMembers.push({
                id: profile.id.toString(),
                first_name: profile.first_name,
                last_name: profile.last_name,
              });
            });
          }
        }
        
        // Get tasks for this work group
        const { data: workGroupTasks, error: tasksError } = await this.supabaseService.getClient()
          .schema('porton')
          .from('work_group_tasks')
          .select('task_id')
          .eq('work_group_id', workGroup.work_group_id);
        
        if (tasksError) throw tasksError;
        
        // Get task details
        const tasks: Task[] = [];
        if (workGroupTasks && workGroupTasks.length > 0) {
          const taskIds = workGroupTasks.map(t => t.task_id);
          
          // Get task details with task_type_id and task_progress_type_id
          const { data: taskDetails, error: taskDetailsError } = await this.supabaseService.getClient()
            .schema('porton')
            .from('tasks')
            .select('*')
            .in('task_id', taskIds);
          
          if (taskDetailsError) throw taskDetailsError;
          
          if (taskDetails && taskDetails.length > 0) {
            // Get all task types
            const taskTypeIds = taskDetails.map(t => t.task_type_id).filter(Boolean);
            let taskTypes: Record<string, string> = {};
            
            if (taskTypeIds.length > 0) {
              const { data: taskTypeData, error: taskTypeError } = await this.supabaseService.getClient()
                .schema('porton')
                .from('task_types')
                .select('task_type_id, task_type_name')
                .in('task_type_id', taskTypeIds);
              
              if (taskTypeError) throw taskTypeError;
              
              if (taskTypeData) {
                // Create a map of task type id to name
                taskTypes = taskTypeData.reduce((acc: Record<string, string>, type) => {
                  acc[type.task_type_id] = type.task_type_name;
                  return acc;
                }, {});
              }
            }
            
            // Get all progress types
            const progressTypeIds = taskDetails.map(t => t.task_progress_type_id).filter(Boolean);
            let progressTypes: Record<string, string> = {};
            
            if (progressTypeIds.length > 0) {
              const { data: progressTypeData, error: progressTypeError } = await this.supabaseService.getClient()
                .schema('porton')
                .from('task_progress_types')
                .select('task_progress_type_id, task_progress_type_name')
                .in('task_progress_type_id', progressTypeIds);
              
              if (progressTypeError) throw progressTypeError;
              
              if (progressTypeData) {
                // Create a map of progress type id to name
                progressTypes = progressTypeData.reduce((acc: Record<string, string>, type) => {
                  acc[type.task_progress_type_id] = type.task_progress_type_name;
                  return acc;
                }, {});
              }
            }
            
            // Get house details for tasks
            const houseIds = taskDetails.map(t => t.house_id).filter(Boolean);
            let houses: Record<string, string> = {};
            
            if (houseIds.length > 0) {
              const { data: houseData, error: houseError } = await this.supabaseService.getClient()
                .schema('porton')
                .from('houses')
                .select('house_id, house_number, house_name')
                .in('house_id', houseIds);
              
              if (houseError) throw houseError;
              
              if (houseData) {
                // Create a map of house id to house number/name
                houses = houseData.reduce((acc: Record<string, string>, house) => {
                  acc[house.house_id] = house.house_number || house.house_name || house.house_id.toString();
                  return acc;
                }, {});
              }
            }
            
            // Map task details with type and progress information
            taskDetails.forEach(task => {
              tasks.push(task);
            });
          }
        }
        
        // For backward compatibility, also get houses
        const { data: workGroupHouses, error: housesError } = await this.supabaseService.getClient()
          .schema('porton')
          .from('work_group_houses')
          .select('house_id')
          .eq('work_group_id', workGroup.work_group_id);
        
        if (housesError) throw housesError;
        
        // Get house details
        const homes: House[] = [];
        if (workGroupHouses && workGroupHouses.length > 0) {
          const houseIds = workGroupHouses.map(h => h.house_id);
          const { data: houses, error: housesDetailsError } = await this.supabaseService.getClient()
            .schema('porton')
            .from('houses')
            .select('*')
            .in('house_id', houseIds);
          
          if (housesDetailsError) throw housesDetailsError;
          
          if (houses) {
            houses.forEach(house => {
              homes.push({
                house_number: house.house_number || house.house_name || '',
                house_id: house.house_id.toString(),
                house_name: house.house_name || house.house_number || '',
                house_type_id: house.house_type_id || null,
              });
            });
          }
        }
        
        // Create the team object
        teams.push({
          id: workGroup.work_group_id.toString(),
          name: `Team ${workGroup.work_group_id}`, // You might want to add a name field to work_groups
          members: staffMembers,
          homes: homes,
          tasks: tasks,
          isLocked: workGroup.is_locked || false
        });
      }
      
      // Check if the teams have changed before updating
      const currentTeams = this.lockedTeams.getValue();
      const teamsChanged = this.haveTeamsChanged(currentTeams, teams);
      
      if (teamsChanged) {
        this.lockedTeams.next(teams);
      }
    } catch (error) {
      console.error('Error loading teams from Supabase:', error);
      // Use an empty array instead of default teams on error
      this.lockedTeams.next([]);
    }
  }
  
  // Helper method to check if teams have changed
  private haveTeamsChanged(currentTeams: LockedTeam[], newTeams: LockedTeam[]): boolean {
    // Different number of teams means they've changed
    if (currentTeams.length !== newTeams.length) {
      return true;
    }
    
    // Check each team for changes
    for (let i = 0; i < newTeams.length; i++) {
      const newTeam = newTeams[i];
      const currentTeam = currentTeams.find(t => t.id === newTeam.id);
      
      // If a team doesn't exist in the current list, teams have changed
      if (!currentTeam) {
        return true;
      }
      
      // Check if isLocked status has changed
      if (currentTeam.isLocked !== newTeam.isLocked) {
        return true;
      }
      
      // Check if members have changed
      if (currentTeam.members.length !== newTeam.members.length) {
        return true;
      }

      // Check if homes have changed (if both teams have homes)
      if (currentTeam.homes && newTeam.homes && 
          currentTeam.homes.length !== newTeam.homes.length) {
        return true;
      }
      
      // Check if tasks have changed (if both teams have tasks)
      if (currentTeam.tasks && newTeam.tasks && 
          currentTeam.tasks.length !== newTeam.tasks.length) {
        return true;
      }
    }
    
    return false;
  }

  async saveLockedTeams(teams: LockedTeam[]) {
    // Check if teams have changed before updating local state
    const currentTeams = this.lockedTeams.getValue();
    const teamsChanged = this.haveTeamsChanged(currentTeams, teams);
    
    if (teamsChanged) {
      this.lockedTeams.next(teams);
    }
    
    // Save to Supabase
    try {
      for (const team of teams) {
        await this.saveTeamToSupabase(team);
      }
    } catch (error) {
      console.error('Error saving teams to Supabase:', error);
    }
  }

  async saveTeamToSupabase(team: LockedTeam) {
    try {
      let workGroup = await this.dataService.getWorkGroupByWorkGroupId(parseInt(team.id));
      
      if (workGroup) {
        this.workGroupService.lockWorkGroup(workGroup.work_group_id);
      } else {
        workGroup = await this.workGroupService.createWorkGroup();
        this.workGroupService.lockWorkGroup(workGroup.work_group_id);
      }

      let existingWorkGroupProfiles = await this.dataService.getWorkGroupProfilesByWorkGroupId(parseInt(team.id));

      if(team.tasks?.length == 0){
        await this.workGroupService.deleteAllWorkGroupTasksByWorkGroupId(workGroup.work_group_id);
      } else {
        if(!team.tasks){
          team.tasks = [];
        }

        await this.workGroupService.deleteAllWorkGroupTasksByWorkGroupId(workGroup.work_group_id);

        team.tasks.forEach((task, index) => {
          this.workGroupService.createWorkGroupTask(workGroup.work_group_id, task.task_id, index);
        });
      }

      if (!team.members.length) {
        existingWorkGroupProfiles.forEach((profile: any) => 
          this.workGroupService.deleteWorkGroupProfile(profile.profile_id, workGroup.work_group_id)
        );
      } else {
        const profilesToDelete = existingWorkGroupProfiles.filter((profile: any) => !team.members.some(member => member.id == profile.profile_id));
        const profilesToAdd = team.members.filter(member => !existingWorkGroupProfiles.some((profile: any) => profile.profile_id == member.id));
      
        profilesToDelete.forEach((profile: any) => {
          this.workGroupService.deleteWorkGroupProfile(profile.profile_id, workGroup.work_group_id);
        });
      
        profilesToAdd.forEach(profile => {
          this.workGroupService.createWorkGroupProfile(workGroup.work_group_id, profile.id);
        });
      }
    } catch (error) {
      console.error(`Error saving team ${team.id} to Supabase:`, error);
      throw error;
    }
  }

  async createNewTeam(team: LockedTeam) {
    try {
      // Create a new work group
      const { data: newWorkGroup, error: createError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .insert({
          is_locked: false
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Create a new team with the generated ID
      const newTeam: LockedTeam = {
        id: newWorkGroup.work_group_id.toString(),
        name: team.name || `Team ${newWorkGroup.work_group_id}`,
        members: [],
        homes: [],
        isLocked: false
      };
      
      // Update local state - check if the team already exists to avoid duplicates
      const currentTeams = this.lockedTeams.getValue();
      const existingTeamIndex = currentTeams.findIndex(t => t.id === newTeam.id);
      
      if (existingTeamIndex >= 0) {
        // Team already exists, update it
        currentTeams[existingTeamIndex] = newTeam;
        this.lockedTeams.next([...currentTeams]);
      } else {
        // Team doesn't exist, add it
        this.lockedTeams.next([...currentTeams, newTeam]);
      }

      this.refreshTeams();
      
      return newTeam;
    } catch (error) {
      console.error('Error creating new team in Supabase:', error);
      throw error;
    }
  }

  getLockedTeams() {
    return this.lockedTeams.getValue();
  }

  updateLockedTeams(teams: LockedTeam[]) {
    this.lockedTeams.next(teams);
  }	

  // Add a public method to refresh teams from Supabase
  async refreshTeams() {
    await this.loadTeamsFromSupabase();
  }

  private getProgressTypeFromStatus(status: string): string {
    // Convert status color to a readable progress type
    switch (status) {
      case 'red':
        return 'Not Started';
      case 'orange':
        return 'In Progress';
      case 'yellow':
        return 'Partially Complete';
      case 'green':
        return 'Completed';
      default:
        // For numeric statuses, use a default based on the value
        const statusNum = parseInt(status);
        if (!isNaN(statusNum)) {
          if (statusNum % 4 === 0) return 'Completed';
          if (statusNum % 4 === 1) return 'Not Started';
          if (statusNum % 4 === 2) return 'In Progress';
          if (statusNum % 4 === 3) return 'Partially Complete';
        }
        return 'Unknown';
    }
  }

  private getStatusFromProgressType(progressTypeId: any, progressTypes: Record<string, string>): string {
    if (!progressTypeId) return 'red'; // Default to 'Not Started' if no progress type
    
    const progressTypeName = progressTypes[progressTypeId];
    
    if (!progressTypeName) return 'red';
    
    // Map progress type names to status colors
    switch (progressTypeName.toLowerCase()) {
      case 'not started':
        return 'red';
      case 'in progress':
        return 'orange';
      case 'partially complete':
      case 'partially completed':
        return 'yellow';
      case 'completed':
      case 'complete':
        return 'green';
      default:
        // If we can't determine the status, use a numeric approach
        const progressId = parseInt(progressTypeId);
        if (!isNaN(progressId)) {
          if (progressId % 4 === 0) return 'green';
          if (progressId % 4 === 1) return 'red';
          if (progressId % 4 === 2) return 'orange';
          if (progressId % 4 === 3) return 'yellow';
        }
        return 'red';
    }
  }
}
