import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../pages/service/notes.service';
import { DataService, Note } from '../../pages/service/data.service';
import { combineLatest } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ProfileService } from '../../pages/service/profile.service';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule
  ],
  template: `
    <div class="notes-container">
      <div class="header-container">
        <div class="notes-header">
          <p-button [disabled]="daysIndex >= 365" (onClick)="increaseIndex()" icon="pi pi-angle-left"></p-button>
          <div class="notes-title">
            <span id="notes">Notes</span>
            <span id="days">{{ selectedDateDisplay }}</span>
          </div>
          <p-button [disabled]="daysIndex <= -365" (onClick)="decreaseIndex()" icon="pi pi-angle-right"></p-button>
        </div>
      </div>

      <div class="notes-content" #messagesContainer>
        <span *ngIf="!notes.length && !areNotesLoaded">Loading notes...</span>
        <span *ngIf="areNotesLoaded && notesForSelectedDate.length === 0">No notes for this day</span>
        <ng-container *ngIf="notesForSelectedDate.length > 0">
          <div class="note-entry" *ngFor="let note of notesForSelectedDate">
            <b>{{profileService.findProfile(note.profile_id)?.first_name}} - {{note.time_sent | date:'HH:mm'}}:</b> {{note.note}}
          </div>
        </ng-container>
      </div>

      <div class="notes-footer">
        <textarea 
          placeholder="Add a note..."
          [(ngModel)]="note"
          (keydown.enter)="addNote($event)"
          [disabled]="daysIndex > 0"
        ></textarea>
      </div>
    </div>
  `,
  styles: `
    .notes-container{
      height: 300px;
      width: 500px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .header-container{
        width: 100%;
        height: 50px;
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
        background-color: white;

        .note-entry {
          display: block;
          width: 100%;
          text-align: left;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
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
  `
})
export class NotesComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  note: string = '';
  notes: Note[] = [];
  daysIndex = 0; 
  areNotesLoaded = false;

  constructor(
    private notesService: NotesService,
    private dataService: DataService,
    public profileService: ProfileService,
  ) {}

  increaseIndex(){
    if(this.daysIndex < 365) {
      this.daysIndex++;
    }
  }

  decreaseIndex(){
    if(this.daysIndex > -365) {
      this.daysIndex--;
    }
  }

  get selectedDate(): Date {
    const now = new Date();
    const selected = new Date(now);
    selected.setDate(now.getDate() - this.daysIndex);
    return selected;
  }

  get selectedDateDisplay(): string {
    if (this.daysIndex === 0) {
      return 'Today';
    }

    const date = this.selectedDate;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }

  get notesForSelectedDate(): Note[] {
    if(!this.notes.length) return [];
    const day = this.selectedDate;
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    return this.notes.filter(note => {
      const timeSent = new Date(note.time_sent);
      return timeSent >= startOfDay && timeSent <= endOfDay;
    });
  }

  ngOnInit(){
    combineLatest([
      this.dataService.notes$,
      this.dataService.$areNotesLoaded,
    ]).subscribe({
      next: ([notes, areNotesLoaded]) => {
        this.notes = notes;
        this.areNotesLoaded = areNotesLoaded;

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

    this.dataService.$notesUpdate.subscribe(res => {
      if(res && res.eventType == 'INSERT'){
        let existingNote = this.notes.find(note => note.note_id == res.new.id);
        if(!existingNote){
          this.notes = [...this.notes, res.new];
        }
      }
    });
  }

  async addNote(event: any){
    event.preventDefault();
    this.note = this.note.trim();

    if(this.note && this.daysIndex <= 0){    
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
}