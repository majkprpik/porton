import { $t } from '@primeng/themes';
import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { LayoutService } from '../service/layout.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DocumentOrientations, ExportTypes, Profile } from '../../pages/service/data.models';

interface CellData {
  isReserved: boolean;
  color: string;
  displayText: string;
  tooltip: string;
  identifier: string;
  isToday: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  isReservationStart: boolean;
  isReservationMiddle: boolean;
  isReservationEnd: boolean;
}

@Component({
  selector: 'app-work-schedule-export-form',
  imports: [
    DialogModule,
    ButtonModule,
    TranslateModule,
    CommonModule,
    SelectModule,
    FormsModule,
    RadioButtonModule,
  ],
  template: `
  <p-dialog 
    [(visible)]="visible" 
    [modal]="true" 
    [style]="{ width: '1200px' }" 
    [draggable]="false" 
    [resizable]="false"
    (onHide)="onCancel()"
  >
    <ng-template pTemplate="header">
      <h3>
        {{ 'WORK-SCHEDULE.MODAL.EXPORT-SCHEDULE' | translate }}
      </h3>
    </ng-template>

    <div class="export-schedule-date">
      <p-button [disabled]="isExporting" (onClick)="getPreviousWeek()" icon="pi pi-angle-left"></p-button>
       <div class="schedule-week">
          <b>
            {{ days()[0] | date: 'EEE' }} {{ days()[0] | date: 'dd.M.' }} - {{ days()[6] | date: 'EEE' }} {{ days()[6] | date: 'dd.M.' }}
          </b>
        </div>
      <p-button [disabled]="isExporting" (onClick)="getNextWeek()" icon="pi pi-angle-right"></p-button>
    </div>
    
    <div  class="export-table-container">
      @if(isExporting){
        <div class="exporting-overlay">

        </div>

        <div class="export-loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          <b>Exporting schedule. Please wait...</b>
        </div>
      }
      <table #exportTable class="export-table">
        <thead>
          <tr>
            <th class="days-header corner-header"></th>
            @for (day of days(); track day.getTime()) {
              <th
                class="day-header"
                [title]="day.toLocaleDateString()"
                [ngStyle]="{
                  'height': '30px',
                }"
              >
                {{ day | date: 'EEE' }} {{ day | date: 'dd.M.' }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (profile of filteredProfiles; track profile.id; let i = $index) {
            <tr>
              <th 
                class="row-header" 
              >
                {{ profile.first_name }}
              </th>
              @for (day of days(); track day.getTime(); let j = $index) {
                <td
                  [ngClass]="{
                    'reserved-cell': gridMatrix()[i][j].isReserved,
                    'reservation-start': gridMatrix()[i][j].isReservationStart,
                    'reservation-middle': gridMatrix()[i][j].isReservationMiddle,
                    'reservation-end': gridMatrix()[i][j].isReservationEnd,
                    'border-left-important': true,
                    'border-right-important': true,
                    'border-top-important': true,
                    'border-bottom-important': true,
                    'height-30-important': true,
                  }"
                  [style.background-color]="gridMatrix()[i][j].color"
                >
                  <b>
                    {{gridMatrix()[i][j].displayText}}
                  </b>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>

    <ng-template pTemplate="footer">
      <div class="form-footer">
        <p-button 
          [label]="'BUTTONS.CANCEL' | translate" 
          icon="pi pi-times" 
          (click)="onCancel()" 
          styleClass="p-button-text"
          [disabled]="isExporting"
        ></p-button>

        <div class="export-buttons">
          <div class="export-type">
            <p-select 
              id="exportType" 
              [options]="exportTypes" 
              [(ngModel)]="selectedExportType" 
              optionLabel="label"
              optionValue="value"
              [style]="{ width: '100px' }" 
            >
            </p-select>
            
            <div class="select-export-types">
              @if(selectedExportType == 'pdf') {
                <label id="portrait-select-container">
                  <p-radioButton id="portrait" name="orientation" value="portrait" [(ngModel)]="selectedOrientation" label="Portrait"></p-radioButton>
                  {{ 'WORK-SCHEDULE.MODAL.PORTRAIT' | translate }}
                </label>
                <label id="landscape-select-container">  
                  <p-radioButton id="landscape" name="orientation" value="landscape" [(ngModel)]="selectedOrientation" label="Landscape"></p-radioButton>
                  {{ 'WORK-SCHEDULE.MODAL.LANDSCAPE' | translate }}
                </label>
              }
            </div>
          </div>

          <p-button 
            [label]="'BUTTONS.EXPORT' | translate" 
            icon="pi pi-check" 
            (click)="onExport(selectedOrientation)" 
            class="density-button"
            [disabled]="isExporting"
          ></p-button>
        </div>
      </div>
    </ng-template>
  </p-dialog> 
  `,
  styles: `
    ::ng-deep p-select span {
      display: flex !important;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }

    .export-schedule-date{
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding-bottom: 10px;
    }

    .export-table-container {
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      position: relative;

      .exporting-overlay{
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background-color: white;
        opacity: 80%;
        z-index: 20;
      }

      .export-loading{
        position: fixed;
        top: 45%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        z-index: 25;
      }

      .export-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
        margin: 0;
        box-shadow: none;

        & > thead > tr > th:first-child {
          z-index: 15 !important;
        }

        th,td {
          border: 1px solid #ddd;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 110px !important;
        }

        .height-30-important{
          height: 30px !important;
        }
        tbody tr:nth-child(even) {
          background-color: rgba(0, 0, 0, 0.01);
        }

        .corner-header {
          background-color: #f0f0f0 !important;
          border: 1px solid black !important;
          position: sticky !important;
          top: 0;
          left: 0;
          z-index: 15 !important;
          width: 150px !important;
        }

        .days-header {
          background-color: var(--surface-card) !important;
          font-weight: bold;
          position: sticky;
          top: 0;
          left: 0;
          z-index: 10 !important;
          border: 1px solid black;
          box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
        }

        .day-header {
          background-color: var(--surface-card);
          font-weight: bold;
          position: sticky;
          top: 0;
          z-index: 5;
          border: 1px solid black;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .row-header {
          background-color: var(--surface-card);
          font-weight: bold;
          position: sticky;
          left: 0;
          z-index: 5;
          border: 1px solid black;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
          width: 150px !important;

          &.active-row {
            background-color: #e8f5e9;
            color: #2e7d32;
            border-left: 3px solid #4caf50;
            font-weight: 900;
          }
        }

        .reserved-cell {
          color: #000;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: bold;
          box-sizing: border-box;

          &.reservation-start {
            position: relative;
            z-index: 2;
          }

          &.reservation-middle {
            position: relative;
            z-index: 2;
          }

          &.reservation-end {
            position: relative;
            z-index: 2;
          }
        }
        user-select: none;
      }
    }

    .form-footer{
      width: 100%;
      padding-top: 20px;
      padding-bottom: 10px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;

      .export-buttons{
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;

        .export-type{
          display: flex;
          flex-direction: row; 
          gap: 10px;

          .select-export-types{
            display: flex;
            flex-direction: column;
            gap: 5px;

            #portrait-select-container, #landscape-select-container{
              display: flex;
              flex-direction: row;
              gap: 5px;
            }
          }
        }
      }
    }

    @keyframes cell-selected-pulse {
      0% {
        border-color: rgba(0, 123, 255, 1);
        background-color: rgba(0, 123, 255, 0.05);
      }
      50% {
        border-color: rgba(0, 123, 255, 0.7);
        background-color: rgba(0, 123, 255, 0.1);
      }
      100% {
        border-color: rgba(0, 123, 255, 1);
        background-color: rgba(0, 123, 255, 0.05);
      }
    }

    .border-left-important {
      border-left: 1px solid black !important;
    }
    .border-right-important {
      border-right: 1px solid black !important;
    }
    .border-top-important {
      border-top: 1px solid black !important;
    }
    .border-bottom-important {
      border-bottom: 1px solid black !important;
    }
  `
})
export class WorkScheduleExportFormComponent {
  @ViewChild('exportTable', { static: false }) exportTable!: ElementRef;

  @Input() visible: boolean = false;
  @Input() filteredProfiles: Profile[] = [];
  @Input() gridMatrix = signal<CellData[][]>([]);

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() weekChange = new EventEmitter<{monday: Date, sunday: Date}>();

  days = signal<Date[]>(this.generateDays());
  isNightMode: boolean | undefined = undefined;
  
  weekOffset = 0;
  isExporting = false;

  exportTypes = [
    { label: 'PDF', value: ExportTypes.PDF },
  ];

  selectedExportType = ExportTypes.PDF;

  orientationOptions = [
    { label: 'Portrait', value: DocumentOrientations.Portrait },
    { label: 'Landscape', value: DocumentOrientations.Landscape },
  ];

  selectedOrientation = DocumentOrientations.Portrait;

  constructor(
    private layoutService: LayoutService,
  ) {
    effect(() => {
      this.isNightMode = this.layoutService.layoutConfig().darkTheme;
    });
  }

  ngOnInit(){
    console.log(this.gridMatrix);
  }

  onCancel() {
    this.visibleChange.emit(false);
  }

  onExport(orientation: string) {
    if (!this.exportTable) return;

    this.isExporting = true;

    setTimeout(() => { // allow overlay to render first
      const element = this.exportTable.nativeElement;

      if (this.selectedExportType === ExportTypes.PDF) {
        html2canvas(element, { scale: 2 }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          let pdf;

          if (orientation === DocumentOrientations.Portrait) {
            pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height / canvas.width) * pdfWidth;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
          } else {
            pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const scaleX = pdfWidth / canvas.width;
            const scaleY = pdfHeight / canvas.height;
            const scale = Math.min(scaleX, scaleY);
            
            const imgWidth = canvas.width * scale;
            const imgHeight = canvas.height * scale;
            
            const x = (pdfWidth - imgWidth) / 2;
            const y = 0;
            
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          }

          pdf.save('work-schedule.pdf');
        }).finally(() => {
          this.isExporting = false; 
          this.visibleChange.emit(false);
        });
      }
    });
  }

  private generateDays(offsetWeeks: number = 0): Date[] {
    const days: Date[] = [];
    const today = new Date();

    // Apply offset
    today.setDate(today.getDate() + offsetWeeks * 7);

    // Find Monday of this week
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const diffToMonday = (dayOfWeek + 6) % 7;
    monday.setDate(today.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Build the week
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }

    return days;
  }

  getNextWeek() {
    this.weekOffset++;
    this.days.set(this.generateDays(this.weekOffset));
    this.weekChange.emit({monday: this.days()[0], sunday: this.days()[this.days().length - 1]})
  }

  getPreviousWeek() {
    this.weekOffset--;
    this.days.set(this.generateDays(this.weekOffset));
    this.weekChange.emit({monday: this.days()[0], sunday: this.days()[this.days().length - 1]})
  }

  formatDate(date: Date): string {
    return `${date.getDate()}.${date.getMonth() + 1}`;
  }
}
