/**
 * Controles reutilizables para formularios de producto.
 *
 * Preferir los primitivos con defaults (`FormInput`, `FormMoneyInput`, `FormSelectTrigger`)
 * en drawers y páginas de alta/edición. Un cambio de diseño va en `form-control-styles.ts`.
 *
 * - `FormField`: label + slot alineado + hint/error
 * - Montos: siempre `FormMoneyInput` (no `Input` ni `type="number"` para dinero)
 * - Filtros/tablas compactas: `Input` / `SelectTrigger` sin prefijo Form (size default)
 */
export { FormField, type FormFieldProps } from '@/components/ui/form-field'
export {
  formButtonClass,
  formControlHeightClass,
  formFieldControlSlotClass,
  inputControlVariants,
} from '@/components/ui/form-control-styles'
export {
  FormInput,
  FormMoneyInput,
  FormSelectTrigger,
  formSegmentButtonClass,
} from '@/components/ui/form-primitives'
