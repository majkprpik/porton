-- ============================================================
-- RLS: Enable row-level security and apply role-based policies
-- on all porton schema tables, matching the test environment.
-- ============================================================

-- ============================================================
-- STEP 1: Create get_my_role() function
-- ============================================================
CREATE OR REPLACE FUNCTION porton.get_my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT pr.name
  FROM porton.profiles p
  JOIN porton.profile_roles pr ON p.role_id = pr.id
  WHERE p.id = auth.uid()
$function$;

-- ============================================================
-- STEP 2: Drop all existing policies (clean slate)
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'porton'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

-- ============================================================
-- STEP 3: Enable RLS on all tables
-- ============================================================
ALTER TABLE porton.house_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.house_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.pinned_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.profile_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.profile_work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.profile_work_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.repair_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.task_progress_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.temp_house_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.temp_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.work_group_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.work_group_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE porton.work_groups ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: house_availabilities
-- ============================================================
CREATE POLICY role_based_select ON porton.house_availabilities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.house_availabilities
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba'])
  );

CREATE POLICY role_based_update ON porton.house_availabilities
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba']));

CREATE POLICY role_based_delete ON porton.house_availabilities
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba'])
  );

-- ============================================================
-- STEP 5: house_types (read-only)
-- ============================================================
CREATE POLICY role_based_select ON porton.house_types
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- STEP 6: houses
-- ============================================================
CREATE POLICY role_based_select ON porton.houses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.houses
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa'])
  );

CREATE POLICY role_based_update ON porton.houses
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']));

CREATE POLICY role_based_delete ON porton.houses
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa'])
  );

-- ============================================================
-- STEP 7: notes
-- ============================================================
CREATE POLICY role_based_select ON porton.notes
  FOR SELECT TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa','Korisnicka sluzba','Recepcija','Nocna recepcija','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );

CREATE POLICY role_based_insert ON porton.notes
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa','Korisnicka sluzba','Recepcija','Nocna recepcija','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );

-- ============================================================
-- STEP 8: pinned_charts
-- ============================================================
CREATE POLICY role_based_select ON porton.pinned_charts
  FOR SELECT TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Voditelj kampa'])
  );

CREATE POLICY role_based_insert ON porton.pinned_charts
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Voditelj kampa'])
  );

CREATE POLICY role_based_update ON porton.pinned_charts
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Voditelj kampa']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Voditelj kampa']));

CREATE POLICY role_based_delete ON porton.pinned_charts
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Voditelj kampa'])
  );

-- ============================================================
-- STEP 9: profile_roles (read-only)
-- ============================================================
CREATE POLICY role_based_select ON porton.profile_roles
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- STEP 10: profile_work_days
-- ============================================================
CREATE POLICY role_based_select ON porton.profile_work_days
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.profile_work_days
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva'])
  );

CREATE POLICY role_based_update ON porton.profile_work_days
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva']));

CREATE POLICY role_based_delete ON porton.profile_work_days
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva'])
  );

-- ============================================================
-- STEP 11: profile_work_schedule
-- ============================================================
CREATE POLICY role_based_select ON porton.profile_work_schedule
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.profile_work_schedule
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva'])
  );

CREATE POLICY role_based_update ON porton.profile_work_schedule
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva']));

CREATE POLICY role_based_delete ON porton.profile_work_schedule
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Voditelj kampa','Voditelj domacinstva'])
  );

-- ============================================================
-- STEP 12: profiles
-- ============================================================
CREATE POLICY role_based_select ON porton.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.profiles
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa'])
  );

CREATE POLICY role_based_update ON porton.profiles
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']));

CREATE POLICY role_based_delete ON porton.profiles
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa'])
  );

-- ============================================================
-- STEP 13: repair_task_comments (any authenticated user)
-- ============================================================
CREATE POLICY role_based_select ON porton.repair_task_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.repair_task_comments
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- STEP 14: seasons
-- ============================================================
CREATE POLICY role_based_select ON porton.seasons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.seasons
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa'])
  );

CREATE POLICY role_based_update ON porton.seasons
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']));

CREATE POLICY role_based_delete ON porton.seasons
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa'])
  );

-- ============================================================
-- STEP 15: task_progress_types & task_types (read-only)
-- ============================================================
CREATE POLICY role_based_select ON porton.task_progress_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_select ON porton.task_types
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- STEP 16: tasks
-- ============================================================
CREATE POLICY role_based_select ON porton.tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY role_based_update ON porton.tasks
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Sobarica','Odrzavanje','Terasar','Kucni majstor','Korisnicka sluzba','Voditelj recepcije','Prodaja','Recepcija','Nocna recepcija']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Sobarica','Odrzavanje','Terasar','Kucni majstor','Korisnicka sluzba','Voditelj recepcije','Prodaja','Recepcija','Nocna recepcija']));

CREATE POLICY role_based_delete ON porton.tasks
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva'])
  );

-- ============================================================
-- STEP 17: temp_house_availabilities
-- ============================================================
CREATE POLICY role_based_select ON porton.temp_house_availabilities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.temp_house_availabilities
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba'])
  );

CREATE POLICY role_based_update ON porton.temp_house_availabilities
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba']));

CREATE POLICY role_based_delete ON porton.temp_house_availabilities
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj recepcije','Recepcija','Nocna recepcija','Voditelj kampa','Prodaja','Korisnicka sluzba'])
  );

-- ============================================================
-- STEP 18: temp_houses
-- ============================================================
CREATE POLICY role_based_select ON porton.temp_houses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_based_insert ON porton.temp_houses
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa','Odrzavanje','Kucni majstor'])
  );

CREATE POLICY role_based_update ON porton.temp_houses
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa']));

CREATE POLICY role_based_delete ON porton.temp_houses
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Voditelj kampa'])
  );

-- ============================================================
-- STEP 19: user_devices (users manage only their own devices)
-- ============================================================
CREATE POLICY role_based_select ON porton.user_devices
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY role_based_insert ON porton.user_devices
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY role_based_update ON porton.user_devices
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY role_based_delete ON porton.user_devices
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ============================================================
-- STEP 20: work_group_profiles
-- ============================================================
CREATE POLICY role_based_select ON porton.work_group_profiles
  FOR SELECT TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Sobarica','Odrzavanje','Terasar','Kucni majstor','Korisnicka sluzba','Recepcija','Nocna recepcija','Voditelj recepcije','Prodaja'])
  );

CREATE POLICY role_based_insert ON porton.work_group_profiles
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );

CREATE POLICY role_based_update ON porton.work_group_profiles
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja']));

CREATE POLICY role_based_delete ON porton.work_group_profiles
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );

-- ============================================================
-- STEP 21: work_group_tasks
-- ============================================================
CREATE POLICY role_based_select ON porton.work_group_tasks
  FOR SELECT TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Sobarica','Odrzavanje','Terasar','Kucni majstor','Korisnicka sluzba','Recepcija','Nocna recepcija','Voditelj recepcije','Prodaja'])
  );

CREATE POLICY role_based_insert ON porton.work_group_tasks
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );

CREATE POLICY role_based_update ON porton.work_group_tasks
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Sobarica','Odrzavanje','Terasar','Kucni majstor','Korisnicka sluzba','Voditelj recepcije','Prodaja']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Sobarica','Odrzavanje','Terasar','Kucni majstor','Korisnicka sluzba','Voditelj recepcije','Prodaja']));

CREATE POLICY role_based_delete ON porton.work_group_tasks
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );

-- ============================================================
-- STEP 22: work_groups
-- ============================================================
CREATE POLICY role_based_select ON porton.work_groups
  FOR SELECT TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Sobarica','Odrzavanje','Terasar','Kucni majstor','Korisnicka sluzba','Recepcija','Nocna recepcija','Voditelj recepcije','Prodaja'])
  );

CREATE POLICY role_based_insert ON porton.work_groups
  FOR INSERT TO authenticated WITH CHECK (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );

CREATE POLICY role_based_update ON porton.work_groups
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja']))
  WITH CHECK (porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja']));

CREATE POLICY role_based_delete ON porton.work_groups
  FOR DELETE TO authenticated USING (
    porton.get_my_role() = ANY (ARRAY['Uprava','Savjetnik uprave','Voditelj kampa','Voditelj domacinstva','Voditelj recepcije','Prodaja'])
  );
