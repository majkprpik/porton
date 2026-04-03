import { Component, ElementRef, Inject, LOCALE_ID, ViewChild } from '@angular/core';
import { Note, Profile } from '../../core/models/data.models';
import { NotesService } from '../../core/services/notes.service';
import { ProfileService } from '../../core/services/profile.service';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { MentionModule } from 'angular-mentions';
import { AuthService } from '../../core/services/auth.service';
import { isToday, areDaysEqual } from '../../shared/utils/date-utils';

@Component({
  selector: 'app-notes-page',
  imports: [
    ButtonModule,
    CommonModule,
    FormsModule,
    DatePicker,
    TranslateModule,
    MentionModule,
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
          <div class="empty-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>{{ 'APP-LAYOUT.NOTES.LOADING-NOTES' | translate }}</span>
          </div>
        }
        @if(areNotesLoaded && notesForSelectedDate.length == 0){
          <div class="empty-state">
            <i class="pi pi-comments"></i>
            <span>{{ 'APP-LAYOUT.NOTES.NO-NOTES' | translate }}</span>
          </div>
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
                  @if(profileService.isProfileDeleted(note.profile_id)){
                    <b>
                      <i>{{ findProfileNameForNote(note)}} ({{ 'APP-LAYOUT.NOTES.PROFILE-DELETED' | translate }})</i>
                    </b>
                    <span [ngStyle]="{'color': 'gray'}"> - {{note.time_sent | date:'HH:mm'}}</span>
                  } @else {
                    <b>{{ findProfileNameForNote(note)}} </b> <span [ngStyle]="{'color': 'gray'}"> - {{note.time_sent | date:'HH:mm'}}</span>
                  }
                <br>
              }
                <span [innerHTML]="formatNoteText(note.note)"></span>
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
          [mention]="profileNames"
          [mentionConfig]="{ dropUp: true }"
        ></textarea>
        <p-button
          icon="pi pi-send"
          [rounded]="true"
          [text]="true"
          [disabled]="!note.trim() || daysIndex < 0"
          (onClick)="addNote($event)"
        ></p-button>
      </div>
    </div>
  `,
  styles: `
    .notes-container {
      height: calc(100vh - 120px);
      display: flex;
      flex-direction: column;
    }

    .header-container {
      width: 100%;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      border-bottom: 1px solid var(--glass-border);
      position: relative;
      z-index: 2;

      .notes-header {
        width: 300px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .notes-title {
          display: flex;
          flex-direction: column;
          align-items: center;

          #notes {
            font-size: 21px;
            font-weight: bold;
          }
        }
      }
    }

    .notes-content {
      flex: 1;
      box-sizing: border-box;
      padding: 20px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      word-wrap: break-word;
      align-items: flex-start;
      scrollbar-gutter: stable;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));

      .empty-state {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: var(--text-color-secondary);

        i {
          font-size: 3rem;
          opacity: 0.4;
        }
      }

      .date-sent {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          width: 200px;
          color: var(--text-color-secondary);
          display: flex;
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

    .left-half-line, .right-half-line {
      height: 1px;
      background-color: var(--glass-border);
      width: 100%;
    }

    .notes-footer {
      height: 60px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1rem;
      border-top: 1px solid var(--glass-border);
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);

      textarea {
        flex: 1;
        height: 40px;
        border: none;
        border-radius: 8px;
        resize: none;
        box-sizing: border-box;
        padding: 10px 14px;
        outline: none;
        background: transparent;
        color: var(--text-color);
        font-family: inherit;
        font-size: 14px;

        &::placeholder {
          color: var(--text-color-secondary);
          opacity: 0.7;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  `
})
export class NotesPageComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  note: string = '';
  notes: Note[] = [];
  daysIndex: number = 0; 
  areNotesLoaded: boolean = false;
  selectedDate: Date = new Date();
  profiles: Profile[] = [];
  activeProfiles: Profile[] = [];
  profileNames: string[] = [];

  isToday = isToday;
  areDaysEqual = areDaysEqual;

  formatNoteText(text: string): string {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/@\S+/g, '<b>$&</b>');
  }

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    private notesService: NotesService,
    private dataService: DataService,
    public profileService: ProfileService,
    private authService: AuthService,
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

  ngOnInit() {
    this.subscribeToDataStreams();
    this.updateSelectedDate();
  }

  private subscribeToDataStreams() {
    combineLatest([
      this.dataService.notes$.pipe(nonNull()),
      this.dataService.$areNotesLoaded,
      this.dataService.profiles$.pipe(nonNull()),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([notes, areNotesLoaded, profiles]) => {
          this.notes = this.normalizeAndSortNotes(notes);
          this.areNotesLoaded = areNotesLoaded;
          this.profiles = profiles;
          this.activeProfiles = profiles
            .filter(p => !p.is_deleted || !p.is_test_user);
          this.profileNames = profiles
            .filter(p => !p.is_deleted || !p.is_test_user)
            .map(p => p.first_name!);

          if (areNotesLoaded) {
            setTimeout(() => this.scrollToBottom(), 0);
          }
        },
        error: (error) => {
          console.error('Error loading notes data:', error);
        }
      });
  }

  private normalizeAndSortNotes(notes: any[]) {
    return notes
      .map(note => {
        if (!note.for_date) {
          return {
            ...note,
            for_date: note.time_sent,
          };
        }
        return note;
      })
      .sort(
        (a, b) =>
          new Date(a.time_sent).getTime() - new Date(b.time_sent).getTime()
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    const mentionedProfiles = this.notesService.getMentionedProfilesFromNote(this.activeProfiles, this.note);

    if(this.note && this.daysIndex >= 0){    
      const now = new Date();
      const selectedDate = new Date(this.selectedDate);

      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

      const sentNote = await this.notesService.createNote(this.note, selectedDate);

      if(sentNote && mentionedProfiles.length) {
        this.notesService.sendNotificationToMentionedUsers(this.activeProfiles.find(p => p.id == this.authService.getStoredUserId())?.first_name ?? 'User', mentionedProfiles, this.note);
      }

      this.note = '';
    }
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
  }

  hasMoreThan5MinutesPassedBetweenMessages(note1: Note, note2: Note){
    if (!note1.time_sent || !note2.time_sent) return false;

    const time1 = new Date(note1.time_sent).getTime();
    const time2 = new Date(note2.time_sent).getTime();

    const diffMs = Math.abs(time1 - time2); // difference in milliseconds
    const fiveMinutesMs = 5 * 60 * 1000; // 5 minutes in ms

    return diffMs > fiveMinutesMs;
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
