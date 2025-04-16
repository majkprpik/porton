import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../pages/service/notes.service';
import { DataService, Note, Profile } from '../../pages/service/data.service';
import { combineLatest } from 'rxjs';
import { PrimeIcons } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

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
      <div class="notes-header">
        <p-button [disabled]="daysIndex <= 0" (onClick)="decreaseIndex()" icon="pi pi-angle-left"></p-button>
        <div class="notes-title">
          <span id="notes">Notes</span>
          <span id="days">{{daysDisplay[daysIndex]}}</span>
        </div>
        <p-button [disabled]="daysIndex >= 4" (onClick)="increaseIndex()" icon="pi pi-angle-right"></p-button>
      </div>

      <div class="notes-content" #messagesContainer>
        @if(!notes.length && !areNotesLoaded){
          <span>Loading notes...</span>
        }
        @else if(!last5DaysNotes[daysIndex].length && areNotesLoaded){
          <span>No notes for today</span>
        } @else {
          @for(note of last5DaysNotes[daysIndex]; track $index){
            <span>{{findUser(note.profile_id)?.first_name}} - {{note.time_sent | date: 'HH:mm'}}: {{note.note}}</span>
          }
        }
      </div>

      <div class="notes-footer">
        <textarea 
          placeholder="Add a note..."
          [(ngModel)]="note"
          (keydown.enter)="addNote($event)"
          [disabled]="daysIndex != 4"
        ></textarea>
      </div>
    </div>
  `,
  styles: `
    .notes-container{
      background-color: whitesmoke;
      height: 300px;
      width: 500px;
      border-radius: 10px;
      border: 1px solid black;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .notes-header{
        height: 50px;
        width: 100%;
        border-radius: 10px 10px 0 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid black;
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

      .notes-content{
        height: calc(100% - 100px);
        box-sizing: border-box;
        padding: 10px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
        word-wrap: break-word;
      }

      .notes-footer{
        height: 50px;
        width: 100%;
        border-radius: 0 0 10px 10px;
        border-top: 1px solid black;

        textarea{
          width: 100%;
          height: 100%;
          border-radius: 0 0 10px 10px;
          resize: none;
          box-sizing: border-box; 
          padding: 10px;
          outline: none;
        }
      }
    }
  `
})
export class NotesComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  note: string = '';
  notes: Note[] = [];
  users: Profile[] = [];
  last5DaysNotes: { [key: number]: Note[] } = {};
  daysIndex = 4;
  daysDisplay = ['4 days ago', '3 days ago', '2 days ago', '1 day ago', 'Today'];
  areNotesLoaded = false;

  constructor(
    private notesService: NotesService,
    private dataService: DataService,
  ) {
  }

  increaseIndex(){
    if(this.daysIndex >= 4){
      this.daysIndex = 4;
    } else {
      this.daysIndex++;
    }
  }

  decreaseIndex(){
    if(this.daysIndex <= 0){
      this.daysIndex = 0;
    } else {
      this.daysIndex--;
    }
  }
  
  ngOnInit(){
    combineLatest([
      this.dataService.notes$,
      this.dataService.profiles$,
      this.dataService.$areNotesLoaded,
    ]).subscribe({
      next: ([notes, users, areNotesLoaded]) => {
        this.notes = notes;
        this.users = users;

        if(notes && areNotesLoaded){
          this.areNotesLoaded = true;
          const now = new Date();
          this.last5DaysNotes = {};

          for (let i = 0; i < 5; i++) {
            const day = new Date(now);
            day.setDate(now.getDate() - (4 - i)); 

            const startOfDay = new Date(day.setHours(0, 0, 0, 0));
            const endOfDay = new Date(day.setHours(23, 59, 59, 999));

            this.last5DaysNotes[i] = notes.filter(note => {
              const timeSent = new Date(note.time_sent);
              return timeSent >= startOfDay && timeSent <= endOfDay;
            });
          }

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
          this.last5DaysNotes[4] = [...this.last5DaysNotes[4], res.new];
        }
      }
    });
  }

  findUser(profileId: string){
    let foundUser = this.users.find(user => user.id == profileId);
    if(foundUser && !foundUser?.first_name){
      foundUser.first_name = foundUser?.role + ' ' + 'user'
    }
    return foundUser
  }

  async addNote(event: any){
    event.preventDefault();
    this.note = this.note.trim();
    if(this.note){
      this.notesService.createNote(this.note);
      this.note = '';
    }
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
  }
}
