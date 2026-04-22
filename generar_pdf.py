from fpdf import FPDF
from datetime import datetime

class PDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'B', 9)
            self.set_text_color(100, 100, 100)
            self.cell(0, 8, 'GESTION PYME PRO - Plan Estrategico MVP', 0, 0, 'L')
            self.cell(0, 8, f'Abril 2026', 0, 1, 'R')
            self.set_draw_color(200, 200, 200)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Pagina {self.page_no()}', 0, 0, 'C')

    def section(self, title):
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(30, 58, 138)
        self.cell(0, 10, title, 0, 1)
        self.set_draw_color(30, 58, 138)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(4)

    def sub_section(self, title):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, title, 0, 1)
        self.ln(1)

    def p(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        x = self.get_x()
        self.cell(8, 5.5, '')
        self.set_font('Helvetica', 'B', 10)
        self.cell(4, 5.5, '-')
        self.set_font('Helvetica', '', 10)
        self.multi_cell(0, 5.5, text)

    def bullets(self, items):
        for item in items:
            self.bullet(item)
            self.ln(0.5)

    def row(self, cols, widths, bold=False, fill=False):
        self.set_font('Helvetica', 'B' if bold else '', 9)
        if fill:
            self.set_fill_color(230, 238, 250)
        self.set_text_color(50, 50, 50)
        for i, (col, w) in enumerate(zip(cols, widths)):
            align = 'C' if i > 0 else 'L'
            self.cell(w, 7, col, 1, 0, align, fill)
        self.ln()

    def key_val(self, key, val):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(50, 50, 50)
        self.cell(70, 6, key, 0, 0)
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 6, val)


pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# === PORTADA ===
pdf.ln(50)
pdf.set_font('Helvetica', 'B', 28)
pdf.set_text_color(30, 58, 138)
pdf.cell(0, 15, 'GESTION PYME PRO', 0, 1, 'C')
pdf.ln(5)
pdf.set_draw_color(30, 58, 138)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(8)
pdf.set_font('Helvetica', '', 14)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 8, 'Sistema de Gestion Economica-Financiera', 0, 1, 'C')
pdf.cell(0, 8, 'para Pequenas y Medianas Empresas', 0, 1, 'C')
pdf.ln(10)
pdf.set_font('Helvetica', 'I', 12)
pdf.set_text_color(120, 120, 120)
pdf.cell(0, 8, 'Plan Estrategico de Desarrollo', 0, 1, 'C')
pdf.cell(0, 8, 'Version MVP - Abril 2026', 0, 1, 'C')

# === PAGINA 2: RESUMEN + VISION ===
pdf.add_page()

pdf.section('1. RESUMEN EJECUTIVO')
pdf.p('Sistema web progresivo (PWA) disenado para transformar las operaciones diarias de PYMEs en informacion financiera estrategica para la toma de decisiones en tiempo real.')
pdf.p('Permite registrar ingresos, egresos, cobros y pagos, generando automaticamente los tres reportes financieros clave: Estado de Resultados, Flujo de Caja y Situacion Patrimonial.')

pdf.section('2. VISION Y OBJETIVOS')
pdf.p('Convertir la informacion operativa en la sangre del sistema economico-financiero de la empresa, proporcionando visibilidad clara y actualizada del desempeno empresarial.')

pdf.sub_section('Objetivos principales:')
pdf.bullets([
    'Estado de resultados actualizado con maximo 2 semanas de desfase',
    'Flujo de caja y flujo financiero en tiempo real (diario)',
    'Estado de situacion patrimonial trimestral',
    'Funcionamiento offline con sincronizacion multi-usuario',
    'Dashboard con metricas clave en tiempo real',
    'Exportacion de reportes a PDF y Excel'
])

# === PAGINA 3: ALCANCE ===
pdf.add_page()

pdf.section('3. ALCANCE DEL SISTEMA')

pdf.sub_section('Registro de operaciones diarias:')
pdf.bullets([
    'Ingresos y egresos',
    'Cobros por venta y pagos por compras',
    'Solo el area de administracion y finanzas registra',
    'Cada area con su responsable que refleja sus operaciones con respaldo'
])

pdf.sub_section('Metodos contables:')
pdf.bullets([
    'Metodo devengado: para Estado de Resultados (ventas y compras se registran al momento, independiente de cobro/pago)',
    'Metodo percibido: para Flujo de Caja (se registran cobros y pagos reales)',
])

pdf.sub_section('Caracteristicas principales:')
pdf.bullets([
    'Gestion de productos y servicios (misma dinamica, sin stock en servicios)',
    'Multi-moneda',
    'Multi-empresa (cada usuario pertenece a una sola empresa)',
    'Hasta 4 usuarios por empresa',
    'Multiples cuentas bancarias y cajas',
    'Categorizacion de gastos (administrativos, comerciales, financieros)',
    'PWA - funciona offline, se instala en movil/desktop',
    'Sincronizacion al recuperar internet (multi-usuario simultaneo)',
    'Indicador de ultima actualizacion (fecha y hora)',
    'Integracion con n8n, CRM, facturacion electronica y bancos'
])

pdf.sub_section('Metricas y reportes:')
pdf.bullets([
    'Punto de equilibrio financiero',
    'Ventas totales, costos totales, costos fijos y variables',
    'Margen de contribucion',
    'Resultado neto sobre ventas',
    'Rentabilidad neta sobre ventas',
    'ROI sobre activos totales (trimestral) - corrientes y no corrientes',
    'Comparativo mes a mes y mes vs mismo mes del ano anterior',
    'Rentabilidad promedio ano actual vs ano anterior',
    'Flujo financiero diario',
    'Estado de resultado mensual',
    'Situacion patrimonial trimestral',
    'Dashboard en tiempo real',
    'Exportacion a PDF y Excel'
])

# === PAGINA 4: STACK ===
pdf.add_page()

pdf.section('4. STACK TECNOLOGICO')

pdf.p('Tecnologias seleccionadas para maxima eficiencia y costo inicial cero:')

widths_t = [55, 65, 70]
pdf.row(['Componente', 'Tecnologia', 'Costo Inicial'], widths_t, bold=True, fill=True)
pdf.row(['Frontend', 'Next.js 14 + PWA', 'Gratis'], widths_t)
pdf.row(['Backend', 'Next.js API Routes', 'Gratis'], widths_t)
pdf.row(['Base de Datos', 'Supabase (PostgreSQL)', 'Gratis'], widths_t)
pdf.row(['Autenticacion', 'Supabase Auth', 'Gratis'], widths_t)
pdf.row(['Almacenamiento', 'Supabase Storage', 'Gratis'], widths_t)
pdf.row(['Hosting', 'Vercel (Hobby)', 'Gratis'], widths_t)
pdf.row(['Offline Storage', 'IndexedDB + Dexie.js', 'Gratis'], widths_t)
pdf.row(['Sincronizacion', 'Supabase Realtime', 'Gratis'], widths_t)
pdf.ln(3)

pdf.set_font('Helvetica', 'B', 11)
pdf.set_text_color(30, 58, 138)
pdf.cell(0, 8, 'COSTO TOTAL INICIAL: $0', 0, 1)
pdf.set_font('Helvetica', '', 10)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 6, 'Costo estimado con trafico moderado: $20-50/mes', 0, 1)
pdf.ln(5)

pdf.sub_section('Arquitectura offline:')
pdf.p('Cada usuario trabaja en su IndexedDB local en el navegador. Al recuperar conexion, se sincroniza con Supabase Cloud. Conflictos: ultimo cambio gana + registro de auditoria. Supabase Realtime notifica a otros usuarios de la empresa.')

# === PAGINA 5: MODELO DE DATOS + FASES ===
pdf.add_page()

pdf.section('5. MODELO DE DATOS')

widths_m = [50, 140]
pdf.row(['Entidad', 'Descripcion'], widths_m, bold=True, fill=True)
pdf.row(['Empresa', 'Datos de la empresa, configuracion general'], widths_m)
pdf.row(['Usuarios', 'Dueno, Admin Finanzas, Responsable Area, Vendedor'], widths_m)
pdf.row(['Cuentas Bancarias', 'Caja, Bancos, Medios de pago'], widths_m)
pdf.row(['Categorias', 'Clasificacion de ingresos, costos y gastos'], widths_m)
pdf.row(['Transacciones', 'Ingresos y egresos con soporte documental'], widths_m)
pdf.row(['Productos/Servicios', 'Catalogo de bienes y servicios'], widths_m)
pdf.row(['Reportes', 'Vistas calculadas y estados financieros'], widths_m)
pdf.ln(5)

pdf.section('6. FASES DEL PROYECTO')

fases = [
    ('FASE 1 - Fundamentos (Semanas 1-2)', [
        'Setup proyecto Next.js + PWA',
        'Config Supabase (auth, DB, storage)',
        'Sistema de autenticacion multi-empresa',
        'CRUD basico de transacciones',
    ]),
    ('FASE 2 - Core Financiero (Semanas 3-4)', [
        'Modulo de flujo de caja (diario)',
        'Modulo de estado de resultados (mensual)',
        'Dashboard con metricas',
        'Multiples cuentas bancarias',
    ]),
    ('FASE 3 - Sincronizacion (Semanas 5-6)', [
        'Service Worker para modo offline',
        'Sincronizacion IndexedDB <-> Cloud',
        'Manejo de conflictos multi-usuario',
        'Indicador de ultima sincronizacion',
    ]),
    ('FASE 4 - Reportes (Semanas 7-8)', [
        'Generacion de graficos',
        'Exportacion PDF y Excel',
        'Filtros avanzados por periodo',
        'Estado de situacion patrimonial (trimestral)',
    ]),
    ('FASE 5 - Pulido (Semanas 9-10)', [
        'Testing completo',
        'Optimizacion de rendimiento',
        'Documentacion de usuario',
        'Despliegue MVP',
    ]),
]

for titulo, items in fases:
    pdf.sub_section(titulo)
    pdf.bullets(items)
    pdf.ln(1)

# === PAGINA 6: MODELO NEGOCIO + PERMISOS ===
pdf.add_page()

pdf.section('7. MODELO DE NEGOCIO')
pdf.p('Suscripcion mensual por empresa. Escalamiento gradual: empezar gratis e invertir a medida que se consiguen clientes.')

widths_p = [35, 30, 25, 100]
pdf.row(['Plan', 'Precio', 'Usuarios', 'Incluye'], widths_p, bold=True, fill=True)
pdf.row(['Gratis', '$0/mes', '2', 'Hasta 100 transacciones/mes, basico'], widths_p)
pdf.row(['Basico', '$15/mes', '4', 'Ilimitado, reportes, export'], widths_p)
pdf.row(['Pro', '$35/mes', '8', 'Todo + multiples sucursales'], widths_p)
pdf.row(['Empresarial', '$75/mes', 'Ilimitado', 'API, integraciones, soporte prioritario'], widths_p)
pdf.ln(8)

pdf.section('8. PERMISOS POR ROL')

widths_r = [50, 140]
pdf.row(['Rol', 'Acceso'], widths_r, bold=True, fill=True)
pdf.row(['Dueno (SuperAdmin)', 'Acceso total a todas las funciones y reportes'], widths_r)
pdf.row(['Admin Finanzas', 'Gestion completa, puede ver todos los reportes'], widths_r)
pdf.row(['Responsable de Area', 'Operaciones de su area, reportes limitados'], widths_r)
pdf.row(['Vendedor', 'Solo operaciones de ventas de su cartera'], widths_r)
pdf.ln(8)

pdf.section('9. INTEGRACIONES FUTURAS')
pdf.bullets([
    'n8n - Automatizacion de flujos de trabajo',
    'CRM - Gestion de relaciones con clientes',
    'Sistemas de facturacion electronica',
    'Bancos para conciliacion automatica',
    'API abierta para integraciones personalizadas',
])
pdf.ln(5)

pdf.section('10. CONCLUSION')
pdf.p('Gestion PYME Pro ofrece una solucion completa y accesible para la gestion financiera de pequenas y medianas empresas. Permite transformar datos operativos en informacion estrategica para la toma de decisiones, con un enfoque en simplicidad, accesibilidad offline y costos reducidos. El MVP en 10 semanas permite validar el producto con clientes reales con inversion inicial de $0.')

pdf.output('/mnt/datos/Documentos/gestion-pyme/Gestion_Pyme_Pro_Plan_Estrategico.pdf')
print('PDF generado exitosamente')