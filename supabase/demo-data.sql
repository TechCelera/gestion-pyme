-- Script para crear usuario demo y datos de prueba
-- Ejecutar en Supabase SQL Editor

-- Crear usuario demo (la contraseña debe ser hasheada por Supabase Auth)
-- Nota: El usuario se crea mejor desde la UI de Supabase Auth o desde el registro
-- Aquí dejamos los datos de la empresa y cuentas de prueba

-- 1. Primero crear el usuario desde Supabase Auth UI con:
--    Email: demo@gestionpyme.com
--    Password: Demo123!
--    O usar el formulario de registro de la app

-- 2. Luego ejecutar este SQL para crear los datos de prueba:

-- Crear empresa demo (después de registrar el usuario, obtener su company_id)
-- Nota: Reemplazar 'USER_ID_AQUI' con el UUID del usuario demo creado

-- Empresa Demo
INSERT INTO companies (name, tax_id, address, phone, email, status, trial_ends_at)
VALUES (
  'Empresa Demo S.A.S',
  '900123456-7',
  'Calle 123 # 45-67, Bogotá',
  '+57 300 123 4567',
  'info@empresademo.com',
  'active',
  NOW() + INTERVAL '30 days'
)
ON CONFLICT DO NOTHING;

-- Obtener el ID de la empresa (ejecutar esto manualmente y guardar el ID)
-- SELECT id FROM companies WHERE name = 'Empresa Demo S.A.S';

-- Categorías de ejemplo (reemplazar COMPANY_UUID con el ID real)
-- INSERT INTO categories (company_id, name, type, description) VALUES
-- ('COMPANY_UUID', 'Ventas', 'income', 'Ingresos por ventas'),
-- ('COMPANY_UUID', 'Servicios', 'income', 'Ingresos por servicios'),
-- ('COMPANY_UUID', 'Salarios', 'expense', 'Gastos de nómina'),
-- ('COMPANY_UUID', 'Arriendo', 'expense', 'Gasto de arriendo oficina'),
-- ('COMPANY_UUID', 'Servicios públicos', 'expense', 'Agua, luz, internet'),
-- ('COMPANY_UUID', 'Transporte', 'expense', 'Gastos de transporte'),
-- ('COMPANY_UUID', 'Insumos', 'expense', 'Materiales e insumos'),
-- ('COMPANY_UUID', 'Marketing', 'expense', 'Publicidad y marketing');

-- Cuentas bancarias de ejemplo
-- INSERT INTO accounts (company_id, name, type, bank_name, account_number, currency, initial_balance, current_balance) VALUES
-- ('COMPANY_UUID', 'Cuenta Corriente Bancolombia', 'bank', 'Bancolombia', '1234567890', 'COP', 5000000, 5000000),
-- ('COMPANY_UUID', 'Cuenta de Ahorros', 'savings', 'Davivienda', '0987654321', 'COP', 2000000, 2000000),
-- ('COMPANY_UUID', 'Efectivo', 'cash', NULL, NULL, 'COP', 500000, 500000);

-- Contactos de ejemplo
-- INSERT INTO contacts (company_id, name, email, phone, type, status) VALUES
-- ('COMPANY_UUID', 'Juan Pérez', 'juan@cliente.com', '3001112222', 'cliente', 'active'),
-- ('COMPANY_UUID', 'María García', 'maria@proveedor.com', '3003334444', 'proveedor', 'active'),
-- ('COMPANY_UUID', 'Carlos López', 'carlos@cliente.com', '3005556666', 'cliente', 'active'),
-- ('COMPANY_UUID', 'Ana Martínez', 'ana@proveedor.com', '3007778888', 'proveedor', 'active');

-- Transacciones de ejemplo (se crean mejor desde la app para que pasen por el flujo completo)
-- Pero aquí un ejemplo de una transacción ya contabilizada:

-- INSERT INTO transactions (
--   company_id, created_by, type, status, date, amount, currency,
--   description, account_id, category_id, contact_id, contact_type,
--   method, document_type, document_number
-- ) VALUES
-- ('COMPANY_UUID', 'USER_UUID', 'income', 'posted', NOW() - INTERVAL '5 days', 1500000, 'COP',
--  'Venta de software', 'ACCOUNT_UUID', 'CATEGORY_UUID', 'CONTACT_UUID', 'cliente',
--  'accrual', 'invoice', 'FAC-001');
