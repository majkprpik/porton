import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService, HouseType } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-house-types',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    InputTextModule, 
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="card">
      <div class="house-types-management-header">
        <h1>Upravljanje tipovima kuća</h1>
        <button 
          class="add-button p-button-success"
          (click)="openNew()">
          <i class="pi pi-plus mr-2"></i> Dodaj novi tip
        </button>
      </div>
      
      <p-table [value]="houseTypes" [tableStyle]="{'min-width': '50rem'}"
               [paginator]="true" [rows]="10"
               [rowHover]="true" dataKey="house_type_id">
        <ng-template pTemplate="header">
          <tr>
            <th class="text-left w-2">ID</th>
            <th class="text-left">Naziv tipa</th>
            <th class="w-2 text-center">Akcije</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-type>
          <tr>
            <td>{{ type.house_type_id }}</td>
            <td>{{ type.house_type_name }}</td>
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
            <td colspan="3" class="text-center">Nema dostupnih tipova kuća.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="typeDialog" [style]="{width: '450px'}" 
              [header]="editMode ? 'Uredi tip kuće' : 'Dodaj novi tip kuće'" 
              [modal]="true" 
              [contentStyle]="{overflow: 'visible'}"
              [draggable]="false" [resizable]="false">
      <div class="p-field mb-4" *ngIf="selectedType">
        <label for="name" class="font-medium mb-2 block">Naziv tipa*</label>
        <input type="text" pInputText id="name" [(ngModel)]="selectedType.house_type_name" 
               required autofocus class="w-full" 
               placeholder="Unesite naziv tipa" />
        <small *ngIf="submitted && !selectedType.house_type_name" class="p-error">Naziv tipa je obavezan.</small>
      </div>
      <div class="flex justify-content-end mt-4">
        <p-button label="Odustani" icon="pi pi-times" (click)="hideDialog()" 
                 styleClass="p-button-text"></p-button>
        <p-button label="Spremi" icon="pi pi-check" (click)="saveType()" 
                 [disabled]="!selectedType?.house_type_name"></p-button>
      </div>
    </p-dialog>

    <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
    
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

      .house-types-management-header{
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
export class HouseTypesComponent implements OnInit, OnDestroy {
  houseTypes: HouseType[] = [];
  typeDialog: boolean = false;
  selectedType: HouseType | null = null;
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
    // Subscribe to the houseTypes$ observable instead of using one-time loading
    this.dataService.houseTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        console.log('SUBSCRIPTION: House types updated, count:', types.length);
        console.log('SUBSCRIPTION: Types received:', types);
        this.houseTypes = types;
      });
    
    // Initial load of data if needed
    this.loadHouseTypes();
  }
  
  ngOnDestroy() {
    // Complete the subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHouseTypes() {
    // This will trigger the BehaviorSubject to emit new values
    this.dataService.getHouseTypes().subscribe({
      error: (error) => {
        console.error('Error loading house types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load house types',
          life: 3000
        });
      }
    });
  }

  openNew() {
    // Just initialize with the name, let the backend handle ID assignment
    this.selectedType = { house_type_name: '' } as HouseType;
    this.submitted = false;
    this.editMode = false;
    this.typeDialog = true;
  }

  editType(type: HouseType) {
    // Create a copy to avoid direct modification of the list item
    this.selectedType = { ...type };
    this.editMode = true;
    this.typeDialog = true;
  }

  deleteType(type: HouseType) {
    this.confirmationService.confirm({
      message: `Jeste li sigurni da želite obrisati tip "${type.house_type_name}"?`,
      header: 'Potvrda brisanja',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.dataService.deleteHouseType(type.house_type_id).subscribe({
          next: () => {
            // Let the BehaviorSubject handle the update
            // No need to modify local array here
            
            this.messageService.add({
              severity: 'success',
              summary: 'Uspješno',
              detail: 'Tip kuće je obrisan',
              life: 3000
            });
          },
          error: (error: any) => {
            console.error('Error deleting house type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Greška',
              detail: 'Neuspješno brisanje tipa kuće',
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

    if (this.selectedType?.house_type_name?.trim()) {
      console.log('Saving house type:', this.selectedType);
      
      if (this.editMode && this.selectedType.house_type_id) {
        // Update existing type
        console.log('Updating existing type with ID:', this.selectedType.house_type_id);
        this.dataService.updateHouseType(this.selectedType).subscribe({
          next: () => {
            console.log('Update completed successfully');
            // Let the BehaviorSubject handle the update
            // No need to modify local array here
            
            this.messageService.add({
              severity: 'success',
              summary: 'Uspješno',
              detail: 'Tip kuće je ažuriran',
              life: 3000
            });
          },
          error: (error: any) => {
            console.error('Error updating house type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Greška',
              detail: 'Neuspješno ažuriranje tipa kuće',
              life: 3000
            });
          }
        });
      } else {
        // Create new type
        console.log('Creating new type with name:', this.selectedType.house_type_name);
        this.dataService.createHouseType(this.selectedType).subscribe({
          next: () => {
            console.log('Create completed successfully');
            // Let the BehaviorSubject handle the update
            // No need to modify local array here
            
            this.messageService.add({
              severity: 'success',
              summary: 'Uspješno',
              detail: 'Tip kuće je kreiran',
              life: 3000
            });
          },
          error: (error: any) => {
            console.error('Error creating house type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Greška',
              detail: 'Neuspješno kreiranje tipa kuće',
              life: 3000
            });
          }
        });
      }

      this.typeDialog = false;
      this.selectedType = null;
    }
  }
} 