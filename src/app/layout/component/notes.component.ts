import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../pages/service/notes.service';
import { DataService, Note, Profile } from '../../pages/service/data.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="notes-container">
      <div class="notes-header">
        <span>Notes</span>
      </div>

      <div class="notes-content" #messagesContainer>
        @if(!notes.length){
          <span>No notes for today</span>
        } @else {
          @for(note of notes; track $index){
            <span>{{findUser(note.profile_id)?.first_name}} - {{note.time_sent | date: 'HH:mm'}}: {{note.note}}</span>
          }
        }
      </div>

      <div class="notes-footer">
        <textarea 
          placeholder="Add a note..."
          [(ngModel)]="note"
          (keydown.enter)="addNote($event)"
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
        justify-content: center;
        border-bottom: 1px solid black;

        span{
          font-size: 21px;
          font-weight: bold;
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

  constructor(
    private notesService: NotesService,
    private dataService: DataService,
  ) {
  }
  
  ngOnInit(){
    combineLatest([
      this.dataService.notes$,
      this.dataService.profiles$,
    ]).subscribe({
      next: ([notes, users]) => {
        this.notes = notes;
        this.users = users;

        if(notes.length > 0){
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
        console.log(res);
        let existingNote = this.notes.find(note => note.note_id == res.new.id);

        if(!existingNote){
          this.notes = [...this.notes, res.new];
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

  gethhmmFromSupabaseTimeString(time: string){
    return time.slice(0, 5);
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
