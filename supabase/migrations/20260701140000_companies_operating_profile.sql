-- Perfil operativo por empresa (ej. distribuidora frutas/verduras).
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS operating_profile text NOT NULL DEFAULT 'default'
  CHECK (operating_profile IN ('default', 'distribuidora'));

COMMENT ON COLUMN companies.operating_profile IS
  'Modo operativo: default (PYME estándar) o distribuidora (import Excel, cheques, bruto/neto).';
