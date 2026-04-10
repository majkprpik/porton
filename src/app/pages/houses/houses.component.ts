import { Component, OnInit, ViewChild } from '@angular/core';
import { House, HouseType, HouseTypes } from '../../core/models/data.models';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
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
      <div class="toolbar">
        <div class="tab-bar">
          @for(opt of typeOptions; track opt.value){
            <button
              class="tab-item"
              [class.active]="selectedType === opt.value"
              (click)="selectedType = opt.value">
              {{ opt.key | translate }}
            </button>
          }
        </div>
        <p-button severity="primary" (click)="openCreateHouseWindow()">
          <i class="pi pi-plus mr-2"></i> {{ 'CONTENT-MANAGEMENT.HOUSES.ADD-NEW-HOUSE' | translate }}
        </p-button>
      </div>
      <p-table #dt [value]="filteredHouses" [tableStyle]="{'min-width': '50rem'}" [stripedRows]="true" (onSort)="onSort($event)">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="house_number" style="width: 10rem">{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HOUSE-NUMBER' | translate }} <p-sortIcon field="house_number" /></th>
            <th pSortableColumn="house_name" style="width: 13rem">{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HOUSE-NAME' | translate }} <p-sortIcon field="house_name" /></th>
            <th pSortableColumn="house_type_name" style="width: 10rem">{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HOUSE-TYPE' | translate }} <p-sortIcon field="house_type_name" /></th>
            <th class="spacer-col"></th>
            <th style="width: 7rem; text-align: center; padding-left: 1.5rem">{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HAS-POOL' | translate }}</th>
            <th style="width: 7rem; text-align: center">{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.HAS-JACUZZI' | translate }}</th>
            <th pSortableColumn="is_active" style="width: 7rem; text-align: center">{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.IS-ACTIVE' | translate }} <p-sortIcon field="is_active" /></th>
            <th style="width: 7rem; text-align: center">{{ 'CONTENT-MANAGEMENT.HOUSES.TABLE-COLUMNS.ACTIONS' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-house>
          <tr [class.inactive-row]="!house.is_active">
            <td>{{ house.house_number }}</td>
            <td>{{ house.house_name }}</td>
            <td><span class="type-badge type-{{ house.house_type_name?.replace(' ', '-') }}">{{ house.house_type_name }}</span></td>
            <td class="spacer-col"></td>
            <td class="bool-cell" style="padding-left: 1.5rem">
              <i [class]="house.has_pool ? 'pi pi-check bool-true' : 'pi pi-times bool-false'"></i>
            </td>
            <td class="bool-cell">
              <i [class]="house.has_jacuzzi ? 'pi pi-check bool-true' : 'pi pi-times bool-false'"></i>
            </td>
            <td class="bool-cell">
              <i [class]="house.is_active ? 'pi pi-check bool-true' : 'pi pi-times bool-false'"></i>
            </td>
            <td class="action-cell">
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                severity="secondary"
                size="small"
                (click)="openEditHouseWindow(house)">
              </p-button>
              <p-button
                icon="pi pi-trash"
                [text]="true"
                severity="danger"
                size="small"
                (click)="openDeleteHouseWindow(house)">
              </p-button>
            </td>
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
      appendTo="body"
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
        <div class="field flex flex-row gap-5">
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
              {{ 'CONTENT-MANAGEMENT.HOUSES.EDIT.HAS-POOL' | translate }}
            </label>
          </div>
          <div class="field flex items-center gap-2 mt-5">
            <p-checkbox
              inputId="hasJacuzzi"
              name="hasJacuzzi"
              binary="true"
              [(ngModel)]="selectedHouse.has_jacuzzi"
            />
            <label
              [ngStyle]="{'margin-bottom': '0px'}"
              for="hasJacuzzi"
            >
              {{ 'CONTENT-MANAGEMENT.HOUSES.EDIT.HAS-JACUZZI' | translate }}
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
              {{ 'CONTENT-MANAGEMENT.HOUSES.EDIT.IS-ACTIVE' | translate }}
            </label>
          </div>
        </div>
        <div class="field">
          <textarea 
            id="description" 
            rows="4" 
            class="p-inputtext"
            pTextarea  
            [(ngModel)]="selectedHouse.description" 
            [placeholder]="'CONTENT-MANAGEMENT.HOUSES.EDIT.DESCRIPTION-PLACEHOLDER' | translate"
            style="resize: none"
          >
          </textarea>
        </div>
      }
      @if(isExistingHouseErrorDisplayed){
        <div class="field">
          <div class="p-error">{{existingHouseErrorMessage}}</div>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialogs()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.SAVE' | translate" icon="pi pi-check" (click)="saveHouse(selectedHouse!)" [disabled]="!selectedHouse"></p-button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="isDeleteHouseModuleVisible" [style]="{width: '450px'}" [header]="'CONTENT-MANAGEMENT.HOUSES.DELETE.TITLE' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}" appendTo="body">
      <label>
        {{ 'CONTENT-MANAGEMENT.HOUSES.DELETE.TEXT' | translate }} <b>{{ selectedHouse?.house_name }}</b>?
      </label>
      <ng-template pTemplate="footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialogs()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.DELETE' | translate" icon="pi pi-trash" (click)="deleteHouse(selectedHouse!.house_id)" styleClass="p-button-danger" [disabled]="!selectedHouse"></p-button>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="isCreateHouseModuleVisible"
      [style]="{width: '450px'}"
      [header]="'CONTENT-MANAGEMENT.HOUSES.ADD.TITLE' | translate"
      [modal]="true"
      [contentStyle]="{overflow: 'visible'}"
      appendTo="body"
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
        <div class="field flex flex-row gap-5">
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
              inputId="hasJacuzzi"
              name="hasJacuzzi"
              binary="true"
              [(ngModel)]="houseToCreate.has_jacuzzi"
            />
            <label
              [ngStyle]="{'margin-bottom': '0px'}"
              for="hasJacuzzi"
            >
              {{ 'CONTENT-MANAGEMENT.HOUSES.ADD.HAS-JACUZZI' | translate }}
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
        </div>
        <div class="field">
          <textarea 
            id="description" 
            rows="4" 
            class="p-inputtext"
            pTextarea  
            [(ngModel)]="houseToCreate.description" 
            [placeholder]="'CONTENT-MANAGEMENT.HOUSES.ADD.DESCRIPTION-PLACEHOLDER' | translate"
            style="resize: none"
          >
          </textarea>
        </div>
      }
      @if(isExistingHouseErrorDisplayed){
        <div class="field">
          <div class="p-error">{{existingHouseErrorMessage}}</div>
        </div>
      }
      <ng-template pTemplate="footer">
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
      </ng-template>
    </p-dialog>
    <p-toast></p-toast>
  `,
  styles: [
    `
    .card {
      padding: 2rem;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      border-radius: 8px;
    }

    .toolbar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      border-bottom: 2px solid var(--surface-border);
    }

    .tab-bar {
      display: flex;
      flex-direction: row;
    }

    .tab-item {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.75rem 1.25rem;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      transition: color 0.2s;
      white-space: nowrap;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--primary-color);
        transform: scaleX(0);
        transition: transform 0.2s;
      }

      &:hover { color: var(--text-color); }

      &.active {
        color: var(--primary-color);
        font-weight: 600;

        &::after { transform: scaleX(1); }
      }
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

    .field {
      margin-bottom: 10px;

      textarea { width: 100%; }
      input { width: 100%; }
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

    tr.inactive-row td {
      background-color: rgba(239, 68, 68, 0.08);
    }

    .bool-cell {
      text-align: center;

      .bool-true {
        color: #22c55e;
        font-size: 0.95rem;
      }

      .bool-false {
        color: #ef4444;
        font-size: 0.95rem;
      }
    }

    .type-badge {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.02em;

      &.type-family-1  { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
      &.type-family-2  { background: rgba(139, 92, 246, 0.15); color: #7c3aed; }
      &.type-couple    { background: rgba(236, 72, 153, 0.15); color: #db2777; }
      &.type-mobilne   { background: rgba(245, 158, 11, 0.15); color: #d97706; }
      &.type-dodatno   { background: var(--surface-hover);     color: var(--text-color-secondary); }
    }

    .spacer-col {
      width: auto;
    }

    .action-cell {
      text-align: center;
      white-space: nowrap;
    }

    ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
    }

    ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
    }
    `
  ]
})
export class HousesComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  private prevSortField = '';
  private prevSortOrder = 0;

  onSort(event: { field: string; order: number }) {
    if (event.field === this.prevSortField && this.prevSortOrder === -1 && event.order === 1) {
      setTimeout(() => this.dt.reset());
      this.prevSortField = '';
      this.prevSortOrder = 0;
    } else {
      this.prevSortField = event.field;
      this.prevSortOrder = event.order;
    }
  }
  houses: (House & { house_type_name: string })[] = [];
  houseTypes: HouseType[] = [];
  selectedHouse?: House;
  houseToCreate?: Partial<House>;

  selectedType = 'ALL';
  typeOptions: { key: string; value: string }[] = [
    { key: 'HOUSE-TYPES.ALL',      value: 'ALL' },
    { key: 'HOUSE-TYPES.FAMILY-1', value: HouseTypes.Family1 },
    { key: 'HOUSE-TYPES.FAMILY-2', value: HouseTypes.Family2 },
    { key: 'HOUSE-TYPES.COUPLE',   value: HouseTypes.Couple },
    { key: 'HOUSE-TYPES.MOBILE',   value: HouseTypes.Mobile },
    { key: 'HOUSE-TYPES.OTHER',    value: HouseTypes.Other },
  ];

  get filteredHouses(): House[] {
    if (this.selectedType === 'ALL') return this.houses;
    const typeId = this.houseTypes.find(ht => ht.house_type_name === this.selectedType)?.house_type_id;
    return this.houses.filter(h => h.house_type_id === typeId);
  }

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
      next: ([houseTypes, houses]) => {
        this.houseTypes = houseTypes;
        this.houses = [...houses]
          .map(h => ({ ...h, house_type_name: houseTypes.find(ht => ht.house_type_id === h.house_type_id)?.house_type_name ?? '' }))
          .sort((a, b) => a.house_number - b.house_number);
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
      has_jacuzzi: false,
      is_active: true,
      description: '',
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
