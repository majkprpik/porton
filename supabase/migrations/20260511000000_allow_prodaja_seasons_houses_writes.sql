-- Migration: Grant Prodaja write access on seasons and houses
-- Date: 2026-05-11
-- Description: Prodaja now uses the content management page (Seasons + Houses tabs).
--              Add Prodaja to INSERT/UPDATE/DELETE policies so writes don't get
--              silently denied by RLS. SELECT policies are already open to all roles.

-- -----------------------------------------------------------------------------
-- seasons
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "role_based_insert" ON porton.seasons;
DROP POLICY IF EXISTS "role_based_update" ON porton.seasons;
DROP POLICY IF EXISTS "role_based_delete" ON porton.seasons;

CREATE POLICY "role_based_insert" ON porton.seasons
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'));

CREATE POLICY "role_based_update" ON porton.seasons
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'))
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'));

CREATE POLICY "role_based_delete" ON porton.seasons
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'));

-- -----------------------------------------------------------------------------
-- houses
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "role_based_insert" ON porton.houses;
DROP POLICY IF EXISTS "role_based_update" ON porton.houses;
DROP POLICY IF EXISTS "role_based_delete" ON porton.houses;

CREATE POLICY "role_based_insert" ON porton.houses
  FOR INSERT TO authenticated
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'));

CREATE POLICY "role_based_update" ON porton.houses
  FOR UPDATE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'))
  WITH CHECK (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'));

CREATE POLICY "role_based_delete" ON porton.houses
  FOR DELETE TO authenticated
  USING (porton.get_my_role() IN ('Uprava', 'Voditelj kampa', 'Prodaja'));
