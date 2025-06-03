import { Component, LOCALE_ID } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { HouseService } from '../../pages/service/house.service';
import { DataService, House, HouseAvailability } from '../../pages/service/data.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-arrivals-and-departures',
  standalone: true,
  imports: [
    CheckboxModule,
    FormsModule,
    ToastModule,
    CardModule,
    DividerModule,
    InputTextModule,
    CommonModule,
    ButtonModule,
    DatePickerModule,
    ConfirmDialogModule,
    TranslateModule,
  ],
  providers: [
    ConfirmationService,
  ],
  template: `
    <div class="arrivals-departures-container">
      <div class="header">
        <div class="section-header">
          <p-button icon="pi pi-angle-left" (click)="goToPreviousDay()"></p-button>
          <div class="name-with-icon">
            <i class="pi pi-sign-out mr-2"></i>
            <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.DEPARTURES' | translate }}</span>
          </div>
        </div>

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

        <div class="section-header">
          <div class="name-with-icon">
            <i class="pi pi-sign-in mr-2"></i>
            <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.ARRIVALS' | translate }}</span>
          </div>
          <p-button icon="pi pi-angle-right" (click)="goToNextDay()"></p-button>
        </div>        
      </div>

      <div class="arrivals-and-departures">
        <div class="departures-side">
          <div class="section-content">
            @if(!departures.length){
              <div class="empty-message">
                <i class="pi pi-info-circle"></i>
                <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.NO-DEPARTURES' | translate }}</span>
              </div>
            } @else{
              @for(departure of departures; track departure.house_availability_id){
                <div class="p-field-row">
                  <div class="status-container">
                    <p-checkbox 
                      inputId="departure-checkbox-{{ departure.house_number }}" 
                      (click)="submitDepartures($event, departure)"
                      binary="true"
                      [(ngModel)]="departure.has_departed"
                    ></p-checkbox>
                  </div>
                  <div class="house-container">
                    <label for="departure-checkbox-{{ departure.house_number }}">
                      {{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.HOUSE' | translate }}: <span class="house-number">{{ departure.house_number }}</span>
                    </label>
                  </div>
                  <div class="time-container">
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
          <div class="section-content" [ngStyle]="{'border-left': '1px solid var(--surface-border)'}">
            @if(!arrivals.length){
              <div class="empty-message">
                <i class="pi pi-info-circle"></i>
                <span>{{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.NO-ARRIVALS' | translate }}</span>
              </div>
            } @else{
              @for(arrival of arrivals; track arrival.house_availability_id){
                <div class="p-field-row">
                  <div class="status-container">
                    <p-checkbox 
                      inputId="arrival-checkbox-{{ arrival.house_number }}" 
                      (click)="submitArrivals($event, arrival)"
                      binary="true"
                      [(ngModel)]="arrival.has_arrived"
                    ></p-checkbox>
                  </div>
                  <div class="house-container">
                    <label for="arrival-checkbox-{{ arrival.house_number }}">
                      {{ 'APP-LAYOUT.ARRIVALS-AND-DEPARTURES.HOUSE' | translate }}: <span class="house-number">{{ arrival.house_number }}</span>
                    </label>
                  </div>
                  <div class="time-container">
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
    </div>

    <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
  `,
  styles: `
    .arrivals-departures-container {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      background-color: var(--surface-card);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      height: 340px;
      width: 100%;

      .header{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 5px;
        width: 100%;
        background-color: var(--surface-ground);
        height: 50px;

        .selected-date{
          width: 95px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5px;
          background-color: var(--surface-section);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-color);
          gap: 10px;
          height: 100%;

          .name-with-icon{
            span{
              font-size: 13px;
            }
          }
        }
      }

      .arrivals-and-departures{
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
        border-top: 1px solid var(--surface-border);
        height: 290px;

        .departures-side, .arrivals-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;

          .section-content {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            height: 100%;
            scrollbar-gutter: stable;
          }
        }
      }
    }

    .vertical-divider {
      width: 1px;
      background-color: var(--surface-border);
    }

    .p-field-row {
      display: flex;
      align-items: center;
      padding: 0.5rem 0;
      gap: 1rem;
    }

    .status-container {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .house-container {
      flex: 1;
      min-width: 0;
    }

    .time-container {
      flex: 0 0 80px;
    }

    .house-number {
      font-weight: 600;
      color: var(--primary-color);
    }

    .empty-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-color-secondary);
      height: 100%;
      width: 183px;
      box-sizing: border-box;
      padding-left: 20px;
      
      i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }
    }

    :host ::ng-deep {
      .p-calendar {
        width: 100%;
        
        .p-inputtext {
          width: 100%;
          font-size: 0.9rem;
        }
      }

      .p-divider {
        margin: 0.5rem 0;
      }

      p-checkbox {
        .p-checkbox {
          margin-right: 0;
        }
      }
    }
  `
})
export class ArrivalsAndDeparturesComponent {
  arrivals: any[] = [];
  departures: any[] = [];
  private subscription: Subscription | undefined;
  checkedDepartureHouseIds: number[] = [];
  checkedArrivalHouseIds: number[] = [];
  houseAvailabilities: HouseAvailability[] = [];
  houses: House[] = [];
  selectedDate: Date = new Date();

  constructor(
    private houseService: HouseService,
    private dataService: DataService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {    
    
  }
  
  async ngOnInit(){
    combineLatest([
      this.dataService.houses$,
      this.dataService.houseAvailabilities$,
    ]).subscribe({
      next: ([houses, houseAvailabilities]) => {
        this.houses = houses;
        this.houseAvailabilities = houseAvailabilities;

        if(houses && houses.length > 0 && houseAvailabilities && houseAvailabilities.length > 0){
          this.getTodaysArrivals();
          this.getTodaysDepartures();
        }
      },
      error: (error) => {
        console.log(error);
      }
    });

    this.dataService.$houseAvailabilitiesUpdate.subscribe(res => {
      if(res && res.eventType == 'UPDATE'){
        if(this.arrivals.find(arrival => arrival.house_availability_id == res.new.house_availability_id)) {
          let arrivalIndex = this.arrivals.findIndex(arrival => arrival.house_availability_id == res.new.house_availability_id);
          let house = this.houses.find(house => house.house_id == res.new.house_id);

          res.new = {
            ...res.new,
            house_number: house?.house_number,
            arrivalTimeObj: this.getTimeObjFromTimeString(res.new.arrival_time || '16:00'),
          }

          this.arrivals[arrivalIndex] = res.new;
          this.arrivals = [...this.arrivals];
        } else if (this.departures.find(arrival => arrival.house_availability_id == res.new.house_availability_id)){
          let departureIndex = this.departures.findIndex(arrival => arrival.house_availability_id == res.new.house_availability_id);
          let house = this.houses.find(house => house.house_id == res.new.house_id);
          
          res.new = {
            ...res.new,
            house_number: house?.house_number,
            departureTimeObj: this.getTimeObjFromTimeString(res.new.departure_time || '10:00')
          }

          this.departures[departureIndex] = res.new;
          this.departures = [...this.departures];
        }

        const haIndex = this.houseAvailabilities.findIndex(ha => ha.house_availability_id == res.new.house_availability_id);
        this.houseAvailabilities[haIndex] = res.new;
        this.dataService.setHouseAvailabilites([...this.houseAvailabilities]);
      };
    });
  }

  getTodaysArrivals(){
    const specificDateStr = this.selectedDate.toISOString().split('T')[0];

    let todaysHouseAvailabilities = this.houseAvailabilities.filter(ha => ha.house_availability_start_date.split('T')[0] == specificDateStr);

    this.arrivals = todaysHouseAvailabilities.map(ha => {
      const house_number = this.houses.find(house => house.house_id == ha.house_id)?.house_number;
      // Parse time string into Date object for the calendar component
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
      // Parse time string into Date object for the calendar component
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

  // Update departure time in database
  async updateDepartureTime(departure: any) {
    const timeString = this.getTimeStringFromObj(departure.departureTimeObj);
    
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
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async submitDepartures(event: any, departure: any) {
    if (!event.target.checked) {
      event.preventDefault();
  
      this.confirmationService.confirm({
        target: event.target,
        message: `Are you sure you want to mark <b>House ${departure.house_number}</b> as NOT departed?`, // Use HTML to make the house number bold
        header: 'Confirm Departure Uncheck',
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
          let hasDeparted = await this.houseService.setHouseAvailabilityDeparted(departure.house_availability_id, false);
          if (hasDeparted) {
            departure.has_departed = false;
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
        let hasDeparted = await this.houseService.setHouseAvailabilityDeparted(departure.house_availability_id, event.target.checked);
        if (hasDeparted) {
          departure.has_departed = true;
        }
      }
    }
  }

  async submitArrivals(event: any, arrival: any) {
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
          let hasArrived = await this.houseService.setHouseAvailabilityArrived(arrival.house_availability_id, false);
          if (hasArrived) {
            arrival.has_arrived = false;
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
        let hasArrived = await this.houseService.setHouseAvailabilityArrived(arrival.house_availability_id, true);
        if (hasArrived) {
          arrival.has_arrived = true;
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
