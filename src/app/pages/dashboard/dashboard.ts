import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DataService, House, HouseAvailability } from '../service/data.service';
import { FormsModule } from '@angular/forms';

interface ReservationSlot {
    houseId: number;
    startDate: Date;
    endDate: Date;
    lastName: string;
    adults: number;
    babies: number;
    dogsSmall: number;
    color: string;
    typeId: number;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.scss'],
    standalone: true,
    imports: [CommonModule, ScrollingModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
  
} 