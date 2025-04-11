import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
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
          idColumn = 'house_availability_id';
          break;
        case 'houses':
          idColumn = 'house_id';
          break;
        case 'work_groups':
          idColumn = 'work_group_id';
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
  async deleteData(table: string, filter: string, schema: string = 'public') {
    const conditions = filter.split(' AND ').map(condition => {
      const [column, value] = condition.trim().split(' = ');
      return {
        column: column.trim(),
        value: value.trim().replace(/'/g, '')
      };
    });

    let query = this.supabase
      .schema(schema)
      .from(table)
      .delete();

    conditions.forEach(({ column, value }) => {
      query = query.eq(column, value);
    });

    const { data, error } = await query.select();

    if (error) {
      console.error('Error deleting data:', error.message);
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
}
