import { ColorPickerModule } from 'primeng/colorpicker';
import { transition } from '@angular/animations';
import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { LayoutService } from '../service/layout.service';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { DataService, House, TaskType } from '../../pages/service/data.service';
import { TaskService } from '../../pages/service/task.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotesComponent } from './notes.component';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ArrivalsAndDeparturesComponent } from './arrivals-and-departures.component';

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
        CdkDragHandle
    ],
    providers: [MessageService],
    template: `
    <div class="layout-wrapper" [ngClass]="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-outlet></router-outlet>

                @if(isNotesWindowVisible){
                    <div class="notes-window" cdkDrag>
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

                @if(isArrivalsAndDeparturesWindowVisible){
                    <div class="arrivals-and-departures-window" cdkDrag>
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
        <p-dialog 
            header="Prijava kvara" 
            [(visible)]="faultReportVisible" 
            [modal]="true"
            [style]="{ width: '30rem' }"
            [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
            (onHide)="resetForm()"
        >
            <div class="fault-report-form">
                <div class="field">
                    <label for="location" class="font-bold block mb-2">Lokacija*</label>
                    <p-dropdown
                        id="location"
                        [options]="locationOptions"
                        [(ngModel)]="selectedLocation"
                        placeholder="Odaberi lokaciju"
                        [style]="{ width: '100%' }"
                        (onChange)="onLocationChange($event)"
                    >
                        <ng-template let-item pTemplate="item">
                            <span>{{ item.name || item.house_number }}</span>
                        </ng-template>
                        <ng-template let-item pTemplate="selectedItem">
                            <span>{{ item.name || item.house_number }}</span>
                        </ng-template>
                    </p-dropdown>
                </div>
                
                <div class="field mt-4">
                    <label for="description" class="font-bold block mb-2">Opis</label>
                    <textarea
                        id="description"
                        pInputTextarea
                        [(ngModel)]="faultDescription"
                        [rows]="5"
                        [style]="{ width: '100%' }"
                        placeholder="Unesite opis kvara"
                    ></textarea>
                </div>

                @if(!capturedImage){
                    <div class="upload-a-photo">
                        @if(taskImages.length <= 0){
                            <label for="description" class="font-bold block mb-2">Učitaj sliku</label>
                        } @else {
                            <label for="description" class="font-bold block mb-2">Učitane slike</label>
                        }

                        <div class="task-images-container" [ngStyle]="{'justify-content': taskImages.length ? 'flex-start' : 'center'}">
                            <input type="file" accept="image/*" capture="environment" (change)="handleImageCapture($event)" hidden #fileInput>

                            @for(image of taskImages; track image.base64Url){
                                <div class="task-images">
                                    <div class="image-wrapper">
                                        <div class="close-icon-container">
                                            <i (click)="removeImage(image)" class="pi pi-trash"></i>
                                        </div>
                                        <img (click)="onOpenImage(image.base64Url)" [src]="image.base64Url" [alt]="image.base64Url" >
                                    </div>
                                </div>
                            }
                            
                            <div 
                              class="camera-icon-container"
                              (click)="openCamera()"
                            >
                              <span class="camera-icon">📷</span>
                              <span class="camera-icon-label">Capture an image...</span>
                            </div>
                        </div>
                    </div>
                } @else {
                    <div class="save-captured-image"> 
                        <label for="description" class="font-bold block mb-2">Spremi fotografiju?</label>
                        <div class="captured-image-container">
                            <img [src]="capturedImage" alt="Captured Photo">
                            <div class="save-captured-image-buttons">
                              <button 
                                  pButton
                                  label="Odbaci"
                                  class="p-button-text" 
                                  (click)="discardImage()">
                              </button>
                    
                              <button 
                                  pButton
                                  label="Spremi"
                                  (click)="saveImage()">
                              </button>
                            </div>
                        </div>
                    </div>
                }
            </div>
  
            <ng-template pTemplate="footer">
                @if(!capturedImage){
                    <div class="flex justify-content-end gap-2">
                        <button 
                            pButton 
                            label="Odustani" 
                            class="p-button-text" 
                            (click)="faultReportVisible = false"
                        ></button>
                        <button 
                            pButton 
                            label="Prijavi" 
                            (click)="submitFaultReport()"
                            [disabled]="!isFormValid()"
                        ></button>
                    </div>
                }
            </ng-template>
            
        </p-dialog>

        <!-- Extraordinary Task Dialog -->
        <p-dialog 
            header="Prijava izvanrednog zadatka" 
            [(visible)]="extraordinaryTaskVisible" 
            [modal]="true"
            [style]="{ width: '30rem' }"
            [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
        >
            <div class="task-form">
                <div class="field">
                    <label for="location" class="font-bold block mb-2">Lokacija*</label>
                    <p-dropdown
                        id="location"
                        [options]="locationOptions"
                        [(ngModel)]="selectedLocationForTask"
                        placeholder="Odaberi lokaciju"
                        [style]="{ width: '100%' }"
                        (onChange)="onLocationChangeForTask($event)"
                    >
                        <ng-template let-item pTemplate="item">
                            <span>{{ item.name || item.house_number }}</span>
                        </ng-template>
                        <ng-template let-item pTemplate="selectedItem">
                            <span>{{ item.name || item.house_number }}</span>
                        </ng-template>
                    </p-dropdown>
                </div>
                
                <div class="field mt-4">
                    <label for="taskType" class="font-bold block mb-2">Vrsta zadatka*</label>
                    <p-dropdown
                        id="taskType"
                        [options]="taskTypes"
                        [(ngModel)]="selectedTaskType"
                        optionLabel="task_type_name"
                        placeholder="Odaberi vrstu zadatka"
                        [style]="{ width: '100%' }"
                    ></p-dropdown>
                </div>

                <div class="field mt-4">
                    <label for="taskDescription" class="font-bold block mb-2">Opis</label>
                    <textarea
                        id="taskDescription"
                        pInputTextarea
                        [(ngModel)]="taskDescription"
                        [rows]="5"
                        [style]="{ width: '100%' }"
                        placeholder="Unesite opis zadatka"
                    ></textarea>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button 
                        pButton 
                        label="Odustani" 
                        class="p-button-text" 
                        (click)="extraordinaryTaskVisible = false"
                    ></button>
                    <button 
                        pButton 
                        label="Prijavi zadatak" 
                        (click)="submitExtraordinaryTask()"
                        [disabled]="!isTaskFormValid()"
                    ></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>
    </div>`,
    styles: [`
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

        .fault-report-form, .task-form {
            padding: 1.5rem 0;

            .field {
                margin-bottom: 1rem;
            }

            label {
                color: var(--text-color);
            }

            .upload-a-photo{
                overflow-x: auto;

                .task-images-container{
                    border: 1px solid var(--surface-border);
                    border-radius: 5px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    overflow-x: auto;
                    gap: 5px;

                    .task-images{
                        flex: 0 0 auto;
                        position: relative;

                        .image-wrapper{
                            .close-icon-container{
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

                                i{
                                    color: white;
                                }

                                &:hover{
                                    cursor: pointer;
                                }
                            }

                            img{
                                border-radius: 5px;
                                height: 200px
                            }
                        }

                    }

                    .camera-icon-container{
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
    
                        &:hover{
                            cursor: pointer;
                        }
                    }
                }
            }

            .save-captured-image{
                width: 100%;

                .captured-image-container{
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;

                    .save-captured-image-buttons{
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
            height: 300px;
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
            box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
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

            .close-notes-window {
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
                
                    i{
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
            box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
                        0 2px 2px 0 rgba(0, 0, 0, 0.14),
                        0 1px 5px 0 rgba(0, 0, 0, 0.12);

            .example-handle {
                position: absolute;
                top: 8px;
                left: 15px;
                color: #ccc;
                cursor: move;
                width: 24px;
                height: 24px;
            } 
            
            .close-arrivals-and-departures-window {
                position: absolute;
                top: 4px;
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
            
                    i{
                        color: white;
                    }
                }
            }
        }


    `]
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
    locationOptions: (House | SpecialLocation)[] = [];

    // Dialog visibility flags
    faultReportVisible: boolean = false;
    extraordinaryTaskVisible: boolean = false;
    isNotesWindowVisible: boolean = false;
    isArrivalsAndDeparturesWindowVisible: boolean = false;

    // Form fields
    selectedLocation: House | SpecialLocation | null = null;
    selectedHouse: House | null = null;
    faultDescription: string = '';
    locationType: string = 'house';

    // Form fields for extraordinary task
    selectedLocationForTask: House | SpecialLocation | null = null;
    selectedHouseForTask: House | null = null;
    locationTypeForTask: string = 'house';
    selectedTaskType: TaskType | null = null;
    taskDescription: string = '';

    houses: House[] = [];
    taskTypes: TaskType[] = [];

    imageToUpload: any;
    imagesToUpload: any[] = [];
    capturedImage: any;
    taskImages: any[] = [];
    openImage: any;

    menuItems: MenuItem[] = [
        {
            icon: 'pi pi-wrench',
            command: () => {
                this.faultReportVisible = true;
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
            }
        },
        {
            icon: 'pi pi-arrow-right-arrow-left',
            command: () => {
                this.isArrivalsAndDeparturesWindowVisible = true;
            }
        },
    ];

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router,
        private dataService: DataService,
        private taskService: TaskService,
        private messageService: MessageService
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

        // Subscribe to houses data
        this.dataService.houses$.subscribe(houses => {
            this.houses = houses;
            // Update location options when houses change
            this.updateLocationOptions();
        });

        // Subscribe to task types
        this.dataService.taskTypes$.subscribe(types => {
            this.taskTypes = types;
        });

        // Load initial data
        this.dataService.loadHouses().subscribe();
        this.dataService.getTaskTypes().subscribe();
    }

    // Handle location change in fault report dialog
    onLocationChange(event: any) {
        const selection = event.value;
        if (selection && ('type' in selection)) {
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
        if (selection && ('type' in selection)) {
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
            ...this.specialLocations, 
            ...this.houses
        ];
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
        return !!this.selectedLocationForTask && 
               !!this.selectedTaskType;
    }

    submitFaultReport() {
        if (!this.isFormValid()) return;

        if (this.locationType === 'house' && this.selectedHouse) {
            // For house locations, use the existing method
            this.taskService.createTaskForHouse(
                this.selectedHouse.house_id.toString(),
                this.faultDescription,
                'Popravak',
                false
            ).then(async result => {
                if (result) {
                    try{
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
                        
                        // Refresh tasks list
                        this.dataService.loadTasksFromDb();
                    }
                    catch(imagesSaveError){
                        console.error("Error saving images: ", imagesSaveError);
                    }
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Greška',
                        detail: 'Došlo je do greške prilikom prijave kvara'
                    });
                }
            });
        } else if (this.selectedLocation && ('type' in this.selectedLocation)) {
            // For special locations (building or parcel)
            const locationName = this.selectedLocation.name;
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
            this.dataService.getTaskTypeIdByTaskName("Popravak").then(taskTypeId => {
                if (!taskTypeId) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Greška',
                        detail: 'Nije moguće pronaći tip zadatka "Popravak"'
                    });
                    return;
                }
                
                // Get the "Nije dodijeljeno" (not assigned) task progress type
                this.dataService.getTaskProgressTypeIdByTaskProgressTypeName("Nije dodijeljeno").then(progressTypeId => {
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
                        async result => {
                            if (result) {
                                try{
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
                                } catch (imagesSaveError){
                                    console.error("Error saving images: ", imagesSaveError);
                                }
                            } else {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Greška',
                                    detail: 'Došlo je do greške prilikom prijave kvara'
                                });
                            }
                        },
                        error => {
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
            this.taskService.createTaskForHouse(
                this.selectedHouseForTask.house_id.toString(),
                this.taskDescription,
                this.selectedTaskType!.task_type_name,
                false,
                true
            ).then(result => {
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
        } else if (this.selectedLocationForTask && ('type' in this.selectedLocationForTask)) {
            // For special locations (building or parcel)
            const locationName = this.selectedLocationForTask.name;
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
            this.dataService.getTaskProgressTypeIdByTaskProgressTypeName("Nije dodijeljeno").then(progressTypeId => {
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
                    result => {
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
                    error => {
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

    saveImage(){
      if(this.imageToUpload && this.capturedImage){
        const renamedFile = this.renameImageNameForSupabaseStorage();
        this.taskImages.push({
            base64Url: this.capturedImage,
            file: renamedFile,
        });
        this.imagesToUpload.push(renamedFile);
        this.capturedImage = '';
      } else{
        console.log("Image or id null");
      }
    }
    
    discardImage(){
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

    onOpenImage(imageUrl: string){
      this.openImage.emit({
        imageUrl: imageUrl
      });
    }

    private renameImageNameForSupabaseStorage(){
      const sanitizedFileName = this.imageToUpload.name.replace(/\s+/g, '-');
    
      const renamedFile = new File([this.imageToUpload], sanitizedFileName, { 
        type: this.imageToUpload.type, 
        lastModified: this.imageToUpload.lastModified 
      });
    
      return renamedFile;
    }

    resetForm(){
        this.selectedLocation = null;
        this.faultDescription = '';
        this.capturedImage = '';
        this.taskImages = [];
        this.taskService.$taskModalData.next(null);
    }

    removeImage(imageToRemove: any){
        this.taskImages = this.taskImages.filter(ti => ti.file != imageToRemove.file);
        this.imagesToUpload = this.imagesToUpload.filter(itu => itu != imageToRemove.file);
    }

    closeNotesWindow(){
        this.isNotesWindowVisible = false;
    }

    closeArrivalsAndDeparturesWindow(){
        this.isArrivalsAndDeparturesWindowVisible = false;
    }
}
