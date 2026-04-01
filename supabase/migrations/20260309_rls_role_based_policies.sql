-- Migration: Role-based RLS policies for all porton schema tables
-- Date: 2026-03-09
-- Description: Replaces generic "authenticated" policies with granular role-based access control

-- =============================================================================
-- 1. Create helper function to get current user's role
-- =============================================================================

CREATE OR REPLACE FUNCTION porton.get_my_role()
RETURNS TEXT AS $$
  SELECT pr.name
  FROM porton.profiles p
  JOIN porton.profile_roles pr ON p.role_id = pr.id
  WHERE p.id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- 2. Drop ALL existing policies on ALL porton schema tables
-- =============================================================================

-- house_availabilities
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.house_availabilities;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.house_availabilities;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.house_availabilities;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.house_availabilities;

-- house_types
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.house_types;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.house_types;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.house_types;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.house_types;

-- houses
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.houses;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.houses;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.houses;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.houses;

-- notes
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.notes;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.notes;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.notes;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.notes;

-- pinned_charts
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.pinned_charts;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.pinned_charts;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.pinned_charts;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.pinned_charts;

-- profile_roles
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.profile_roles;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.profile_roles;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.profile_roles;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.profile_roles;

-- profile_work_days
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.profile_work_days;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.profile_work_days;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.profile_work_days;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.profile_work_days;

-- profile_work_schedule
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.profile_work_schedule;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.profile_work_schedule;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.profile_work_schedule;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.profile_work_schedule;

-- profiles
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.profiles;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.profiles;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.profiles;

-- repair_task_comments
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.repair_task_comments;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.repair_task_comments;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.repair_task_comments;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.repair_task_comments;
DROP POLICY IF EXISTS "Allow select for public" ON porton.repair_task_comments;
DROP POLICY IF EXISTS "Allow update for public" ON porton.repair_task_comments;
DROP POLICY IF EXISTS "Allow delete for public" ON porton.repair_task_comments;

-- seasons
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.seasons;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.seasons;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.seasons;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.seasons;

-- task_progress_types
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.task_progress_types;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.task_progress_types;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.task_progress_types;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.task_progress_types;

-- task_types
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.task_types;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.task_types;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.task_types;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.task_types;

-- tasks
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.tasks;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.tasks;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.tasks;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.tasks;

-- temp_house_availabilities
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.temp_house_availabilities;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.temp_house_availabilities;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.temp_house_availabilities;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.temp_house_availabilities;

-- temp_houses
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.temp_houses;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.temp_houses;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.temp_houses;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.temp_houses;

-- user_devices
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.user_devices;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.user_devices;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.user_devices;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.user_devices;

-- work_group_profiles
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.work_group_profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.work_group_profiles;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.work_group_profiles;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.work_group_profiles;

-- work_group_tasks
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.work_group_tasks;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.work_group_tasks;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.work_group_tasks;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.work_group_tasks;

-- work_groups
DROP POLICY IF EXISTS "Allow select for authenticated" ON porton.work_groups;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON porton.work_groups;
DROP POLICY IF EXISTS "Allow update for authenticated" ON porton.work_groups;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON porton.work_groups;

-- =============================================================================
-- 3. Create new role-based policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- house_availabilities
-- SELECT: all roles | INSERT/UPDATE/DELETE: restricted
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.house_availabilities
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.house_availabilities
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_update" ON porton.house_availabilities
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_delete" ON porton.house_availabilities
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ));

-- -----------------------------------------------------------------------------
-- house_types
-- SELECT: all roles | No write access
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.house_types
  FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- houses
-- SELECT: all roles | INSERT/UPDATE/DELETE: Uprava, Voditelj kampa
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.houses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.houses
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_update" ON porton.houses
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'))
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_delete" ON porton.houses
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

-- -----------------------------------------------------------------------------
-- notes
-- SELECT/INSERT: restricted set | No UPDATE/DELETE
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.notes
  FOR SELECT TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Odrzavanje', 'Prodaja',
    'Nocna recepcija', 'Korisnicka sluzba', 'Ostalo'
  ));

CREATE POLICY "role_based_insert" ON porton.notes
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Odrzavanje', 'Prodaja',
    'Nocna recepcija', 'Korisnicka sluzba', 'Ostalo'
  ));

-- -----------------------------------------------------------------------------
-- pinned_charts
-- Full access: Uprava, Voditelj kampa | No access for others
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.pinned_charts
  FOR SELECT TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_insert" ON porton.pinned_charts
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_update" ON porton.pinned_charts
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'))
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_delete" ON porton.pinned_charts
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

-- -----------------------------------------------------------------------------
-- profile_roles
-- SELECT: all roles | No write access
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.profile_roles
  FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- profile_work_days
-- SELECT: all roles | INSERT/UPDATE/DELETE: restricted
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.profile_work_days
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.profile_work_days
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_update" ON porton.profile_work_days
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_delete" ON porton.profile_work_days
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

-- -----------------------------------------------------------------------------
-- profile_work_schedule
-- SELECT: all roles | INSERT/UPDATE/DELETE: restricted
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.profile_work_schedule
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.profile_work_schedule
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_update" ON porton.profile_work_schedule
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_delete" ON porton.profile_work_schedule
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Voditelj recepcije', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

-- -----------------------------------------------------------------------------
-- profiles
-- SELECT: all roles | INSERT/UPDATE/DELETE: Uprava, Voditelj kampa
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.profiles
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_update" ON porton.profiles
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'))
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_delete" ON porton.profiles
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

-- -----------------------------------------------------------------------------
-- repair_task_comments
-- SELECT: all roles | INSERT: all roles | No UPDATE/DELETE
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.repair_task_comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.repair_task_comments
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- seasons
-- SELECT: all roles | INSERT/UPDATE/DELETE: Uprava, Voditelj kampa
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.seasons
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.seasons
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_update" ON porton.seasons
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'))
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_delete" ON porton.seasons
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

-- -----------------------------------------------------------------------------
-- task_progress_types
-- SELECT: all roles | No write access
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.task_progress_types
  FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- task_types
-- SELECT: all roles | No write access
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.task_types
  FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- tasks
-- SELECT: all roles | INSERT: all roles | UPDATE/DELETE: restricted
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.tasks
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.tasks
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "role_based_update" ON porton.tasks
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva',
    'Sobarica', 'Odrzavanje', 'Terasar', 'Kucni majstor', 'Korisnicka sluzba'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva',
    'Sobarica', 'Odrzavanje', 'Terasar', 'Kucni majstor', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_delete" ON porton.tasks
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

-- -----------------------------------------------------------------------------
-- temp_house_availabilities
-- SELECT: all roles | INSERT/UPDATE/DELETE: restricted
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.temp_house_availabilities
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.temp_house_availabilities
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_update" ON porton.temp_house_availabilities
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_delete" ON porton.temp_house_availabilities
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj recepcije', 'Recepcija',
    'Voditelj kampa', 'Voditelj domacinstva', 'Prodaja', 'Korisnicka sluzba'
  ));

-- -----------------------------------------------------------------------------
-- temp_houses
-- SELECT: all roles | INSERT/UPDATE/DELETE: Uprava, Voditelj kampa
-- INSERT (additional): Odrzavanje, Kucni majstor
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.temp_houses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_based_insert" ON porton.temp_houses
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Voditelj kampa', 'Odrzavanje', 'Kucni majstor'
  ));

CREATE POLICY "role_based_update" ON porton.temp_houses
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'))
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

CREATE POLICY "role_based_delete" ON porton.temp_houses
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa'));

-- -----------------------------------------------------------------------------
-- user_devices
-- All operations: own records only (profile_id = auth.uid())
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.user_devices
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "role_based_insert" ON porton.user_devices
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "role_based_update" ON porton.user_devices
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "role_based_delete" ON porton.user_devices
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- -----------------------------------------------------------------------------
-- work_group_profiles
-- Full access: Uprava, Savjetnik uprave, Voditelj kampa, Voditelj domacinstva
-- SELECT only: Sobarica, Odrzavanje, Terasar, Kucni majstor, Korisnicka sluzba
-- No access: Voditelj recepcije, Recepcija, Prodaja, Nocna recepcija, Ostalo
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.work_group_profiles
  FOR SELECT TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva',
    'Sobarica', 'Odrzavanje', 'Terasar', 'Kucni majstor', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_insert" ON porton.work_group_profiles
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_update" ON porton.work_group_profiles
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_delete" ON porton.work_group_profiles
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

-- -----------------------------------------------------------------------------
-- work_group_tasks
-- Full access: Uprava, Savjetnik uprave, Voditelj kampa, Voditelj domacinstva
-- SELECT + UPDATE: Sobarica, Odrzavanje, Terasar, Kucni majstor, Korisnicka sluzba
-- No access: Voditelj recepcije, Recepcija, Prodaja, Nocna recepcija, Ostalo
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.work_group_tasks
  FOR SELECT TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva',
    'Sobarica', 'Odrzavanje', 'Terasar', 'Kucni majstor', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_insert" ON porton.work_group_tasks
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_update" ON porton.work_group_tasks
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva',
    'Sobarica', 'Odrzavanje', 'Terasar', 'Kucni majstor', 'Korisnicka sluzba'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva',
    'Sobarica', 'Odrzavanje', 'Terasar', 'Kucni majstor', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_delete" ON porton.work_group_tasks
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

-- -----------------------------------------------------------------------------
-- work_groups
-- Full access: Uprava, Savjetnik uprave, Voditelj kampa, Voditelj domacinstva
-- SELECT only: Sobarica, Odrzavanje, Terasar, Kucni majstor, Korisnicka sluzba
-- No access: Voditelj recepcije, Recepcija, Prodaja, Nocna recepcija, Ostalo
-- -----------------------------------------------------------------------------

CREATE POLICY "role_based_select" ON porton.work_groups
  FOR SELECT TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva',
    'Sobarica', 'Odrzavanje', 'Terasar', 'Kucni majstor', 'Korisnicka sluzba'
  ));

CREATE POLICY "role_based_insert" ON porton.work_groups
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_update" ON porton.work_groups
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ))
  WITH CHECK (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));

CREATE POLICY "role_based_delete" ON porton.work_groups
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN (
    'Uprava', 'Savjetnik uprave', 'Voditelj kampa', 'Voditelj domacinstva'
  ));
