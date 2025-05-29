import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../service/data.service';
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

interface Role {
  role_id: string;
  role_name: string;
}

@Component({
  selector: 'app-roles',
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
      <div class="flex justify-content-between align-items-center mb-4">
        <h1>Upravljanje ulogama</h1>
        <button 
          class="add-button p-button-success"
          (click)="openNew()">
          <i class="pi pi-plus mr-2"></i> Dodaj novu ulogu
        </button>
      </div>
      
      <p-table [value]="roles" [tableStyle]="{'min-width': '50rem'}"
               [paginator]="true" [rows]="10"
               [rowHover]="true" dataKey="role_id">
        <ng-template pTemplate="header">
          <tr>
            <th class="text-left">Identifikator uloge</th>
            <th class="text-left">Naziv uloge</th>
            <th class="w-2 text-center">Akcije</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-role>
          <tr>
            <td>{{ role.role_id }}</td>
            <td>{{ role.role_name }}</td>
            <td>
              <div class="flex justify-content-center gap-2">
                <button 
                  class="p-button-rounded p-button-success action-button" 
                  (click)="editRole(role)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button 
                  class="p-button-rounded p-button-danger action-button" 
                  (click)="deleteRole(role)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="3" class="text-center">Nema dostupnih uloga.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="roleDialog" [style]="{width: '450px'}" 
              [header]="editMode ? 'Uredi ulogu' : 'Dodaj novu ulogu'" 
              [modal]="true" 
              [contentStyle]="{overflow: 'visible'}"
              [draggable]="false" [resizable]="false">
      <div class="p-field mb-4" *ngIf="selectedRole">
        <label for="id" class="font-medium mb-2 block">Identifikator uloge*</label>
        <input type="text" pInputText id="id" [(ngModel)]="selectedRole.role_id" 
               required autofocus class="w-full" 
               placeholder="Unesite identifikator uloge" 
               [disabled]="editMode" />
        <small *ngIf="submitted && !selectedRole.role_id" class="p-error">Identifikator uloge je obavezan.</small>
      </div>
      <div class="p-field mb-4" *ngIf="selectedRole">
        <label for="name" class="font-medium mb-2 block">Naziv uloge*</label>
        <input type="text" pInputText id="name" [(ngModel)]="selectedRole.role_name" 
               required class="w-full" 
               placeholder="Unesite naziv uloge" />
        <small *ngIf="submitted && !selectedRole.role_name" class="p-error">Naziv uloge je obavezan.</small>
      </div>
      <div class="flex justify-content-end mt-4">
        <p-button label="Odustani" icon="pi pi-times" (click)="hideDialog()" 
                 styleClass="p-button-text"></p-button>
        <p-button label="Spremi" icon="pi pi-check" (click)="saveRole()" 
                 [disabled]="!selectedRole?.role_id || !selectedRole?.role_name"></p-button>
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
    }
    
    h1 {
      margin-top: 0;
      margin-bottom: 0;
      color: var(--text-color);
      font-size: 1.5rem;
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
export class RolesComponent implements OnInit, OnDestroy {
  roles: Role[] = [];
  roleDialog: boolean = false;
  selectedRole: Role | null = null;
  submitted: boolean = false;
  editMode: boolean = false;
  
  // Subject for handling component destruction
  private destroy$ = new Subject<void>();

  // Pre-defined roles from the existing profiles component
  availableRoles = [
    { role_id: 'voditelj_kampa', role_name: 'Voditelj kampa' },
    { role_id: 'savjetnik_uprave', role_name: 'Savjetnik uprave' },
    { role_id: 'voditelj_recepcije', role_name: 'Voditelj recepcije' },
    { role_id: 'recepcija', role_name: 'Recepcija' },
    { role_id: 'customer_service', role_name: 'Customer service' },
    { role_id: 'nocni_recepcioner', role_name: 'Noćni recepcioner' },
    { role_id: 'prodaja', role_name: 'Prodaja' },
    { role_id: 'voditelj_domacinstva', role_name: 'Voditelj domaćinstva' },
    { role_id: 'sobarica', role_name: 'Sobarica' },
    { role_id: 'terase', role_name: 'Terase' },
    { role_id: 'kucni_majstor', role_name: 'Kućni majstor' },
    { role_id: 'odrzavanje', role_name: 'Održavanje' }
  ];

  constructor(
    private dataService: DataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    // In a real implementation, we would subscribe to a roles$ observable from DataService
    // For now, we'll just use the pre-defined roles
    this.roles = [...this.availableRoles];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openNew() {
    this.selectedRole = { role_id: '', role_name: '' };
    this.submitted = false;
    this.editMode = false;
    this.roleDialog = true;
  }

  editRole(role: Role) {
    this.selectedRole = { ...role };
    this.editMode = true;
    this.roleDialog = true;
  }

  deleteRole(role: Role) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${role.role_name}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // In a real implementation, we would call the DataService to delete the role
        this.roles = this.roles.filter(r => r.role_id !== role.role_id);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Role Deleted',
          life: 3000
        });
      }
    });
  }

  hideDialog() {
    this.roleDialog = false;
    this.submitted = false;
  }

  saveRole() {
    this.submitted = true;

    if (this.selectedRole?.role_id && this.selectedRole.role_name) {
      if (this.editMode) {
        // Update existing role
        this.roles = this.roles.map(r => 
          r.role_id === this.selectedRole?.role_id ? { ...this.selectedRole } : r
        );
        
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Role Updated',
          life: 3000
        });
      } else {
        // Check if role ID already exists
        if (this.roles.some(r => r.role_id === this.selectedRole?.role_id)) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Role ID already exists',
            life: 3000
          });
          return;
        }
        
        // Add new role
        this.roles.push(this.selectedRole);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Role Created',
          life: 3000
        });
      }

      // In a real implementation, we would call the DataService to save changes
      
      this.roleDialog = false;
      this.selectedRole = null;
    }
  }
} 