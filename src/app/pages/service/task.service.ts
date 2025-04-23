import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DataService, HouseStatus, HouseStatusTask, Task, TaskProgressType } from './data.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  mobileHomes: HouseStatus[] = [];
  $selectedTask = new BehaviorSubject<any>(null);
  $taskToRemove = new BehaviorSubject<any>(null);
  taskProgressTypes: TaskProgressType[] = [];

  constructor(
    private supabase: SupabaseService,
    private dataService: DataService,
  ) {
    this.dataService.taskProgressTypes$.subscribe(res => {
      this.taskProgressTypes = res;
    });
  }

  async createTaskForHouse(houseId: string, description: string, taskTypeName: string, isAssigned: boolean, isUnscheduled: boolean = false){
    try {
      let taskTypeId = await this.dataService.getTaskTypeIdByTaskName(taskTypeName);
      let taskProgressTypeId;

      if(isAssigned){
        taskProgressTypeId = await this.dataService.getTaskProgressTypeIdByTaskProgressTypeName('Dodijeljeno');
      } else {
        taskProgressTypeId = await this.dataService.getTaskProgressTypeIdByTaskProgressTypeName('Nije dodijeljeno');
      }

      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .insert({
          task_type_id: taskTypeId,
          task_progress_type_id: taskProgressTypeId,
          house_id: parseInt(houseId),
          description: description,
          // created_by: this.authService.getStoredUserId(),
          created_at: this.getFormattedDateTimeNowForSupabase(),
          is_unscheduled: isUnscheduled
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching task for house:', error);
      return null;
    }
  }

  async uploadCommentForTask(taskId: number, comment: string){
    try{
      const { error: commentUploadError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .update({ description: comment })
        .eq('task_id', taskId);

      if(commentUploadError) throw commentUploadError

      return true;
    } catch (error){
      console.error('Error uploading comment:', error);
      return [];
    }
  }

  async updateTask(task: HouseStatusTask){
    try{
      const { error: updateTaskError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .update({
          task_type_id: task.taskTypeId,
          task_progress_type_id: task.taskProgressTypeId,
          start_time: task.startTime,
          end_time: task.endTime,
          description: task.description,
        })
        .eq('task_id', task.taskId);

      if(updateTaskError) throw updateTaskError

      return true;
    } catch (error){
      console.error('Error updating task:', error);
      return false;
    }
  }


  async setTaskProgress(taskId: number, taskProgress: string){
    try{
      const taskProgressTypeId = await this.dataService.getTaskProgressTypeIdByTaskProgressTypeName(taskProgress);

      const { error: taskTypeIdError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .update({ 
          task_progress_type_id: taskProgressTypeId,
        })
        .eq('task_id', taskId)
        .single();

      if(taskTypeIdError) throw taskTypeIdError

      return true;
    } catch (error) {
      console.error('Error fetching task type ids', error);
      return false;
    }
  }

  async deleteTaskForHouse(taskId: number){
    try{
      const { error: updateTaskError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .delete()
        .eq('task_id', taskId);

      if(updateTaskError) throw updateTaskError

      return true;
    } catch (error){
      console.error('Error updating task:', error);
      return false;
    }
  }

  private getFormattedDateTimeNowForSupabase(){
    const now = new Date();
    const isoString = now.toISOString(); // Example: 2025-03-14T11:26:33.350Z
  
    // Convert to required format: "YYYY-MM-DD HH:MM:SS.ssssss+00"
    return isoString.replace('T', ' ').replace('Z', '+00');
  }

  isTaskAssigned(task: any){
    let assignedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Dodijeljeno');
    return assignedTaskProgressType?.task_progress_type_id == task.task_progress_type_id;
  }

  isTaskNotAssigned(task: any){
    let assignedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Nije dodijeljeno');
    return assignedTaskProgressType?.task_progress_type_id == task.task_progress_type_id;
  }

  isTaskInProgress(task: any){
    let inProgressTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'U progresu');
    return inProgressTaskProgressType?.task_progress_type_id == task.task_progress_type_id;
  }

  isTaskCompleted(task: any){
    let completedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Završeno');
    return completedTaskProgressType?.task_progress_type_id == task.task_progress_type_id;
  }

  isTaskPaused(task: any){
    let pausedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Pauzirano');
    return pausedTaskProgressType?.task_progress_type_id == task.task_progress_type_id;
  }
}
