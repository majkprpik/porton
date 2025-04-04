import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl as string,
      environment.supabaseAnonKey as string
    );
  }

  getClient() {
    return this.supabase;
  }

  // Example: Fetch data from a table
  async getData(table: string, schema: string = 'public') {
    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .select('*');

    if (error) {
      console.error('Error fetching data:', error.message);
      return null;
    }

    return data;
  }

  // Example: Insert data into a table
  async insertData(table: string, newData: any, schema: string = 'public') {
    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .insert([newData])
      .select();

    if (error) {
      console.error('Error inserting data:', error.message);
      return null;
    }

    return data;
  }

  // Update data in a table
  async updateData(table: string, updates: any, condition: string, schema: string = 'public') {
    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .update(updates)
      .eq('task_id', condition)
      .select();

    if (error) {
      console.error('Error updating data:', error.message);
      return null;
    }

    return data;
  }

  // Update all records in a table
  async updateAll(table: string, updates: any, schema: string = 'public') {
    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .update(updates)
      .select();

    if (error) {
      console.error('Error updating data:', error.message);
      return null;
    }

    return data;
  }

  // Update multiple records in a table by IDs
  async updateByIds(table: string, updates: any, ids: number[], idColumn: string, schema: string = 'public') {
    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .update(updates)
      .in(idColumn, ids)
      .select();

    if (error) {
      console.error('Error updating data:', error.message);
      return null;
    }

    return data;
  }

  listenToChanges(houseNumber: string) {
    const channel = this.supabase.channel('realtime:porton' + houseNumber);

    return channel;
  }
}
