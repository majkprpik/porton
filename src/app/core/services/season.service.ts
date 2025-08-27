import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { Season } from '../models/data.models';
import { SupabaseService } from './supabase.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Injectable({
  providedIn: 'root'
})
export class SeasonService {
  seasons: Season[] = []

  constructor(
    private dataService: DataService,
    private supabaseService: SupabaseService,
  ) {
    this.dataService.seasons$
      .pipe(nonNull())
      .subscribe(seasons => {
        this.seasons = seasons;
      });
  }

  async createSeason(season: Season){
    if(this.seasonExist(season.year)) return;

    try {
      const { data: createdSeason, error: createSeasonError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('seasons')
        .insert({
          year: season.year,
          season_start_date: season.season_start_date,
          season_end_date: season.season_end_date,
        })
        .select()
        .single();

      if(createSeasonError) throw createSeasonError;

      if(createdSeason && !this.seasons.find(s => s.id == createdSeason.id)) {
        this.dataService.setSeasons([...this.seasons, createdSeason]);
      }

      return createdSeason;
    } catch(error){
      console.error("Error creating season: ", error);
      return null;
    }
  }

  async updateSeason(season: Season){
    try {
      const { data: updatedSeason, error: updateSeasonError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('seasons')
        .update({ 
          season_start_date: season.season_start_date,
          season_end_date: season.season_end_date,
          updated_at: this.supabaseService.formatDateTimeForSupabase(new Date()),
        })
        .eq('id', season.id)
        .select()
        .single();

      if(updateSeasonError) throw updateSeasonError;

      if(updatedSeason && updatedSeason.id) {
        const updatedSeasons = this.seasons.map(s => s.id == updatedSeason ? updatedSeason : s);
        this.dataService.setSeasons(updatedSeasons);
      }

      return updatedSeason;
    } catch(error) {
      console.error("Error updating season: ", error);
      return null;
    }
  } 

  async deleteSeason(seasonId: number){
    try{
      const { data: deletedSeason, error: deleteSeasonError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('season')
        .delete()
        .eq('id', seasonId)
        .select()
        .single();

      if(deleteSeasonError) throw deleteSeasonError;

      if(deletedSeason && deletedSeason.id) {
        const filteredSeasons = this.seasons.filter(s => s.id != deletedSeason.id);
        this.dataService.setSeasons(filteredSeasons);
      }

      return deletedSeason;
    } catch (error){
      console.error('Error deleting seasons:', error);
      return null;
    }
  }

  seasonExist(year: number){
    return this.seasons.some(s => s.year == year);
  }
}
