#!/usr/bin/env python3
"""
Lucid-Lab — Invoice PDF generator (ReportLab)
Usage:
    python3 scripts/generate_invoice.py                 # generates Turismo sample
Reuse: import build_invoice() from this module and pass an InvoiceData dict.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

ROOT = Path(__file__).resolve().parents[1]
LOGO_PATH = ROOT / "public" / "logo.png"
OUT_DIR = ROOT / "docs" / "invoices"

# ── Brand palette ──────────────────────────────────────────────────────────────
DARK   = colors.HexColor("#111111")
ORANGE = colors.HexColor("#C85A1E")   # brand accent / header highlights
MID    = colors.HexColor("#555555")
LIGHT  = colors.HexColor("#F7F5F1")
BORDER = colors.HexColor("#DDDDDD")
W, H   = A4   # 595.28 × 841.89 pts


# ── Data model ─────────────────────────────────────────────────────────────────
@dataclass
class InvoiceLine:
    description: str
    unit_price: float
    quantity: float
    unit: str = "j/h"
    tva_rate: float = 0.0


@dataclass
class InvoiceData:
    number: str
    date: str                 # "JJ/MM/AAAA"
    delivery_date: str        # period string
    bdc_ref: str = ""         # bon de commande reference

    issuer_name: str = "Lucid-Lab"
    issuer_address: str = "47 rue Vivienne, 75002 Paris, France"
    issuer_mentions: list[str] = field(default_factory=list)

    client_name: str = ""
    client_address: str = ""
    client_contact_email: str = ""
    client_tva: str = ""

    lines: list[InvoiceLine] = field(default_factory=list)
    n_empty_lines: int = 2     # blank rows in the table
    is_autoliquidation: bool = True

    payment_due: str = "À réception de facture — paiement immédiat (art. 5 CGV)"
    payment_iban: str = "FR76 1732 8844 0043 2662 8862 178"
    payment_bic: str = "SWNBFR22"
    payment_bank: str = "Swan"


# ── Helpers ────────────────────────────────────────────────────────────────────

def p(text, style): return Paragraph(text, style)

def section_header(title: str, doc_width: float, styles: dict) -> Table:
    """Full-width black bar with white bold title."""
    t = Table([[p(title, styles["section_title"])]], colWidths=[doc_width])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    return t

def orange_subsection(title: str, styles: dict) -> Paragraph:
    return p(f"<b>{title}</b>", styles["orange_head"])


# ── Main builder ───────────────────────────────────────────────────────────────

def build_invoice(data: InvoiceData, out_path: Path) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    LM = RM = 1.6 * cm
    TM = BM = 1.6 * cm
    doc_w = W - LM - RM

    doc = BaseDocTemplate(
        str(out_path), pagesize=A4,
        leftMargin=LM, rightMargin=RM,
        topMargin=TM, bottomMargin=BM,
    )
    frame = Frame(LM, BM, doc_w, H - TM - BM, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=frame)])

    # ── Styles ────────────────────────────────────────────────────────────────
    def S(name, **kw):
        base = dict(fontName="Helvetica", fontSize=8.5, leading=12, textColor=DARK)
        base.update(kw)
        return ParagraphStyle(name, **base)

    styles = {
        "co_name":      S("co", fontName="Helvetica-Bold", fontSize=20, leading=24),
        "tagline":      S("tag", fontName="Helvetica-Oblique", fontSize=9,
                          textColor=ORANGE, leading=13),
        "col_head":     S("ch",  fontName="Helvetica-Bold", fontSize=8,
                          textColor=colors.white),
        "section_title":S("st",  fontName="Helvetica-Bold", fontSize=9,
                          textColor=colors.white),
        "orange_head":  S("oh",  fontName="Helvetica-Bold", fontSize=8.5,
                          textColor=ORANGE, spaceBefore=6),
        "label":        S("lbl", fontSize=8, textColor=MID),
        "val":          S("val", fontSize=8.5),
        "val_b":        S("vb",  fontName="Helvetica-Bold", fontSize=8.5),
        "val_r":        S("vr",  fontSize=8.5, alignment=TA_RIGHT),
        "val_br":       S("vbr", fontName="Helvetica-Bold", fontSize=8.5,
                          alignment=TA_RIGHT),
        "th":           S("th",  fontName="Helvetica-Bold", fontSize=8,
                          textColor=colors.white),
        "th_r":         S("thr", fontName="Helvetica-Bold", fontSize=8,
                          textColor=colors.white, alignment=TA_RIGHT),
        "td":           S("td",  fontSize=8.5, leading=12),
        "td_r":         S("tdr", fontSize=8.5, alignment=TA_RIGHT),
        "meta_label":   S("ml",  fontSize=8.5, textColor=MID),
        "meta_val":     S("mv",  fontName="Helvetica-Bold", fontSize=8.5,
                          alignment=TA_RIGHT),
        "notice":       S("ntc", fontSize=7.5, textColor=MID, leading=11),
        "footer":       S("ft",  fontSize=7, textColor=MID, alignment=TA_CENTER,
                          leading=10),
        "auto_banner":  S("ab",  fontName="Helvetica-Bold", fontSize=8.5,
                          textColor=ORANGE, alignment=TA_CENTER),
    }

    story = []
    SP = lambda n=0.3: Spacer(1, n * cm)

    # ════════════════════════════════════════════════════════════════════════
    # HEADER — company name + tagline + logo
    # ════════════════════════════════════════════════════════════════════════
    logo_img = ""
    if LOGO_PATH.exists():
        logo_img = Image(str(LOGO_PATH), width=1.5 * cm, height=1.5 * cm)

    hdr = Table(
        [[p("LUCID-LAB", styles["co_name"]), logo_img]],
        colWidths=[None, 1.8 * cm],
    )
    hdr.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN",  (1, 0), (1, 0),  "RIGHT"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
    ]))
    story.append(hdr)
    story.append(p(
        "Full-Stack Transformation Engine — Stratégie · Software · IA Engineering",
        styles["tagline"],
    ))
    story.append(SP(0.25))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK))
    story.append(SP(0.35))

    # ════════════════════════════════════════════════════════════════════════
    # ÉMETTEUR | FACTURÉ À  (two-column section with black header)
    # ════════════════════════════════════════════════════════════════════════
    col_w2 = (doc_w - 0.5 * cm) / 2

    parties_header = Table(
        [[p("ÉMETTEUR", styles["col_head"]), p("FACTURÉ À", styles["col_head"])]],
        colWidths=[col_w2, col_w2],
    )
    parties_header.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
    ]))
    story.append(parties_header)

    # Build issuer rows
    issuer_rows = [
        ("", data.issuer_name),
        ("", "SAS en cours de constitution — capital 999 €"),
        ("", data.issuer_address),
        ("", "Société en formation — immatriculation RCS Paris en cours"),
        ("", "gouronjules@gmail.com — info@lucid-lab.fr — lucid-lab.fr"),
    ]
    for extra in data.issuer_mentions:
        issuer_rows.append(("", extra))

    # Build client rows
    client_rows = [
        ("", data.client_name),
        ("", data.client_address),
        ("", f"Contact : {data.client_contact_email}" if data.client_contact_email else "Contact : [email facturation]"),
        ("", f"TVA intra : {data.client_tva}" if data.client_tva else "TVA intra : [à confirmer]"),
    ]

    def make_rows(rows_data):
        out = []
        for label, val in rows_data:
            if label:
                out.append([p(label, styles["label"]), p(val, styles["val"])])
            else:
                bold = rows_data.index((label, val)) == 0
                out.append([p(val, styles["val_b"] if bold else styles["val"])])
        return out

    def info_table(rows_data, col_widths):
        tdata = []
        cws = []
        for label, val in rows_data:
            if label:
                tdata.append([p(label, styles["label"]), p(val, styles["val"])])
                cws = [2.2 * cm, None]
            else:
                is_first = (rows_data.index((label, val)) == 0)
                tdata.append([p(val, styles["val_b"] if is_first else styles["val"])])
                cws = [None]
        # Rebuild as single-column since mixed structures don't work in ReportLab tables
        flat = []
        for label, val in rows_data:
            if label:
                flat.append(p(f"<font color='#555555'>{label}</font>  {val}", styles["val"]))
            else:
                is_first = (rows_data.index((label, val)) == 0)
                flat.append(p(val, styles["val_b"] if is_first else styles["val"]))
        t = Table([[row] for row in flat], colWidths=[col_widths])
        t.setStyle(TableStyle([
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
            ("TOPPADDING",    (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        return t

    parties_body = Table(
        [[info_table(issuer_rows, col_w2 - 6),
          info_table(client_rows, col_w2 - 6)]],
        colWidths=[col_w2, col_w2],
    )
    parties_body.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("LINEAFTER",     (0, 0), (0, -1),  0.5, BORDER),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    story.append(parties_body)
    story.append(SP(0.4))

    # ════════════════════════════════════════════════════════════════════════
    # INVOICE META (right-aligned rows)
    # ════════════════════════════════════════════════════════════════════════
    meta = [
        ("Numéro de facture",  data.number),
        ("Date d'émission",    data.date),
        ("Date de prestation", data.delivery_date),
        ("Bon de commande",    data.bdc_ref or "[Référence BdC ou échange écrit — à compléter]"),
    ]
    meta_table = Table(
        [[p(k, styles["meta_label"]), p(v, styles["meta_val"])] for k, v in meta],
        colWidths=[None, 9 * cm],
    )
    meta_table.setStyle(TableStyle([
        ("LINEBELOW",     (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (-1, 0), (-1, -1), 0),
        ("FONT",          (-1, 0), (-1, 0), "Helvetica-Bold"),  # invoice # bold
    ]))
    story.append(meta_table)
    story.append(SP(0.4))

    # ════════════════════════════════════════════════════════════════════════
    # LINE ITEMS TABLE
    # ════════════════════════════════════════════════════════════════════════
    QTY_W  = 2.0 * cm
    UNIT_W = 1.6 * cm
    PU_W   = 2.5 * cm
    TOT_W  = 2.5 * cm
    DESC_W = doc_w - QTY_W - UNIT_W - PU_W - TOT_W

    header_row = [
        p("Désignation",    styles["th"]),
        p("Quantité",       styles["th_r"]),
        p("Unité",          styles["th_r"]),
        p("PU HT (€)",      styles["th_r"]),
        p("Total HT (€)",   styles["th_r"]),
    ]
    rows = [header_row]

    for ln in data.lines:
        total = ln.unit_price * ln.quantity
        rows.append([
            p(ln.description, styles["td"]),
            p(f"{ln.quantity:g}",           styles["td_r"]),
            p(ln.unit,                      styles["td_r"]),
            p(f"{ln.unit_price:,.2f} €",    styles["td_r"]),
            p(f"{total:,.2f} €",            styles["td_r"]),
        ])

    # Blank rows
    for _ in range(data.n_empty_lines):
        rows.append(["", p("0.00 €", styles["td_r"]), "", "", p("0.00 €", styles["td_r"])])

    items_table = Table(
        rows,
        colWidths=[DESC_W, QTY_W, UNIT_W, PU_W, TOT_W],
        repeatRows=1,
    )
    items_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  DARK),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, LIGHT]),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (0, -1),  6),
        ("RIGHTPADDING",  (-1, 0), (-1, -1), 6),
        ("LINEBELOW",     (0, -1), (-1, -1), 0.5, BORDER),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    story.append(items_table)
    story.append(SP(0.3))

    # ════════════════════════════════════════════════════════════════════════
    # TOTALS
    # ════════════════════════════════════════════════════════════════════════
    excl = sum(l.unit_price * l.quantity for l in data.lines)
    tva_total = sum(l.unit_price * l.quantity * l.tva_rate for l in data.lines)
    incl = excl + tva_total
    tva_label = "TVA — Autoliquidation" if data.is_autoliquidation else "TVA 20 %"

    totals_rows = [
        [p("Sous-total HT", styles["meta_label"]),
         p(f"{excl:,.2f} €", styles["val_br"])],
        [p(tva_label, styles["meta_label"]),
         p(f"{tva_total:,.2f} €", styles["val_br"])],
        [p("Total TTC à régler",
           ParagraphStyle("ttcl", fontName="Helvetica-Bold", fontSize=10,
                          textColor=colors.white)),
         p(f"{incl:,.2f} €",
           ParagraphStyle("ttcv", fontName="Helvetica-Bold", fontSize=11,
                          textColor=colors.white, alignment=TA_RIGHT))],
    ]
    totals_table = Table(totals_rows, colWidths=[None, 3.5 * cm], hAlign="RIGHT")
    totals_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 2), (-1, 2), ORANGE),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (0, -1),  0),
        ("LEFTPADDING",   (0, 2), (0, 2),   8),
        ("RIGHTPADDING",  (-1, 0), (-1, -1), 6),
        ("LINEABOVE",     (0, 2), (-1, 2), 0.5, ORANGE),
    ]))
    story.append(totals_table)

    # Autoliquidation banner
    if data.is_autoliquidation:
        story.append(SP(0.2))
        banner = Table(
            [[p("AUTOLIQUIDATION — TVA due par le preneur (art. 283-2 CGI / art. 196 directive 2006/112/CE)",
                styles["auto_banner"])]],
            colWidths=[doc_w],
        )
        banner.setStyle(TableStyle([
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("BOX",           (0, 0), (-1, -1), 0.5, ORANGE),
        ]))
        story.append(banner)

    story.append(SP(0.5))

    # ════════════════════════════════════════════════════════════════════════
    # MODALITÉS DE PAIEMENT
    # ════════════════════════════════════════════════════════════════════════
    story.append(section_header("MODALITÉS DE PAIEMENT", doc_w, styles))
    story.append(SP(0.1))

    pay_rows = [
        ("Date d'échéance",     data.payment_due),
        ("Mode de règlement",   "Virement SEPA exclusivement (art. 5.4 CGV)"),
        ("Bénéficiaire",        data.issuer_name),
        ("IBAN",                data.payment_iban),
        ("BIC",                 data.payment_bic),
        ("Banque",              data.payment_bank),
        ("Référence à indiquer", f"{data.number} — {data.client_name}"),
    ]
    pay_table = Table(
        [[p(k, styles["label"]), p(v, styles["val"])] for k, v in pay_rows],
        colWidths=[4 * cm, None],
    )
    pay_table.setStyle(TableStyle([
        ("LINEBELOW",     (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (-1, 0), (-1, -1), 6),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    story.append(pay_table)
    story.append(SP(0.6))

    # ════════════════════════════════════════════════════════════════════════
    # MENTIONS LÉGALES & CGV
    # ════════════════════════════════════════════════════════════════════════
    story.append(section_header("MENTIONS LÉGALES & CGV", doc_w, styles))
    story.append(SP(0.2))

    tva_regime = (
        "AUTOLIQUIDATION — Prestation de services intracommunautaire entre assujettis. "
        "TVA due par le preneur (Turismo) dans son État membre d'établissement, conformément à "
        "l'art. 196 de la directive 2006/112/CE et à l'art. 283-2 du Code général des impôts. "
        "Aucune TVA facturée par le prestataire. N° TVA intra prestataire (Lucid-Lab) : FR 02 104 672 050. "
        "N° TVA intra preneur (Turismo) : à compléter sur VIES avant émission. ATTENTION : ce régime "
        "ne s'applique que si preneur et prestataire sont établis dans deux États membres UE différents. "
        "Si Turismo est établi en France, basculer en TVA 20 % ou en franchise art. 293 B CGI."
        if data.is_autoliquidation else
        "Prestation soumise à la TVA française au taux normal de 20 %."
    )

    legal_sections = [
        ("Régime TVA", tva_regime),
        ("Pénalités de retard",
         "Tout retard de paiement entraîne de plein droit, dès le jour suivant la date d'échéance "
         "et sans mise en demeure préalable, l'application d'intérêts moratoires au taux de la BCE + 10 "
         "points (art. L. 441-10 C. com.) — soit environ 14,5 % annuel à ce jour."),
        ("Indemnité forfaitaire de recouvrement",
         "Indemnité forfaitaire de 40 € due de plein droit pour frais de recouvrement "
         "(art. D. 441-5 C. com.). Indemnité complémentaire sur justificatifs si frais réels supérieurs."),
        ("Indemnité contractuelle de gestion du retard",
         "En complément, indemnité forfaitaire contractuelle de 250 € par facture en retard "
         "(art. 6.3 CGV — clause pénale art. 1231-5 C. civ.)."),
        ("Escompte",
         "Aucun escompte consenti pour paiement anticipé."),
        ("Réserve de propriété & cession de droits",
         "Les Livrables et droits associés ne sont transférés qu'au paiement intégral du prix HT "
         "(art. 8.2 CGV). Lucid-Lab se réserve la suspension immédiate des Prestations et la rétention "
         "des Livrables en cas de retard (art. 6.5 CGV)."),
        ("CGV opposables",
         "Conditions Générales de Vente Lucid-Lab v1.0 du 15/05/2026 : https://lucid-lab.fr/cgv "
         "(PDF horodaté). Le Client reconnaît en avoir pris connaissance et les accepter sans réserve "
         "avant toute commande."),
        ("Juridiction",
         "Compétence exclusive du Tribunal des activités économiques de Paris en cas de litige entre "
         "professionnels (art. 20.3 CGV), après tentative de résolution amiable préalable obligatoire "
         "(art. 20.1 CGV)."),
        ("Assurance RC Professionnelle",
         "Hiscox SA, succursale française (49 av. de l'Opéra, 75002 Paris), via LegalPlace "
         "(ORIAS 17 004 808), police n° RCPLP 3695175450 — plafond 100 000 €/période — couverture "
         "monde hors USA/Canada."),
    ]

    for title, body in legal_sections:
        story.append(orange_subsection(title, styles))
        story.append(p(body, styles["notice"]))
        story.append(SP(0.15))

    story.append(SP(0.4))

    # ════════════════════════════════════════════════════════════════════════
    # FOOTER
    # ════════════════════════════════════════════════════════════════════════
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(SP(0.15))
    story.append(p(
        "Lucid-Lab SAS en cours de constitution  ·  47 rue Vivienne 75002 Paris  ·  "
        "RCS Paris en cours  ·  TVA intra FR 02 104 672 050  ·  info@lucid-lab.fr",
        styles["footer"],
    ))

    doc.build(story)
    return out_path


# ── Turismo — F-2026-0001 ─────────────────────────────────────────────────────

TURISMO = InvoiceData(
    number="F-2026-0001",
    date="19/05/2026",
    delivery_date="01/03/2026 → 15/05/2026",
    bdc_ref="",   # à compléter si disponible

    client_name="TURISMO S.A.",
    client_address="Aurore Fievez\nL-8077 BERTRANGE\nLuxembourg",
    client_contact_email="angel.fievez@drive-turismo.com",
    client_tva="LU34604513",

    lines=[
        InvoiceLine(
            description=(
                "Audit Flash + Roadmap d'Exécution — cartographie processus, "
                "architecture cible, plan d'exécution priorisé livré "
                "(étapes 01-02 Offre Escalier)."
            ),
            unit_price=650.00,
            quantity=1,
        ),
        InvoiceLine(
            description=(
                "Build & Run — Agents IA et automatisations métier : workflows n8n, "
                "intégrations OpenAI/Claude, connecteurs et pipelines sur "
                "infrastructure Turismo (étape 03)."
            ),
            unit_price=650.00,
            quantity=2,
        ),
        InvoiceLine(
            description=(
                "Scaling opérationnel & monitoring — supervision continue, "
                "ajustements, accompagnement équipes Turismo (étape 04)."
            ),
            unit_price=650.00,
            quantity=1,
        ),
    ],
    n_empty_lines=2,
    is_autoliquidation=True,

    payment_due="À réception de facture — paiement immédiat (art. 5 CGV)",
    payment_iban="FR76 1732 8844 0043 2662 8862 178",
    payment_bic="SWNBFR22",
    payment_bank="Swan",
)


if __name__ == "__main__":
    out = OUT_DIR / "F-2026-0001_Turismo.pdf"
    result = build_invoice(TURISMO, out)
    print(f"✓ Invoice generated → {result.relative_to(ROOT)}")
