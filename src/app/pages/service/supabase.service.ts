import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
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
      environment.supabaseAnonKey as string,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        }
      }
    );

    this.supabaseAdmin = createClient(
      environment.supabaseUrl as string,
      environment.supabaseServiceKey as string
    );
  }

  async getSession(): Promise<string | null> {
    const { data, error } = await this.supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data.session?.access_token ?? null;
  }

  getClient() {
    return this.supabase;
  }

  // Example: Fetch data from a table
  async getData(table: string, schema: string) {
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
  async insertData(table: string, newData: any, schema: string) {
    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .insert([newData])
      .select();

    if (error) {
      console.error('Error inserting data:', error.message);
      return null;
    }
    
    return data.length > 0 ? data[0] : null;
  }

  async insertMultipleData(table: string, newData: any | any[], schema: string) {
    const payload = Array.isArray(newData) ? newData : [newData];

    const { data, error } = await this.supabase
      .schema(schema)
      .from(table)
      .insert(payload)
      .select();

    if (error) {
      console.error('Error inserting data:', error.message);
      return null;
    }

    return data;
  }

  async updateMultipleData(table: string, updates: any[], schema: string) {
    const updatePromises = updates.map(async (item) => {
      const { id, ...rest } = item;

      const { data, error } = await this.supabase
        .schema(schema)
        .from(table)
        .update(rest)
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Error updating record with id ${id}:`, error.message);
        return null;
      }

      return data?.[0] ?? null;
    });

    const results = await Promise.all(updatePromises);

    // Filter out failed updates
    return results.filter(item => item !== null);
  }

  // Update data in a table
  async updateData(table: string, updates: any, condition: string, schema: string) {
    let query;
    
    // Check if condition looks like a simple ID
    if (/^\d+$/.test(condition)) {
      // Use the appropriate ID column based on the table
      let idColumn;
      
      switch (table) {
        case 'tasks':
          idColumn = 'task_id';
          break;
        case 'house_availabilities':
        case 'temp_house_availabilities':
          idColumn = 'house_availability_id';
          break;
        case 'houses':
          idColumn = 'house_id';
          break;
        case 'work_groups':
          idColumn = 'work_group_id';
          break;
        case 'house_types':
          idColumn = 'house_type_id';
          break;
        case 'task_progress_types':
          idColumn = 'task_progress_type_id';
          break;
        default:
          // For other tables, assume the column is named 'id'
          idColumn = 'id';
      }
      
      query = this.supabase
        .schema(schema)
        .from(table)
        .update(updates)
        .eq(idColumn, condition);
    } else {
      // Assume the condition is already a fully-formed condition string like "column = value"
      const [column, value] = condition.split(' = ');
      // Remove any quotes from the value if present
      const cleanValue = value ? value.replace(/['"]/g, '') : value;

      query = this.supabase
        .schema(schema)
        .from(table)
        .update(updates)
        .eq(column.trim(), cleanValue);
    }
    
    const { data, error } = await query.select();

    if (error) {
      console.error('Error updating data:', error.message);
      return null;
    }

    return data;
  }

  // Delete data from a table based on a filter condition
  async deleteData(table: string, filter: string | number, schema: string) {
    let query = this.supabase
      .schema(schema)
      .from(table)
      .delete();
    
    // Check if the filter is a number or a string representing a number (ID)
    if (typeof filter === 'number' || !isNaN(Number(filter))) {
      // Determine the correct ID column for the table
      let idColumn;
      
      switch (table) {
        case 'tasks':
          idColumn = 'task_id';
          break;
        case 'house_availabilities':
        case 'temp_house_availabilities':
          idColumn = 'house_availability_id';
          break;
        case 'houses':
          idColumn = 'house_id';
          break;
        case 'work_groups':
          idColumn = 'work_group_id';
          break;
        case 'house_types':
          idColumn = 'house_type_id';
          break;
        case 'task_progress_types':
          idColumn = 'task_progress_type_id';
          break;
        default:
          // For tables ending with 's', use the singular form + '_id'
          idColumn = `${table.slice(0, -1)}_id`;
      }
    
      query = query.eq(idColumn, filter);
    } else if (typeof filter === 'string' && filter.includes('=')) {
      // It's a condition string like "column = value"
      const conditions = filter.split(' AND ').map(condition => {
        const [column, value] = condition.trim().split(' = ');
        return {
          column: column.trim(),
          value: value.trim().replace(/'/g, '')
        };
      });

      conditions.forEach(({ column, value }) => {
        query = query.eq(column, value);
      });
    } else {
      console.error('Invalid filter format for deleteData');
      return null;
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Error deleting data:', error.message);
      return null;
    }

    return data;
  }
  
  getAdminClient() {
    return this.supabaseAdmin;
  }

  public formatDateTimeForSupabase(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
