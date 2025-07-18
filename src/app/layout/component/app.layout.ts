import { HouseAvailability, Note, Profile, ProfileRole, ProfileWorkSchedule, WorkGroup, WorkGroupProfile, WorkGroupTask } from './../../pages/service/data.service';
import { Component, ElementRef, Renderer2, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, fromEvent, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { LayoutService } from '../service/layout.service';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { DataService, House, RepairTaskComment, Task, TaskType } from '../../pages/service/data.service';
import { TaskService, TaskTypeName } from '../../pages/service/task.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotesComponent } from './notes.component';
import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ArrivalsAndDeparturesComponent } from './arrivals-and-departures.component';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProfileService } from '../../pages/service/profile.service';
import { AuthService } from '../../pages/service/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkGroupService } from '../../pages/service/work-group.service';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { LanguageService } from '../../pages/language/language.service';
import { PushNotificationsService } from '../../pages/service/push-notifications.service';
import { MultiSelect } from 'primeng/multiselect';
import { HouseService } from '../../pages/service/house.service';
import { ErrorLoggingService } from '../../pages/service/error-logging.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [
        CommonModule,
        AppTopbar,
        AppSidebar,
        RouterModule,
        SpeedDialModule,
        DialogModule,
        ButtonModule,
        FormsModule,
        ToastModule,
        NotesComponent,
        ArrivalsAndDeparturesComponent,
        CdkDrag,
        CdkDragHandle,
        ChipModule,
        ConfirmDialogModule,
        TranslateModule,
        TabsModule,
        SelectModule,
        MultiSelect,
    ],
    providers: [MessageService, ConfirmationService],
    template: ` 
    <div class="layout-wrapper" [ngClass]="containerClass" #dragBoundary>
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-outlet></router-outlet>

                @if (isNotesWindowVisible) {
                    <div class="notes-window" cdkDrag (cdkDragEnded)="onDragEnd('notes', $event)" [cdkDragBoundary]="dragBoundary" [cdkDragFreeDragPosition]="positions['notes'] || { x: 0, y: 0 }">
                        <app-notes></app-notes>

                        <div class="example-handle" cdkDragHandle>
                            <svg width="24px" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"></path>
                                <path d="M0 0h24v24H0z" fill="none"></path>
                            </svg>
                        </div>

                        <div (click)="closeNotesWindow()" class="close-notes-window">
                            <i class="pi pi-times"></i>
                        </div>
                    </div>
                }

                @if (isArrivalsAndDeparturesWindowVisible) {
                    <div class="arrivals-and-departures-window" cdkDrag (cdkDragEnded)="onDragEnd('arrivals', $event)" [cdkDragBoundary]="dragBoundary" [cdkDragFreeDragPosition]="positions['arrivals'] || { x: 0, y: 0 }">
                        <app-arrivals-and-departures></app-arrivals-and-departures>

                        <div class="example-handle" cdkDragHandle>
                            <svg width="24px" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"></path>
                                <path d="M0 0h24v24H0z" fill="none"></path>
                            </svg>
                        </div>

                        <div (click)="closeArrivalsAndDeparturesWindow()" class="close-arrivals-and-departures-window">
                            <i class="pi pi-times"></i>
                        </div>
                    </div>
                }

                <p-dialog
                    [header]="'APP-LAYOUT.STAFF-DETAILS.TITLE' | translate"
                    [(visible)]="isProfileDetailsWindowVisible"
                    [modal]="true"
                    [style]="{ width: '30rem' }"
                    [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
                >
                    <div class="details" [ngStyle]="{'margin-left': '10px', 'margin-bottom': '10px'}">
                        <div>
                            <span><b>{{ 'APP-LAYOUT.STAFF-DETAILS.FULL-NAME' | translate }}:</b> {{ profileModalData?.first_name }}</span>
                        </div>

                        <div>
                            <span>
                                <b>{{ 'APP-LAYOUT.STAFF-DETAILS.EMAIL' | translate }}:</b> {{ profileModalData?.email }}
                            </span>
                        </div>
    
                        <div>
                            <span>
                                <b>{{ 'APP-LAYOUT.STAFF-DETAILS.PHONE-NUMBER' | translate }}:</b> {{ profileModalData?.phone_number }}
                            </span>
                        </div>
    
                        <div>
                            <span><b>{{ 'APP-LAYOUT.STAFF-DETAILS.ROLE' | translate }}:</b> {{ profileModalData?.translated_role }}</span>
                        </div>
                    </div>
                </p-dialog>

                <p-dialog
                    [header]="'APP-LAYOUT.TASK-DETAILS.TITLE' | translate" 
                    [(visible)]="isTaskDetailsWindowVisible"
                    [modal]="true"
                    [style]="{ width: '30rem' }"
                    [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
                    (onHide)="resetForm('task-details')"
                >
                    <ng-template pTemplate="header">
                        <div class="dialog-header">
                            <span>{{ 'APP-LAYOUT.TASK-DETAILS.TITLE' | translate }}</span>
                            @if(
                                !profileService.isHousekeeper(storedUserId) && 
                                !profileService.isHouseTechnician(storedUserId) && 
                                !profileService.isCustomerService(storedUserId)
                            ) {
                                <div class="header-icons">
                                    <div class="trash-icon" (click)="deleteTask($event, task)">
                                        <i class="pi pi-trash"></i>
                                    </div>
                                </div>
                            }
                        </div>
                    </ng-template>
                    <p-tabs [(value)]="selectedTabIndex">
                        @if (taskService.isRepairTask(task)){
                            <p-tablist>
                                <p-tab value="0">{{ 'APP-LAYOUT.TASK-DETAILS.TABS.DETAILS' | translate }}</p-tab>
                                <p-tab value="1">
                                    {{ 'APP-LAYOUT.TASK-DETAILS.IMAGES' | translate }}
                                    @if(taskImages.length){
                                        <span class="image-count">{{ taskImages.length }}</span>
                                    }
                                </p-tab>
                                <p-tab value="2">
                                    {{ 'APP-LAYOUT.TASK-DETAILS.TABS.COMMENTS' | translate }}
                                    @if(commentsForTask.length){
                                        <span class="image-count">{{ commentsForTask.length }}</span>
                                    }
                                </p-tab>
                            </p-tablist>
                        }
                        <p-tabpanels>
                            <p-tabpanel value="0">
                                <div class="details">
                                    <div>
                                        <span><b>{{ 'APP-LAYOUT.TASK-DETAILS.HOUSE' | translate }}:</b> {{ houseService.getHouseName(task?.house_id) }}</span>
                                    </div>
    
                                    <div>
                                        <span>
                                            <b>{{ 'APP-LAYOUT.TASK-DETAILS.TYPE' | translate }}:</b> {{ ('TASK-TYPES.' + taskService.getTaskTypeById(task?.task_type_id)?.task_type_name) | translate }}
                                        </span>
                                    </div>
    
                                    <div>
                                        <span>
                                            <b>{{ 'APP-LAYOUT.TASK-DETAILS.STATUS' | translate }}:</b> {{ ('TASK-PROGRESS-TYPES.' + taskService.getTaskProgressTypeById(task?.task_progress_type_id)?.task_progress_type_name) | translate }}
                                        </span>
                                    </div>
    
                                    <div>
                                        <span><b>{{ 'APP-LAYOUT.TASK-DETAILS.DESCRIPTION' | translate }}:</b> {{ task?.description }}</span>
                                    </div>
    
                                    <div>
                                        <span><b>{{ 'APP-LAYOUT.TASK-DETAILS.CREATED-AT' | translate }}: </b> {{ task?.created_at | date: 'dd MMM yyyy' }} </span>
                                    </div>

                                    @if(task?.start_time){
                                        <div>
                                            <span><b>{{ 'APP-LAYOUT.TASK-DETAILS.START-TIME' | translate }}: </b> {{ task?.start_time | date: 'dd MMM yyyy - HH:mm' : 'UTC' }} </span>
                                        </div>
                                    }

                                    @if(task?.end_time){
                                        <div>
                                            <span><b>{{ 'APP-LAYOUT.TASK-DETAILS.END-TIME' | translate }}: </b> {{ task?.end_time | date: 'dd MMM yyyy - HH:mm' : 'UTC' }} </span>
                                        </div>
                                    }

                                    @if(task?.completed_by){
                                        <div>
                                            <span><b>{{ 'APP-LAYOUT.TASK-DETAILS.COMPLETED-BY' | translate }}: </b> {{ profileService.getProfileById(task?.completed_by)?.first_name }}</span>
                                        </div>   
                                    }
                                </div>
                            </p-tabpanel>
                            @if (taskService.isRepairTask(task)){
                                <p-tabpanel value="1">
                                    @if (!capturedImage) {
                                        <div class="upload-a-photo">
                                            @if (!taskImages.length) {
                                                <label for="description" class="font-bold block mb-2">{{ 'APP-LAYOUT.TASK-DETAILS.IMAGES' | translate }}</label>
                                            }

                                            <div class="task-images-container" [ngStyle]="{ 'justify-content': taskImages.length ? 'flex-start' : 'center' }">
                                                <input type="file" accept="image/*" capture="environment" (change)="handleImageCapture($event)" hidden #fileInput />

                                                @for (image of taskImages; track image.url) {
                                                    <div class="task-images">
                                                        <div class="image-wrapper">
                                                            <div class="close-icon-container">
                                                                <i (click)="removeImage(image, $event, 'task-details')" class="pi pi-trash"></i>
                                                            </div>
                                                            <img #imgElement (click)="onOpenImage(imgElement)" [src]="image.url" [alt]="image.url" />
                                                        </div>
                                                    </div>
                                                }

                                                <div class="camera-icon-container" (click)="openCamera()">
                                                    <span class="camera-icon">📷</span>
                                                    <span class="camera-icon-label">{{ 'APP-LAYOUT.TASK-DETAILS.CAPTURE-IMAGE' | translate }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    } @else {
                                        <div class="save-captured-image">
                                            <label for="description" class="font-bold block mb-2">{{ 'APP-LAYOUT.TASK-DETAILS.SAVE-IMAGE' | translate }}</label>
                                            <div class="captured-image-container">
                                                <img #imgElement (click)="onOpenImage(imgElement)" [src]="capturedImage" alt="Captured Photo" />
                                                <div class="save-captured-image-buttons">
                                                    <button pButton label="Odbaci" class="p-button-text" (click)="discardImage()"></button>
                                                    <button pButton label="Spremi" (click)="saveImage()"></button>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </p-tabpanel>
                                <p-tabpanel value="2">
                                    <div class="comments-content" #commentsContainer>
                                        @if (!commentsForTask.length && !areCommentsLoaded) {
                                            <span>{{ 'APP-LAYOUT.TASK-DETAILS.LOADING-COMMENTS' | translate }}</span>
                                        } @else if (!commentsForTask.length && areCommentsLoaded) {
                                            <span>{{ 'APP-LAYOUT.TASK-DETAILS.NO-COMMENTS' | translate }}</span>
                                        } @else {
                                            @for (comment of commentsForTask; track $index) {
                                                <span>
                                                    <b>{{ profileService.getProfileNameForComment(comment) }} - {{ comment.created_at | date: 'HH:mm' : 'UTC' }}:</b> {{ comment.comment }}
                                                </span>
                                            }
                                        }
                                    </div>

                                    <div class="comments-footer">
                                        <textarea [placeholder]="'APP-LAYOUT.TASK-DETAILS.ADD-COMMENT' | translate" [(ngModel)]="comment" (keydown.enter)="addComment($event)"></textarea>
                                    </div>
                                </p-tabpanel>
                            }
                        </p-tabpanels>
                    </p-tabs>
                </p-dialog>
            </div>
        </div>
        <div class="layout-mask animate-fadein"></div>
        <!-- <app-debug-overlay></app-debug-overlay> -->
        <div class="custom-overlay" *ngIf="isSpeedDialVisible" (click)="closeSpeedDial()"></div>

        @if(!faultReportVisible && !isUnscheduledTaskVisible){
            <p-speedDial
                [(visible)]="isSpeedDialVisible"
                [model]="layoutService.getSpeedDialItems()"
                [radius]="120"
                [type]="layoutService.getSpeedDialItems().length > 2 ? 'quarter-circle' : 'linear'"
                [direction]="layoutService.getSpeedDialItems().length > 2 ? 'up-left' : 'up'"
                buttonClassName="p-button-primary"
                [buttonProps]="{ size: 'large', raised: true }"
                showIcon="pi pi-list"
                hideIcon="pi pi-times"
                [transitionDelay]="80"
            ></p-speedDial>
        }

        <p-dialog 
            [header]="'APP-LAYOUT.REPAIR-TASK-REPORT.TITLE' | translate" 
            [(visible)]="faultReportVisible" 
            [modal]="true" 
            [style]="{ width: '30rem' }" 
            [breakpoints]="{ '960px': '75vw', '641px': '90vw' }" 
            (onHide)="resetForm('fault-report')"
        >
            <div class="fault-report-form">
                <div class="field">
                    <label for="location" class="font-bold block mb-2">{{ 'APP-LAYOUT.REPAIR-TASK-REPORT.LOCATION' | translate }}*</label>
                    <p-select id="location" 
                        [options]="houses" 
                        [(ngModel)]="selectedHouseForFaultReport" 
                        [placeholder]="'APP-LAYOUT.REPAIR-TASK-REPORT.SELECT-LOCATION' | translate" 
                        [style]="{ width: '100%' }" 
                    >
                        <ng-template let-item pTemplate="item">
                            <span>{{ item.name || item.house_name }}</span>
                        </ng-template>
                        <ng-template let-item pTemplate="selectedItem">
                            <span>{{ item.name || item.house_name }}</span>
                        </ng-template>
                    </p-select>
                </div>

                <div class="field mt-4">
                    <label for="description" class="font-bold block mb-2">{{ 'APP-LAYOUT.REPAIR-TASK-REPORT.DESCRIPTION' | translate }}</label>
                    <textarea 
                        id="description" 
                        class="p-inputtext"
                        pTextarea  
                        [(ngModel)]="faultDescription" 
                        [rows]="5" 
                        [style]="{ width: '100%' }" 
                        [placeholder]="'APP-LAYOUT.REPAIR-TASK-REPORT.ADD-DESCRIPTION' | translate"
                    ></textarea>
                </div>

                @if (!capturedImage) {
                    <div class="upload-a-photo">
                        @if (!taskImages.length) {
                            <label for="description" class="font-bold block mb-2">{{ 'APP-LAYOUT.REPAIR-TASK-REPORT.IMAGES' | translate }}</label>
                        } @else {
                            <label for="description" class="font-bold block mb-2">{{ 'APP-LAYOUT.REPAIR-TASK-REPORT.ADDED-IMAGES' | translate }}</label>
                        }

                        <div class="task-images-container" [ngStyle]="{ 'justify-content': taskImages.length ? 'flex-start' : 'center' }">
                            <input type="file" accept="image/*" capture="environment" (change)="handleImageCapture($event)" hidden #fileInput />

                            @for (image of taskImages; let i = $index; track i) {
                                <div class="task-images">
                                    <div class="image-wrapper">
                                        <div class="close-icon-container">
                                            <i (click)="removeImage(image, $event, 'repair-task')" class="pi pi-trash"></i>
                                        </div>
                                        <img #imgElement (click)="onOpenImage(imgElement)" [src]="image.base64Url" [alt]="image.base64Url" />
                                    </div>
                                </div>
                            }

                            <div class="camera-icon-container" (click)="openCamera()">
                                <span class="camera-icon">📷</span>
                                <span class="camera-icon-label">{{ 'APP-LAYOUT.REPAIR-TASK-REPORT.CAPTURE-IMAGE' | translate }}</span>
                            </div>
                        </div>
                    </div>
                } @else {
                    <div class="save-captured-image">
                        <label for="description" class="font-bold block mb-2">{{ 'APP-LAYOUT.REPAIR-TASK-REPORT.SAVE-IMAGE' | translate }}</label>
                        <div class="captured-image-container">
                            <img [src]="capturedImage" alt="Captured Photo" />
                            <div class="save-captured-image-buttons">
                                <button pButton label="Odbaci" class="p-button-text" (click)="discardImage()"></button>

                                <button pButton label="Spremi" (click)="saveImage()"></button>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <ng-template pTemplate="footer">
                @if (!capturedImage) {
                    <div class="flex justify-content-end gap-2">
                        <button pButton [label]="'BUTTONS.CANCEL' | translate" class="p-button-text" (click)="faultReportVisible = false"></button>
                        <button pButton [label]="'BUTTONS.REPORT' | translate" (click)="submitFaultReport()" [disabled]="!isFaultReportFormValid()"></button>
                    </div>
                }
            </ng-template>
        </p-dialog>

        <p-dialog 
            [header]="'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.TITLE' | translate" 
            [(visible)]="isUnscheduledTaskVisible" 
            [modal]="true" 
            [style]="{ width: '30rem' }" 
            [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
            (onHide)="resetForm('unscheduled-task-report')"
        >
            <div class="task-form">
                <div class="field">
                    <label for="location" class="font-bold block mb-2">{{ 'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.LOCATION' | translate }}*</label>
                    <p-multiselect 
                            [options]="houses" 
                            [(ngModel)]="selectedHouseNamesForTaskReport"
                            optionLabel="house_name" 
                            optionValue="house_name" 
                            [placeholder]="'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.SELECT-LOCATION' | translate" 
                            [style]="{ width: '100%' }" 
                            (onChange)="onLocationSelect()"
                        >
                            <ng-template let-item pTemplate="item">
                                <span>{{ item.house_name }}</span>
                            </ng-template>
                    </p-multiselect>
                </div>

                <div class="field mt-4">
                    <label for="taskType" class="font-bold block mb-2">{{ 'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.TASK-TYPE' | translate }}*</label>
                    <p-select 
                        id="taskType" 
                        [options]="taskTypes" 
                        [(ngModel)]="selectedTaskType" 
                        optionLabel="translatedName" 
                        [placeholder]="'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.SELECT-TASK-TYPE' | translate" 
                        [style]="{ width: '100%' }"
                        appendTo="body"
                    ></p-select>
                </div>

                <div class="field mt-4">
                    <label for="taskDescription" class="font-bold block mb-2">{{ 'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.DESCRIPTION' | translate }}</label>
                    <textarea 
                        id="taskDescription" 
                        class="p-inputtext"
                        pTextarea  
                        [(ngModel)]="taskDescription" 
                        [rows]="5" 
                        [style]="{ width: '100%' }" 
                        [placeholder]="'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.ADD-DESCRIPTION' | translate"
                    ></textarea>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton [label]="'BUTTONS.CANCEL' | translate" class="p-button-text" (click)="isUnscheduledTaskVisible = false"></button>
                    <button pButton [label]="'BUTTONS.REPORT' | translate" (click)="submitUnscheduledTask()" [disabled]="!isUnscheduledTaskFormValid()"></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>
        <p-confirmdialog />
    </div>`,
    styles: [
        `
           .custom-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.4);
                z-index: 999;
            }

            ::ng-deep .p-tablist-tab-list {
                justify-content: space-evenly;
            }

            ::ng-deep .p-tabview-panel {
                min-height: 150px;
                border-radius: 4px;
                transition: transform 0.3s ease;
                border-radius: 4px;
            }

            ::ng-deep {
                .p-speeddial {
                    position: fixed !important;
                    bottom: 2rem !important;
                    right: 2rem !important;
                    z-index: 99999 !important;

                    .p-speeddial-button {
                        width: 4rem !important;
                        height: 4rem !important;
                        z-index: inherit !important;
                        background: var(--primary-color) !important;
                        border-color: var(--primary-color) !important;
                        transition: transform 0.3s ease;

                        .p-button-icon {
                            font-size: 1.8rem;
                        }

                        &:hover {
                            transform: scale(1.1);
                        }
                    }

                    .p-speeddial-action {
                        width: 3rem !important;
                        height: 3rem !important;
                        background: var(--surface-card);
                        color: var(--text-color);
                        border: 1px solid var(--surface-border);
                        margin-bottom: 0.5rem;
                        z-index: inherit !important;
                        transition: transform 0.3s ease;

                        &:hover {
                            transform: scale(1.1);
                        }

                        .p-speeddial-action-icon {
                            font-size: 1.2rem;
                        }
                    }

                    .p-speeddial-list {
                        padding: 0;
                        margin: 0;
                        z-index: inherit !important;
                    }
                }
            }

            .upload-a-photo{
                .task-images-container{
                    min-height: 150px;
                }
            }

            .comments-content {
                height: 140px;
                box-sizing: border-box;
                padding: 10px;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                overflow-x: hidden;
                word-break: break-word;
                white-space: normal;
                align-items: flex-start;
                background-color: white;
            }

            .comments-footer {
                height: 30px;
                width: 100%;
                border-radius: 0 0 10px 10px;
                border-top: 1px solid #e5e7eb;

                textarea {
                    width: 100%;
                    height: 100%;
                    border-radius: 0 0 10px 10px;
                    resize: none;
                    box-sizing: border-box;
                    padding: 10px 10px 0 10px;
                    outline: none;

                    &:disabled {
                        background-color: var(--surface-ground);
                    }
                }
            }

            .field {
                margin-bottom: 1rem;
            }

            label {
                color: var(--text-color);
            }

            .image-count{
                height: 20px;
                width: 20px;
                background-color: var(--p-tabs-tab-active-color);
                color: white;
                border-radius: 15px;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                font-size: 11px;
            }

            .upload-a-photo {
                overflow-x: auto;

                .task-images-container {
                    border: 1px solid var(--surface-border);
                    border-radius: 5px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    overflow-x: auto;
                    gap: 5px;

                    .task-images {
                        flex: 0 0 auto;
                        position: relative;

                        .image-wrapper {
                            .close-icon-container {
                                background-color: orangered;
                                border-radius: 30px;
                                height: 25px;
                                width: 25px;
                                position: absolute;
                                right: 10px;
                                top: 10px;
                                transition: transform 0.3s ease;

                                display: flex;
                                flex-direction: row;
                                align-items: center;
                                justify-content: center;

                                i {
                                    color: white;
                                }

                                &:hover {
                                    cursor: pointer;
                                    transform: scale(1.05);
                                }
                            }

                            transition: transform 0.3s ease;

                            img {
                                border-radius: 5px;
                                height: 200px;
                            }

                            &:hover{
                                cursor: pointer;
                            }
                        }
                    }

                    .camera-icon-container {
                        margin: 10px 10px 10px 10px;
                        flex: 0 0 auto;
                        width: 150px;
                        height: 50px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: gray;
                        background-color: var(--surface-border);
                        border-radius: 5px;

                        &:hover {
                            cursor: pointer;
                        }
                    }
                }
            }

            .fault-report-form{
                min-height: 300px;

                .upload-a-photo{
                    .task-images-container{
                        min-height: 150px;
                    }
                }
            }

            .save-captured-image {
                width: 100%;
                max-height: 500px;

                .captured-image-container {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;

                    .save-captured-image-buttons {
                        padding-top: 10px;
                        width: 100%;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-evenly;
                    }

                    &:hover{
                        cursor: pointer;
                    }
                }
            }

            .fault-report-form,
            .task-form,
            .team-card {
                padding: 1.5rem 0;

                .save-captured-image {
                    width: 100%;
                    max-height: 500px;

                    .captured-image-container {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;

                        .save-captured-image-buttons {
                            padding-top: 10px;
                            width: 100%;
                            display: flex;
                            flex-direction: row;
                            align-items: center;
                            justify-content: space-evenly;
                        }
                    }
                }
            }

            .notes-window {
                position: fixed !important;
                top: 100px;
                left: 100px;
                z-index: 99999 !important;
                width: 500px;
                height: 350px;
                padding: 10px;
                box-sizing: border-box;
                border: solid 1px #ccc;
                color: rgba(0, 0, 0, 0.87);
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                background: #fff;
                border-radius: 10px;
                position: relative;
                transition: box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
                box-shadow:
                    0 3px 1px -2px rgba(0, 0, 0, 0.2),
                    0 2px 2px 0 rgba(0, 0, 0, 0.14),
                    0 1px 5px 0 rgba(0, 0, 0, 0.12);

                .example-handle {
                    position: absolute;
                    top: 17px;
                    left: 15px;
                    color: #ccc;
                    cursor: move;
                    width: 24px;
                    height: 24px;
                }

                .close-notes-window {
                    position: absolute;
                    top: 13px;
                    right: 12px;
                    color: #ccc;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 5px;

                    &:hover {
                        background-color: red;
                        cursor: pointer;

                        i {
                            color: white;
                        }
                    }
                }
            }

            .arrivals-and-departures-window {
                position: fixed !important;
                top: 100px;
                left: 100px;
                z-index: 99999 !important;
                width: 450px;
                height: 340px;
                box-sizing: border-box;
                border: solid 1px #ccc;
                color: rgba(0, 0, 0, 0.87);
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                background: #fff;
                border-radius: 10px;
                position: relative;
                transition: box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
                box-shadow:
                    0 3px 1px -2px rgba(0, 0, 0, 0.2),
                    0 2px 2px 0 rgba(0, 0, 0, 0.14),
                    0 1px 5px 0 rgba(0, 0, 0, 0.12);

                .example-handle {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    color: #ccc;
                    cursor: move;
                    width: 24px;
                    height: 24px;
                }

                .close-arrivals-and-departures-window {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    color: #ccc;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 5px;

                    &:hover {
                        background-color: red;
                        cursor: pointer;

                        i {
                            color: white;
                        }
                    }
                }
            }

            p-dialog{
                .dialog-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    font-weight: 600; 
                    font-size: 20px;
                }

                .header-icons {
                    width: 50px;
                    display: flex;
                    flex-direction: row;
                    gap: 10px;

                    .trash-icon{
                        height: 40px;
                        width: 40px;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        justify-content: center;
                        border-radius: 20px;
                        transition: background-color 0.3s ease;

                        i{
                            color: red;
                        }

                        &:hover{
                            cursor: pointer;
                            background-color: var(--surface-hover);
                        }
                    }
                }

                .details{
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  margin-top: 10px;

                  span{
                    font-size: 16px;
                  }
              
                  .task-images{
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    overflow-x: auto;
                  }
                }
            }

            @media screen and (max-width: 600px){
                .layout-main{
                    padding-bottom: 100px;
                }
            }
        `
    ]
})
export class AppLayout {
    overlayMenuOpenSubscription: Subscription;
    menuOutsideClickListener: any;

    @ViewChild('fileInput') fileInput!: ElementRef;
    @ViewChild(AppSidebar) appSidebar!: AppSidebar;
    @ViewChild(AppTopbar) appTopBar!: AppTopbar;

    faultReportVisible: boolean = false;
    isUnscheduledTaskVisible: boolean = false;
    isNotesWindowVisible: boolean = false;
    isArrivalsAndDeparturesWindowVisible: boolean = false;
    isTaskDetailsWindowVisible: boolean = false;
    isProfileDetailsWindowVisible: boolean = false;
    isSpeedDialVisible: boolean = false;

    selectedHouse: House | null = null;
    faultDescription: string = '';

    selectedTaskType: TaskType | null = null;
    taskDescription: string = '';
    selectedHouseNamesForTaskReport: string[] = [];
    selectedHouseForFaultReport: House | null = null;

    houses: House[] = [];
    taskTypes: TaskType[] = [];
    otherTaskTypes: TaskType[] = [];
    profileRoles: ProfileRole[] = [];
    task?: Task;
    tasks: Task[] = [];
    profileModalData: any
    profiles: Profile[] = [];
    storedUserId: string | null = '';

    imageToUpload: any;
    imagesToUpload: any[] = [];
    capturedImage: any;
    taskImages: any[] = [];
    openImage: any;
    positions: { [key: string]: { x: number; y: number } } = {};

    comments: RepairTaskComment[] = [];
    comment: string = '';
    commentsForTask: RepairTaskComment[] = [];
    areCommentsLoaded: boolean = false;

    workGroups: WorkGroup[] = [];
    workGroupTasks: WorkGroupTask[] = [];
    workGroupProfiles: WorkGroupProfile[] = [];

    houseAvailabilities = signal<HouseAvailability[]>([]);
    tempHouseAvailabilities: HouseAvailability[] = [];

    fullWorkSchedule: ProfileWorkSchedule[] = [];

    notes: Note[] = [];

    selectedTabIndex: string = "0";

    loggedUser: Profile | undefined = undefined;

    private visibilityChangeSub!: Subscription;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router,
        private dataService: DataService,
        public taskService: TaskService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        public profileService: ProfileService,
        public authService: AuthService,
        private translateService: TranslateService,
        private workGroupService: WorkGroupService,
        private languageService: LanguageService,
        private pushNotificationsService: PushNotificationsService,
        public houseService: HouseService,
        private errorLogger: ErrorLoggingService,
    ) {
        this.captureConsoleMessages();
        this.onAppVisibilityChange();

        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            if (!this.menuOutsideClickListener) {
                this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
                    if (this.isOutsideClicked(event)) {
                        this.hideMenu();
                    }
                });
            }

            if (this.layoutService.layoutState().staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.hideMenu();
        });
    }

    onAppVisibilityChange(){
        this.visibilityChangeSub = fromEvent(document, 'visibilitychange').subscribe(() => {
            if (document.visibilityState === 'visible') {
                this.onAppVisible();
            }
        });
    }

    captureConsoleMessages() {
        const originalLog = console.log;
        console.log = (...args: any[]) => {
            args.forEach(arg => this.errorLogger.logMessage(arg));
            originalLog.apply(console, args);
        };

        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            args.forEach(arg => this.errorLogger.logError(arg));
            originalConsoleError.apply(console, args);
        };

        const originalConsoleWarn = console.warn;
        console.warn = (...args: any[]) => {
            args.forEach(arg => this.errorLogger.logWarning(arg));
            originalConsoleWarn.apply(console, args);
        };

        window.onerror = (message, source, lineno, colno, error) => {
            this.errorLogger.logError(
            error instanceof Error
                ? error
                : `Unhandled Error: ${message} at ${source}:${lineno}:${colno}`
            );
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.errorLogger.logError(event.reason);
        });
    }

    private onAppVisible() {
        console.log('App is now visible — refresh or reconnect!');
        this.dataService.loadInitialData();
        this.pushNotificationsService.requestFirebaseMessaging();
        this.dataService.listenToDatabaseChanges(); 
    }

    ngOnInit() {
        this.dataService.loadInitialData();
        this.pushNotificationsService.requestFirebaseMessaging();
        this.dataService.listenToDatabaseChanges(); 

        combineLatest([
            this.dataService.repairTaskComments$,
            this.dataService.houses$,
            this.dataService.taskTypes$,
            this.dataService.tasks$,
            this.dataService.workGroups$,
            this.dataService.workGroupTasks$,
            this.dataService.workGroupProfiles$,
            this.dataService.houseAvailabilities$,
            this.dataService.profiles$,
            this.dataService.tempHouseAvailabilities$,
            this.dataService.notes$,
            this.dataService.profileRoles$,
            this.dataService.profileWorkSchedule$,
        ]).subscribe({
            next: ([repairTaskComments, houses, taskTypes, tasks, workGroups, workGroupTasks, workGroupProfiles, houseAvailabilities, profiles, tempHouseAvailabilities, notes, profileRoles, fullWorkSchedule]) => {
                this.storedUserId = this.authService.getStoredUserId();

                this.comments = repairTaskComments;
                this.taskTypes = taskTypes.map(taskType => ({
                    ...taskType, 
                    translatedName: this.languageService.getSelectedLanguageCode() == 'en' ? this.taskService.taskTypesTranslationMap[taskType.task_type_name] : taskType.task_type_name,
                })); 
                this.otherTaskTypes = taskTypes.map(taskType => ({
                    ...taskType, 
                    translatedName: this.languageService.getSelectedLanguageCode() == 'en' ? this.taskService.taskTypesTranslationMap[taskType.task_type_name] : taskType.task_type_name,
                }));
                this.tasks = tasks;
                this.workGroups = workGroups;
                this.workGroupTasks = workGroupTasks;
                this.workGroupProfiles = workGroupProfiles;
                this.houseAvailabilities.set(houseAvailabilities);
                this.profiles = profiles;
                this.tempHouseAvailabilities = tempHouseAvailabilities;
                this.notes = notes;
                this.profileRoles = profileRoles;
                this.fullWorkSchedule = fullWorkSchedule;
                
                this.loggedUser = this.profiles.find(profile => profile.id == this.storedUserId);

                this.houses = houses.sort((a, b) => {
                    const nameA = a.house_name.toLowerCase();
                    const nameB = b.house_name.toLowerCase();

                    if (isNaN(Number(nameA)) && isNaN(Number(nameB))) {
                        return nameA.localeCompare(nameB);
                    } else if (isNaN(Number(nameA))) {
                        return -1;
                    } else if (isNaN(Number(nameB))) {
                        return 1;
                    } else {
                        return Number(nameA) - Number(nameB);
                    }
                });

                if(profiles.length > 0 && profileRoles.length > 0){
                    this.buildSpeedDialItems();
                }
            },
            error: (error) => {
                console.error(error);
            }
        });

        this.router.events
            .pipe(filter(e => e instanceof NavigationEnd))
        	.subscribe((e: NavigationEnd) => {
                this.workGroupService.setActiveGroup(undefined);

                if(e.urlAfterRedirects === '/home'){
                    this.loadStoredWindowPositions();
                } else {
                    this.isNotesWindowVisible = false;
                    this.isArrivalsAndDeparturesWindowVisible = false;
                }
        	});

        this.subscribeToModalData();
        this.subscribeToDataUpdates();

        if(this.router.url == '/home'){
            this.loadStoredWindowPositions();
        }
    }

    buildSpeedDialItems(){
        if(this.layoutService.getSpeedDialItems().length <= 0){
            this.layoutService.addSpeedDialItem({
                icon: 'pi pi-wrench',
                command: () => {
                    this.faultReportVisible = true;
                    this.isTaskDetailsWindowVisible = false;
                    this.resetForm('task-details');
                }
            });
            if(!this.profileService.isHousekeeper(this.storedUserId)){
                this.layoutService.addSpeedDialItem({
                    icon: 'pi pi-file-edit',
                    command: () => {
                        this.isUnscheduledTaskVisible = true;
                    }
                });
                if(!this.profileService.isHouseTechnician(this.storedUserId)){
                    this.layoutService.addSpeedDialItem({
                        icon: 'pi pi-clipboard',
                        command: () => {
                            this.isNotesWindowVisible = true;
                            this.positions['notes'] = { x: 0, y: 0 };
                            localStorage.setItem('windowPositions', JSON.stringify(this.positions));
                        }
                    });
                    this.layoutService.addSpeedDialItem({
                        icon: 'pi pi-arrow-right-arrow-left',
                        command: () => {
                            this.isArrivalsAndDeparturesWindowVisible = true;
                            this.positions['arrivals'] = { x: 0, y: 0 };
                            localStorage.setItem('windowPositions', JSON.stringify(this.positions));
                        }
                    });
                }
            } 
        }
    }

    loadStoredWindowPositions(){
        const saved = localStorage.getItem('windowPositions');

        if(!saved) return;

        this.positions = JSON.parse(saved);

        if (this.positions['notes']) {
            this.isNotesWindowVisible = true;
        }

        if (this.positions['arrivals']) {
            this.isArrivalsAndDeparturesWindowVisible = true;
        }
    }

    async getStoredImagesForTask(task: Task) {
        try {
            const fetchedImages = await this.dataService.getStoredImagesForTask(task.task_id);

            if (!fetchedImages || fetchedImages.length === 0) {
                console.warn('No images found.');
                this.taskImages = [];
                return;
            }

            this.taskImages = await Promise.all(
                fetchedImages.map(async (image: any) => {
                    const url = await this.dataService.getPublicUrlForImage(`task-${task.task_id}/${image.name}`);
                    return { name: image.name, url };
                })
            );

            this.taskImages;
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    }

    onLocationSelect(){
        const houses = this.houses.filter(house => this.selectedHouseNamesForTaskReport.includes(house.house_name));

        if(houses.find(house => house.house_name == 'Zgrada' || house.house_name == 'Parcele')){
            this.taskTypes = this.taskTypes.filter(tt => tt.task_type_name == 'Ostalo' || tt.task_type_name == 'Popravak');
        } else {
            this.taskTypes = [...this.otherTaskTypes];
        }
    }

    isOutsideClicked(event: MouseEvent) {
        const sidebarEl = document.querySelector('.layout-sidebar');
        const topbarEl = document.querySelector('.layout-menu-button');
        const eventTarget = event.target as Node;

        return !(sidebarEl?.isSameNode(eventTarget) || sidebarEl?.contains(eventTarget) || topbarEl?.isSameNode(eventTarget) || topbarEl?.contains(eventTarget));
    }

    hideMenu() {
        this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    get containerClass() {
        return {
            'layout-overlay': this.layoutService.layoutConfig().menuMode === 'overlay',
            'layout-static': this.layoutService.layoutConfig().menuMode === 'static',
            'layout-static-inactive': this.layoutService.layoutState().staticMenuDesktopInactive && this.layoutService.layoutConfig().menuMode === 'static',
            'layout-overlay-active': this.layoutService.layoutState().overlayMenuActive,
            'layout-mobile-active': this.layoutService.layoutState().staticMenuMobileActive
        };
    }

    ngOnDestroy() {
        this.visibilityChangeSub.unsubscribe();

        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }

    isFaultReportFormValid(): boolean {
        return !!this.selectedHouseForFaultReport;
    }

    isUnscheduledTaskFormValid(): boolean {
        return !!this.selectedHouseNamesForTaskReport.length && !!this.selectedTaskType;
    }

    submitFaultReport() {
        if (!this.isFaultReportFormValid()) return;

        this.taskService.createTaskForHouse(
            this.selectedHouseForFaultReport!.house_id.toString(),
            this.faultDescription,
            TaskTypeName.Repair,
            true
        ).then(async result => {
            if (result) {
                try {
                    if(this.imagesToUpload.length){
                        await this.taskService.storeImagesForTask(this.imagesToUpload, result.task_id);
                    }

                    this.messageService.add({
                        severity: 'success',
                        summary: this.translateService.instant('APP-LAYOUT.REPAIR-TASK-REPORT.MESSAGES.SUCCESS'),
                        detail: this.translateService.instant('APP-LAYOUT.REPAIR-TASK-REPORT.MESSAGES.REPAIR-REPORT.SUCCESS'),
                    });

                    this.resetFaultReportForm();
                } catch (imagesSaveError) {
                    console.error('Error saving images: ', imagesSaveError);
                }
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: this.translateService.instant('APP-LAYOUT.REPAIR-TASK-REPORT.MESSAGES.ERROR'),
                    detail: this.translateService.instant('APP-LAYOUT.REPAIR-TASK-REPORT.MESSAGES.REPAIR-REPORT.ERORR'),
                });
            }
        });
    }

    submitUnscheduledTask() {
        if (!this.isUnscheduledTaskFormValid()) return;

        const createPromises = this.selectedHouseNamesForTaskReport.map(houseName => {
            const house = this.houseService.getHouseByName(houseName);
            if (!house) return Promise.resolve(null);

            return this.taskService.createTaskForHouse(
                house.house_id.toString(),
                this.taskDescription,
                this.selectedTaskType!.task_type_name as TaskTypeName,
                true
            );
        });

        Promise.all(createPromises).then(results => {
            const allSucceeded = results.every(result => result != null);

            if (allSucceeded) {
                this.messageService.add({
                    severity: 'success',
                    summary: this.translateService.instant('APP-LAYOUT.UNSCHEDULED-TASK-REPORT.MESSAGES.SUCCESS'),
                    detail: this.translateService.instant('APP-LAYOUT.UNSCHEDULED-TASK-REPORT.MESSAGES.TASK-REPORT.SUCCESS'),
                });
                this.resetUnscheduledTaskForm();
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: this.translateService.instant('APP-LAYOUT.UNSCHEDULED-TASK-REPORT.MESSAGES.ERROR'),
                    detail: this.translateService.instant('APP-LAYOUT.UNSCHEDULED-TASK-REPORT.MESSAGES.TASK-REPORT.ERROR'),
                });
            }
        });
    }

    resetUnscheduledTaskForm(){
        this.selectedTaskType = null;
        this.taskDescription = '';
        this.isUnscheduledTaskVisible = false;
        this.selectedHouseNamesForTaskReport = [];
        this.taskTypes = [...this.otherTaskTypes];
    }

    resetFaultReportForm(){
        this.selectedHouseForFaultReport = null;
        this.selectedHouse = null;
        this.faultDescription = '';
        this.faultReportVisible = false;
        this.capturedImage = '';
        this.taskImages = [];
        this.imagesToUpload = [];
    }

    async saveImage() {
        if (this.imageToUpload && this.capturedImage) {
            const renamedFile = this.renameImageNameForSupabaseStorage();

            if (this.task && Object.keys(this.task).length > 0) {
                this.taskImages.push({
                    url: this.capturedImage,
                    file: renamedFile
                });
            } else {
                this.taskImages.push({
                    base64Url: this.capturedImage,
                    file: renamedFile
                });
            }

            this.imagesToUpload.push(renamedFile);
            this.capturedImage = '';
        } else {
            console.log('Image or id null');
        }

        if (this.task) {
            await this.taskService.storeImagesForTask(this.imagesToUpload, this.task.task_id);
        }
    }

    discardImage() {
        this.capturedImage = '';
    }

    handleImageCapture(event: any) {
        this.imageToUpload = event.target.files[0];
        if (this.imageToUpload) {
            const reader = new FileReader();
            reader.onload = () => {
                this.capturedImage = reader.result as string;
            };
            reader.readAsDataURL(this.imageToUpload);
        }
    }

    openCamera() {
        this.fileInput.nativeElement.click();
    }

    onOpenImage(element: HTMLElement) {
        if(element){
            element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) { // Safari
            (element as any).webkitRequestFullscreen();
        } else if ((element as any).msRequestFullscreen) { // IE11
            (element as any).msRequestFullscreen();
        }
    }

    private renameImageNameForSupabaseStorage() {
        const sanitizedFileName = this.imageToUpload.name.replace(/\s+/g, '-');

        const renamedFile = new File([this.imageToUpload], sanitizedFileName, {
            type: this.imageToUpload.type,
            lastModified: this.imageToUpload.lastModified
        });

        return renamedFile;
    }

    resetForm(window: string) {
        if(window == 'unscheduled-task-report'){
            this.resetUnscheduledTaskForm();
        } else if (window == 'fault-report'){
            this.resetFaultReportForm();
        } else if(window == 'task-details'){
            this.selectedTabIndex = "0";
            this.taskService.$taskModalData.next(null);
        }

        this.task = undefined;
    }

    removeImage(imageToRemove: any, event: any, window: string) {
        if (window == 'task-details') {
            this.confirmationService.confirm({
                target: event.target,
                message: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.REMOVE-IMAGE.WARNING'),
                header: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.REMOVE-IMAGE.HEADER'),
                icon: 'pi pi-exclamation-triangle',
                rejectLabel: 'Cancel',
                rejectButtonProps: {
                    label: this.translateService.instant('BUTTONS.CANCEL'),
                    severity: 'secondary',
                    outlined: true
                },
                acceptButtonProps: {
                    label: this.translateService.instant('BUTTONS.CONFIRM'),
                    severity: 'danger'
                },
                accept: async () => {
                    this.taskService.removeImageForTask(imageToRemove, this.task!.task_id);
                    this.messageService.add({ severity: 'info', summary: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.UPDATED'), detail: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.REMOVE-IMAGE.SUCCESS') });
                    this.taskImages = this.taskImages.filter((ti) => ti.url != imageToRemove.url);
                },
                reject: () => {
                    this.messageService.add({ severity: 'warn', summary: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.CANCELLED'), detail: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.REMOVE-IMAGE.CANCELLED') });
                }
            });
        } else {
            this.taskImages = this.taskImages.filter((ti) => ti.file != imageToRemove.file);
            this.imagesToUpload = this.imagesToUpload.filter((itu) => itu != imageToRemove.file);
        }
    }

    closeNotesWindow() {
        this.isNotesWindowVisible = false;
        const stored = localStorage.getItem('windowPositions');

        if (stored) {
            delete this.positions['notes'];
            localStorage.setItem('windowPositions', JSON.stringify(this.positions));
        }
    }

    closeArrivalsAndDeparturesWindow() {
        this.isArrivalsAndDeparturesWindowVisible = false;
        const stored = localStorage.getItem('windowPositions');

        if (stored) {
            delete this.positions['arrivals'];
            localStorage.setItem('windowPositions', JSON.stringify(this.positions));
        }
    }

    onDragEnd(windowKey: string, event: CdkDragEnd) {
        const pos = event.source.getFreeDragPosition();
        this.positions[windowKey] = { x: pos.x, y: pos.y };
        localStorage.setItem('windowPositions', JSON.stringify(this.positions));
    }

    getWindowPosition(windowKey: string): { [key: string]: string } {
        const pos = this.positions[windowKey];
        return pos ? { transform: `translate(${pos.x}px, ${pos.y}px)` } : {};
    }

    addComment(event: any) {
        event.preventDefault();
        this.comment = this.comment.trim();

        if (this.comment) {
            this.taskService.addCommentOnRepairTask(this.comment, this.task!.task_id);
            this.comment = '';
        }
    }

    deleteTask(event: any, task: Task | undefined){
        if(!task) return;

        this.confirmationService.confirm({
            target: event.target,
            message: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.TASK-DELETE.WARNING'),
            header: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.TASK-DELETE.HEADER'),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'Cancel',
            rejectButtonProps: {
                label: this.translateService.instant('BUTTONS.CANCEL'),
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: this.translateService.instant('BUTTONS.CONFIRM'),
                severity: 'danger'
            },
            accept: async () => {
                this.taskService.deleteTask(task.task_id)
                    .then(res => {
                        if(res){
                            this.isTaskDetailsWindowVisible = false;
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting task: ', error);
                    });
                this.messageService.add({ severity: 'info', summary: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.UPDATED'), detail: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.TASK-DELETE.SUCCESS') });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.CANCELLED'), detail: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.TASK-DELETE.CANCELLED') });
            }
        });
    }

    closeSpeedDial(){
        this.isSpeedDialVisible = false;
    }

    subscribeToModalData(){
        this.taskService.$taskModalData.subscribe((res) => {
            if(!res) {
                this.isTaskDetailsWindowVisible = false;
                return;
            }

            this.resetForm('fault-report');
            this.task = this.tasks.find((task) => task.task_id == res.task_id);
            this.isTaskDetailsWindowVisible = true;
            this.faultReportVisible = false;

            if (this.task && this.taskService.isRepairTask(this.task)) {
                this.getStoredImagesForTask(this.task);
                this.commentsForTask = this.comments.filter((comments) => comments.task_id == this.task!.task_id);
                this.areCommentsLoaded = true;
            } else {
                this.taskImages = [];
                this.commentsForTask = [];
                this.areCommentsLoaded = false;
            }
        });

        this.profileService.$profileModalData.subscribe((profileData) => {
            if(!profileData) return;

            this.profileModalData = this.profiles.find(profile => profile.id == profileData.id);
            this.isProfileDetailsWindowVisible = true;
            const profileRoleName = this.profileService.getProfileRoleNameById(this.profileModalData.role_id);

            this.profileModalData = {
                ...this.profileModalData,
                email: this.authService.normalizeEmail(this.profileModalData.first_name),
                translated_role: this.languageService.getSelectedLanguageCode() == 'en' ? this.profileService.translationMap[profileRoleName] : profileRoleName,
            }
        });
    }

    subscribeToDataUpdates(){
        this.dataService.$repairTaskCommentsUpdate.subscribe((res) => {
            if (res && res.new.id && res.eventType == 'INSERT') {
                let existingComment = this.comments.find((comment) => comment.id == res.new.id);

                if (!existingComment) {
                    this.comments = [...this.comments, res.new];
                    this.commentsForTask = this.comments.filter((comments) => comments.task_id == this.task?.task_id);
                }
            }
        });

        this.dataService.$workGroupsUpdate.subscribe((res) => {
            if (res && res.new.work_group_id && res.eventType == 'INSERT') {
                if (!this.workGroups.find((wg) => wg.work_group_id == res.new.work_group_id)) {
                    this.workGroups = [...this.workGroups, res.new];
                    this.dataService.setWorkGroups(this.workGroups);
                }
            } else if (res && res.new.work_group_id && res.eventType == 'UPDATE') {
                let workGroupIndex = this.workGroups.findIndex((wg) => wg.work_group_id == res.new.work_group_id);

                if (workGroupIndex != -1) {
                    this.workGroups = [...this.workGroups.slice(0, workGroupIndex), res.new, ...this.workGroups.slice(workGroupIndex + 1)];
                    this.dataService.setWorkGroups(this.workGroups);
                }
            } else if (res && res.old.work_group_id && res.eventType == 'DELETE') {
                this.workGroups = this.workGroups.filter((wg) => wg.work_group_id != res.old.work_group_id);
                this.dataService.setWorkGroups(this.workGroups);
            }
        });

        this.dataService.$tasksUpdate.subscribe((res) => {
            if (res && res.new.task_id && res.eventType == 'INSERT') {
                console.log("Insert on tasks: ", res);
                if (!this.tasks.find((task) => task.task_id == res.new.task_id)) {
                    console.log("A new task has arrived: ", res);
                    this.tasks = [...this.tasks, res.new];
                    this.dataService.setTasks(this.tasks);
                }
            } else if (res && res.new.task_id && res.eventType == 'UPDATE') {
                console.log("Update on tasks: ", res);
                let taskIndex = this.tasks.findIndex((task) => task.task_id == res.new.task_id);

                if (taskIndex != -1) {
                    console.log("A task has been updated: ", res);
                    this.tasks = this.tasks.map((task) => (task.task_id === res.new.task_id ? res.new : task));

                    this.dataService.setTasks(this.tasks);
                }
            } else if (res && res.old.task_id && res.eventType == 'DELETE') {
                console.log("Delete on tasks: ", res);
                this.tasks = this.tasks.filter((task) => task.task_id != res.old.task_id);
                this.dataService.setTasks(this.tasks);
            }
        });

        this.dataService.$workGroupTasksUpdate.subscribe((res) => {
            if (res && res.new.task_id && res.eventType == 'INSERT') {
                if (!this.workGroupTasks.find((wgt) => wgt.task_id == res.new.task_id)) {
                    this.workGroupTasks = [...this.workGroupTasks, res.new];
                    this.dataService.setWorkGroupTasks(this.workGroupTasks);
                }
            } else if (res && res.old.task_id && res.eventType == 'DELETE') {
                this.workGroupTasks = this.workGroupTasks.filter((wgt) => wgt.task_id != res.old.task_id);
                this.dataService.setWorkGroupTasks(this.workGroupTasks);
            }
        });

        this.dataService.$workGroupProfilesUpdate.subscribe((res) => {
            if (res && res.new.work_group_id && res.eventType == 'INSERT') {
                if(!this.workGroupProfiles.find(wgp => wgp.profile_id == res.new.profile_id && wgp.work_group_id == res.new.work_group_id)){
                    this.workGroupProfiles = [...this.workGroupProfiles, res.new];
                    this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
                }
            } else if (res && res.old.profile_id && res.old.work_group_id && res.eventType == 'DELETE') {
                this.workGroupProfiles = this.workGroupProfiles.filter((wgp) => !(wgp.profile_id == res.old.profile_id && wgp.work_group_id == res.old.work_group_id));
                this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
            }
        });

        this.dataService.$houseAvailabilitiesUpdate.subscribe((res) => {
            if(res && res.new.house_availability_id && res.eventType == 'INSERT') {
                if(!this.houseAvailabilities().find(ha => ha.house_availability_id == res.new.house_availability_id)){
                    this.houseAvailabilities.update(current => [...current, res.new]);
                    this.dataService.setHouseAvailabilites(this.houseAvailabilities());
                }
            }
            else if (res && res.new.house_availability_id && res.eventType == 'UPDATE') {
                let houseAvailabilityIndex = this.houseAvailabilities().findIndex((ha) => ha.house_availability_id == res.new.house_availability_id);

                if (houseAvailabilityIndex != -1) {
                    const updatedHouseAvailabilites = [...this.houseAvailabilities()];
                    updatedHouseAvailabilites[houseAvailabilityIndex] = res.new;
                    this.dataService.setHouseAvailabilites(updatedHouseAvailabilites);
                }
            } else if(res && res.old.house_availability_id && res.eventType == 'DELETE'){
                const filtered = this.houseAvailabilities().filter(ha => ha.house_availability_id !== res.old.house_availability_id);
                this.houseAvailabilities.set(filtered);
                this.dataService.setHouseAvailabilites(filtered);
            }
        });

        this.dataService.$tempHouseAvailabilitiesUpdate.subscribe((res) => {
            if(res && res.new.house_availability_id && res.eventType == 'INSERT'){
                if(!this.tempHouseAvailabilities.find(tha => tha.house_availability_id == res.new.house_availability_id)){
                    this.tempHouseAvailabilities = [...this.tempHouseAvailabilities, res.new];
                    this.dataService.setTempHouseAvailabilities(this.tempHouseAvailabilities);
                }
            } else if(res && res.new.house_availability_id && res.eventType == 'UPDATE'){
                const tempHouseAvailabilitiesIndex = this.tempHouseAvailabilities.findIndex(tha => tha.house_availability_id == res.new.house_availability_id);

                if(tempHouseAvailabilitiesIndex != -1){
                    const updatedTempHouseAvailabilities = [...this.tempHouseAvailabilities];
                    updatedTempHouseAvailabilities[tempHouseAvailabilitiesIndex] = res.new;
                    this.dataService.setTempHouseAvailabilities(updatedTempHouseAvailabilities);
                }
            } else if(res && res.old.house_availability_id && res.eventType == 'DELETE'){
                this.tempHouseAvailabilities = this.tempHouseAvailabilities.filter(tha => tha.house_availability_id != res.old.house_availability_id);
                this.dataService.setTempHouseAvailabilities(this.tempHouseAvailabilities);
            }
        });

        this.dataService.$profileWorkScheduleUpdate.subscribe(res => {
            if(res && res.new.id && res.eventType == 'INSERT'){
                if(!this.fullWorkSchedule.find(sch => sch.id == res.new.id)){
                    this.fullWorkSchedule = [...this.fullWorkSchedule, res.new];
                    this.dataService.setFullWorkSchedule(this.fullWorkSchedule);
                }
            } else if(res && res.new.id && res.eventType == 'UPDATE'){
                const profileWorkScheduleIndex = this.fullWorkSchedule.findIndex(schedule => schedule.id == res.new.id);

                if(profileWorkScheduleIndex != -1){
                    const updatedFullWorkSchedule = [...this.fullWorkSchedule];
                    updatedFullWorkSchedule[profileWorkScheduleIndex] = res.new;
                    this.dataService.setFullWorkSchedule(updatedFullWorkSchedule);
                }
            } else if(res && res.old.id && res.eventType == 'DELETE'){
                this.fullWorkSchedule = this.fullWorkSchedule.filter(schedule => schedule.id != res.old.id);
                this.dataService.setFullWorkSchedule(this.fullWorkSchedule);
            }
        });

        this.dataService.$profilesUpdate.subscribe((res) => {
            if(res && res.new.id && res.eventType == 'INSERT'){
                if(!this.profiles.find(profile => profile.id == res.new.id)){
                    this.profiles = [...this.profiles, res.new];
                    this.dataService.setProfiles(this.profiles);
                }
            } else if(res && res.new.id && res.eventType == 'UPDATE'){
                let profileIndex = this.profiles.findIndex(profile => profile.id == res.new.id);

                if(profileIndex != -1){
                    const updatedProfiles = [...this.profiles];
                    updatedProfiles[profileIndex] = res.new;
                    this.dataService.setProfiles(updatedProfiles);
                }
            } else if (res && res.old.id && res.eventType == 'DELETE'){
                this.profiles = this.profiles.filter(profile => profile.id != res.old.id);
                this.dataService.setProfiles(this.profiles);

                if(res.old.id == this.storedUserId){
                    this.authService.logout();
                }
            }
        });

        this.dataService.$notesUpdate.subscribe(res => {
            if(res && res.new.id && res.eventType == 'INSERT'){
                if(!this.notes.find(note => note.id == res.new.id)){
                    this.notes = [...this.notes, res.new];
                    this.dataService.setNotes(this.notes);
                }
            }
        });
    }
}
