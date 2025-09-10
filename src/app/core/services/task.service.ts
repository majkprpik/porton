import { PushNotificationsService } from './push-notifications.service';
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { House, Profile, RepairTaskComment, Task, TaskProgressType, TaskProgressTypeName, TaskType, TaskTypeName } from '../models/data.models';
import { BehaviorSubject, combineLatest } from 'rxjs';
import imageCompression from 'browser-image-compression';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

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

  private profilesToReceiveTaskCompletedNotification = [
    'Matej Adrić',
    'Mia Lukić',
    'Marko Sovulj',
  ]

  private isUrgentIconVisibleSubject = new BehaviorSubject<boolean>(false);
  isUrgentIconVisible$ = this.isUrgentIconVisibleSubject.asObservable();
  private intervalId: any;
  tasks: Task[] = [];
  profiles: Profile[] = [];
  houses: House[] = [];
  repairTaskComments: RepairTaskComment[] = []

  constructor(
    private supabaseService: SupabaseService,
    private dataService: DataService,
    private authService: AuthService,
    private pushNotificationsService: PushNotificationsService,
  ) {
    this.startUrgencyInterval();
    this.storedUserId = this.authService.getStoredUserId();

    combineLatest([
      this.dataService.taskProgressTypes$.pipe(nonNull()),
      this.dataService.taskTypes$.pipe(nonNull()),
      this.dataService.tasks$.pipe(nonNull()),
      this.dataService.profiles$.pipe(nonNull()),
      this.dataService.houses$.pipe(nonNull()),
      this.dataService.repairTaskComments$.pipe(nonNull()),
    ]).subscribe(([taskProgressTypes, taskTypes, tasks, profiles, houses, repairTaskComments]) => {
      this.taskProgressTypes = taskProgressTypes;
      this.taskTypes = taskTypes;
      this.tasks = tasks;
      this.profiles = profiles;
      this.houses = houses;
      this.repairTaskComments = repairTaskComments;

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

  async createTask(houseId: number, description: string, taskTypeName: TaskTypeName, isUnscheduled: boolean = false){
    try {
      const { data: createdTask, error: createTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .insert({
          task_type_id: this.getTaskTypeByName(taskTypeName)?.task_type_id,
          task_progress_type_id: this.getTaskProgressTypeByName(TaskProgressTypeName.NotAssigned)?.task_progress_type_id,
          house_id: houseId,
          description: description,
          created_by: this.authService.getStoredUserId(),
          created_at: this.supabaseService.formatDateTimeForSupabase(new Date()),
          is_unscheduled: isUnscheduled
        })
        .select()
        .single();

      if (createTaskError) throw createTaskError;

      if (createdTask && !this.tasks.find(t => t.task_id === createdTask.task_id)) {
        this.dataService.setTasks([...this.tasks, createdTask]);
      }

      return createdTask;
    } catch (error) {
      console.error('Error fetching task for house:', error);
      return null;
    }
  }

  async createTaskImages(images: any[], taskId: number) {
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
      return null;
    }
  }

  async deleteTaskImage(image: any, taskId: number) {
    try {
      const filePath = image.path || `task-${taskId}/${image.name}`;
  
      const { error: deleteTaskImageError } = await this.supabaseService.getClient()
        .storage
        .from('damage-reports-images')
        .remove([filePath]);
  
      if (deleteTaskImageError) throw deleteTaskImageError;
  
      return true;
    } catch (error: any) {
      console.error('Error removing image:', error);
      return null
    }
  }

  async deleteAllImagesForTask(taskId: number){
    try {
      const folder = `task-${taskId}`;

      const { data: files, error: listError } = await this.supabaseService.getClient()
        .storage
        .from('damage-reports-images')
        .list(folder, { limit: 100, offset: 0 });

      if (listError) throw listError;

      if (!files || files.length === 0) return true;

      const paths = files.map(f => `${folder}/${f.name}`);

      const { error: deleteError } = await this.supabaseService.getClient()
        .storage
        .from('damage-reports-images')
        .remove(paths);

      if (deleteError) throw deleteError;

      return true;
    } catch (error: any) {
      console.error('Error removing images for task: ' + taskId, error);
      return null
    }
  }

  async createRepairTaskComment(repairTaskComment: string, taskId: number){
    try{
      const { data: createdComment, error: createCommentError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('repair_task_comments')
        .insert({
          task_id: taskId,
          user_id: this.authService.getStoredUserId(),
          comment: repairTaskComment,
          created_at: this.supabaseService.formatDateTimeForSupabase(new Date()),
        })
        .select()
        .single();

      if(createCommentError) throw createCommentError;

      if(createdComment && !this.repairTaskComments.find(c => c.id == createdComment.id)) {
        this.dataService.setRepairTaskComments([...this.repairTaskComments, createdComment]);
      }

      return createdComment;
    } catch (error){
      console.error('Error uploading comment:', error);
      return null;
    }
  }

  async deleteTask(taskId: number){
    try{
      const { data: deletedTask, error: deleteTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .delete()
        .eq('task_id', taskId)
        .select()
        .single();

      if(deleteTaskError) throw deleteTaskError;

      if(deletedTask && deletedTask.task_id) {
        const filteredTasks = this.tasks.filter(t => t.task_id != deletedTask.task_id);
        this.dataService.setTasks(filteredTasks);
      }

      this.deleteAllImagesForTask(deletedTask.task_id);

      return deletedTask;
    } catch (error){
      console.error('Error deleting task:', error);
      return null;
    }
  }

  async updateTaskProgressType(task: Task, taskProgressTypeId: number){
    const isCompleted = this.getTaskProgressTypeById(taskProgressTypeId)?.task_progress_type_name == 'Završeno';
    const isInProgress = this.getTaskProgressTypeById(taskProgressTypeId)?.task_progress_type_name == 'U tijeku';

    try{
      const { data: updatedTask, error: updateTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('tasks')
        .update({ 
          task_progress_type_id: taskProgressTypeId,
          completed_by: isCompleted ? this.authService.getStoredUserId() : null,
          end_time: isCompleted ? this.supabaseService.formatDateTimeForSupabase(new Date()) : null,
          start_time: isInProgress ? (task?.start_time ?? this.supabaseService.formatDateTimeForSupabase(new Date())) : task?.start_time,
        })
        .eq('task_id', task.task_id)
        .select()
        .single();

      if(updateTaskError) throw updateTaskError

      if(updatedTask && updatedTask.task_id) {
        const updatedTasks = this.tasks.map(t => t.task_id == updatedTask.task_id ? updatedTask : t);
        this.dataService.setTasks(updatedTasks);

        this.handleRepairTaskCompleteNotificationSend(updatedTask);
      }

      return updatedTask;
    } catch (error) {
      console.error('Error updating task progress type: ', error);
      return null;
    }
  }

  handleRepairTaskCompleteNotificationSend(updatedTask: Task){
    if(this.isTaskCompleted(updatedTask) && updatedTask.is_unscheduled && this.isRepairTask(updatedTask)){
      const profilesToReceiveNotification = this.profiles.filter(profile => 
        this.profilesToReceiveTaskCompletedNotification.some(p => p == profile.first_name));

      let completedBy: any = this.profiles.find(profile => profile.id == updatedTask.completed_by)?.first_name;
      if(!completedBy) completedBy = 'User';

      let houseNumber = this.houses.find(house => house.house_id == updatedTask.house_id)?.house_name;
      if(!houseNumber) houseNumber = '0';

      profilesToReceiveNotification.forEach(profile => {
        this.pushNotificationsService.sendNotification(profile.id, {
          title: 'Task completed',
          body: completedBy + ' completed a repair task on house ' + houseNumber,
        });
      });
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

