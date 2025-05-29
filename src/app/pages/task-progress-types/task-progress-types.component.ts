import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService, TaskProgressType } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-task-progress-types',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    InputTextModule, 
    FormsModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="card">
      <div class="task-statuses-management-header">
        <h1>Upravljanje statusima zadataka</h1>
        <button 
          class="add-button p-button-success"
          (click)="openNew()">
          <i class="pi pi-plus mr-2"></i> Dodaj novi status
        </button>
      </div>
      
      <p-table [value]="taskProgressTypes" [tableStyle]="{'min-width': '50rem'}"
               [paginator]="true" [rows]="10"
               [rowHover]="true" dataKey="task_progress_type_id">
        <ng-template pTemplate="header">
          <tr>
            <th class="text-left w-2">ID</th>
            <th class="text-left">Naziv statusa</th>
            <th class="w-2 text-center">Akcije</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-type>
          <tr>
            <td>{{ type.task_progress_type_id }}</td>
            <td>{{ type.task_progress_type_name }}</td>
            <td>
              <div class="flex justify-content-center gap-2">
                <button 
                  class="p-button-rounded p-button-success action-button" 
                  (click)="editType(type)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button 
                  class="p-button-rounded p-button-danger action-button" 
                  (click)="deleteType(type)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="3" class="text-center">Nema dostupnih statusa zadataka.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="typeDialog" [style]="{width: '450px'}" 
              [header]="editMode ? 'Uredi status zadatka' : 'Dodaj novi status zadatka'" 
              [modal]="true" 
              [contentStyle]="{overflow: 'visible'}"
              [draggable]="false" [resizable]="false">
      <div class="p-field mb-4" *ngIf="selectedType">
        <label for="name" class="font-medium mb-2 block">Naziv statusa*</label>
        <input type="text" pInputText id="name" [(ngModel)]="selectedType.task_progress_type_name" 
               required autofocus class="w-full" 
               placeholder="Unesite naziv statusa" />
        <small *ngIf="submitted && !selectedType.task_progress_type_name" class="p-error">Naziv statusa je obavezan.</small>
      </div>
      <div class="flex justify-content-end mt-4">
        <p-button label="Odustani" icon="pi pi-times" (click)="hideDialog()" 
                 styleClass="p-button-text"></p-button>
        <p-button label="Spremi" icon="pi pi-check" (click)="saveType()" 
                 [disabled]="!selectedType?.task_progress_type_name"></p-button>
      </div>
    </p-dialog>
    <p-toast></p-toast>
  `,
  styles: [
    `
    .card {
      padding: 2rem;
      background-color: var(--surface-card);
      border-radius: 8px;
      box-shadow: var(--card-shadow);
      margin: 1rem;

      .task-statuses-management-header{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 30px;

        .add-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: none;
          background-color: #4CAF50;
          color: white;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
          height: 40px;
        }
      }
    }
    
    h1 {
      margin-top: 0;
      margin-bottom: 0;
      color: var(--text-color);
    }
    
    .p-field {
      margin-bottom: 1.5rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .add-button {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      background-color: #4CAF50;
      color: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .add-button:hover {
      background-color: #45a049;
    }

    .action-button {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      color: white;
      cursor: pointer;
    }

    .p-button-success {
      background-color: #4CAF50;
    }

    .p-button-success:hover {
      background-color: #45a049;
    }

    .p-button-danger {
      background-color: #f44336;
    }

    .p-button-danger:hover {
      background-color: #d32f2f;
    }

    .w-2 {
      width: 100px;
    }
    `
  ]
})
export class TaskProgressTypesComponent implements OnInit, OnDestroy {
  taskProgressTypes: TaskProgressType[] = [];
  typeDialog: boolean = false;
  selectedType: TaskProgressType | null = null;
  submitted: boolean = false;
  editMode: boolean = false;
  
  // Add a subject to handle unsubscription
  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    // Subscribe to the taskProgressTypes$ observable instead of using one-time loading
    this.dataService.taskProgressTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        this.taskProgressTypes = types;
        console.log('Task progress types updated:', types);
      });
    
    // Initial load of data if needed
    this.loadTaskProgressTypes();
  }
  
  ngOnDestroy() {
    // Complete the subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTaskProgressTypes() {
    // This will trigger the BehaviorSubject to emit new values
    this.dataService.getTaskProgressTypes().subscribe({
      error: (error) => {
        console.error('Error loading task progress types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load task progress types',
          life: 3000
        });
      }
    });
  }

  openNew() {
    this.selectedType = { task_progress_type_name: '' } as TaskProgressType;
    this.submitted = false;
    this.editMode = false;
    this.typeDialog = true;
  }

  editType(type: TaskProgressType) {
    this.selectedType = { ...type };
    this.editMode = true;
    this.typeDialog = true;
  }

  deleteType(type: TaskProgressType) {
    this.confirmationService.confirm({
      message: `Jeste li sigurni da želite obrisati status "${type.task_progress_type_name}"?`,
      header: 'Potvrda brisanja',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.dataService.deleteTaskProgressType(type.task_progress_type_id).subscribe({
          next: () => {
            // Let the BehaviorSubject handle the update
            // No need to modify local array here
            
            this.messageService.add({
              severity: 'success',
              summary: 'Uspješno',
              detail: 'Status zadatka je obrisan',
              life: 3000
            });
          },
          error: (error: any) => {
            console.error('Error deleting task progress type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Greška',
              detail: 'Neuspješno brisanje statusa zadatka',
              life: 3000
            });
          }
        });
      }
    });
  }

  hideDialog() {
    this.typeDialog = false;
    this.submitted = false;
  }

  saveType() {
    this.submitted = true;

    if (this.selectedType?.task_progress_type_name?.trim()) {
      if (this.editMode && this.selectedType.task_progress_type_id) {
        // Update existing status
        this.dataService.updateTaskProgressType2(this.selectedType).subscribe({
          next: () => {
            // Let the BehaviorSubject handle the update
            // No need to modify local array here
            
            this.messageService.add({
              severity: 'success',
              summary: 'Uspješno',
              detail: 'Status zadatka je ažuriran',
              life: 3000
            });
          },
          error: (error: any) => {
            console.error('Error updating task progress type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Greška',
              detail: 'Neuspješno ažuriranje statusa zadatka',
              life: 3000
            });
          }
        });
      } else {
        // Create new status
        this.dataService.createTaskProgressType(this.selectedType).subscribe({
          next: () => {
            // Let the BehaviorSubject handle the update
            // No need to modify local array here
            
            this.messageService.add({
              severity: 'success',
              summary: 'Uspješno',
              detail: 'Status zadatka je kreiran',
              life: 3000
            });
          },
          error: (error: any) => {
            console.error('Error creating task progress type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Greška',
              detail: 'Neuspješno kreiranje statusa zadatka',
              life: 3000
            });
          }
        });
      }

      this.typeDialog = false;
      this.selectedType = null;
    }
  }

  findIndexById(id: number): number {
    return this.taskProgressTypes.findIndex(item => item.task_progress_type_id === id);
  }
} 