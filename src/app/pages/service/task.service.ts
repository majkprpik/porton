import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DataService, HouseStatus, RepairTaskComment, TaskProgressType, TaskType } from './data.service';
import { BehaviorSubject } from 'rxjs';
import imageCompression from 'browser-image-compression';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  mobileHomes: HouseStatus[] = [];
  $selectedTask = new BehaviorSubject<any>(null);
  $taskToRemove = new BehaviorSubject<any>(null);
  $taskModalData = new BehaviorSubject<any>(null);

  taskProgressTypes: TaskProgressType[] = [];
  assignedTaskProgressType: TaskProgressType | undefined = undefined;
  pausedTaskProgressType: TaskProgressType | undefined = undefined;
  completedTaskProgressType: TaskProgressType | undefined = undefined;
  inProgressTaskProgressType: TaskProgressType | undefined = undefined;
  notAssignedTaskProgressType: TaskProgressType | undefined = undefined;

  taskTypes: TaskType[] = [];
  houseRepairTaskType: TaskType | undefined = undefined;
  houseCleaningTaskType: TaskType | undefined = undefined;
  deckCleaningTaskType: TaskType | undefined = undefined;
  sheetChangeTaskType: TaskType | undefined = undefined;
  towelChangeTaskType: TaskType | undefined = undefined;

  constructor(
    private supabaseService: SupabaseService,
    private dataService: DataService,
    private authService: AuthService,
  ) {
    this.dataService.taskProgressTypes$.subscribe(res => {
      this.taskProgressTypes = res;

      this.pausedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Pauzirano');
      this.completedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Završeno');
      this.inProgressTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'U progresu');
      this.notAssignedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Nije dodijeljeno');
      this.assignedTaskProgressType = this.taskProgressTypes.find(tpt => tpt.task_progress_type_name == 'Dodijeljeno');
    });

    this.dataService.taskTypes$.subscribe(taskTypes => {
      this.taskTypes = taskTypes;

      this.houseCleaningTaskType = this.taskTypes.find(tt => tt.task_type_name == 'Čišćenje kućice');
      this.deckCleaningTaskType = this.taskTypes.find(tt => tt.task_type_name == 'Čišćenje terase');
      this.houseRepairTaskType = this.taskTypes.find(tt => tt.task_type_name == 'Popravak');
      this.sheetChangeTaskType = this.taskTypes.find(tt => tt.task_type_name == 'Mijenjanje posteljine');
      this.towelChangeTaskType = this.taskTypes.find(tt => tt.task_type_name == 'Mijenjanje ručnika');
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

      const { data, error } = await this.supabaseService.getClient()
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

  private getFormattedDateTimeNowForSupabase(){
    const now = new Date();
    const isoString = now.toISOString(); // Example: 2025-03-14T11:26:33.350Z
  
    // Convert to required format: "YYYY-MM-DD HH:MM:SS.ssssss+00"
    return isoString.replace('T', ' ').replace('Z', '+00');
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
          created_at: this.supabaseService.getFormattedDateTimeNowForSupabase(),
        })
        .single();

      if(commentError) throw commentError

      return comment;
    } catch (error){
      console.error('Error uploading comment:', error);
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

  isTaskAssigned(task: any){
    return (
      this.assignedTaskProgressType?.task_progress_type_id == task.task_progress_type_id || 
      this.assignedTaskProgressType?.task_progress_type_id == task.taskProgressTypeId); 
  }

  isTaskNotAssigned(task: any){
    return (
      this.notAssignedTaskProgressType?.task_progress_type_id == task.task_progress_type_id || 
      this.notAssignedTaskProgressType?.task_progress_type_id == task.taskProgressTypeId);
  }

  isTaskInProgress(task: any){
    return (
      this.inProgressTaskProgressType?.task_progress_type_id == task.task_progress_type_id || 
      this.inProgressTaskProgressType?.task_progress_type_id == task.taskProgressTypeId);
  }

  isTaskCompleted(task: any){
    return (
      this.completedTaskProgressType?.task_progress_type_id == task.task_progress_type_id || 
      this.completedTaskProgressType?.task_progress_type_id == task.taskProgressTypeId);
  }

  isTaskPaused(task: any){
    return (
      this.pausedTaskProgressType?.task_progress_type_id == task.task_progress_type_id || 
      this.pausedTaskProgressType?.task_progress_type_id == task.taskProgressTypeId);
  }

  isRepairTask(task: any){
    return (
      this.houseRepairTaskType?.task_type_id == task.task_type_id || 
      this.houseRepairTaskType?.task_type_id == task.taskTypeId
    );
  }

  isHouseCleaningTask(task: any){
    return (
      this.houseCleaningTaskType?.task_type_id == task.task_type_id || 
      this.houseCleaningTaskType?.task_type_id == task.taskTypeId
    );
  }

  isDeckCleaningTask(task: any){
    return (
      this.deckCleaningTaskType?.task_type_id == task.task_type_id || 
      this.deckCleaningTaskType?.task_type_id == task.taskTypeId
    );
  }

  isSheetChangeTask(task: any){
    return (
      this.sheetChangeTaskType?.task_type_id == task.task_type_id || 
      this.sheetChangeTaskType?.task_type_id == task.taskTypeId
    );
  }

  isTowelChangeTask(task: any){
    return (
      this.towelChangeTaskType?.task_type_id == task.task_type_id || 
      this.towelChangeTaskType?.task_type_id == task.taskTypeId
    );
  }

  getTaskIcon(taskTypeId: number): string {
    switch(taskTypeId){
      case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje kućice")?.task_type_id: 
        return 'pi pi-home';
      case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje terase")?.task_type_id: 
        return 'pi pi-table';
      case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje posteljine")?.task_type_id: 
        return 'pi pi-inbox';
      case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje ručnika")?.task_type_id: 
        return 'pi pi-bookmark';
      case this.taskTypes.find(tt => tt.task_type_name == "Popravak")?.task_type_id: 
        return 'pi pi-wrench';
      default: 
        return 'pi pi-file';
    }
  }
}
