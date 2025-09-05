import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'addDays' })
export class AddDaysPipe implements PipeTransform {
  transform(value: Date | string, days: number = 1): Date {
    const d = new Date(value);
    d.setDate(d.getDate() + days);
    return d;
  }
}
