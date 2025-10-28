import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { House, HouseAvailability, Season } from '../models/data.models';
import { HouseService } from './house.service';

@Injectable({
  providedIn: 'root'
})
export class ExportReservationsService {

  private weekendColors = {
    saturday: 'EF4444', // Tailwind red-400
    sunday: 'DC2626', // Tailwind red-500
  };

  constructor(private houseService: HouseService) {} 

  exportToExcel(
    combinedHouses: House[], 
    combinedHouseaAvailabilities: HouseAvailability[], 
    season: Season,
  ) {
    const seasonStart = new Date(season.season_start_date);
    seasonStart.setHours(0, 0, 0, 0);

    const seasonEnd = new Date(season.season_end_date);
    seasonEnd.setHours(0, 0, 0, 0);

    const allDates = this.getSeasonDates(seasonStart, seasonEnd); 
    const uniqueTypes = [...new Set(combinedHouses.map(h => h.house_type_id))];  
    const wb: XLSX.WorkBook = { Sheets: {}, SheetNames: [] }; 

    for (const typeId of uniqueTypes) {
      const sheetName = this.houseService.getHouseType(typeId)?.house_type_name ?? '';
      const housesOfType = combinedHouses.filter(h => h.house_type_id === typeId);
      const houseIds = housesOfType.map(h => h.house_id); 
      const reservations = combinedHouseaAvailabilities.filter(r => houseIds.includes(r.house_id));  

      if (!reservations.length) continue; 

      const data: any[][] = [];
      const header = ['House', ...allDates.map(d => this.formatExcelHeaderDate(d))];
      data.push(header);  
      const grouped = this.groupBy(reservations, 'house_id');
      const cellMeta: Record<string, any> = {};
      const sortedHouseIds = Object.keys(grouped)
        .map(id => +id)
        .sort((a, b) => {
          const houseA = housesOfType.find(h => h.house_id === a);
          const houseB = housesOfType.find(h => h.house_id === b);  
          const numA = Number(houseA?.house_number ?? 0);
          const numB = Number(houseB?.house_number ?? 0);
          const aPos = a > 0 ? 0 : 1;
          const bPos = b > 0 ? 0 : 1;
          
          if (aPos !== bPos) return aPos - bPos;  
          return numA - numB;
        }); 

      for (const houseId of sortedHouseIds) {
        const house = housesOfType.find(h => h.house_id === +houseId);
        const houseName = house?.house_name || `House ${houseId}`;
        const row: any[] = [houseName];
        (row as any)._houseId = houseId;
        const resList = grouped[houseId]; 

        for (const date of allDates) {
          const match = resList.find((r: any) =>
            this.parseLocalDate(r.house_availability_start_date) <= date &&
            date <= this.parseLocalDate(r.house_availability_end_date)
          );  

          if (match) {
            const startDate = this.parseLocalDate(match.house_availability_start_date);
            const startDateStr = this.formatExcelHeaderDate(startDate);
            const cellDateStr = this.formatExcelHeaderDate(date);
            const isFirstDay = cellDateStr === startDateStr;
            const cellValue = isFirstDay ? (match.last_name || match.reservation_number) : '';

            row.push(cellValue);  
            cellMeta[`${houseId}-${cellDateStr}`] = match;  

            if (isFirstDay && match.note) {
              cellMeta[`${houseId}-${cellDateStr}`]._note = match.note;
            }
          } else {
            row.push('');
          }
        } 

        data.push(row);
      }
    
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

      const headerRow = 0;
      for (let C = 1; C < header.length; ++C) {
        const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: C });
        const cell = ws[cellAddr];
        if (!cell) continue;

        const headerText = header[C];
        const weekday = headerText.split(' ')[0];

        if (weekday === 'Sat') {
          cell.s = {
            font: { color: { rgb: this.weekendColors.saturday }, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        } else if (weekday === 'Sun') {
          cell.s = {
            font: { color: { rgb: this.weekendColors.sunday }, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        } else {
          cell.s = {
            font: { bold: true },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
      }

      const houseIdToNumber: Record<number, string | number> = {}; 
      const range = XLSX.utils.decode_range(ws['!ref'] || '');

      for (const h of combinedHouses) {
        houseIdToNumber[h.house_id] = h.house_number || h.house_id;
      } 
      
      for (let R = 1; R <= range.e.r; ++R) {
        const houseId = (data[R] as any)?._houseId;

        for (let C = 1; C <= range.e.c; ++C) {
          const dateStr = header[C];
          const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddr] || (ws[cellAddr] = { t: 's', v: '' });
          const res = cellMeta[`${houseId}-${dateStr}`]; 


          if (res) {
            const color = this.colorForReservation(res);

            const startDate = this.formatExcelHeaderDate(this.parseLocalDate(res.house_availability_start_date));
            const endDate = this.formatExcelHeaderDate(this.parseLocalDate(res.house_availability_end_date));
            const isStart = dateStr === startDate;
            const isEnd = dateStr === endDate;

            const border: any = {
              top:    { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
            };

            if (isStart) border.left = { style: 'thin', color: { rgb: '000000' } };
            if (isEnd) border.right = { style: 'thin', color: { rgb: '000000' } };

            cell.s = {
              fill: { patternType: 'solid', fgColor: { rgb: color } },
              alignment: { horizontal: 'center', vertical: 'center' },
              font: { bold: !!cell.v },
              border,
            };

            if (res._note && cell.v) {
              cell.c = [{ t: res._note }];
            }
          }

        }
      } 

      ws['!cols'] = [{ wch: 10 }, ...Array(allDates.length).fill({ wch: 12 })];
      wb.Sheets[sheetName] = ws;
      wb.SheetNames.push(sheetName);
    } 
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'reservations_by_type.xlsx');
  } 

  private groupBy(arr: any[], key: string) {
    return arr.reduce((acc, obj) => {
      (acc[obj[key]] = acc[obj[key]] || []).push(obj);

      return acc;
    }, {});
  } 

  private getSeasonDates(start: Date, end: Date): Date[] {
    const dates: Date[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    return dates;
  } 

  private colors = [
    '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFE4BA',
    '#E8BAFF', '#BAF2FF', '#FFC9BA', '#D4FFBA', '#FFBAEC'
  ];

  private colorForReservation(r: any): string {
    const baseColor = this.colors[r.color_theme % this.colors.length];
    const opacity = 0.7 + (r.color_tint * 0.3);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);

    if (result) {
      const rVal = parseInt(result[1], 16);
      const gVal = parseInt(result[2], 16);
      const bVal = parseInt(result[3], 16);

      const blend = (c: number) => Math.round(255 - (255 - c) * opacity);

      const rFinal = blend(rVal);
      const gFinal = blend(gVal);
      const bFinal = blend(bVal);

      return `FF${rFinal.toString(16).padStart(2, '0')}${gFinal.toString(16).padStart(2, '0')}${bFinal.toString(16).padStart(2, '0')}`.toUpperCase();
    }

    return `FF${baseColor.replace('#', '')}`.toUpperCase();
  }

  private parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);

    return new Date(year, month - 1, day);
  } 

  private formatDateKey(d: Date): string {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatExcelHeaderDate(d: Date): string {
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${weekday} ${day}.${month}.`;
  }
}
