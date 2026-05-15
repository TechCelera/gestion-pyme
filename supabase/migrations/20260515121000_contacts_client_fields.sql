-- Campos adicionales de cliente (alineación propuesta socio)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS client_segment VARCHAR(40),
  ADD COLUMN IF NOT EXISTS associated_services TEXT;

COMMENT ON COLUMN contacts.client_segment IS 'Ej. particular, corporativo (texto corto controlado en app).';
COMMENT ON COLUMN contacts.associated_services IS 'Servicios asociados al contacto (texto libre o lista serializada).';
