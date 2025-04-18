import { Component } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { HouseService } from '../../pages/service/house.service';
import { DataService, House, HouseAvailability } from '../../pages/service/data.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-arrivals-and-departures',
  standalone: true,
  imports: [
    CheckboxModule,
    FormsModule,
    ConfirmDialogModule,
    ToastModule,
    CalendarModule,
    CardModule,
    DividerModule,
    InputTextModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="arrivals-departures-container">
      <div class="departures-side">
        <div class="section-header">
          <i class="pi pi-sign-out mr-2"></i>
          <span>Departures</span>
        </div>
        <div class="section-content">
          @if(!departures.length){
            <div class="empty-message">
              <i class="pi pi-info-circle"></i>
              <span>No departures for today</span>
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
                    House: <span class="house-number">{{ departure.house_number }}</span>
                  </label>
                </div>
                <div class="time-container">
                  <p-calendar 
                    [(ngModel)]="departure.departureTimeObj" 
                    [timeOnly]="true" 
                    hourFormat="24"
                    [showSeconds]="false"
                    (onBlur)="updateDepartureTime(departure)"
                    appendTo="body"
                    placeholder="10:00"
                    styleClass="w-full"
                  ></p-calendar>
                </div>
              </div>
              <p-divider *ngIf="!$last"></p-divider>
            }
          }
        </div>
      </div>

      <div class="vertical-divider"></div>

      <div class="arrivals-side">
        <div class="section-header">
          <i class="pi pi-sign-in mr-2"></i>
          <span>Arrivals</span>
        </div>
        <div class="section-content">
          @if(!arrivals.length){
            <div class="empty-message">
              <i class="pi pi-info-circle"></i>
              <span>No arrivals for today</span>
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
                    House: <span class="house-number">{{ arrival.house_number }}</span>
                  </label>
                </div>
                <div class="time-container">
                  <p-calendar 
                    [(ngModel)]="arrival.arrivalTimeObj" 
                    [timeOnly]="true" 
                    hourFormat="24"
                    [showSeconds]="false"
                    (onBlur)="updateArrivalTime(arrival)"
                    appendTo="body"
                    placeholder="15:00"
                    styleClass="w-full"
                  ></p-calendar>
                </div>
              </div>
              <p-divider *ngIf="!$last"></p-divider>
            }
          }
        </div>
      </div>
    </div>

    <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
    <p-toast></p-toast>
  `,
  styles: `
    .arrivals-departures-container {
      display: flex;
      border-radius: 8px;
      overflow: hidden;
      background-color: var(--surface-card);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      height: 340px;
      width: 100%;
    }

    .departures-side, .arrivals-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background-color: var(--surface-section);
      border-bottom: 1px solid var(--surface-border);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .section-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
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
      flex: 0 0 120px;
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
      padding: 2rem 0;
      color: var(--text-color-secondary);
      height: 100%;
      
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
    })
  }

  getTodaysArrivals(){
    const today = new Date();
    const specificDateStr = today.toISOString().split('T')[0];

    let todaysHouseAvailabilities = this.houseAvailabilities.filter(ha => ha.house_availability_start_date.split('T')[0] == specificDateStr);

    this.arrivals = todaysHouseAvailabilities.map(ha => {
      const house_number = this.houses.find(house => house.house_id == ha.house_id)?.house_number;
      // Parse time string into Date object for the calendar component
      const arrivalTimeObj = this.getTimeObjFromTimeString(ha.arrival_time || '15:00');
      return { ...ha, house_number, arrivalTimeObj };
    });

    this.arrivals.sort((a, b) => {
      if (a.house_number < b.house_number) return -1;
      if (a.house_number > b.house_number) return 1;
      return 0;
    });
  }

  getTodaysDepartures() {
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
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

  // Convert time string (e.g. "15:00") to Date object for p-calendar
  getTimeObjFromTimeString(timeString: string): Date {
    const date = new Date();
    const [hours, minutes] = timeString.split(':').map(n => parseInt(n, 10));
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(0);
    return date;
  }

  // Convert Date object to time string (e.g. "15:00")
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
}
