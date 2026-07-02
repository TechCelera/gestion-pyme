#!/usr/bin/env python3
"""Genera Propuesta_Matias_Distribuidora.pdf con fpdf2 (venv local .pdf-venv)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

DIR = Path(__file__).resolve().parent
OUT = DIR / "Propuesta_Matias_Distribuidora.pdf"
VENV_PY = DIR / ".pdf-venv" / "bin" / "python"

INTRO = (
    "Ponemos Gestion PYME al servicio de la operación diaria de Administración y Finanzas "
    "de la distribución mayorista de frutas y verduras Pedro Veglia: menos planillas, "
    "más control. La idea es que un empleado lleve el día a día sin volver a armar Excels, "
    "con el bruto y el neto listos para decidir."
)

PHASES = [
    (
        "1. Análisis",
        "Sem. 1–2",
        "USD 450",
        [
            "Estudio de planillas Excel actuales",
            "Diagnóstico de flujos (ventas, gastos, caja, cheques, CC)",
            "Definición funcional del módulo Admin y Finanzas",
            "Diseño de carga única (sin doble planilla)",
        ],
    ),
    (
        "2. Adaptación del sistema",
        "Sem. 3–4",
        "USD 300",
        [
            "Adaptación de Gestion PYME a Administración y Finanzas",
            "Import Excel ventas (export Pedro Veglia)",
            "Cheques inmediatos y diferidos",
            "Reportes día / semana / mes — bruto y neto",
            "Gastos, caja chica, compras y CC clientes",
        ],
    ),
    (
        "3. Implementación",
        "Sem. 5–6",
        "USD 550",
        [
            "Migración de datos desde planillas",
            "Capacitación al empleado operador",
            "Puesta en marcha y go-live",
            "Soporte y ajustes — 60 días",
        ],
    ),
]

OUT_OF_SCOPE = (
    "Integración automática Pedro Veglia · Logística y cobranza · "
    "Contabilidad formal / AFIP"
)

TITLE = (74, 115, 150)
HEAD_FILL = (228, 238, 246)
WEEKS = (95, 111, 127)
BORDER = (184, 205, 220)
PAD = 4.0
HEAD_H = 7.0
BODY_LINE = 4.2


def ensure_venv() -> None:
    if VENV_PY.exists():
        return
    subprocess.run([sys.executable, "-m", "venv", str(DIR / ".pdf-venv")], check=True)
    subprocess.run([str(DIR / ".pdf-venv" / "bin" / "pip"), "install", "fpdf2"], check=True)


def generate_pdf() -> None:
    from fpdf import FPDF

    font = Path("/usr/share/fonts/TTF/DejaVuSans.ttf")
    font_b = Path("/usr/share/fonts/TTF/DejaVuSans-Bold.ttf")

    class PDF(FPDF):
        def footer(self):
            self.set_y(-9)
            self.set_font("DejaVu", "", 7)
            self.set_text_color(120, 120, 120)
            self.cell(0, 5, "Bernabé Aguilar · Wilman Montenegro — Jul 2026", align="C")

    pdf = PDF()
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    pdf.set_margins(14, 12, 14)
    pdf.add_font("DejaVu", "", str(font))
    pdf.add_font("DejaVu", "B", str(font_b))
    w = pdf.epw

    col_title = (w - PAD * 2) * 0.54
    col_weeks = (w - PAD * 2) * 0.20
    col_price = (w - PAD * 2) * 0.26

    def mc(text: str, *, h=4.2, bold=False, size=8.5, color=(34, 34, 34)) -> None:
        pdf.set_font("DejaVu", "B" if bold else "", size)
        pdf.set_text_color(*color)
        pdf.multi_cell(w, h, text, new_x="LMARGIN", new_y="NEXT")

    def phase_header(title: str, weeks: str, price: str) -> None:
        pdf.set_fill_color(*HEAD_FILL)
        pdf.set_draw_color(*BORDER)
        pdf.set_line_width(0.2)
        x0 = pdf.l_margin
        y0 = pdf.get_y()
        pdf.rect(x0, y0, w, HEAD_H, style="FD")
        pdf.set_xy(x0 + PAD, y0)
        pdf.set_font("DejaVu", "B", 8.4)
        pdf.set_text_color(*TITLE)
        pdf.cell(col_title, HEAD_H, title, border=0, fill=True, align="L")
        pdf.set_font("DejaVu", "", 8.2)
        pdf.set_text_color(*WEEKS)
        pdf.cell(col_weeks, HEAD_H, weeks, border=0, fill=True, align="C")
        pdf.set_font("DejaVu", "B", 8.2)
        pdf.set_text_color(*TITLE)
        pdf.cell(col_price, HEAD_H, price, border=0, fill=True, align="R", new_x="LMARGIN", new_y="NEXT")

    def phase_items(items: list[str]) -> None:
        body_x = pdf.l_margin + PAD
        body_w = w - PAD * 2
        bullet_w = 4.0
        text_w = body_w - bullet_w
        pdf.ln(1.2)
        pdf.set_font("DejaVu", "", 8.2)
        pdf.set_text_color(34, 34, 34)
        for item in items:
            y0 = pdf.get_y()
            pdf.set_xy(body_x, y0)
            pdf.cell(bullet_w, BODY_LINE, "•", align="L")
            pdf.set_xy(body_x + bullet_w, y0)
            pdf.multi_cell(text_w, BODY_LINE, item)
        pdf.ln(0.8)

    mc("Propuesta comercial", h=5.5, bold=True, size=13.5, color=TITLE)
    pdf.set_draw_color(*TITLE)
    pdf.set_line_width(0.35)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + w, pdf.get_y())
    pdf.ln(1.5)
    mc("Para Matías García · Distribución mayorista frutas y verduras · Marca Pedro Veglia", size=8.5, color=TITLE)
    mc("Módulo Administración y Finanzas · 6 semanas", size=8.5, color=(90, 90, 90))
    pdf.ln(0.8)
    mc(INTRO, h=4.0, size=8.3)
    pdf.ln(1.5)

    for title, weeks, price, items in PHASES:
        phase_header(title, weeks, price)
        phase_items(items)
        pdf.set_draw_color(*BORDER)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + w, pdf.get_y())
        pdf.ln(2)

    pdf.ln(0.5)
    label_w = w * 0.74
    amount_w = w * 0.26
    pdf.set_draw_color(140, 140, 140)
    pdf.set_line_width(0.25)

    def invest_row(label: str, amount: str = "", *, head: bool = False, note: bool = False) -> None:
        h = HEAD_H if head else (4.5 if note else 5.2)
        y0 = pdf.get_y()
        if head:
            pdf.set_fill_color(*HEAD_FILL)
            pdf.set_font("DejaVu", "B", 8.4)
            pdf.set_text_color(*TITLE)
            pdf.rect(pdf.l_margin, y0, w, h, style="FD")
            pdf.set_xy(pdf.l_margin + PAD, y0)
            pdf.cell(w - PAD * 2, h, label, border=0, align="L")
        elif note:
            pdf.set_fill_color(248, 250, 252)
            pdf.set_font("DejaVu", "", 7.5)
            pdf.set_text_color(90, 90, 90)
            pdf.rect(pdf.l_margin, y0, w, h, style="FD")
            pdf.set_xy(pdf.l_margin + PAD, y0)
            pdf.cell(w - PAD * 2, h, label, border=0, align="L")
        else:
            pdf.set_font("DejaVu", "", 8.2)
            pdf.set_text_color(34, 34, 34)
            pdf.rect(pdf.l_margin, y0, label_w, h, style="D")
            pdf.rect(pdf.l_margin + label_w, y0, amount_w, h, style="D")
            pdf.set_xy(pdf.l_margin + PAD, y0)
            pdf.cell(label_w - PAD * 2, h, label, border=0, align="L")
            pdf.set_xy(pdf.l_margin + label_w, y0)
            pdf.set_font("DejaVu", "B", 8.2)
            pdf.cell(amount_w - PAD, h, f"{amount}  ", border=0, align="R")
        pdf.set_y(y0 + h)

    invest_row("Inversión", head=True)
    invest_row("Análisis + Adaptación + Implementación (6 semanas)", "USD 1.300")
    invest_row("Plataforma y soporte mensual", "USD 55/mes")
    invest_row("Pago: 40% firma · 40% go-live · 20% a 30 días", note=True)

    pdf.ln(1.2)
    pdf.set_font("DejaVu", "B", 8)
    pdf.set_text_color(*TITLE)
    pdf.cell(0, 4, "Fuera de alcance (etapa 2): ", new_x="END")
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(70, 70, 70)
    pdf.multi_cell(0, 3.8, OUT_OF_SCOPE)
    pdf.output(str(OUT))


def main() -> None:
    if not VENV_PY.exists():
        ensure_venv()
        if Path(__file__).resolve() != Path(sys.argv[0]).resolve():
            subprocess.run([str(VENV_PY), *sys.argv], check=True)
            return
    try:
        from fpdf import FPDF  # noqa: F401
    except ModuleNotFoundError:
        ensure_venv()
        subprocess.run([str(VENV_PY), __file__], check=True)
        return
    generate_pdf()
    print(f"OK {OUT}")


if __name__ == "__main__":
    main()
