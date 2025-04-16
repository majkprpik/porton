import { Component } from '@angular/core';
import { combineLatest, interval, Subscription } from 'rxjs';
import { HouseService } from '../../pages/service/house.service';
import { DataService, House, HouseAvailability } from '../../pages/service/data.service';
import { MatDialog } from '@angular/material/dialog';
import { UncheckArrivalDepartureModalComponent } from './uncheck-arrival-departure-modal.component';

@Component({
  selector: 'app-arrivals-and-departures',
  standalone: true,
  imports: [],
  template: `
    <div class="arrivals-and-departures-container">
      <div class="departures-container">
        <div class="departures-header">
          <span>Departures</span>
        </div>
        <div class="departures-content">
          @if(!departures.length){
            <span>No departures for today</span>
          } @else{
            @for(departure of departures; track departure.house_availability_id){
              <div class="departures-data">
                <input 
                    id="departure-checkbox-{{ departure.house_number }}" 
                    type="checkbox" 
                    (click)="submitDepartures($event, departure)"
                    [checked]="departure.has_departed"
                >
                <label for="departure-checkbox-{{ departure.house_number }}">House: {{ departure.house_number }} at: {{ getTimeFromDate(departure.house_availability_start_date) }}</label>
              </div>
            }
          }
        </div>
      </div>

      <div class="arrivals-container">
        <div class="arrivals-header">
          <span>Arrivals</span>
        </div>
        <div class="arrivals-content">
          @if(!arrivals.length){
            <span>No arrivals for today</span>
          } @else{
            @for(arrival of arrivals; track arrival.house_availability_id){
              <div class="arrivals-data">
                <input 
                    id="arrival-checkbox-{{ arrival.house_number }}" 
                    type="checkbox" 
                    (click)="submitArrivals($event, arrival)"
                    [checked]="arrival.has_arrived"
                >
                <label for="arrival-checkbox-{{ arrival.house_number }}">House: {{ arrival.house_number }} at: {{ getTimeFromDate(arrival.house_availability_start_date) }}</label>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .arrivals-and-departures-container{
      height: 300px;
      width: 500px;
      display: flex;
      flex-direction: row;
      border-radius: 10px;
      border: 1px solid black;

      .arrivals-container, .departures-container{
        width: 50%;
        height: 100%;
        display: flex;
        flex-direction: column;
        
        .arrivals-header, .departures-header{
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          height: 50px;
          width: 100%;
          background-color: whitesmoke;
          border-bottom: 1px solid black;

          span{
            font-weight: bold;
            font-size: 21px;
          }
        }

        .arrivals-content, .departures-content{
          flex: 1;
          display: flex; 
          flex-direction: column;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
          padding: 15px;
          gap: 10px;
          overflow-y: auto;

          .arrivals-data, .departures-data{
            width: 100%;
            display: flex; 
            flex-direction: row;
            gap: 10px;
          }
        }
      }

      .arrivals-container{
        border-radius: 0 10px 10px 0;

        .arrivals-header{
          border-radius: 0 10px 0 0;
        }

        .arrivals-content{
          display: flex; 
          flex-direction: column;
        }
      }

      .departures-container{
        border-right: 1px solid gray;
        border-radius: 10px 0 0 10px;

        .departures-header{
          border-radius: 10px 0 0 0;
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
    private dialog: MatDialog,
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
      return { ...ha, house_number };
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
      return { ...ha, house_number };
    });

    this.departures.sort((a, b) => {
      if (a.house_number < b.house_number) return -1;
      if (a.house_number > b.house_number) return 1;
      return 0;
    });
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

  async submitDepartures(event: any, departure: any){
    if(!event.target.checked){
      event.preventDefault();

      let dialogRef = this.dialog.open(UncheckArrivalDepartureModalComponent, {
        height: '180px',
        width: '400px',
        data: { 
          houseNumber: departure.house_number,
          arrivalOrDeparture: 'departure',
        }
      });

      dialogRef.afterClosed().subscribe(async result => {
        if(result){
          let hasDeparted = await this.houseService.setHouseAvailabilityDeparted(departure.house_availability_id, false);
          if(hasDeparted){
            departure.has_departed = false;
          }
        }
      });
    } else {
      if(departure.house_availability_id){
        let hasDeparted = await this.houseService.setHouseAvailabilityDeparted(departure.house_availability_id, event.target.checked);
        if(hasDeparted){
          departure.has_departed = true;
        }
      }
    }
  }

  async submitArrivals(event: any, arrival: any){
    if(!event.target.checked){
      event.preventDefault();

      let dialogRef = this.dialog.open(UncheckArrivalDepartureModalComponent, {
        height: '180px',
        width: '400px',
        data: { 
          houseNumber: arrival.house_number,
          arrivalOrDeparture: 'arrival',
        }
      });

      dialogRef.afterClosed().subscribe(async result => {
        if(result){
          let hasArrived = await this.houseService.setHouseAvailabilityArrived(arrival.house_availability_id, false);
          if(hasArrived){
            arrival.has_arrived = false;
          }
        }
      });
    } else {
      if(arrival.house_availability_id){
        let hasArrived = await this.houseService.setHouseAvailabilityArrived(arrival.house_availability_id, event.target.checked);
        if(hasArrived){
          arrival.has_arrived = true;
        }
      }
    }
  }
}
