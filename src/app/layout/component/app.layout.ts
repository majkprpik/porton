import { HouseAvailability, HouseStatus, Note, Profile, WorkGroup, WorkGroupProfile, WorkGroupTask } from './../../pages/service/data.service';
import { Component, ElementRef, Renderer2, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { LayoutService } from '../service/layout.service';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { DataService, House, RepairTaskComment, Task, TaskProgressType, TaskType } from '../../pages/service/data.service';
import { TaskService } from '../../pages/service/task.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotesComponent } from './notes.component';
import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ArrivalsAndDeparturesComponent } from './arrivals-and-departures.component';
import { TabViewModule } from 'primeng/tabview';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProfileService } from '../../pages/service/profile.service';
import { AuthService } from '../../pages/service/auth.service';

// Define a special location interface for Zgrada and Parcela options
interface SpecialLocation {
    name: string;
    type: string;
}

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
        DropdownModule,
        InputTextarea,
        ButtonModule,
        FormsModule,
        ToastModule,
        NotesComponent,
        ArrivalsAndDeparturesComponent,
        CdkDrag,
        CdkDragHandle,
        TabViewModule,
        ChipModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: ` <div class="layout-wrapper" [ngClass]="containerClass" #dragBoundary>
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
                    header="Detalji zadatka" 
                    [(visible)]="isTaskDetailsWindowVisible"
                    [modal]="true"
                    [style]="{ width: '30rem' }"
                    [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
                    (onHide)="resetForm('task-details')"
                >
                    <ng-template pTemplate="header">
                        <div class="dialog-header">
                        <span>Detalji zadatka</span>
                        <div class="header-icons">
                            <div class="trash-icon" (click)="deleteTask($event, task)">
                                <i class="pi pi-trash"></i>
                            </div>
                        </div>
                        </div>
                    </ng-template>
                    <p-tabView class="team-card">
                        @if (getTaskTypeName(task) == 'Popravak') {
                            <p-tabPanel header="Detalji">
                                <div class="details">
                                    <div>
                                        <span><b>Kućica:</b> {{ getHouseForTask(task)?.house_name }}</span>
                                    </div>

                                    <div>
                                        <span><b>Tip:</b> {{ getTaskTypeName(task) }}</span>
                                    </div>

                                    <div>
                                        <span><b>Status:</b> {{ getTaskProgressTypeName(task) }}</span>
                                    </div>

                                    <div>
                                        <span><b>Opis:</b> {{ task?.description }}</span>
                                    </div>
                                </div>
                            </p-tabPanel>
                            <p-tabPanel header="Slike">
                                @if (!capturedImage) {
                                    <div class="upload-a-photo">
                                        @if (!taskImages.length) {
                                            <label for="description" class="font-bold block mb-2">Učitaj sliku</label>
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
                                                <span class="camera-icon-label">Capture an image...</span>
                                            </div>
                                        </div>
                                    </div>
                                } @else {
                                    <div class="save-captured-image">
                                        <label for="description" class="font-bold block mb-2">Spremi fotografiju?</label>
                                        <div class="captured-image-container">
                                            <img [src]="capturedImage" alt="Captured Photo" />
                                            <div class="save-captured-image-buttons">
                                                <button pButton label="Odbaci" class="p-button-text" (click)="discardImage()"></button>

                                                <button pButton label="Spremi" (click)="saveImage()"></button>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </p-tabPanel>
                            <p-tabPanel header="Komentari">
                                <div class="comments-content" #commentsContainer>
                                    @if (!commentsForTask.length && !areCommentsLoaded) {
                                        <span>Loading comments...</span>
                                    } @else if (!commentsForTask.length && areCommentsLoaded) {
                                        <span>No comments for this task.</span>
                                    } @else {
                                        @for (comment of commentsForTask; track $index) {
                                            <span
                                                ><b>{{ profileService.findProfile(comment.user_id)?.first_name }} - {{ comment.created_at | date: 'HH:mm' : 'UTC' }}:</b> {{ comment.comment }}</span
                                            >
                                        }
                                    }
                                </div>

                                <div class="comments-footer">
                                    <textarea placeholder="Add a comment..." [(ngModel)]="comment" (keydown.enter)="addComment($event)"></textarea>
                                </div>
                            </p-tabPanel>
                        } @else {
                            <div class="details">
                                <div>
                                    <span><b>Kućica:</b> {{ getHouseForTask(task)?.house_name }}</span>
                                </div>

                                <div>
                                    <span><b>Tip:</b> {{ getTaskTypeName(task) }}</span>
                                </div>

                                <div>
                                    <span><b>Status:</b> {{ getTaskProgressTypeName(task) }}</span>
                                </div>

                                <div>
                                    <span><b>Opis:</b> {{ task?.description }}</span>
                                </div>
                            </div>
                        }
                    </p-tabView>
                </p-dialog>
            </div>
        </div>
        <div class="layout-mask animate-fadein"></div>
        <!-- <app-debug-overlay></app-debug-overlay> -->

        <p-speedDial
            [model]="menuItems"
            [radius]="120"
            type="quarter-circle"
            direction="up-left"
            buttonClassName="p-button-primary"
            [buttonProps]="{ size: 'large', raised: true }"
            showIcon="pi pi-list"
            hideIcon="pi pi-times"
            [transitionDelay]="80"
        ></p-speedDial>

        <!-- Fault Report Dialog -->
        <p-dialog header="Prijava kvara" [(visible)]="faultReportVisible" [modal]="true" [style]="{ width: '30rem' }" [breakpoints]="{ '960px': '75vw', '641px': '90vw' }" (onHide)="resetForm('fault-report')">
            <div class="fault-report-form">
                <div class="field">
                    <label for="location" class="font-bold block mb-2">Lokacija*</label>
                    <p-dropdown id="location" [options]="locationOptions" [(ngModel)]="selectedLocation" placeholder="Odaberi lokaciju" [style]="{ width: '100%' }" (onChange)="onLocationChange($event)">
                        <ng-template let-item pTemplate="item">
                            <span>{{ item.name || item.house_name }}</span>
                        </ng-template>
                        <ng-template let-item pTemplate="selectedItem">
                            <span>{{ item.name || item.house_name }}</span>
                        </ng-template>
                    </p-dropdown>
                </div>

                <div class="field mt-4">
                    <label for="description" class="font-bold block mb-2">Opis</label>
                    <textarea id="description" pInputTextarea [(ngModel)]="faultDescription" [rows]="5" [style]="{ width: '100%' }" placeholder="Unesite opis kvara"></textarea>
                </div>

                @if (!capturedImage) {
                    <div class="upload-a-photo">
                        @if (!taskImages.length) {
                            <label for="description" class="font-bold block mb-2">Učitaj sliku</label>
                        } @else {
                            <label for="description" class="font-bold block mb-2">Učitane slike</label>
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
                                <span class="camera-icon-label">Capture an image...</span>
                            </div>
                        </div>
                    </div>
                } @else {
                    <div class="save-captured-image">
                        <label for="description" class="font-bold block mb-2">Spremi fotografiju?</label>
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
                        <button pButton label="Odustani" class="p-button-text" (click)="faultReportVisible = false"></button>
                        <button pButton label="Prijavi" (click)="submitFaultReport()" [disabled]="!isFormValid()"></button>
                    </div>
                }
            </ng-template>
        </p-dialog>

        <!-- Extraordinary Task Dialog -->
        <p-dialog header="Prijava izvanrednog zadatka" [(visible)]="extraordinaryTaskVisible" [modal]="true" [style]="{ width: '30rem' }" [breakpoints]="{ '960px': '75vw', '641px': '90vw' }">
            <div class="task-form">
                <div class="field">
                    <label for="location" class="font-bold block mb-2">Lokacija*</label>
                    <p-dropdown id="location" [options]="locationOptions" [(ngModel)]="selectedLocationForTask" placeholder="Odaberi lokaciju" [style]="{ width: '100%' }" (onChange)="onLocationChangeForTask($event)">
                        <ng-template let-item pTemplate="item">
                            <span>{{ item.name || item.house_name }}</span>
                        </ng-template>
                        <ng-template let-item pTemplate="selectedItem">
                            <span>{{ item.name || item.house_name }}</span>
                        </ng-template>
                    </p-dropdown>
                </div>

                <div class="field mt-4">
                    <label for="taskType" class="font-bold block mb-2">Vrsta zadatka*</label>
                    <p-dropdown id="taskType" [options]="taskTypes" [(ngModel)]="selectedTaskType" optionLabel="task_type_name" placeholder="Odaberi vrstu zadatka" [style]="{ width: '100%' }"></p-dropdown>
                </div>

                <div class="field mt-4">
                    <label for="taskDescription" class="font-bold block mb-2">Opis</label>
                    <textarea id="taskDescription" pInputTextarea [(ngModel)]="taskDescription" [rows]="5" [style]="{ width: '100%' }" placeholder="Unesite opis zadatka"></textarea>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton label="Odustani" class="p-button-text" (click)="extraordinaryTaskVisible = false"></button>
                    <button pButton label="Prijavi zadatak" (click)="submitExtraordinaryTask()" [disabled]="!isTaskFormValid()"></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>

        <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
    </div>`,
    styles: [
        `
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

                .layout-main-container {
                    // padding-bottom: 6rem; /* Add space at bottom to prevent SpeedDial from covering content */
                }
            }

            .team-card {
                padding: 0 !important;

                .comments-content {
                    min-height: 150px;
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
                    height: 50px;
                    width: 100%;
                    border-radius: 0 0 10px 10px;
                    border-top: 1px solid #e5e7eb;

                    textarea {
                        width: 100%;
                        height: 100%;
                        border-radius: 0 0 10px 10px;
                        resize: none;
                        box-sizing: border-box;
                        padding: 10px;
                        outline: none;

                        &:disabled {
                            background-color: var(--surface-ground);
                        }
                    }
                }
            }

            .fault-report-form,
            .task-form,
            .team-card {
                padding: 1.5rem 0;

                .field {
                    margin-bottom: 1rem;
                }

                label {
                    color: var(--text-color);
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
                                    }
                                }

                                img {
                                    border-radius: 5px;
                                    height: 200px;
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

                .save-captured-image {
                    width: 100%;

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
                width: 480px;
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
                    left: 15px;
                    color: #ccc;
                    cursor: move;
                    width: 24px;
                    height: 24px;
                }

                .close-arrivals-and-departures-window {
                    position: absolute;
                    top: 8px;
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

            p-dialog {
                .details {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-top: 10px;

                    span {
                        font-size: 16px;
                    }

                    .task-images {
                        width: 100%;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        overflow-x: auto;
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
                  gap: 15px;
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
        `
    ]
})
export class AppLayout {
    overlayMenuOpenSubscription: Subscription;
    menuOutsideClickListener: any;

    @ViewChild('fileInput') fileInput!: ElementRef;
    @ViewChild(AppSidebar) appSidebar!: AppSidebar;
    @ViewChild(AppTopbar) appTopBar!: AppTopbar;

    // Special locations
    specialLocations: SpecialLocation[] = [
        { name: 'Zgrada', type: 'building' },
        { name: 'Parcela', type: 'parcel' }
    ];

    // Combined location options
    locationOptions: (House)[] = [];

    // Dialog visibility flags
    faultReportVisible: boolean = false;
    extraordinaryTaskVisible: boolean = false;
    isNotesWindowVisible: boolean = false;
    isArrivalsAndDeparturesWindowVisible: boolean = false;
    isTaskDetailsWindowVisible: boolean = false;

    // Form fields
    selectedLocation: House | null = null;
    selectedHouse: House | null = null;
    faultDescription: string = '';
    locationType: string = 'house';

    // Form fields for extraordinary task
    selectedLocationForTask: House | null = null;
    selectedHouseForTask: House | null = null;
    locationTypeForTask: string = 'house';
    selectedTaskType: TaskType | null = null;
    taskDescription: string = '';

    houses: House[] = [];
    taskTypes: TaskType[] = [];
    otherTaskTypes: TaskType[] = [];
    taskProgressTypes: TaskProgressType[] = [];
    task: any = {};
    tasks: Task[] = [];
    profiles: Profile[] = [];

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

    houseStatuses = signal<HouseStatus[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    tempHouseAvailabilities: HouseAvailability[] = [];

    notes: Note[] = [];

    menuItems: MenuItem[] = [
        {
            icon: 'pi pi-wrench',
            command: () => {
                this.faultReportVisible = true;
                this.isTaskDetailsWindowVisible = false;
                this.resetForm('task-details');
            }
        },
        {
            icon: 'pi pi-file-edit',
            command: () => {
                this.extraordinaryTaskVisible = true;
            }
        },
        {
            icon: 'pi pi-clipboard',
            command: () => {
                this.isNotesWindowVisible = true;
                this.positions['notes'] = { x: 0, y: 0 };
                localStorage.setItem('windowPositions', JSON.stringify(this.positions));
            }
        },
        {
            icon: 'pi pi-arrow-right-arrow-left',
            command: () => {
                this.isArrivalsAndDeparturesWindowVisible = true;
                this.positions['arrivals'] = { x: 0, y: 0 };
                localStorage.setItem('windowPositions', JSON.stringify(this.positions));
            }
        }
    ];

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router,
        private dataService: DataService,
        public taskService: TaskService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        public profileService: ProfileService,
        private authService: AuthService,
    ) {
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

    ngOnInit() {
        combineLatest([
            this.dataService.repairTaskComments$,
            this.dataService.houses$,
            this.dataService.taskTypes$,
            this.dataService.taskProgressTypes$,
            this.dataService.tasks$,
            this.dataService.workGroups$,
            this.dataService.workGroupTasks$,
            this.dataService.workGroupProfiles$,
            this.dataService.houseStatuses$,
            this.dataService.houseAvailabilities$,
            this.dataService.profiles$,
            this.dataService.tempHouseAvailabilities$,
            this.dataService.notes$,
        ]).subscribe({
            next: ([repairTaskComments, houses, taskTypes, taskProgressTypes, tasks, workGroups, workGroupTasks, workGroupProfiles, houseStatuses, houseAvailabilities, profiles, tempHouseAvailabilities, notes]) => {
                this.comments = repairTaskComments;
                this.houses = houses;
                this.taskTypes = taskTypes;
                this.otherTaskTypes = taskTypes;
                this.taskProgressTypes = taskProgressTypes;
                this.tasks = tasks;
                this.workGroups = workGroups;
                this.workGroupTasks = workGroupTasks;
                this.workGroupProfiles = workGroupProfiles;
                this.houseStatuses.set(houseStatuses);
                this.houseAvailabilities.set(houseAvailabilities);
                this.profiles = profiles;
                this.tempHouseAvailabilities = tempHouseAvailabilities;
                this.notes = notes;

                if (houses) {
                    this.updateLocationOptions();
                }
            },
            error: (error) => {
                console.error(error);
            }
        });

        this.router.events
            .pipe(filter(e => e instanceof NavigationEnd))
        	.subscribe((e: NavigationEnd) => {
                if(e.urlAfterRedirects === '/home'){
                    this.loadStoredWindowPositions();
                } else {
                    this.isNotesWindowVisible = false;
                    this.isArrivalsAndDeparturesWindowVisible = false;
                }
        	});

        this.taskService.$taskModalData.subscribe((res) => {
            if (res) {
                this.resetForm('fault-report');

                this.task = this.tasks.find((task) => task.task_id == res.task_id);

                this.isTaskDetailsWindowVisible = true;
                this.faultReportVisible = false;

                this.commentsForTask = this.comments.filter((comments) => comments.task_id == this.task.task_id);
                this.areCommentsLoaded = true;

                if (this.getTaskTypeName(this.task) == 'Popravak') {
                    this.getStoredImagesForTask(this.task);
                } else {
                    this.taskImages = [];
                }
            } else {
                this.isTaskDetailsWindowVisible = false;
            }
        });

        // Load initial data
        this.dataService.loadHouses().subscribe();
        this.dataService.getTaskTypes().subscribe();
        this.createDeletedUser();


        if(this.router.url == '/home'){
            this.loadStoredWindowPositions();
        }

        this.dataService.$repairTaskCommentsUpdate.subscribe((res) => {
            if (res && res.eventType == 'INSERT') {
                let existingComment = this.comments.find((comment) => comment.id == res.new.id);

                if (!existingComment) {
                    this.comments = [...this.comments, res.new];
                    this.commentsForTask = this.comments.filter((comments) => comments.task_id == this.task.task_id);
                }
            }
        });

        this.dataService.$workGroupsUpdate.subscribe((res) => {
            if (res && res.eventType == 'INSERT') {
                if (!this.workGroups.find((wg) => wg.work_group_id == res.new.work_group_id)) {
                    this.workGroups = [...this.workGroups, res.new];
                    this.dataService.setWorkGroups(this.workGroups);
                }
            } else if (res && res.eventType == 'UPDATE') {
                let workGroupIndex = this.workGroups.findIndex((wg) => wg.work_group_id == res.new.work_group_id);

                if (workGroupIndex != -1) {
                    this.workGroups = [...this.workGroups.slice(0, workGroupIndex), res.new, ...this.workGroups.slice(workGroupIndex + 1)];
                    this.dataService.setWorkGroups(this.workGroups);
                }
            } else if (res && res.eventType == 'DELETE') {
                this.workGroups = this.workGroups.filter((wg) => wg.work_group_id != res.old.work_group_id);
                this.dataService.setWorkGroups(this.workGroups);
            }
        });

        this.dataService.$tasksUpdate.subscribe((res) => {
            if (res && res.eventType == 'INSERT') {
                if (!this.tasks.find((task) => task.task_id == res.new.task_id)) {
                    const updatedStatuses = this.houseStatuses().map((hs) => {
                        if (hs.house_id === res.new.house_id) {
                            const existingTask = hs.housetasks.some((task: any) => task.task_id === res.new.task_id);

                            if (!existingTask) {
                                return {
                                    ...hs,
                                    housetasks: [...hs.housetasks, res.new]
                                };
                            }
                        }
                        return hs;
                    });

                    this.dataService.setHouseStatuses(updatedStatuses);
                    this.tasks = [...this.tasks, res.new];
                    this.dataService.setTasks(this.tasks);
                }
            } else if (res && res.eventType == 'UPDATE') {
                let taskIndex = this.tasks.findIndex((task) => task.task_id == res.new.task_id);

                if (taskIndex != -1) {
                    const updatedStatuses = this.houseStatuses().map((hs) => {
                        let housetaskIndex = hs.housetasks.findIndex((ht) => ht.task_id == res.new.task_id);

                        if (housetaskIndex != -1) {
                            const updatedTasks = [...hs.housetasks];
                            updatedTasks[housetaskIndex] = res.new;

                            return {
                                ...hs,
                                housetasks: updatedTasks
                            };
                        }

                        return hs;
                    });

                    this.dataService.setHouseStatuses(updatedStatuses);
                    this.tasks = this.tasks.map((task) => (task.task_id === res.new.task_id ? res.new : task));

                    this.dataService.setTasks(this.tasks);
                }
            } else if (res && res.eventType == 'DELETE') {
                const updatedStatuses = this.houseStatuses().map(hs => {
                    if (hs.housetasks.find(ht => ht.task_id == res.old.task_id)) {
                        return {
                            ...hs,
                            housetasks: hs.housetasks.filter(ht => ht.task_id != res.old.task_id),
                        };
                    }

                    return hs;
                });
                this.dataService.setHouseStatuses(updatedStatuses);

                this.tasks = this.tasks.filter((task) => task.task_id != res.old.task_id);
                this.dataService.setTasks(this.tasks);
            }
        });

        this.dataService.$workGroupTasksUpdate.subscribe((res) => {
            if (res && res.eventType == 'INSERT') {
                if (!this.workGroupTasks.find((wgt) => wgt.task_id == res.new.task_id)) {
                    this.workGroupTasks = [...this.workGroupTasks, res.new];
                    this.dataService.setWorkGroupTasks(this.workGroupTasks);
                }
            } else if (res && res.eventType == 'DELETE') {
                this.workGroupTasks = this.workGroupTasks.filter((wgt) => wgt.task_id != res.old.task_id);
                this.dataService.setWorkGroupTasks(this.workGroupTasks);
            }
        });

        this.dataService.$workGroupProfilesUpdate.subscribe((res) => {
            if (res && res.eventType == 'INSERT') {
                this.workGroupProfiles = [...this.workGroupProfiles, res.new];
                this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
            } else if (res && res.eventType == 'DELETE') {
                this.workGroupProfiles = this.workGroupProfiles.filter((wgp) => !(wgp.profile_id == res.old.profile_id && wgp.work_group_id == res.old.work_group_id));
                this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
            }
        });

        this.dataService.$houseAvailabilitiesUpdate.subscribe((res) => {
            if(res && res.eventType == 'INSERT') {
                if(!this.houseAvailabilities().find(ha => ha.house_availability_id == res.new.house_availability_id)){
                    this.houseAvailabilities.update(current => [...current, res.new]);
                    this.dataService.setHouseAvailabilites(this.houseAvailabilities());
                }
            }
            else if (res && res.eventType == 'UPDATE') {
                let houseAvailabilityIndex = this.houseAvailabilities().findIndex((ha) => ha.house_availability_id == res.new.house_availability_id);

                if (houseAvailabilityIndex != -1) {
                    const updatedHouseAvailabilites = [...this.houseAvailabilities()];
                    updatedHouseAvailabilites[houseAvailabilityIndex] = res.new;
                    this.dataService.setHouseAvailabilites(updatedHouseAvailabilites);
                }
            } else if(res && res.eventType == 'DELETE'){
                const filtered = this.houseAvailabilities().filter(ha => ha.house_availability_id !== res.old.house_availability_id);
                this.houseAvailabilities.set(filtered);
                this.dataService.setHouseAvailabilites(filtered);
            }
        });

        this.dataService.$tempHouseAvailabilitiesUpdate.subscribe((res) => {
            if(res && res.eventType == 'INSERT'){
                if(!this.tempHouseAvailabilities.find(tha => tha.house_availability_id == res.new.house_availability_id)){
                    this.tempHouseAvailabilities = [...this.tempHouseAvailabilities, res.new];
                    this.dataService.setTempHouseAvailabilities(this.tempHouseAvailabilities);
                }
            } else if(res && res.eventType == 'UPDATE'){
                const tempHouseAvailabilitiesIndex = this.tempHouseAvailabilities.findIndex(tha => tha.house_availability_id == res.new.house_availability_id);

                if(tempHouseAvailabilitiesIndex != -1){
                    const updatedTempHouseAvailabilities = [...this.tempHouseAvailabilities];
                    updatedTempHouseAvailabilities[tempHouseAvailabilitiesIndex] = res.new;
                    this.dataService.setTempHouseAvailabilities(updatedTempHouseAvailabilities);
                }
            } else if(res && res.eventType == 'DELETE'){
                this.tempHouseAvailabilities = this.tempHouseAvailabilities.filter(tha => tha.house_availability_id != res.old.house_availability_id);
                this.dataService.setTempHouseAvailabilities(this.tempHouseAvailabilities);
            }
        });

        this.dataService.$profilesUpdate.subscribe((res) => {
            if(res && res.eventType == 'INSERT'){
                if(!this.profiles.find(profile => profile.id == res.new.id)){
                    this.profiles = [...this.profiles, res.new];
                    this.dataService.setProfiles(this.profiles);
                }
            } else if(res && res.eventType == 'UPDATE'){
                let profileIndex = this.profiles.findIndex(profile => profile.id == res.new.id);

                if(profileIndex != -1){
                    const updatedProfiles = [...this.profiles];
                    updatedProfiles[profileIndex] = res.new;
                    this.dataService.setProfiles(updatedProfiles);
                }
            } else if (res && res.eventType == 'DELETE'){
                if(res.old.id == this.authService.getStoredUserId()){
                    this.authService.logout();
                }

                this.profiles = this.profiles.filter(profile => profile.id != res.old.id);
                this.dataService.setProfiles(this.profiles);
            }
        });

        this.dataService.$notesUpdate.subscribe(res => {
            if(res && res.eventType == 'INSERT'){
                if(!this.notes.find(note => note.id == res.new.id)){
                    this.notes = [...this.notes, res.new];
                    this.dataService.setNotes(this.notes);
                }
            }
        });
    }

    async createDeletedUser(){
        const deletedUser = await this.dataService.getDeletedUser();

        if(!deletedUser || deletedUser.length <= 0){
            this.authService.createUser({
                id: '11111111-1111-1111-1111-111111111111',
                normalized_email: this.authService.normalizeEmail('Deleted User'),
                password: 'test123',
                email_confirm: true,
                name: 'Deleted User',
                role: 'voditelj_recepcije'
            });
        }
    }

    isLoggedUserDeleted(){
        return !this.profiles.find(profile => profile.id == this.authService.getStoredUserId());
    }

    loadStoredWindowPositions(){
        const saved = localStorage.getItem('windowPositions');

        if (saved) {
            this.positions = JSON.parse(saved);
    
            if (this.positions['notes']) {
                this.isNotesWindowVisible = true;
            }
    
            if (this.positions['arrivals']) {
                this.isArrivalsAndDeparturesWindowVisible = true;
            }
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

    // Handle location change in fault report dialog
    onLocationChange(event: any) {
        const selection = event.value;
        if (selection && 'type' in selection) {
            // This is a special location
            this.locationType = selection.type;
            this.selectedHouse = null;
        } else {
            // This is a house
            this.locationType = 'house';
            this.selectedHouse = selection;
        }
    }

    // Handle location change in extraordinary task dialog
    onLocationChangeForTask(event: any) {
        const selection = event.value;
        let house = this.houses.find(house => house.house_id == selection.house_id);
        
        if(house?.house_name == 'Zgrada' || house?.house_name == 'Parcele'){
            this.taskTypes = this.taskTypes.filter(tt => tt.task_type_name == 'Ostalo');
        } else {
            this.taskTypes = [...this.otherTaskTypes];
        }

        if (selection && 'type' in selection) {
            // This is a special location
            this.locationTypeForTask = selection.type;
            this.selectedHouseForTask = null;
        } else {
            // This is a house
            this.locationTypeForTask = 'house';
            this.selectedHouseForTask = selection;
        }
    }

    // Update location options method
    updateLocationOptions() {
        this.locationOptions = [
            // ...this.specialLocations,
            ...this.houses
        ];


        // sort first names with letters, then numbers
       this.locationOptions.sort((a, b) => {
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
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }

    isFormValid(): boolean {
        return !!this.selectedLocation;
    }

    isTaskFormValid(): boolean {
        return !!this.selectedLocationForTask && !!this.selectedTaskType;
    }

    submitFaultReport() {
        if (!this.isFormValid()) return;

        if (this.locationType === 'house' && this.selectedHouse) {
            // For house locations, use the existing method
            this.taskService.createTaskForHouse(
                this.selectedHouse.house_id.toString(),
                this.faultDescription,
                'Popravak',
                false,
                true
            ).then(async result => {
                if (result) {
                    try {
                        await this.taskService.storeImagesForTask(this.imagesToUpload, result.task_id);

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Uspjeh',
                            detail: 'Kvar je uspješno prijavljen'
                        });

                        // Reset form and close dialog
                        this.selectedLocation = null;
                        this.selectedHouse = null;
                        this.locationType = 'house';
                        this.faultDescription = '';
                        this.faultReportVisible = false;
                    } catch (imagesSaveError) {
                        console.error('Error saving images: ', imagesSaveError);
                    }
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Greška',
                        detail: 'Došlo je do greške prilikom prijave kvara'
                    });
                }
            });
        } else if (this.selectedLocation && 'type' in this.selectedLocation) {
            // For special locations (building or parcel)
            const locationName = this.selectedLocation.house_name;
            const locationType = this.selectedLocation.type;

            // Add the location to the description rather than using a separate field
            const enhancedDescription = `[${locationName}] ${this.faultDescription}`;

            // Create a task with location_type field
            const taskData: any = {
                description: enhancedDescription,
                location_type: locationType,
                is_unscheduled: false
            };

            // Get the task type ID for "Popravak" (repair)
            this.dataService.getTaskTypeIdByTaskName('Popravak').then((taskTypeId) => {
                if (!taskTypeId) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Greška',
                        detail: 'Nije moguće pronaći tip zadatka "Popravak"'
                    });
                    return;
                }

                // Get the "Nije dodijeljeno" (not assigned) task progress type
                this.dataService.getTaskProgressTypeIdByTaskProgressTypeName('Nije dodijeljeno').then((progressTypeId) => {
                    if (!progressTypeId) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Greška',
                            detail: 'Nije moguće pronaći status zadatka "Nije dodijeljeno"'
                        });
                        return;
                    }

                    // Complete the task data
                    taskData.task_type_id = taskTypeId;
                    taskData.task_progress_type_id = progressTypeId;
                    taskData.created_by = 'user'; // Replace with actual user ID if available
                    taskData.created_at = new Date().toISOString();

                    // Create the task
                    this.dataService.createTask(taskData).subscribe(
                        async (result) => {
                            if (result) {
                                try {
                                    await this.taskService.storeImagesForTask(this.imagesToUpload, result.task_id);
                                    this.messageService.add({
                                        severity: 'success',
                                        summary: 'Uspjeh',
                                        detail: `Kvar na lokaciji "${locationName}" je uspješno prijavljen`
                                    });

                                    // Reset form and close dialog
                                    this.selectedLocation = null;
                                    this.selectedHouse = null;
                                    this.locationType = 'house';
                                    this.faultDescription = '';
                                    this.faultReportVisible = false;

                                    // Refresh tasks list
                                    this.dataService.loadTasksFromDb();
                                } catch (imagesSaveError) {
                                    console.error('Error saving images: ', imagesSaveError);
                                }
                            } else {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Greška',
                                    detail: 'Došlo je do greške prilikom prijave kvara'
                                });
                            }
                        },
                        (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Greška',
                                detail: 'Došlo je do greške prilikom prijave kvara'
                            });
                            console.error('Error creating task:', error);
                        }
                    );
                });
            });
        }
    }

    submitExtraordinaryTask() {
        if (!this.isTaskFormValid()) return;

        if (this.locationTypeForTask === 'house' && this.selectedHouseForTask) {
            // For house locations, use the existing method
            this.taskService.createTaskForHouse(this.selectedHouseForTask.house_id.toString(), this.taskDescription, this.selectedTaskType!.task_type_name, false, true).then((result) => {
                if (result) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Uspjeh',
                        detail: 'Zadatak je uspješno prijavljen'
                    });

                    // Reset form and close dialog
                    this.selectedLocationForTask = null;
                    this.selectedHouseForTask = null;
                    this.locationTypeForTask = 'house';
                    this.selectedTaskType = null;
                    this.taskDescription = '';
                    this.extraordinaryTaskVisible = false;

                    // Refresh tasks list
                    this.dataService.loadTasksFromDb();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Greška',
                        detail: 'Došlo je do greške prilikom prijave zadatka'
                    });
                }
            });
        } else if (this.selectedLocationForTask && 'type' in this.selectedLocationForTask) {
            // For special locations (building or parcel)
            const locationName = this.selectedLocationForTask.house_name;
            const locationType = this.selectedLocationForTask.type;

            if (!this.selectedTaskType) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Greška',
                    detail: 'Molimo odaberite vrstu zadatka'
                });
                return;
            }

            // Add the location to the description rather than using a separate field
            const enhancedDescription = `[${locationName}] ${this.taskDescription}`;

            // Create a task with location_type field
            const taskData: any = {
                description: enhancedDescription,
                location_type: locationType,
                task_type_id: this.selectedTaskType.task_type_id,
                is_unscheduled: true
            };

            // Get the "Nije dodijeljeno" (not assigned) task progress type
            this.dataService.getTaskProgressTypeIdByTaskProgressTypeName('Nije dodijeljeno').then((progressTypeId) => {
                if (!progressTypeId) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Greška',
                        detail: 'Nije moguće pronaći status zadatka "Nije dodijeljeno"'
                    });
                    return;
                }

                // Complete the task data
                taskData.task_progress_type_id = progressTypeId;
                taskData.created_by = 'user'; // Replace with actual user ID if available
                taskData.created_at = new Date().toISOString();

                // Create the task
                this.dataService.createTask(taskData).subscribe(
                    (result) => {
                        if (result) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Uspjeh',
                                detail: `Zadatak za lokaciju "${locationName}" je uspješno prijavljen`
                            });

                            // Reset form and close dialog
                            this.selectedLocationForTask = null;
                            this.selectedHouseForTask = null;
                            this.locationTypeForTask = 'house';
                            this.selectedTaskType = null;
                            this.taskDescription = '';
                            this.extraordinaryTaskVisible = false;

                            // Refresh tasks list
                            this.dataService.loadTasksFromDb();
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Greška',
                                detail: 'Došlo je do greške prilikom prijave zadatka'
                            });
                        }
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Greška',
                            detail: 'Došlo je do greške prilikom prijave zadatka'
                        });
                        console.error('Error creating task:', error);
                    }
                );
            });
        }
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
        this.selectedLocation = null;
        this.faultDescription = '';
        this.capturedImage = '';
        this.taskImages = [];
        this.imagesToUpload = [];
        this.task = {};

        if (window == 'task-details') {
            this.taskService.$taskModalData.next(null);
        }
    }

    removeImage(imageToRemove: any, event: any, window: string) {
        if (window == 'task-details') {
            this.confirmationService.confirm({
                target: event.target,
                message: `Are you sure you want to remove this image?`,
                header: 'Confirm Image Delete',
                icon: 'pi pi-exclamation-triangle',
                rejectLabel: 'Cancel',
                rejectButtonProps: {
                    label: 'Cancel',
                    severity: 'secondary',
                    outlined: true
                },
                acceptButtonProps: {
                    label: 'Confirm',
                    severity: 'danger'
                },
                accept: async () => {
                    this.taskService.removeImageForTask(imageToRemove, this.task.task_id);
                    this.messageService.add({ severity: 'info', summary: 'Updated', detail: 'Image removed' });
                    this.taskImages = this.taskImages.filter((ti) => ti.url != imageToRemove.url);
                },
                reject: () => {
                    this.messageService.add({ severity: 'warn', summary: 'Cancelled', detail: 'Change was cancelled' });
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

    getHouseForTask(task: any) {
        if (task) {
            return this.houses.find((house) => house.house_id == task.house_id);
        }
        return;
    }

    getTaskTypeName(task: any) {
        if (task) {
            return this.taskTypes.find((tt) => tt.task_type_id == task.task_type_id || tt.task_type_id == task.taskTypeId)?.task_type_name;
        }
        return;
    }

    getTaskProgressTypeName(task: any) {
        if (task) {
            return this.taskProgressTypes.find((tpt) => tpt.task_progress_type_id == task.task_progress_type_id || tpt.task_progress_type_id == task.taskProgressTypeId)?.task_progress_type_name;
        }
        return;
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
            this.taskService.addCommentOnRepairTask(this.comment, this.task.task_id);
            this.comment = '';
        }
    }

    deleteTask(event: any, task: Task){
        this.confirmationService.confirm({
                target: event.target,
                message: `Are you sure you want to delete this task?`,
                header: 'Confirm Task Delete',
                icon: 'pi pi-exclamation-triangle',
                rejectLabel: 'Cancel',
                rejectButtonProps: {
                    label: 'Cancel',
                    severity: 'secondary',
                    outlined: true
                },
                acceptButtonProps: {
                    label: 'Confirm',
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
                    this.messageService.add({ severity: 'info', summary: 'Updated', detail: 'Task deleted' });
                },
                reject: () => {
                    this.messageService.add({ severity: 'warn', summary: 'Cancelled', detail: 'Change was cancelled' });
                }
            });
    }
}
