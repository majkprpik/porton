import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

      <div class="notes-content">
        @if(!notes.length){
          <span>No notes for today</span>
        } @else {
          @for(note of notes; track note){
            <span>{{note}}</span>
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
        flex: 1;
        box-sizing: border-box;
        padding: 10px;
        display: flex;
        flex-direction: column;
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
  note: string = '';
  notes: string[] = [];

  constructor() {
        
  }

  addNote(event: any){
    event.preventDefault();
    this.note = this.note.trim();

    if(this.note){
      this.notes.push(this.getCurrentTime() + ': ' + this.note);
      this.note = '';
    }
  }

  getCurrentTime(){
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
