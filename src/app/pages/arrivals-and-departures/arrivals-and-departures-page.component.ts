import { Component } from '@angular/core';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { House, HouseAvailability } from '../../core/models/data.models';
import { HouseService } from '../../core/services/house.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Component({
  selector: 'app-arrivals-and-departures-page',
  imports: [
    FormsModule,
    TranslateModule,
    CheckboxModule,
    DatePickerModule,
    DividerModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
  ],
  template: `
  <div class="arrivals-and-departures">
    <div class="header">
      <p-button icon="pi pi-angle-left" (click)="goToPreviousDay()"></p-button>  
      <span class="selected-date">
          @if(isToday(selectedDate)){
            <span [ngStyle]="{'height': '20px'}">{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.TODAY' | translate }}</span>
          } @else {
            <p-datepicker 
              [(ngModel)]="selectedDate"
              [showIcon]="false" 
              dateFormat="dd/mm/yy"
              [inputStyle]="{
                height: '20px',
                width: '100px',
              }" 
              (onSelect)="updateSelectedDate()"
            />
          }
      </span>
      <p-button icon="pi pi-angle-right" (click)="goToNextDay()"></p-button>
    </div>

    <div class="departures-side">      
      <div class="name-with-icon">
        <i class="pi pi-sign-out mr-2"></i>
        <h3>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.DEPARTURES' | translate }}</h3>
      </div>
      <div class="section-content">
        @if(!departures.length){
          <div class="empty-message">
            <i class="pi pi-info-circle"></i>
            @if(isToday(selectedDate)){
              <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.NO-DEPARTURES-FOR-TODAY' | translate }}</span>
            } @else {
              <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.NO-DEPARTURES-FOR-THIS-DAY' | translate }}</span>
            }
          </div>
        } @else{
          @for(departure of departures; track departure.house_availability_id){
            <div class="p-field-row">
              <div class="status-container">
                <p-checkbox 
                  [disabled]="profileService.isHousekeeper(storedUserId) || profileService.isHouseTechnician(storedUserId)"
                  inputId="departure-checkbox-{{ departure.house_number }}" 
                  binary="true"
                  [(ngModel)]="departure.has_departed"
                  (click)="submitDepartures($event, departure)"
                ></p-checkbox>
              </div>
              <div class="house-container">
                <label for="departure-checkbox-{{ departure.house_number }}">
                  {{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.HOUSE' | translate }}: <span class="house-number">{{ departure.house_number }}</span>
                </label>
              </div>
              <div class="time-container">
                @if(profileService.isHousekeeper(storedUserId) || profileService.isHouseTechnician(storedUserId)){
                  <input 
                    pInputText
                    [value]="departure.departureTimeObj | date:'HH:mm'" 
                    readonly
                  >
                } @else {
                  <p-datepicker 
                    [(ngModel)]="departure.departureTimeObj" 
                    [timeOnly]="true" 
                    hourFormat="24"
                    [showSeconds]="false"
                    (onBlur)="updateDepartureTime(departure)"
                    appendTo="body"
                    placeholder="10:00"
                    styleClass="w-full"
                  />
                }  
              </div>
            </div>
            @if(!$last){
              <p-divider></p-divider>
            }
          }
        }
      </div>
    </div>

    <div class="arrivals-side">
      <div class="name-with-icon">
        <i class="pi pi-sign-in mr-2"></i>
        <h3>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.ARRIVALS' | translate }}</h3>
      </div>
      <div class="section-content" [ngStyle]="{'border-left': '1px solid var(--surface-border)'}">
        @if(!arrivals.length){
          <div class="empty-message">
            <i class="pi pi-info-circle"></i>
            @if(isToday(selectedDate)){
              <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.NO-ARRIVALS-FOR-TODAY' | translate }}</span>
            } @else {
              <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.NO-ARRIVALS-FOR-THIS-DAY' | translate }}</span>
            }
          </div>
        } @else{
          @for(arrival of arrivals; track arrival.house_availability_id){
            <div class="p-field-row">
              <div class="status-container">
                <p-checkbox 
                  [disabled]="profileService.isHousekeeper(storedUserId) || profileService.isHouseTechnician(storedUserId)"
                  inputId="arrival-checkbox-{{ arrival.house_number }}" 
                  binary="true"
                  [(ngModel)]="arrival.has_arrived"
                  (click)="submitArrivals($event, arrival)"
                ></p-checkbox>
              </div>
              <div class="house-container">
                <label for="arrival-checkbox-{{ arrival.house_number }}">
                  {{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.HOUSE' | translate }}: <span class="house-number">{{ arrival.house_number }}</span>
                </label>
              </div>
              <div class="time-container">
                @if(profileService.isHousekeeper(storedUserId) || profileService.isHouseTechnician(storedUserId)){
                  <input 
                    pInputText 
                    [value]="arrival.arrivalTimeObj | date:'HH:mm'" 
                    readonly
                  >
                } @else {
                  <p-datepicker 
                    [(ngModel)]="arrival.arrivalTimeObj" 
                    [timeOnly]="true" 
                    hourFormat="24"
                    [showSeconds]="false"
                    (onBlur)="updateArrivalTime(arrival)"
                    appendTo="body"
                    placeholder="16:00"
                    styleClass="w-full"
                  />
                }
              </div>
            </div>
            @if(!$last){
              <p-divider></p-divider>
            }
          }
        }
      </div>
    </div>
  </div>
  `,
  styles: `
  ::ng-deep .p-checkbox.p-disabled.p-checkbox-checked .p-checkbox-box {
    background-color: var(--primary-color) !important;  /* Light gray background */
  }

  ::ng-deep .p-checkbox.p-disabled.p-checkbox-checked .p-checkbox-icon {
    color: white !important;
  }

  .arrivals-and-departures{
    margin-top: 20px;
    display: flex;
    flex-direction: column; 
    align-items: center;
    width: 100%;
    gap: 50px;
    padding-bottom: 100px;

    .header{
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 50px;

      .selected-date{
        width: 150px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
      }
    }

    .departures-side, .arrivals-side{
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;

      .name-with-icon{
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;

        h3{
          margin: 0;
        }
      }

      .section-content{
        width: 100%;

        .empty-message{
          width: 100%;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        .p-field-row{
          width: 100%;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        .house-container{
          .house-number{
            font-weight: bold;
            color: var(--primary-color);
          }
        }
      }
    }
  }
  `
})
export class ArrivalsAndDeparturesPageComponent {
  arrivals: any[] = [];
  departures: any[] = [];
  checkedDepartureHouseIds: number[] = [];
  checkedArrivalHouseIds: number[] = [];
  houseAvailabilities: HouseAvailability[] = [];
  houses: House[] = [];
  selectedDate: Date = new Date();
  storedUserId: string | null = '';

  private destroy$ = new Subject<void>();

  constructor(
    private houseService: HouseService,
    private dataService: DataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public profileService: ProfileService,
    private authService: AuthService,
    private translateService: TranslateService,
  ) {}
  
  async ngOnInit() {
    this.subscribeToDataStreams();
    this.subscribeToHouseAvailabilitiesUpdate();
  }

  private subscribeToDataStreams() {
    combineLatest([
      this.dataService.houses$.pipe(nonNull()),
      this.dataService.houseAvailabilities$.pipe(nonNull()),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([houses, houseAvailabilities]) => {
          this.storedUserId = this.authService.getStoredUserId();

          this.houses = houses;
          this.houseAvailabilities = houseAvailabilities;

          if (houses?.length > 0 && houseAvailabilities?.length > 0) {
            this.getTodaysArrivals();
            this.getTodaysDepartures();
          }
        },
        error: (error) => {
          console.error('Error loading data:', error);
        }
      });
  }

  private subscribeToHouseAvailabilitiesUpdate() {
    this.dataService.$houseAvailabilitiesUpdate
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res && res.new.house_availability_id && res.eventType === 'UPDATE') {
          this.handleHouseAvailabilityUpdate(res.new);
        }
      });
  }

  private handleHouseAvailabilityUpdate(updatedAvailability: any) {
    const arrivalIndex = this.arrivals.findIndex(
      arrival => arrival.house_availability_id === updatedAvailability.house_availability_id
    );
    if (arrivalIndex !== -1) {
      const house = this.houses.find(h => h.house_id === updatedAvailability.house_id);
      this.arrivals[arrivalIndex] = {
        ...updatedAvailability,
        house_number: house?.house_number,
        arrivalTimeObj: this.getTimeObjFromTimeString(updatedAvailability.arrival_time || '16:00'),
      };
      this.arrivals = [...this.arrivals];
    }

    const departureIndex = this.departures.findIndex(
      dep => dep.house_availability_id === updatedAvailability.house_availability_id
    );
    if (departureIndex !== -1) {
      const house = this.houses.find(h => h.house_id === updatedAvailability.house_id);
      this.departures[departureIndex] = {
        ...updatedAvailability,
        house_number: house?.house_number,
        departureTimeObj: this.getTimeObjFromTimeString(updatedAvailability.departure_time || '10:00'),
      };
      this.departures = [...this.departures];
    }

    const haIndex = this.houseAvailabilities.findIndex(
      ha => ha.house_availability_id === updatedAvailability.house_availability_id
    );
    if (haIndex !== -1) {
      this.houseAvailabilities[haIndex] = updatedAvailability;
      this.dataService.setHouseAvailabilites([...this.houseAvailabilities]);
    }
  }

  getTodaysArrivals(){
    const specificDateStr = this.selectedDate.toISOString().split('T')[0];

    let todaysHouseAvailabilities = this.houseAvailabilities.filter(ha => ha.house_availability_start_date.split('T')[0] == specificDateStr);

    this.arrivals = todaysHouseAvailabilities.map(ha => {
      const house_number = this.houses.find(house => house.house_id == ha.house_id)?.house_number;
      const arrivalTimeObj = this.getTimeObjFromTimeString(ha.arrival_time || '16:00');
      return { ...ha, house_number, arrivalTimeObj };
    });

    this.arrivals.sort((a, b) => {
      if (a.house_number < b.house_number) return -1;
      if (a.house_number > b.house_number) return 1;
      return 0;
    });
  }

  getTodaysDepartures() {
    const yesterday = new Date(this.selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const specificDateStr = yesterday.toISOString().split('T')[0];

    let todaysHouseAvailabilities = this.houseAvailabilities.filter(ha => ha.house_availability_end_date.split('T')[0] == specificDateStr);

    this.departures = todaysHouseAvailabilities.map(ha => {
      const house_number = this.houses.find(house => house.house_id == ha.house_id)?.house_number;
      const departureTimeObj = this.getTimeObjFromTimeString(ha.departure_time || '10:00');
      return { ...ha, house_number, departureTimeObj };
    });

    this.departures.sort((a, b) => {
      if (a.house_number < b.house_number) return -1;
      if (a.house_number > b.house_number) return 1;
      return 0;
    });
  }

  goToPreviousDay() {
    this.selectedDate.setDate(this.selectedDate.getDate() - 1);
    this.selectedDate = new Date(this.selectedDate);
    this.getTodaysArrivals();
    this.getTodaysDepartures();
  }

  goToNextDay() {
    this.selectedDate.setDate(this.selectedDate.getDate() + 1);
    this.selectedDate = new Date(this.selectedDate);
    this.getTodaysArrivals();
    this.getTodaysDepartures();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getTimeObjFromTimeString(timeString: string): Date {
    const date = new Date();
    const [hours, minutes] = timeString.split(':').map(n => parseInt(n, 10));

    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(0);
    
    return date;
  }

  getTimeStringFromObj(date: Date): string {
    if (!date) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // Update arrival time in database
  async updateArrivalTime(arrival: any) {
    const timeString = this.getTimeStringFromObj(arrival.arrivalTimeObj);

    if(arrival.arrival_time.startsWith(timeString)){
      return;
    }
    
    try {
      await this.houseService.updateHouseAvailabilityTime(
        arrival.house_availability_id,
        'arrival_time',
        timeString
      );
      arrival.arrival_time = timeString;
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Time Updated', 
        detail: `Arrival time for House ${arrival.house_number} set to ${timeString}` 
      });
    } catch (error) {
      console.error('Error updating arrival time:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to update arrival time' 
      });
    }
  }

  async updateDepartureTime(departure: any) {
    const timeString = this.getTimeStringFromObj(departure.departureTimeObj);

    if(departure.departure_time.startsWith(timeString)){
      return;
    }
    
    try {
      await this.houseService.updateHouseAvailabilityTime(
        departure.house_availability_id,
        'departure_time',
        timeString
      );
      departure.departure_time = timeString;
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Time Updated', 
        detail: `Departure time for House ${departure.house_number} set to ${timeString}` 
      });
    } catch (error) {
      console.error('Error updating departure time:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to update departure time' 
      });
    }
  }

  getTimeFromDate(date: string){
    const dateObj = new Date(date);
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async submitDepartures(event: any, departure: any) {
    if(this.profileService.isHousekeeper(this.storedUserId) || this.profileService.isHouseTechnician(this.storedUserId)){
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!event.target.checked) {
      event.preventDefault();
  
      this.confirmationService.confirm({
        target: event.target,
        header: this.translateService.instant('APP-LAYOUT.ARRIVALS-AND-DEPARTURES.MODALS.CONFIRM-UNDO-DEPARTURE.TITLE'),
        message: this.translateService.instant('APP-LAYOUT.ARRIVALS-AND-DEPARTURES.MODALS.CONFIRM-UNDO-DEPARTURE.MESSAGE', { houseNumber: this.houses.find(h => h.house_id == departure.house_id)?.house_number } ),
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancel',
        rejectButtonProps: {
          label: this.translateService.instant('BUTTONS.CANCEL'),
          severity: 'secondary',
          outlined: true,
        },
        acceptButtonProps: {
          label: this.translateService.instant('BUTTONS.CONFIRM'),
          severity: 'danger',
        },
        accept: async () => {
          let updatedHouseAvailability = await this.houseService.setHouseAvailabilityDeparted(departure.house_availability_id, false);
          if (updatedHouseAvailability) {
            departure.has_departed = updatedHouseAvailability.has_departed;
            this.messageService.add({ severity: 'info', summary: 'Updated', detail: 'Departure unchecked' });
          }
        },
        reject: () => {
          event.target.checked = true;
          this.messageService.add({ severity: 'warn', summary: 'Cancelled', detail: 'Change was cancelled' });
        }
      });
    } else {
      if (departure.house_availability_id) {
        let updatedHouseAvailability = await this.houseService.setHouseAvailabilityDeparted(departure.house_availability_id, event.target.checked);
        if (updatedHouseAvailability) {
          departure.has_departed = updatedHouseAvailability.has_departed;
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      const departureDay = new Date(departure.house_availability_end_date);
      departureDay.setHours(0, 0, 0 ,0);  
      departureDay.setDate(departureDay.getDate() + 1);
    
      if(departureDay.getTime() > today.getTime()){
        this.confirmationService.confirm({
          target: event.target,
          header: this.translateService.instant('APP-LAYOUT.ARRIVALS-AND-DEPARTURES.MODALS.CREATE-TASKS.TITLE'),
          message: this.translateService.instant('APP-LAYOUT.ARRIVALS-AND-DEPARTURES.MODALS.CREATE-TASKS.TEXT',  { houseNumber: this.houses.find(h => h.house_id == departure.house_id)?.house_number }),
          icon: undefined,
          rejectLabel: 'Cancel',
          rejectButtonProps: {
            label: this.translateService.instant('BUTTONS.CANCEL'),
            severity: 'secondary',
            outlined: true,
          },
          acceptButtonProps: {
            label: this.translateService.instant('BUTTONS.CREATE'),
            severity: 'primary',
          },
          accept: async () => {
            this.houseService.handleHouseDepartureTaskCreation(departure);
            this.messageService.add({ severity: 'info', summary: 'Updated', detail: 'Tasks created' });
          },
          reject: () => {
            this.messageService.add({ severity: 'warn', summary: 'Cancelled', detail: 'Change was cancelled' });
          }
        });
      } 
    }
  }

  async submitArrivals(event: any, arrival: any) {
    if(this.profileService.isHousekeeper(this.storedUserId) || this.profileService.isHouseTechnician(this.storedUserId)){
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!event.target.checked) {
      event.preventDefault();
  
      this.confirmationService.confirm({
        target: event.target,
        message: `Are you sure you want to mark <b>House ${arrival.house_number}</b> as NOT arrived?`,
        header: 'Confirm Uncheck',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancel',
        rejectButtonProps: {
          label: 'Cancel',
          severity: 'secondary',
          outlined: true,
        },
        acceptButtonProps: {
          label: 'Confirm',
          severity: 'danger',
        },
        accept: async () => {
          let updatedHouseAvailability = await this.houseService.setHouseAvailabilityArrived(arrival.house_availability_id, false);
          if (updatedHouseAvailability) {
            arrival.has_arrived = updatedHouseAvailability.has_arrived;
            this.messageService.add({ severity: 'info', summary: 'Updated', detail: 'Arrival unchecked' });
          }
        },
        reject: () => {
          event.target.checked = true; 
          this.messageService.add({ severity: 'warn', summary: 'Cancelled', detail: 'Change was cancelled' });
        }
      });
    } else {
      if (arrival.house_availability_id) {
        let updatedHouseAvailability = await this.houseService.setHouseAvailabilityArrived(arrival.house_availability_id, true);
        if (updatedHouseAvailability) {
          arrival.has_arrived = updatedHouseAvailability.has_arrived;
          this.messageService.add({ severity: 'success', summary: 'Arrival confirmed' });
        }
      }
    }
  }

  updateSelectedDate() {
    const now = new Date();
    this.selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    this.getTodaysArrivals();
    this.getTodaysDepartures();
  }
}
