import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;
  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl as string,
      environment.supabaseAnonKey as string
    );

    this.supabaseAdmin = createClient(
      environment.supabaseUrl as string,
      environment.supabaseServiceKey as string
    );
  }

  getClient() {
    return this.supabase;
  }
  
  getAdminClient() {
    return this.supabaseAdmin;
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
  async updateData(table: string, updates: any, match: string, schema: string = 'public') {
    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .update(updates)
      .match({ id: match })
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
