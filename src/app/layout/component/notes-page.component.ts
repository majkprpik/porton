import { Component, ElementRef, Inject, LOCALE_ID, ViewChild } from '@angular/core';
import { DataService, Note, Profile } from '../../pages/service/data.service';
import { NotesService } from '../../pages/service/notes.service';
import { ProfileService } from '../../pages/service/profile.service';
import { combineLatest } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-notes-page',
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    DatePicker,
    TranslateModule,
  ],
  template: `
    <div class="notes-container">
      <div class="header-container">
        <div class="notes-header">
          <p-button [disabled]="daysIndex <= -365" (onClick)="decreaseIndex()" icon="pi pi-angle-left"></p-button>
          <div class="notes-title">
            <span id="notes">{{ 'APP-LAYOUT.NOTES.TITLE' | translate }}</span>
            @if(isToday(selectedDate)){
              <span [ngStyle]="{'height': '20px'}">{{ 'APP-LAYOUT.NOTES.TODAY' | translate }}</span>
            } @else {
              <p-datePicker 
                [(ngModel)]="selectedDate" 
                [showIcon]="true" 
                dateFormat="dd/mm/yy"
                [inputStyle]="{
                  height: '20px',
                  width: '100px',
                }"
                (onSelect)="updateDaysIndexFromSelectedDate()"
              >
                <ng-template pTemplate="date" let-date>
                  @if(hasNotesForCalendarDate(date) && !isCalendarDateSelected(date)){
                    <strong [ngStyle]="{'color': 'var(--p-green-500)'}">{{ date.day }}</strong>
                  } @else {
                    {{ date.day }}
                  }
                </ng-template>
              </p-datePicker>
            }
          </div>
          <p-button [disabled]="daysIndex >= 365" (onClick)="increaseIndex()" icon="pi pi-angle-right"></p-button>
        </div>
      </div>

      <div class="notes-content" #messagesContainer>
        @if(!notes.length && !areNotesLoaded){
          <span>{{ 'APP-LAYOUT.NOTES.LOADING-NOTES' | translate }}</span>
        }
        @if(areNotesLoaded && notesForSelectedDate.length == 0){
          <span>{{ 'APP-LAYOUT.NOTES.NO-NOTES' | translate }}</span>
        }
        @if(notesForSelectedDate.length > 0){
          @for(note of notesForSelectedDate; track note?.id || i; let i = $index) {
            @if(i == 0 || !areDaysEqual(notesForSelectedDate[i].time_sent, notesForSelectedDate[i-1].time_sent)){
              <div class="date-sent" [ngStyle]="{'padding-top': i != 0 ? '10px': '5px'}">
                <div class="left-half-line"></div>
                @if(isToday(note.time_sent)){
                  <span>
                    {{ 'APP-LAYOUT.NOTES.TODAY' | translate }}
                  </span>
                } @else {
                  <span>
                    {{ note.time_sent | date: 'dd MMM YYYY' }}
                  </span>
                }
                <div class="right-half-line"></div>
              </div>
            }
            <div class="note-entry">
              @if(i == 0 || notesForSelectedDate[i].profile_id != notesForSelectedDate[i-1].profile_id || hasMoreThan5MinutesPassedBetweenMessages(notesForSelectedDate[i], notesForSelectedDate[i-1])){
                <br>
                <b>{{ findProfileNameForNote(note)}} </b> <span [ngStyle]="{'color': 'gray'}">- {{note.time_sent | date:'HH:mm'}}</span>
                <br>
              }
                {{note.note}}
            </div>
          }
        }
      </div>

      <div class="notes-footer">
        <textarea 
          [placeholder]="'APP-LAYOUT.NOTES.ADD-NOTE' | translate"
          [(ngModel)]="note"
          (keydown.enter)="addNote($event)"
          [disabled]="daysIndex < 0"
        ></textarea>
      </div>
    </div>
  `,
  styles: `
  .notes-container{
    height: 80vh;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .header-container{
      width: 100%;
      height: 60px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      border-radius: 10px 10px 0 0;
      border-bottom: 1px solid #e5e7eb;
      background-color: var(--surface-ground);

      .notes-header{
        width: 80%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px 0 10px;

        .notes-title{
          display: flex;
          flex-direction: column;
          align-items: center;

          #notes{
            font-size: 21px;
            font-weight: bold;
          }
        }
      }
    }

    .notes-content{
      height: calc(100% - 100px);
      box-sizing: border-box;
      padding: 10px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      word-wrap: break-word;
      align-items: flex-start;
      background-color: var(--surface-card);
      scrollbar-gutter: stable;

      .date-sent{
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

        span{
          width: 200px;
          color: var(--text-color-secondary);
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }
      }

      .note-entry {
        display: block;
        width: 100%;
        text-align: left;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
        font-size: 14px;
      }
    }

    .notes-footer{
      height: 50px;
      width: 100%;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;

      textarea{
        width: 100%;
        height: 100%;
        border-radius: 0 0 10px 10px;
        resize: none;
        box-sizing: border-box; 
        padding: 10px;
        outline: none;

        &:disabled {
          background-color: var(--surface-ground);
        }
      }
    }
  }

  .left-half-line{
    height: 1px;
    background-color: var(--surface-ground); 
    width: 100%;
  }

  .right-half-line{
    height: 1px;
    background-color: var(--surface-ground); 
    width: 100%;
  }`
})
export class NotesPageComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  note: string = '';
  notes: Note[] = [];
  daysIndex: number = 0; 
  areNotesLoaded: boolean = false;
  selectedDate: Date = new Date();
  profiles: Profile[] = [];

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    private notesService: NotesService,
    private dataService: DataService,
    public profileService: ProfileService,
  ) {}

  increaseIndex(){
    if(this.daysIndex < 365) {
      this.daysIndex++;
      this.updateSelectedDate();
    }
  }

  decreaseIndex(){
    if(this.daysIndex > -365) {
      this.daysIndex--;
      this.updateSelectedDate();
    }
  }

  get selectedDateDisplay(): string {
    if (this.daysIndex === 0) {
      return 'Danas';
    }

    const date = this.selectedDate;
    return date.toLocaleDateString(this.locale, { month: 'long', day: 'numeric', weekday: 'long' });
  }

  get notesForSelectedDate(): Note[] {
    if (!this.selectedDate || !this.notes.length) return [];

    return this.getNotesForDay(
      this.selectedDate.getFullYear(),
      this.selectedDate.getMonth(),
      this.selectedDate.getDate()
    );
  }

  private getNotesForDay(year: number, month: number, day: number): Note[] {
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    return this.notes.filter(note => {
      const noteDate = new Date(note.for_date!);
      return noteDate >= startOfDay && noteDate <= endOfDay;
    });
  }

  hasNotesForCalendarDate(date: { year: number, month: number, day: number }): boolean {
    return this.getNotesForDay(date.year, date.month, date.day).length > 0;
  }

  ngOnInit(){
    combineLatest([
      this.dataService.notes$,
      this.dataService.$areNotesLoaded,
      this.dataService.profiles$,
    ]).subscribe({
      next: ([notes, areNotesLoaded, profiles]) => {
        this.notes = notes;
        this.areNotesLoaded = areNotesLoaded;
        this.profiles = profiles;

        this.notes = this.notes.map(note => {
          if(!note.for_date){
            return {
              ...note, 
              for_date: note.time_sent,
            }
          }

          return note;
        })
        .sort((a, b) => new Date(a.time_sent).getTime() - new Date(b.time_sent).getTime());

        if(areNotesLoaded){
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
        }
      },
      error: (error) => {
        console.log(error);
      }
    });

    this.updateSelectedDate();
  }

  updateSelectedDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newSelected = new Date(today);
    newSelected.setDate(today.getDate() + this.daysIndex);

    this.selectedDate = newSelected;
  }

  updateDaysIndexFromSelectedDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(this.selectedDate);
    selected.setHours(0, 0, 0, 0);

    const diffTime = selected.getTime() - today.getTime();
    this.daysIndex = Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  async addNote(event: any){
    event.preventDefault();
    this.note = this.note.trim();

    if(this.note && this.daysIndex >= 0){    
      const now = new Date();
      const selectedDate = new Date(this.selectedDate);

      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

      await this.notesService.createNote(this.note, selectedDate);
      this.note = '';
    }
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
  }

  areDaysEqual(date1: string | undefined, date2: string | undefined){
    if(date1 && date2) {
      return date1.slice(0, 10).split('-')[2] === date2.slice(0, 10).split('-')[2];
    }

    return false;
  }

  hasMoreThan5MinutesPassedBetweenMessages(note1: Note, note2: Note){
    if (!note1.time_sent || !note2.time_sent) return false;

    const time1 = new Date(note1.time_sent).getTime();
    const time2 = new Date(note2.time_sent).getTime();

    const diffMs = Math.abs(time1 - time2); // difference in milliseconds
    const fiveMinutesMs = 5 * 60 * 1000; // 5 minutes in ms

    return diffMs > fiveMinutesMs;
  }

  isToday(time_sent: string | Date): boolean {
    const date = new Date(time_sent);
    const today = new Date();

    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  isCalendarDateSelected(date: any): boolean {
    return (
      date.day === this.selectedDate.getDate() &&
      date.month === this.selectedDate.getMonth() &&
      date.year === this.selectedDate.getFullYear()
    );
  }

  findProfileNameForNote(note: Note){
    return this.profiles.find(profile => profile.id == note.profile_id)?.first_name;
  }
}
