import { LegalDocument } from '@/components/auth/legal-document'

export default function PrivacyPage() {
  return (
    <LegalDocument title="Política de privacidad">
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Respetamos tu privacidad. Esta política describe qué datos tratamos cuando usás Gestion PYME
          Pro.
        </p>
        <h2 className="text-base font-semibold text-foreground">Datos que recopilamos</h2>
        <p>
          Correo electrónico, nombre, datos de la empresa, movimientos contables y configuración que
          ingreses en la aplicación.
        </p>
        <h2 className="text-base font-semibold text-foreground">Finalidad</h2>
        <p>
          Autenticación, operación del sistema, soporte y mejora del producto. No vendemos tus datos a
          terceros.
        </p>
        <h2 className="text-base font-semibold text-foreground">Almacenamiento</h2>
        <p>
          La información se aloja en infraestructura gestionada (Supabase / proveedores en la nube)
          con controles de acceso y cifrado en tránsito.
        </p>
        <h2 className="text-base font-semibold text-foreground">Tus derechos</h2>
        <p>
          Podés solicitar corrección o eliminación de tu cuenta contactando al administrador de tu
          empresa o al soporte del servicio.
        </p>
        <p className="text-xs">Última actualización: mayo 2026.</p>
      </div>
    </LegalDocument>
  )
}
