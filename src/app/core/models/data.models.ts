export interface TaskType {
  task_type_id: number;
  task_type_name: string;
}

export interface TaskProgressType {
  task_progress_type_id: number;
  task_progress_type_name: string;
}

export interface HouseType {
  house_type_id: number;
  house_type_name: string;
}

export interface House {
  house_id: number;
  house_number: number;
  house_name: string;
  house_type_id: number;
}

export interface Profile {
  id: string; // uuid
  role_id: number | null;
  first_name: string | null;
  last_name: string | null;
  phone_number?: string | null;
  created_at?: string | null;
  password?: string;
  is_test_user?: boolean
  is_deleted?: boolean;
}

export interface UserToRegister {
  id?: string;
  normalized_email?: string;
  password: string;
  email_confirm?: boolean;
  name: string;
  role_id: number | null;
  is_test_user: boolean;
}

export interface WorkGroup {
  work_group_id: number;
  created_at: string;
  is_locked: boolean;
  is_repair: boolean;
}

export interface LockedTeam {
  id: number;
  name: string;
  members: Profile[];
  tasks?: Task[];
  isLocked?: boolean;
  isPublished?: boolean;
}

export interface WorkGroupProfile {
  work_group_id: number;
  profile_id: string; // uuid
}

export interface WorkGroupTask {
  work_group_id: number;
  task_id: number;
  index: number;
}

export interface Task {
  task_id: number;
  task_type_id: number;
  task_progress_type_id: number;
  house_id: number;
  house_number: number;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  index: number; 
  is_unscheduled: boolean;
  completed_by: string | null;
}

export interface HouseAvailability {
  house_availability_id: number;
  house_id: number;
  house_availability_start_date: string;
  house_availability_end_date: string;
  has_arrived: boolean;
  has_departed: boolean;
  last_name: string | null;
  reservation_number: string | null;
  reservation_length: number | null;
  prev_connected: boolean;
  next_connected: boolean;
  adults: number;
  babies: number;
  cribs: number;
  dogs_d: number;
  dogs_s: number;
  dogs_b: number;
  color_theme: number;
  color_tint: number;
  note?: string | null;
  arrival_time?: any;
  departure_time?: any;
}

export interface ProfileWorkSchedule{
  id?: number;
  profile_id: string; 
  start_date: string;
  end_date: string;
  color: string;
}

export interface ProfileWorkDay{
  id?: number;
  profile_id: string;
  day: string;
  start_time: string;
  end_time: string;
  profile_work_schedule_id?: number;
  is_checked?: boolean;
}

export interface Note {
  id: string,
  profile_id: string,
  note: string,
  time_sent: string,
  for_date?: string,
}

export interface RepairTaskComment {
  id: string;
  task_id: number;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface ProfileRole{
  id: number;
  name: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface ScheduleCellData {
  isReserved: boolean;
  color: string;
  displayText: string;
  tooltip: string;
  identifier: string;
  isToday: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  isScheduleStart: boolean;
  isScheduleMiddle: boolean;
  isScheduleEnd: boolean;
  isForDelete: boolean;
}

export interface PushNotification {
  title: string,
  body: string,
  icon?: string,
}

export interface Season {
  id: number;
  year: number; 
  season_start_date: string;
  season_end_date: string;
  created_at: string;
  updated_at: string; 
}

export enum ExportTypes {
  PDF = 'pdf',
}

export enum DocumentOrientations {
  Landscape = 'landscape',
  Portrait = 'portrait',
}

export enum TaskProgressTypeName {
  Paused = 'Pauzirano',
  Completed = 'Završeno',
  InProgress = 'U tijeku',
  NotAssigned = 'Nije dodijeljeno',
  Assigned = 'Dodijeljeno',
}

export enum TaskTypeName {
  HouseCleaning = 'Čišćenje kućice',
  DeckCleaning = 'Čišćenje terase',
  Repair = 'Popravak',
  SheetChange = 'Mijenjanje posteljine',
  TowelChange = 'Mijenjanje ručnika',
  Other = 'Ostalo',
}

export enum ProfileRoles {
  Sobarica = 'Sobarica',
  Terasar = 'Terasar',
  Odrzavanje = 'Odrzavanje',
  KucniMajstor = 'Kucni majstor',
  VoditeljRecepcije = 'Voditelj recepcije',
  Prodaja = 'Prodaja',
  Recepcija = 'Recepcija',
  Uprava = 'Uprava',
  VoditeljDomacinstva = 'Voditelj domacinstva',
  VoditeljKampa = 'Voditelj kampa',
  SavjetnikUprave = 'Savjetnik uprave',
  NocnaRecepcija = 'Nocna recepcija',
  KorisnickaSluzba = 'Korisnicka sluzba',
  Ostalo = 'Ostalo',
}

export enum Departments {
  Housekeeping = 'Housekeeping',
  Technical = 'Technical',
  Reception = 'Reception',
  Management = 'Management',
}

export enum HouseOccupant {
  Adults = 'adults',
  Children = 'babies',
  Cribs = 'cribs',
  Pets = 'dogs_d',
}