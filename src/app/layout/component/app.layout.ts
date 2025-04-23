import { Component, Renderer2, ViewChild } from '@angular/core';
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
import { DebugOverlayComponent } from '../../shared/debug-overlay/debug-overlay.component';
import { TaskService } from '../../pages/service/task.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
        ToastModule
    ],
    providers: [MessageService],
    template: `
    <div class="layout-wrapper" [ngClass]="containerClass">
        <!-- <app-topbar></app-topbar> -->
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-outlet></router-outlet>
            </div>
        </div>
        <div class="layout-mask animate-fadein"></div>
        <!-- <app-debug-overlay></app-debug-overlay> -->

        <p-speedDial 
            [model]="menuItems" 
            direction="up"
            buttonClassName="p-button-primary"
            [buttonProps]="{ size: 'large', raised: true }"
            showIcon="pi pi-plus"
            hideIcon="pi pi-times"
            [transitionDelay]="80"
            [radius]="80"
        ></p-speedDial>

        <!-- Fault Report Dialog -->
        <p-dialog 
            header="Prijava kvara" 
            [(visible)]="faultReportVisible" 
            [modal]="true"
            [style]="{ width: '30rem' }"
            [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
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
            </div>

            <ng-template pTemplate="footer">
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

        <!-- Phone Dialog -->
        <!-- <p-dialog 
            header="Phone" 
            [(visible)]="phoneDialogVisible" 
            [modal]="true"
            [style]="{ width: '50vw' }"
            [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
        >
            <div class="p-4">
                <h3>Phone Content</h3>
                <p>This is a placeholder for the phone functionality.</p>
            </div>
            <ng-template pTemplate="footer">
                <button pButton label="Close" (click)="phoneDialogVisible = false"></button>
            </ng-template>
        </p-dialog> -->

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
                    
                    .p-button-icon {
                        font-size: 1.8rem;
                    }

                    &:hover {
                        background: var(--primary-600) !important;
                        border-color: var(--primary-600) !important;
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

                    &:hover {
                        background: var(--surface-hover);
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
                padding-bottom: 6rem; /* Add space at bottom to prevent SpeedDial from covering content */
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
        }
    `]
})
export class AppLayout {
    overlayMenuOpenSubscription: Subscription;
    menuOutsideClickListener: any;

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
    phoneDialogVisible: boolean = false;

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

    menuItems: MenuItem[] = [
        {
            icon: 'pi pi-exclamation-circle',
            command: () => {
                this.faultReportVisible = true;
            }
        },
        {
            icon: 'pi pi-plus-circle',
            command: () => {
                this.extraordinaryTaskVisible = true;
            }
        },
        // {
        //     icon: 'pi pi-phone',
        //     command: () => {
        //         this.phoneDialogVisible = true;
        //     }
        // }
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
            ).then(result => {
                if (result) {
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
                        result => {
                            if (result) {
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
}
