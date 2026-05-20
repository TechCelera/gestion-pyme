-- Reparación: overload duplicado de create_transaction si 20260523120000 falló en COMMENT.
-- Idempotente: elimina solo la firma sin p_operation_kind y asegura comentario.

-- Normalizar subtipos en datos de desarrollo
UPDATE transactions
SET operation_kind = 'sale'
WHERE type = 'income' AND operation_kind IS NULL;

UPDATE transactions
SET operation_kind = 'purchase'
WHERE type = 'expense' AND operation_kind IS NULL;

UPDATE transactions
SET operation_kind = NULL
WHERE type IN ('transfer', 'adjustment');

DROP FUNCTION IF EXISTS public.create_transaction(
  uuid,
  uuid,
  character varying,
  numeric,
  date,
  character varying,
  uuid,
  character varying,
  character varying,
  numeric,
  uuid,
  character varying,
  uuid,
  uuid,
  character varying,
  character varying,
  character varying,
  text
);

COMMENT ON FUNCTION public.create_transaction(
  uuid,
  uuid,
  character varying,
  numeric,
  date,
  character varying,
  uuid,
  character varying,
  character varying,
  numeric,
  uuid,
  character varying,
  uuid,
  uuid,
  character varying,
  character varying,
  character varying,
  text,
  character varying
) IS 'Crea operación en borrador. operation_kind: sale, purchase, collection, payment.';
