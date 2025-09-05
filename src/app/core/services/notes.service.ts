import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Note, Profile, PushNotification } from '../models/data.models';
import { DataService } from './data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { PushNotificationsService } from './push-notifications.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  notes: Note[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private dataService: DataService,
    private pushNotificationsService: PushNotificationsService,
  ) {
    this.dataService.notes$
      .pipe(nonNull())
      .subscribe(notes => {
        this.notes = notes;
      });
  }

  async createNote(note: string, date: Date){
    try{
      const { data: createdNote, error: createNoteError } = await this.supabaseService.getClient()
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

      if(createdNote && !this.notes.find(n => n.id == createdNote.id)) {
        this.dataService.setNotes([...this.notes, createdNote]);
      }

      return createdNote;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  getMentionedProfilesFromNote(profiles: Profile[], note: string): any[] {
    const matches: any[] = [];

    profiles.forEach(profile => {
      const name = profile.first_name;
      const regex = new RegExp(`@${name!.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'g');

      if (regex.test(note) && !matches.includes(profile)) {
        matches.push(profile);
      }
    });

    return matches;
  }

  async sendNotificationToMentionedUsers(sendingProfileFirstName: string, mentionedProfiles: Profile[], note: string){
    const notification: PushNotification = {
      title: sendingProfileFirstName + ' mentioned you in a note',
      body: note,
    }

    const sendPromises = mentionedProfiles.map(profile => 
      this.pushNotificationsService.sendNotification(profile.id, notification)
    );

    await Promise.all(sendPromises);
  }
}
