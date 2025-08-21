import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Note } from '../models/data.models';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  notes: Note[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private dataService: DataService,
  ) {
    this.dataService.notes$.subscribe(notes => {
      this.notes = notes;
    });
  }

  async createNote(note: string, date: Date){
    try{
      const { data: newNote, error: createNoteError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('notes')
        .insert({ 
          profile_id: this.authService.getStoredUserId(),
          note: note,
          time_sent: this.supabaseService.formatDateTimeForSupabase(new Date()),
          for_date: this.supabaseService.formatDateTimeForSupabase(date),
         })
        .select()
        .single();

      if(createNoteError) throw createNoteError;

      if(newNote && !this.notes.find(n => n.id == newNote.id)) {
        this.dataService.setNotes([...this.notes, newNote]);
      }

      return newNote;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
