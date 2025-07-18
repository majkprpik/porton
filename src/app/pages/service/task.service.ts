import { PushNotificationsService } from './push-notifications.service';
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DataService, Profile, Task, TaskProgressType, TaskType } from './data.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import imageCompression from 'browser-image-compression';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  $selectedTask = new BehaviorSubject<any>(null);
  $taskToRemove = new BehaviorSubject<any>(null);
  $taskModalData = new BehaviorSubject<any>(null);

  private taskProgressTypes: TaskProgressType[] = [];
  private taskTypes: TaskType[] = [];

  loggedUser?: Profile;
  storedUserId?: string | null;
  
  taskTypesTranslationMap: { [key: string]: string } = { 
    "Čišćenje kućice": "House cleaning",
    "Čišćenje terase": "Deck cleaning",
    "Popravak": "Repair",
    "Mijenjanje posteljine": "Sheet change",
    "Mijenjanje ručnika": "Towel change",
    "Ostalo": "Other"
  };

  private isUrgentIconVisibleSubject = new BehaviorSubject<boolean>(false);
  isUrgentIconVisible$ = this.isUrgentIconVisibleSubject.asObservable();
  private intervalId: any;
  tasks: Task[] = [];
  profiles: Profile[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private dataService: DataService,
    private authService: AuthService,
    private pushNotificationsService: PushNotificationsService,
  ) {
    this.startUrgencyInterval();
    this.storedUserId = this.authService.getStoredUserId();

    combineLatest([
      this.dataService.taskProgressTypes$,
      this.dataService.taskTypes$,
      this.dataService.tasks$,
      this.dataService.profiles$,
    ]).subscribe(([taskProgressTypes, taskTypes, tasks, profiles]) => {
      this.taskProgressTypes = taskProgressTypes;
      this.taskTypes = taskTypes;
      this.tasks = tasks;
      this.profiles = profiles;

      this.loggedUser = this.profiles.find(profile => profile.id == this.storedUserId);
    });
  }

  private startUrgencyInterval() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        const currentState = this.isUrgentIconVisibleSubject.value;
        this.isUrgentIconVisibleSubject.next(!currentState);
      }, 1000);
    }
  }

  stopUrgencyInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async createTaskForHouse(houseId: string, description: string, taskTypeName: TaskTypeName, isUnscheduled: boolean = false){
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .insert({
          task_type_id: this.getTaskTypeByName(taskTypeName)?.task_type_id,
          task_progress_type_id: this.getTaskProgressTypeByName(TaskProgressTypeName.NotAssigned)?.task_progress_type_id,
          house_id: parseInt(houseId),
          description: description,
          created_by: this.authService.getStoredUserId(),
          created_at: this.supabaseService.formatDateTimeForSupabase(new Date()),
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
      const { error: commentUploadError } = await this.supabaseService.getClient()
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

  async storeImagesForTask(images: any[], taskId: number) {
    try {
      const compressedImages = await Promise.all(
        images.map(image => this.compressImage(image, 1))
      );
  
      const uploadPromises = compressedImages.map(async (compressedImage) => {
        const filePath = `task-${taskId}/${compressedImage.name}`;
  
        const { data, error: storeImageError } = await this.supabaseService.getClient()
          .storage
          .from('damage-reports-images')
          .upload(filePath, compressedImage);
  
        if (storeImageError) throw storeImageError;
  
        const publicUrl = this.supabaseService.getClient()
          .storage
          .from('damage-reports-images')
          .getPublicUrl(data.path).data.publicUrl;
  
        return { path: data.path, url: publicUrl };
      });
  
      const uploadResults = await Promise.all(uploadPromises);
  
      return uploadResults;
    } catch (error: any) {
      console.error('Error storing images:', error);
      return { error: error.message || "Error storing images in Supabase" };
    }
  }

  async removeImageForTask(image: any, taskId: number) {
    try {
      const filePath = image.path || `task-${taskId}/${image.name}`;
  
      const { error } = await this.supabaseService.getClient()
        .storage
        .from('damage-reports-images')
        .remove([filePath]);
  
      if (error) {
        throw error;
      }
  
      console.log(`Image ${filePath} deleted successfully.`);
      return { success: true };
    } catch (error: any) {
      console.error('Error removing image:', error);
      return { error: error.message || "Error removing image from Supabase" };
    }
  }

  async addCommentOnRepairTask(repairTaskComment: string, taskId: number){
    try{
      const { data: comment, error: commentError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('repair_task_comments')
        .insert({
          task_id: taskId,
          user_id: this.authService.getStoredUserId(),
          comment: repairTaskComment,
          created_at: this.supabaseService.formatDateTimeForSupabase(new Date()),
        })
        .single();

      if(commentError) throw commentError

      return comment;
    } catch (error){
      console.error('Error uploading comment:', error);
      return null;
    }
  }

  async deleteTask(taskId: number){
    try{
      const { error: taskDeleteError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .delete()
        .eq('task_id', taskId);

      if(taskDeleteError) throw taskDeleteError

      return true;
    } catch (error){
      console.error('Error deleting task:', error);
      return false;
    }
  }

  async updateTaskProgressType(task: Task, taskProgressTypeId: number){
    const isCompleted = this.getTaskProgressTypeById(taskProgressTypeId)?.task_progress_type_name == 'Završeno';
    const isInProgress = this.getTaskProgressTypeById(taskProgressTypeId)?.task_progress_type_name == 'U tijeku';

    try{
      const { data: updatedTask, error: taskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .update({ 
          task_progress_type_id: taskProgressTypeId,
          completed_by: isCompleted ? this.authService.getStoredUserId() : null,
          end_time: isCompleted ? this.supabaseService.formatDateTimeForSupabase(new Date()) : null,
          start_time: isInProgress ? (task?.start_time ?? this.supabaseService.formatDateTimeForSupabase(new Date())) : task?.start_time,
        })
        .eq('task_id', task.task_id)
        .select();

      if(taskError) throw taskError
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task progress type: ', error);
      return null;
    }
  }

  private async compressImage(image: File, targetMegaBytes: number){
    const options = {
      maxSizeMB: targetMegaBytes, 
      maxWidthOrHeight: 1920, 
      useWebWorker: true,
    };

    const compressedImage = await imageCompression(image, options);

    return compressedImage;
  }

  getAllTasks(){
    return this.tasks;
  }

  getAllTaskTypes(){
    return this.taskTypes;
  }

  getAllTaskProgressTypes(){
    return this.taskProgressTypes;
  }

  isTaskAssigned(task: Task | undefined){
    return this.getTaskProgressTypeByName(TaskProgressTypeName.Assigned)?.task_progress_type_id == task?.task_progress_type_id;
  }

  isTaskNotAssigned(task: Task | undefined){
    return this.getTaskProgressTypeByName(TaskProgressTypeName.NotAssigned)?.task_progress_type_id == task?.task_progress_type_id;
  }

  isTaskInProgress(task: Task | undefined){
    return this.getTaskProgressTypeByName(TaskProgressTypeName.InProgress)?.task_progress_type_id == task?.task_progress_type_id;
  }

  isTaskCompleted(task: Task | undefined){
    return this.getTaskProgressTypeByName(TaskProgressTypeName.Completed)?.task_progress_type_id == task?.task_progress_type_id;
  }

  isTaskPaused(task: Task | undefined){
    return this.getTaskProgressTypeByName(TaskProgressTypeName.Paused)?.task_progress_type_id == task?.task_progress_type_id;
  }

  isRepairTask(task: Task | undefined){
    return this.getTaskTypeByName(TaskTypeName.Repair)?.task_type_id == task?.task_type_id;
  }

  isHouseCleaningTask(task: Task | undefined){
    return this.getTaskTypeByName(TaskTypeName.HouseCleaning)?.task_type_id == task?.task_type_id;
  }

  isDeckCleaningTask(task: Task | undefined){
    return this.getTaskTypeByName(TaskTypeName.DeckCleaning)?.task_type_id == task?.task_type_id;
  }

  isSheetChangeTask(task: Task | undefined){
    return this.getTaskTypeByName(TaskTypeName.SheetChange)?.task_type_id == task?.task_type_id 
  }

  isTowelChangeTask(task: Task | undefined){
    return this.getTaskTypeByName(TaskTypeName.TowelChange)?.task_type_id == task?.task_type_id;
  }

  isOtherTask(task: Task | undefined){
    return this.getTaskTypeByName(TaskTypeName.Other)?.task_type_id == task?.task_type_id;
  }

  getTaskIcon(taskTypeId: number | undefined): string {
    switch(taskTypeId){
      case this.getTaskTypeByName(TaskTypeName.HouseCleaning)?.task_type_id: 
        return 'fa fa-house';
      case this.getTaskTypeByName(TaskTypeName.DeckCleaning)?.task_type_id: 
        return 'fa fa-umbrella-beach';
      case this.getTaskTypeByName(TaskTypeName.SheetChange)?.task_type_id: 
        return 'fa fa-bed';
      case this.getTaskTypeByName(TaskTypeName.TowelChange)?.task_type_id: 
        return 'fa fa-bookmark';
      case this.getTaskTypeByName(TaskTypeName.Repair)?.task_type_id: 
        return 'fa fa-wrench';
      default: 
        return 'fa fa-file';
    }
  }
  
  getTaskStatusIcon(task: Task): string {
    if (this.isTaskCompleted(task)) {
      return 'fa fa-check-circle';
    } else if (this.isTaskInProgress(task)) {
      return 'fa fa-sync fa-spin';
    } else if (this.isTaskPaused(task)) {
      return 'fa fa-pause-circle';
    } else if (this.isTaskAssigned(task)) {
      return 'fa fa-user-check';
    } else {
      return 'fa fa-clock';
    }
  }

  getTaskProgressTypeByName(taskProgressTypeName: TaskProgressTypeName){
    return this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == taskProgressTypeName);
  }

  getTaskProgressTypeById(taskProgressTypeId: number | undefined){
    return this.taskProgressTypes.find(tpt => tpt.task_progress_type_id == taskProgressTypeId);
  }

  getTaskTypeByName(taskTypeName: TaskTypeName){
    return this.taskTypes.find(tt => tt.task_type_name == taskTypeName);
  }

  getTaskTypeById(taskTypeId: number | undefined){
    return this.taskTypes.find(tt => tt.task_type_id == taskTypeId);
  }
}

export enum TaskProgressTypeName {
  Paused = 'Pauzirano',
  Completed = 'Završeno',
  InProgress = 'U tijeku',
  NotAssigned = 'Nije dodijeljeno',
  Assigned = 'Dodijeljeno',
}

export enum TaskTypeName {
  HouseCleaning = 'Čišćenje kućice',
  DeckCleaning = 'Čišćenje terase',
  Repair = 'Popravak',
  SheetChange = 'Mijenjanje posteljine',
  TowelChange = 'Mijenjanje ručnika',
  Other = 'Ostalo',
}
