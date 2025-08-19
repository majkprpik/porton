import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
  ) { 

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

      return newNote;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
