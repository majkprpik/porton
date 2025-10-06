import { Component, OnInit } from '@angular/core';
import { House, HouseType, HouseTypes } from '../../core/models/data.models';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { HouseService } from '../../core/services/house.service';
import { CheckboxModule } from 'primeng/checkbox';

interface ExtendedHouse extends House{
  id: string;
  title: string;
  is_divider: boolean;
}

@Component({
  selector: 'app-houses',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    FormsModule,
    ToastModule,
    InputTextModule,
    TranslateModule,
    SelectModule,
    CheckboxModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="title">
        <p-button 
          severity="primary"
          (click)="openCreateHouseWindow()"
        >
          <i class="pi pi-plus mr-2"></i> {{ 'CONTENT-MANAGEMENT.HOUSES.ADD-NEW-HOUSE' | translate }}
        </p-button>
      </div>
      <p-table [value]="houses" [tableStyle]="{'min-width': '50rem'}">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HOUSE-NUMBER' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HOUSE-NAME' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HOUSE-TYPE' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HAS-POOL' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.IS-ACTIVE' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.ACTIONS' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-house>
          <tr [ngClass]="{'divider-row': house.is_divider}">
            @if(house.is_divider){
              <td colspan="6" class="divider-cell">{{ ('HOUSE-TYPES.' + house.title | translate) | uppercase}}</td>
            } @else {
              <td>{{ house.house_number }}</td>
              <td>{{ house.house_name }}</td>
              <td>{{ houseService.getHouseType(house.house_type_id)?.house_type_name }}</td>
              <td>{{ house.has_pool }}</td>
              <td>{{ house.is_active }}</td>
              <td>
                <p-button 
                  icon="pi pi-pencil" 
                  styleClass="p-button-rounded p-button-success mr-2" 
                  (click)="openEditHouseWindow(house)">
                </p-button>
                <p-button 
                  icon="pi pi-trash" 
                  styleClass="p-button-rounded p-button-danger mr-2"
                  (click)="openDeleteHouseWindow(house)">
                </p-button>
              </td>
            }
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog 
      [(visible)]="isEditHouseModuleVisible" 
      [style]="{width: '450px'}" 
      [header]="'CONTENT-MANAGEMENT.HOUSES.EDIT.TITLE' | translate" 
      [modal]="true" 
      [contentStyle]="{overflow: 'visible'}"
    >
      @if(selectedHouse){
        <div class="field">
          <label for="houseName">{{ 'CONTENT-MANAGEMENT.HOUSES.EDIT.HOUSE-NAME' | translate }}</label>
          <input id="houseName" type="text" pInputText [(ngModel)]="selectedHouse.house_name" />
        </div>
        <div class="field">
          <label for="houseNumber">{{ 'CONTENT-MANAGEMENT.HOUSES.EDIT.HOUSE-NUMBER' | translate }}</label>
          <input id="houseNumber" type="number" [min]="0" pInputText [(ngModel)]="selectedHouse.house_number" />
        </div>
        <div class="field">
          <label for="houseTypes">{{ 'CONTENT-MANAGEMENT.HOUSES.EDIT.HOUSE-TYPE' | translate }}</label>
          <p-select 
            [options]="houseTypes"
            [(ngModel)]="selectedHouse.house_type_id" 
            [style]="{'width':'100%'}"
            optionLabel="house_type_name"
            optionValue="house_type_id"
            appendTo="body"
            id="houseTypes"
          >
          </p-select>
        </div>
        <div class="field flex items-center gap-2 mt-5">
          <p-checkbox 
            inputId="hasPool" 
            name="hasPool" 
            binary="true"
            [(ngModel)]="selectedHouse.has_pool" 
          />
          <label 
            [ngStyle]="{'margin-bottom': '0px'}" 
            for="hasPool"
          >
            {{ 'CONTENT-MANAGEMENT.HOUSES.ADD.HAS-POOL' | translate }}
          </label>
        </div>
        <div class="field flex items-center gap-2 mt-5">
          <p-checkbox 
            inputId="isActive" 
            name="isActive" 
            binary="true"
            [(ngModel)]="selectedHouse.is_active" 
          />
          <label 
            [ngStyle]="{'margin-bottom': '0px'}" 
            for="isActive"
          >
            {{ 'CONTENT-MANAGEMENT.HOUSES.ADD.IS-ACTIVE' | translate }}
          </label>
        </div>
      }
      @if(isExistingHouseErrorDisplayed){
        <div class="field">
          <div class="p-error">{{existingHouseErrorMessage}}</div>
        </div>
      }
      <div class="p-dialog-footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialogs()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.SAVE' | translate" icon="pi pi-check" (click)="saveHouse(selectedHouse!)" [disabled]="!selectedHouse"></p-button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="isDeleteHouseModuleVisible" [style]="{width: '450px'}" [header]="'CONTENT-MANAGEMENT.HOUSES.DELETE.TITLE' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <label>
        {{ 'CONTENT-MANAGEMENT.HOUSES.DELETE.TEXT' | translate }} <b>{{ selectedHouse?.house_name }}</b>?
      </label>
      <div class="p-dialog-footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialogs()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.DELETE' | translate" icon="pi pi-trash" (click)="deleteHouse(selectedHouse!.house_id)" styleClass="p-button-danger" [disabled]="!selectedHouse"></p-button>
      </div>
    </p-dialog>

    <p-dialog 
      [(visible)]="isCreateHouseModuleVisible" 
      [style]="{width: '450px'}" 
      [header]="'CONTENT-MANAGEMENT.HOUSES.ADD.TITLE' | translate" 
      [modal]="true" 
      [contentStyle]="{overflow: 'visible'}"
    >
      @if(houseToCreate){
        <div class="field">
          <label for="houseName">{{ 'CONTENT-MANAGEMENT.HOUSES.ADD.HOUSE-NAME' | translate }}</label>
          <input id="houseName" type="text" pInputText [(ngModel)]="houseToCreate.house_name" [placeholder]="'CONTENT-MANAGEMENT.HOUSES.ADD.HOUSE-NAME' | translate" />
        </div>
        <div class="field">
          <label for="houseNumber">{{ 'CONTENT-MANAGEMENT.HOUSES.ADD.HOUSE-NUMBER' | translate }}</label>
          <input id="houseNumber" type="number" [min]="0" pInputText [(ngModel)]="houseToCreate.house_number" [placeholder]="'CONTENT-MANAGEMENT.HOUSES.ADD.HOUSE-NUMBER' | translate" />
        </div>
        <div class="field">
          <label for="houseTypes">{{ 'CONTENT-MANAGEMENT.HOUSES.ADD.HOUSE-TYPE' | translate }}</label>
          <p-select 
            [options]="houseTypes"
            [(ngModel)]="houseToCreate.house_type_id" 
            [style]="{'width':'100%'}"
            optionLabel="house_type_name"
            optionValue="house_type_id"
            appendTo="body"
            id="houseTypes"
          >
          </p-select>
        </div>
        <div class="field flex items-center gap-2 mt-5">
          <p-checkbox 
            inputId="hasPool" 
            name="hasPool" 
            binary="true"
            [(ngModel)]="houseToCreate.has_pool" 
          />
          <label 
            [ngStyle]="{'margin-bottom': '0px'}" 
            for="hasPool"
          >
            {{ 'CONTENT-MANAGEMENT.HOUSES.ADD.HAS-POOL' | translate }}
          </label>
        </div>
        <div class="field flex items-center gap-2 mt-5">
          <p-checkbox 
            inputId="isActive" 
            name="isActive" 
            binary="true"
            [(ngModel)]="houseToCreate.is_active" 
          />
          <label 
            [ngStyle]="{'margin-bottom': '0px'}" 
            for="isActive"
          >
            {{ 'CONTENT-MANAGEMENT.HOUSES.ADD.IS-ACTIVE' | translate }}
          </label>
        </div>
      }
      @if(isExistingHouseErrorDisplayed){
        <div class="field">
          <div class="p-error">{{existingHouseErrorMessage}}</div>
        </div>
      }
      <div class="p-dialog-footer">
        <p-button 
          [label]="'BUTTONS.CANCEL' | translate" 
          icon="pi pi-times" 
          (click)="hideDialogs()" 
          styleClass="p-button-text">
        </p-button>
        <p-button 
          [label]="'BUTTONS.SAVE' | translate" 
          icon="pi pi-check" 
          (click)="createHouse(houseToCreate!)" 
          [disabled]="!isCreateHouseFormValid()">
        </p-button>
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

      .title{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        padding-bottom: 10px;
      }
    }
    
    h1 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: var(--text-color);
    }
    
    .p-field {
      margin-bottom: 1.5rem;
    }

    .p-error {
      margin-top: 0.25rem;
      color: #dc3545;
      font-size: 0.875rem;
      padding: 0.5rem;
      background-color: rgba(220, 53, 69, 0.1);
      border-radius: 4px;
    }

    .field{
      margin-bottom: 10px;

      input{
        width: 100%;
      }
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      user-select: none;
    }
    
    .p-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 1.5rem;
    }
    
    .divider-row {
      background-color: var(--primary-color);
    }
    
    .divider-cell {
      font-weight: bold;
      text-align: center;
      padding: 0.75rem;
      color: white;
    }
    `
  ]
})
export class HousesComponent implements OnInit {
  houses: (House | Partial<ExtendedHouse>)[] = [];
  houseTypes: HouseType[] = [];
  selectedHouse?: House;
  houseToCreate?: Partial<House>;

  family1Houses: (House | Partial<ExtendedHouse>)[] = [];
  family2Houses: (House | Partial<ExtendedHouse>)[] = [];
  coupleHouses: (House | Partial<ExtendedHouse>)[] = [];
  mobileHouses: (House | Partial<ExtendedHouse>)[] = [];
  otherHouses: (House | Partial<ExtendedHouse>)[] = [];

  isExistingHouseErrorDisplayed = false;
  existingHouseErrorMessage = ''

  isCreateHouseModuleVisible = false;
  isEditHouseModuleVisible = false;
  isDeleteHouseModuleVisible = false;

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private messageService: MessageService,
    public authService: AuthService,
    public houseService: HouseService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    combineLatest([
      this.dataService.houseTypes$.pipe(nonNull()),
      this.dataService.houses$.pipe(nonNull()),
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async ([houseTypes, houses]) => {
        this.houseTypes = houseTypes;

        this.family1Houses = [];
        this.family2Houses = [];
        this.coupleHouses = [];
        this.mobileHouses = [];
        this.otherHouses = [];

        const family1Houses = houses.filter(house => {
          const family1HouseType = this.houseTypes.find(ht => ht.house_type_name == HouseTypes.Family1);
          return house.house_type_id == family1HouseType?.house_type_id;
        }).sort((a, b) => a.house_number - b.house_number);

        if(family1Houses.length){
          this.family1Houses.push(this.createDividerHouse('FAMILY-1'));
          this.family1Houses.push(...family1Houses);
        }

        const family2Houses = houses.filter(house => {
          const family2HouseType = this.houseTypes.find(ht => ht.house_type_name == HouseTypes.Family2);
          return house.house_type_id == family2HouseType?.house_type_id;
        }).sort((a, b) => a.house_number - b.house_number);

        if(family2Houses.length){
          this.family2Houses.push(this.createDividerHouse('FAMILY-2'));
          this.family2Houses.push(...family2Houses);
        }

        const coupleHouses = houses.filter(house => {
          const coupleHouseType = this.houseTypes.find(ht => ht.house_type_name == HouseTypes.Couple);
          return house.house_type_id == coupleHouseType?.house_type_id;
        }).sort((a, b) => a.house_number - b.house_number);

        if(coupleHouses.length){
          this.coupleHouses.push(this.createDividerHouse('COUPLE'));
          this.coupleHouses.push(...coupleHouses);
        }

        const mobileHouses = houses.filter(house => {
          const mobileHouseType = this.houseTypes.find(ht => ht.house_type_name == HouseTypes.Mobile);
          return house.house_type_id == mobileHouseType?.house_type_id;
        }).sort((a, b) => a.house_number - b.house_number);

        if(mobileHouses.length){
          this.mobileHouses.push(this.createDividerHouse('MOBILE'));
          this.mobileHouses.push(...mobileHouses);
        }

        const otherHouses = houses.filter(house => {
          const otherHouseType = this.houseTypes.find(ht => ht.house_type_name == HouseTypes.Other);
          return house.house_type_id == otherHouseType?.house_type_id;
        }).sort((a, b) => a.house_number - b.house_number);

        if(otherHouses.length){
          this.mobileHouses.push(this.createDividerHouse('OTHER'));
          this.mobileHouses.push(...otherHouses);
        }

        this.houses = [...this.family1Houses, ...this.family2Houses, ...this.coupleHouses, ...this.mobileHouses, ...this.otherHouses];
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createDividerHouse(title: string): Partial<ExtendedHouse> {
    return {
      id: `divider-${title}`,
      title: title,
      is_divider: true,
    };
  }

  hideDialogs(){
    this.isCreateHouseModuleVisible = false;
    this.isDeleteHouseModuleVisible = false;
    this.isEditHouseModuleVisible = false;
    this.isExistingHouseErrorDisplayed = false;
  }

  createHouse(house: Partial<House>){
    if(this.houses.find(h => h.house_name == house.house_name)){
      this.isExistingHouseErrorDisplayed = true;
      this.existingHouseErrorMessage = this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.HOUSE-NAME-EXISTS-ERROR');
      return;
    }
    
    if(this.houses.find(h => h.house_number == house.house_number)){
      this.isExistingHouseErrorDisplayed = true;
      this.existingHouseErrorMessage = this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.HOUSE-NUMBER-EXISTS-ERROR');
      return;
    }

    this.isExistingHouseErrorDisplayed = false;

    this.houseService.createHouse(house).then(res => {
      if(res) {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.SUCCESS'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.CREATE-SUCCESS'), 
          life: 3000 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.ERROR'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.CREATE-ERROR'),
          life: 3000 
        });
      }
      
      this.isCreateHouseModuleVisible = false;
    });
  }

  saveHouse(house: House){
    if(this.houses.find(h => h.house_name == house.house_name && h.house_id !== house.house_id)){
      this.isExistingHouseErrorDisplayed = true;
      this.existingHouseErrorMessage = this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.HOUSE-NAME-EXISTS-ERROR');
      return;
    }

    if(this.houses.find(h => h.house_number == house.house_number && h.house_id !== house.house_id)){
      this.isExistingHouseErrorDisplayed = true;
      this.existingHouseErrorMessage = this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.HOUSE-NUMBER-EXISTS-ERROR');
      return;
    }

    this.isExistingHouseErrorDisplayed = false;

    this.houseService.updateHouse(house).then(res => {
      if(res) {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.SUCCESS'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.EDIT-SUCCESS'), 
          life: 3000 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.ERROR'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.EDIT-ERROR'),
          life: 3000 
        });
      }
  
      this.isEditHouseModuleVisible = false;
    });
  }

  deleteHouse(houseId: number){
    this.houseService.softDeleteHouse(houseId).then(res => {
      if(res) {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.SUCCESS'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.DELETE-SUCCESS'), 
          life: 3000 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.ERROR'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.HOUSES.MESSAGES.DELETE-ERROR'),
          life: 3000 
        });
      }

      this.isDeleteHouseModuleVisible = false;
    });
  }

  openCreateHouseWindow(){
    this.isCreateHouseModuleVisible = true;
    this.houseToCreate = {
      house_name: '',
      house_number: undefined,
      house_type_id: this.houseTypes.find(ht => ht.house_type_name == HouseTypes.Family1)?.house_type_id,
      has_pool: false,
      is_active: true,
    }
  }

  openEditHouseWindow(house: House){
    this.selectedHouse = {...house};
    this.isEditHouseModuleVisible = true;
  }

  openDeleteHouseWindow(house: House){
    this.selectedHouse = {...house};
    this.isDeleteHouseModuleVisible = true;
  }

  isCreateHouseFormValid(){
    return this.houseToCreate?.house_name && this.houseToCreate.house_number;
  }
}
