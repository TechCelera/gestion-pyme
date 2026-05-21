-- Teléfono y correo en contactos; unicidad nombre+tipo por empresa
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

COMMENT ON COLUMN contacts.phone IS 'Teléfono de contacto (obligatorio en alta desde app).';
COMMENT ON COLUMN contacts.email IS 'Correo opcional.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_name_kind
  ON contacts (company_id, lower(trim(name)), kind)
  WHERE deleted_at IS NULL;
