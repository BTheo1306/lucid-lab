"""
Generate the Lucid-Lab branded Google Docs template (.docx).

Run: python3 scripts/generate-google-doc-template.py

Design: A4, single logo on cover, clean rubrics, explicit page breaks per
major section so content never gets cut.
"""

from pathlib import Path

from _lucid_doc import (
    init_document,
    add_cover,
    add_section,
    add_paragraph,
    add_subheading,
    add_bullet,
    add_kv_row,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "lucid-lab-google-doc-template.docx"


def build():
    doc = init_document()

    add_cover(
        doc,
        eyebrow="Template · Lucid-Lab",
        title="Titre du document",
        subtitle="Un format clair pour propositions, audits et comptes-rendus clients.",
        meta=[
            ("Client", "[Nom du client]"),
            ("Document", "[Type de document]"),
            ("Date", "[Date]"),
            ("Contact", "Lucid-Lab — info@lucid-lab.fr"),
        ],
    )

    # --- Contexte ---
    add_section(doc, "Contexte")
    add_paragraph(
        doc,
        "[En 4 à 6 lignes : la situation actuelle, le problème à résoudre et "
        "ce qui motive cette proposition.]",
    )

    # --- Objectif ---
    add_section(doc, "Objectif", new_page=False)
    add_paragraph(
        doc,
        "[Une phrase claire qui décrit le résultat attendu, mesurable si possible.]",
    )

    # --- Périmètre ---
    add_section(doc, "Périmètre", new_page=False)
    add_subheading(doc, "Volet 1 — [Nom du volet]")
    add_bullet(doc, "[Livrable concret 1]")
    add_bullet(doc, "[Livrable concret 2]")
    add_bullet(doc, "[Livrable concret 3]")
    add_subheading(doc, "Volet 2 — [Nom du volet]")
    add_bullet(doc, "[Livrable concret 1]")
    add_bullet(doc, "[Livrable concret 2]")

    # --- Calendrier ---
    add_section(doc, "Calendrier", new_page=False)
    add_kv_row(doc, "Semaine 1", "[Cadrage et accès aux outils]")
    add_kv_row(doc, "Semaines 2–3", "[Construction et tests]")
    add_kv_row(doc, "Semaine 4", "[Mise en production et passation]")

    # --- Investissement ---
    add_section(doc, "Investissement", new_page=False)
    add_paragraph(doc, "[Tarif mensuel ou paiement unique, conditions.]")

    # --- Prochaines étapes ---
    add_section(doc, "Prochaines étapes", new_page=False)
    add_bullet(doc, "[Action 1 attendue côté client]")
    add_bullet(doc, "[Action 2 attendue côté client]")
    add_bullet(doc, "[Action 3 attendue côté client]")
    
    from _lucid_doc import add_signature_block
    add_signature_block(doc, "[Nom du client]")

    return doc


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    build().save(OUTPUT)
    print(f"Generated {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
