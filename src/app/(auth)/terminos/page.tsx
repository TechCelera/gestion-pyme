import { LegalDocument } from '@/components/auth/legal-document'

export default function TermsPage() {
  return (
    <LegalDocument title="Términos de uso">
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Al usar Gestion PYME Pro aceptás estos términos. El servicio permite registrar operaciones,
          reportes y configuración de tu empresa.
        </p>
        <h2 className="text-base font-semibold text-foreground">Uso de la cuenta</h2>
        <p>
          Sos responsable de la confidencialidad de tu contraseña y de la actividad en tu cuenta. No
          compartas credenciales con personas no autorizadas.
        </p>
        <h2 className="text-base font-semibold text-foreground">Datos y contenido</h2>
        <p>
          Los datos que cargues son de tu empresa. Nosotros los procesamos para prestar el servicio,
          con las medidas de seguridad razonables del proveedor de infraestructura.
        </p>
        <h2 className="text-base font-semibold text-foreground">Disponibilidad</h2>
        <p>
          El servicio se ofrece en modalidad de piloto o producción según el acuerdo comercial. Podemos
          realizar mantenimientos programados con aviso razonable cuando sea posible.
        </p>
        <p className="text-xs">Última actualización: mayo 2026.</p>
      </div>
    </LegalDocument>
  )
}
