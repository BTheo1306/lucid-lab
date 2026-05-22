#!/usr/bin/env python3
"""
Generate Lucid-Lab branded PDF guides for the Obsidian LLM Wiki offer.

Run:
    python3 scripts/generate-obsidian-wiki-guides.py
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "obsidian-wiki"
LOGO_PATH = ROOT / "public" / "logo-full.png"

DARK = colors.HexColor("#0A0A0A")
MUTED = colors.HexColor("#555555")
SOFT = colors.HexColor("#E6E2DA")
PAPER = colors.HexColor("#F7F5F1")
AMBER = colors.HexColor("#FFB451")
BLUE = colors.HexColor("#B4D8FF")
GREEN = colors.HexColor("#34D399")
WHITE = colors.white

PAGE_W, PAGE_H = A4


def today_fr() -> str:
    months = {
        1: "janvier",
        2: "février",
        3: "mars",
        4: "avril",
        5: "mai",
        6: "juin",
        7: "juillet",
        8: "août",
        9: "septembre",
        10: "octobre",
        11: "novembre",
        12: "décembre",
    }
    current = date.today()
    return f"{current.day} {months[current.month]} {current.year}"


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()

    def style(name: str, **kwargs) -> ParagraphStyle:
        defaults = {
            "fontName": "Helvetica",
            "fontSize": 9.5,
            "leading": 13.5,
            "textColor": DARK,
            "spaceAfter": 7,
        }
        defaults.update(kwargs)
        return ParagraphStyle(name, parent=base["Normal"], **defaults)

    return {
        "eyebrow": style(
            "Eyebrow",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=MUTED,
            uppercase=True,
            spaceAfter=8,
        ),
        "cover_title": style(
            "CoverTitle",
            fontName="Helvetica-Bold",
            fontSize=31,
            leading=35,
            spaceAfter=13,
        ),
        "cover_subtitle": style(
            "CoverSubtitle",
            fontSize=12.2,
            leading=18,
            textColor=MUTED,
            spaceAfter=20,
        ),
        "h1": style(
            "H1",
            fontName="Helvetica-Bold",
            fontSize=19,
            leading=23,
            spaceBefore=15,
            spaceAfter=8,
        ),
        "h2": style(
            "H2",
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=15,
            spaceBefore=9,
            spaceAfter=5,
        ),
        "body": style("Body", fontSize=9.7, leading=14.3, spaceAfter=7),
        "small": style("Small", fontSize=8.3, leading=11.5, textColor=MUTED, spaceAfter=4),
        "quote": style(
            "Quote",
            fontName="Helvetica-Bold",
            fontSize=10.8,
            leading=15.5,
            textColor=DARK,
            alignment=TA_CENTER,
            spaceAfter=0,
        ),
        "table_head": style(
            "TableHead",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=WHITE,
        ),
        "table_cell": style("TableCell", fontSize=8.4, leading=11.8, spaceAfter=0),
        "table_cell_bold": style(
            "TableCellBold",
            fontName="Helvetica-Bold",
            fontSize=8.4,
            leading=11.8,
            spaceAfter=0,
        ),
        "footer": style("Footer", fontSize=7.2, leading=9, textColor=colors.HexColor("#888888")),
    }


STYLES = make_styles()


def p(text: str, name: str = "body") -> Paragraph:
    return Paragraph(text, STYLES[name])


def bullet_list(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(p(item, "body"), leftIndent=10, bulletFontName="Helvetica") for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=15,
        bulletFontName="Helvetica",
        bulletFontSize=5,
    )


def number_list(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(p(item, "body"), leftIndent=10) for item in items],
        bulletType="1",
        leftIndent=17,
        bulletFontName="Helvetica-Bold",
        bulletFontSize=8.4,
    )


def section(title: str):
    return p(title, "h1")


def subsection(title: str):
    return p(title, "h2")


def callout(title: str, body: str, accent=AMBER) -> Table:
    data = [["", [p(title, "h2"), p(body, "body")]]]
    table = Table(data, colWidths=[0.16 * cm, 16.0 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), accent),
                ("BACKGROUND", (1, 0), (1, -1), WHITE),
                ("BOX", (0, 0), (-1, -1), 0.6, SOFT),
                ("LEFTPADDING", (1, 0), (1, -1), 12),
                ("RIGHTPADDING", (1, 0), (1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def data_table(headers: list[str], rows: list[list[str]], widths: list[float] | None = None) -> Table:
    table_data = [[p(header.upper(), "table_head") for header in headers]]
    for row in rows:
        table_data.append([p(cell, "table_cell") for cell in row])

    if widths is None:
        widths = [16.2 * cm / len(headers)] * len(headers)

    table = Table(table_data, colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("GRID", (0, 0), (-1, -1), 0.45, SOFT),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def command_block(lines: list[str]) -> Table:
    text = "<br/>".join(lines)
    block_style = ParagraphStyle(
        "CommandBlock",
        fontName="Courier",
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor("#202020"),
    )
    table = Table([[Paragraph(text, block_style)]], colWidths=[16.2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0EDE7")),
                ("BOX", (0, 0), (-1, -1), 0.45, SOFT),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def brand_header(canvas, doc, title: str):
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.setFont("Helvetica-Bold", 8.2)
    canvas.drawString(20 * mm, PAGE_H - 14 * mm, "Lucid-Lab")
    canvas.setFont("Helvetica", 7.2)
    canvas.setFillColor(colors.HexColor("#777777"))
    canvas.drawRightString(PAGE_W - 20 * mm, PAGE_H - 14 * mm, title)
    canvas.setStrokeColor(SOFT)
    canvas.line(20 * mm, PAGE_H - 18 * mm, PAGE_W - 20 * mm, PAGE_H - 18 * mm)
    canvas.setFont("Helvetica", 7.2)
    canvas.drawString(20 * mm, 12 * mm, "lucid-lab.fr · info@lucid-lab.fr")
    canvas.drawRightString(PAGE_W - 20 * mm, 12 * mm, str(canvas.getPageNumber()))
    canvas.restoreState()


def cover(title: str, subtitle: str, document_type: str, audience: str) -> list:
    story = []
    if LOGO_PATH.exists():
        logo = Image(str(LOGO_PATH), width=2.1 * cm, height=2.1 * cm)
        logo.hAlign = "LEFT"
        story.append(logo)
        story.append(Spacer(1, 0.35 * cm))
    story.append(p("LUCID-LAB", "eyebrow"))
    story.append(p(title, "cover_title"))
    story.append(p(subtitle, "cover_subtitle"))
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        data_table(
            ["Champ", "Information"],
            [
                ["Document", document_type],
                ["Audience", audience],
                ["Date", today_fr()],
                ["Contact", "Lucid-Lab - info@lucid-lab.fr"],
            ],
            widths=[4.0 * cm, 12.2 * cm],
        )
    )
    story.append(Spacer(1, 0.45 * cm))
    story.append(
        callout(
            "On ne conseille pas. On construit.",
            "Ce document sert à transformer Obsidian et Claude Code en système de connaissance vivant : clair, contrôlé, utile au quotidien.",
            BLUE,
        )
    )
    story.append(PageBreak())
    return story


def build_pdf(out_path: Path, title: str, story: list):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=24 * mm,
        bottomMargin=22 * mm,
        title=title,
        author="Lucid-Lab",
    )
    doc.build(
        story,
        onFirstPage=lambda canvas, current_doc: brand_header(canvas, current_doc, title),
        onLaterPages=lambda canvas, current_doc: brand_header(canvas, current_doc, title),
    )


def client_guide_story() -> list:
    story = cover(
        "Guide d'utilisation Obsidian + Claude Code",
        "Comment utiliser votre wiki personnel et business au maximum de sa capacité, sans perdre le contrôle de vos données.",
        "Guide client",
        "Dirigeant, fondateur, indépendant ou équipe opérationnelle",
    )

    story.append(section("1. Ce que vous avez entre les mains"))
    story.append(
        p(
            "Votre wiki Obsidian est une base de connaissance privée. Claude Code sert à l'alimenter, la ranger, la relier et l'interroger. Obsidian sert à lire, explorer et visualiser les notes."
        )
    )
    story.append(
        data_table(
            ["Element", "Role"],
            [
                ["Obsidian", "Interface de lecture : notes, liens, recherche, graph view, navigation."],
                ["Claude Code", "Assistant de maintenance : ingestion, synthèse, audit, questions/réponses."],
                ["obsidian-wiki", "Méthode de travail : structure, provenance, index, manifest, staged writes."],
                ["Vault", "Dossier local contenant vos pages Markdown et vos données de wiki."],
            ],
            widths=[4.0 * cm, 12.2 * cm],
        )
    )
    story.append(Spacer(1, 0.25 * cm))
    story.append(
        callout(
            "Le principe",
            "Le wiki ne remplace pas votre jugement. Il vous donne une memoire structuree, interrogeable et actionnable pour mieux decider, deleguer et automatiser.",
            AMBER,
        )
    )

    story.append(section("2. Ce que le système fait et ne fait pas"))
    story.append(
        data_table(
            ["Il fait", "Il ne fait pas"],
            [
                ["Il transforme vos documents autorisés en pages claires et reliées.", "Il ne lit pas tout votre ordinateur en continu."],
                ["Il garde une trace des sources déjà ingérées.", "Il ne remplace pas un coffre-fort de mots de passe."],
                ["Il vous aide à retrouver les décisions, offres, clients, process et opportunités.", "Il ne doit pas ingérer de secrets, clés API, mots de passe ou informations bancaires inutiles."],
                ["Il peut auditer le wiki et signaler les zones floues.", "Il n'invente pas les faits manquants : il crée des questions ouvertes."],
            ],
            widths=[8.1 * cm, 8.1 * cm],
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(p("Point important : il ne s'alimente pas tout seul par défaut. C'est volontaire. Vous choisissez quand et quoi ingérer."))

    story.append(section("3. Les bonnes sources à donner au wiki"))
    story.append(
        bullet_list(
            [
                "Documents commerciaux : offres, tarifs, propositions, objections, scripts de vente.",
                "Documents opérationnels : SOPs, process, checklists, comptes-rendus, supports internes.",
                "Documents marketing : site web, pages de vente, contenus, newsletters, posts, analytics.",
                "Recherche client : interviews, feedbacks, avis, questions frequentes, CRM exporte.",
                "Notes personnelles/pro : objectifs, priorités, idées, décisions, blocages.",
                "Transcriptions : réunions, appels commerciaux, ateliers, debriefs.",
            ]
        )
    )
    story.append(
        callout(
            "Règle de sécurité",
            "Avant chaque ingestion sensible, demandez explicitement à Claude ce qu'il compte lire. Ne donnez jamais de dossiers contenant mots de passe, clés privées, seeds, documents bancaires bruts ou données personnelles inutiles.",
            GREEN,
        )
    )

    story.append(PageBreak())
    story.append(section("4. Comment alimenter le wiki"))
    story.append(p("La méthode la plus simple : déposer les fichiers dans un dossier source autorisé, puis demander à Claude Code de mettre à jour le wiki."))
    story.append(
        data_table(
            ["Situation", "Commande ou demande à Claude Code", "Résultat"],
            [
                ["Nouveaux documents", "Mets à jour mon wiki avec les nouveaux documents autorisés.", "Claude traite les fichiers nouveaux ou modifiés."],
                ["Notes rapides", "Traite mes notes brutes dans _raw et transforme-les en pages propres.", "Les brouillons deviennent des pages reliées."],
                ["Question business", "Que sais-tu sur mes meilleurs clients et leurs objections ?", "Claude repond depuis le wiki avec contexte."],
                ["Audit", "Audite mon wiki : liens casses, doublons, contradictions, pages faibles.", "Liste des corrections et prochaines actions."],
                ["Stratégie", "Fais une revue stratégique complète de mon wiki.", "Synthèse des risques, opportunités, décisions et actions."],
            ],
            widths=[3.2 * cm, 7.2 * cm, 5.8 * cm],
        )
    )

    story.append(section("5. Les commandes utiles"))
    story.append(
        command_block(
            [
                "/wiki-status                 # voir ce qui est ingéré, nouveau ou en attente",
                "/wiki-ingest                 # ingérer les nouveaux documents autorisés",
                "/wiki-query [question]       # poser une question au wiki",
                "/wiki-lint                   # auditer la qualité du wiki",
                "/ingest-url [url]            # ingérer une page web précise",
                "/wiki-rebuild                # archiver/reconstruire si le wiki derive trop",
            ]
        )
    )
    story.append(p("Si les slash commands ne sont pas disponibles, ecrivez simplement la demande en langage naturel. Claude Code detecte normalement le skill adapte."))

    story.append(section("6. Routine recommandee"))
    story.append(
        data_table(
            ["Frequence", "Action"],
            [
                ["Chaque jour ou après une réunion", "Déposer les notes utiles dans _raw ou dans le dossier source. Ajouter les décisions importantes."],
                ["Chaque semaine", "Demander une mise à jour du wiki, puis une synthèse des opportunités, risques et questions ouvertes."],
                ["Chaque mois", "Faire une revue stratégique : offres, clients, opérations, automatisations, priorités 30 jours."],
                ["Avant une décision", "Interroger le wiki : contexte, options, risques, précédents, informations manquantes."],
            ],
            widths=[4.0 * cm, 12.2 * cm],
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        command_block(
            [
                "Fais la maintenance hebdomadaire de mon wiki :",
                "1. Vérifie le statut.",
                "2. Ingère les nouveaux fichiers autorisés.",
                "3. Traite les notes dans _raw.",
                "4. Mets à jour les synthèses importantes.",
                "5. Signale les contradictions, risques, opportunités et questions ouvertes.",
            ]
        )
    )

    story.append(PageBreak())
    story.append(section("7. Comment utiliser Obsidian au quotidien"))
    story.append(
        bullet_list(
            [
                "Utilisez la recherche pour retrouver rapidement une offre, un client, une decision ou un process.",
                "Ouvrez le Graph View pour voir les connexions entre clients, offres, outils, process et opportunités.",
                "Cliquez sur les wikilinks entre doubles crochets pour naviguer d'une idée à l'autre.",
                "Ajoutez vos notes rapides dans _raw plutot que de casser la structure du wiki.",
                "Relisez les pages de synthèse avant les décisions importantes : résumé exécutif, plan 30/60/90, risques, opportunités.",
                "Gardez les documents sources séparés du wiki final : le wiki est la synthèse, pas un dépôt de fichiers brut." ,
            ]
        )
    )

    story.append(section("8. Les meilleures questions à poser"))
    story.append(
        data_table(
            ["Objectif", "Question utile"],
            [
                ["Comprendre le business", "Explique mon modele economique, mes offres et mes principaux risques."],
                ["Vendre mieux", "Quelles objections reviennent souvent et comment puis-je y repondre ?"],
                ["Automatiser", "Quelles tâches répétitives ont le meilleur potentiel d'automatisation ?"],
                ["Prioriser", "Quelles actions auraient le plus d'impact dans les 30 prochains jours ?"],
                ["Clarifier", "Quelles sont les informations manquantes pour prendre une bonne decision ?"],
                ["Déléguer", "Quelles tâches devrais-je déléguer ou documenter en priorité ?"],
            ],
            widths=[4.0 * cm, 12.2 * cm],
        )
    )

    story.append(section("9. Foire aux questions"))
    story.append(subsection("Est-ce que le wiki s'alimente tout seul ?"))
    story.append(p("Non, pas par défaut. Vous gardez le contrôle : vous choisissez les dossiers, fichiers et moments d'ingestion. Le système sait toutefois reconnaître ce qui est nouveau ou modifié pour éviter de retraiter inutilement les mêmes sources."))
    story.append(subsection("Dois-je invoquer un skill à chaque fois ?"))
    story.append(p("Vous pouvez utiliser les commandes comme /wiki-ingest ou /wiki-query, mais vous pouvez aussi parler normalement à Claude Code. Exemple : 'Mets à jour mon wiki avec mes nouveaux documents'."))
    story.append(subsection("Faut-il créer un agent spécial ?"))
    story.append(p("Pas au début. Commencez avec les skills et une routine simple. Un agent spécialisé devient intéressant lorsque votre usage est stable : revue hebdomadaire, ingestion contrôlée, synthèses, audit qualité, plan d'action."))
    story.append(subsection("Puis-je utiliser l'application Claude classique ?"))
    story.append(p("Oui pour réfléchir, rédiger ou analyser des textes collés manuellement. Mais pour lire/écrire le vault local, maintenir les fichiers et utiliser pleinement obsidian-wiki, utilisez Claude Code."))

    story.append(section("10. Les 5 règles d'or"))
    story.append(
        number_list(
            [
                "Ne donnez au wiki que les sources que vous acceptez de voir analysees.",
                "Ne mettez jamais de secrets ou mots de passe dans les sources.",
                "Après chaque grosse ingestion, demandez une synthèse et les questions ouvertes.",
                "Utilisez le wiki avant les décisions : il sert à retrouver le contexte que l'on oublie.",
                "Faites une maintenance régulière. Un bon wiki vit par petites mises à jour, pas par gros rattrapages chaotiques.",
            ]
        )
    )

    return story


def installation_guide_story() -> list:
    story = cover(
        "Guide d'installation Obsidian LLM Wiki",
        "Checklist interne Lucid Lab pour installer, configurer et expliquer le système chez un client sans rater d'étape.",
        "Guide d'installation interne",
        "Lucid Lab - delivery, implementation, client success",
    )

    story.append(section("1. Objectif de l'installation"))
    story.append(
        p(
            "Mettre en place sur l'ordinateur du client un wiki Obsidian privé, maintenu par Claude Code, pour cartographier son profil, son business, ses process, ses opportunités et ses cas d'usage IA."
        )
    )
    story.append(
        callout(
            "Message à donner au client",
            "Obsidian est votre interface de lecture. Claude Code est l'assistant qui range, relie, met à jour et interroge le wiki. Rien ne lit votre ordinateur en continu : vous gardez le contrôle des sources.",
            BLUE,
        )
    )

    story.append(section("2. Preparation avant rendez-vous"))
    story.append(
        data_table(
            ["À vérifier", "Pourquoi"],
            [
                ["Mac ou machine compatible", "Adapter les commandes d'installation si le client n'est pas sur macOS."],
                ["Obsidian installé ou installable", "C'est l'interface de lecture du wiki."],
                ["Claude Code disponible", "Le repo obsidian-wiki est pensé pour les agents capables de lire/écrire des fichiers."],
                ["Node/npm disponibles", "La commande npx skills add utilise npm/npx."],
                ["Dossier vault choisi", "Exemple : ~/Documents/Business-Wiki."],
                ["Dossier sources choisi", "Exemple : ~/Documents/Business-Sources."],
                ["Liste des dossiers interdits", "Éviter secrets, finances sensibles, documents personnels hors périmètre."],
            ],
            widths=[5.0 * cm, 11.2 * cm],
        )
    )

    story.append(section("3. Installation rapide"))
    story.append(subsection("Commandes principales"))
    story.append(
        command_block(
            [
                "brew install --cask obsidian",
                "npx skills add Ar9av/obsidian-wiki",
            ]
        )
    )
    story.append(p("Si Homebrew n'est pas installé, faire télécharger Obsidian depuis obsidian.md. Si npx n'est pas disponible, installer Node.js ou passer par la méthode git clone."))
    story.append(subsection("Méthode alternative via git clone"))
    story.append(
        command_block(
            [
                "git clone https://github.com/Ar9av/obsidian-wiki.git",
                "cd obsidian-wiki",
                "bash setup.sh",
            ]
        )
    )

    story.append(section("4. Configuration recommandée"))
    story.append(p("Dans Claude Code, faire configurer le vault avec des chemins simples et explicites."))
    story.append(
        command_block(
            [
                "OBSIDIAN_VAULT_PATH=~/Documents/Business-Wiki",
                "OBSIDIAN_SOURCES_DIR=~/Documents/Business-Sources",
                "WIKI_STAGED_WRITES=true",
            ]
        )
    )
    story.append(
        data_table(
            ["Parametre", "Recommandation"],
            [
                ["Vault", "Un vault par client/personne. Ne jamais mélanger plusieurs entreprises dans le même vault."],
                ["Sources", "Un dossier contrôlé contenant uniquement les documents autorisés."],
                ["Staged writes", "Toujours true au départ : le client valide avant intégration finale."],
                ["QMD", "Optionnel. À ignorer au premier setup sauf besoin de recherche sémantique avancée."],
            ],
            widths=[4.0 * cm, 12.2 * cm],
        )
    )

    story.append(PageBreak())
    story.append(section("5. Prompt initial à coller dans Claude Code"))
    story.append(
        command_block(
            [
                "Tu vas m'aider à construire mon wiki Obsidian privé pour moi et mon entreprise.",
                "Vérifie que les skills obsidian-wiki sont installés.",
                "Configure un vault isolé, active les staged writes si possible,",
                "puis commence par me poser les questions essentielles avant d'ingérer mes documents.",
                "Ne lis aucun dossier sensible sans mon autorisation explicite.",
            ]
        )
    )
    story.append(p("Ensuite, coller le prompt complet préparé pour le client si l'installation est stable. Le prompt doit être écrit à la première personne : 'mon wiki', 'mon entreprise', jamais 'le client'."))

    story.append(section("6. Checklist de verification"))
    story.append(
        data_table(
            ["Check", "Validation"],
            [
                ["Obsidian s'ouvre", "Le client peut ouvrir le vault avec File > Open Vault."],
                ["Skills installés", "Claude Code comprend /wiki-status ou une demande naturelle équivalente."],
                ["Vault créé", "Dossiers concepts, entities, synthesis, projects, _raw, _staging visibles."],
                ["Staged writes actif", "Les nouvelles pages peuvent être mises en attente de validation."],
                ["Index/log/manifest", "index.md, log.md et .manifest.json existent ou seront créés par le setup."],
                ["Source folder", "Le dossier source existe et ne contient pas de secrets."],
                ["Premier test", "Une note non sensible est ingérée et visible dans Obsidian."],
            ],
            widths=[4.4 * cm, 11.8 * cm],
        )
    )

    story.append(section("7. Premiere session client"))
    story.append(
        data_table(
            ["Temps", "Action", "Objectif"],
            [
                ["10 min", "Expliquer Obsidian, Claude Code, vault, sources, staged writes.", "Installer la bonne image mentale."],
                ["15 min", "Questions initiales : business, objectifs, offres, sources, limites.", "Créer les premières pages Moi + Business Overview."],
                ["20 min", "Inventaire des sources avec le client.", "Choisir quoi ingérer maintenant, plus tard, jamais."],
                ["20 min", "Ingestion test avec documents non sensibles.", "Valider le flux complet."],
                ["15 min", "Montrer comment poser des questions et faire une revue.", "Rendre le client autonome."],
            ],
            widths=[2.4 * cm, 7.0 * cm, 6.8 * cm],
        )
    )

    story.append(section("8. Script d'explication au client"))
    story.append(
        callout(
            "Version courte",
            "On installe un wiki local qui devient la carte de votre business. Claude Code ne lit que les sources que vous autorisez. Obsidian vous permet de naviguer dans les notes, les liens et le graphe. Le système ne tourne pas tout seul en arrière-plan : vous gardez la main, et vous lancez les mises à jour quand vous voulez.",
            AMBER,
        )
    )
    story.append(
        bullet_list(
            [
                "Insister sur le contrôle : le client choisit les dossiers et fichiers.",
                "Insister sur la provenance : les faits importants restent rattachés aux sources.",
                "Insister sur l'utilite : decision, delegation, automatisation, memoire business.",
                "Ne pas vendre ca comme une IA magique qui comprend tout toute seule.",
                "Positionner Lucid Lab comme l'équipe qui installe le système, structure le workflow et aide à l'utiliser intelligemment.",
            ]
        )
    )

    story.append(PageBreak())
    story.append(section("9. Commandes à laisser au client"))
    story.append(
        data_table(
            ["Besoin", "Phrase simple"],
            [
                ["Mettre à jour", "Mets à jour mon wiki avec les nouveaux documents autorisés."],
                ["Poser une question", "Que sais-tu sur mes offres, mes clients et mes objections ?"],
                ["Traiter les notes rapides", "Traite mes notes dans _raw et transforme-les en pages propres."],
                ["Revue hebdo", "Fais la maintenance hebdomadaire de mon wiki et donne-moi risques, opportunités et prochaines actions."],
                ["Audit qualité", "Audite mon wiki : doublons, liens cassés, contradictions, pages faibles."],
                ["Automatisation", "Liste mes meilleures opportunités d'automatisation, par impact et difficulté."],
            ],
            widths=[4.2 * cm, 12.0 * cm],
        )
    )

    story.append(section("10. Quand créer un agent dédié"))
    story.append(p("Ne pas commencer par un agent dédié. D'abord stabiliser l'usage avec les skills et quelques routines. Créer un agent quand le client répète les mêmes demandes chaque semaine."))
    story.append(
        data_table(
            ["Niveau", "Usage"],
            [
                ["Niveau 1", "Skills simples : wiki-ingest, wiki-query, wiki-status, wiki-lint."],
                ["Niveau 2", "Routine hebdomadaire collee dans Claude Code."],
                ["Niveau 3", "Agent 'Business Wiki Chief of Staff' avec règles permanentes, revue, ingestion contrôlée et audit."],
            ],
            widths=[3.4 * cm, 12.8 * cm],
        )
    )

    story.append(section("11. Pièges à éviter"))
    story.append(
        bullet_list(
            [
                "Tout ingérer d'un coup. Préférer 5 à 10 sources importantes, puis itérer.",
                "Mélanger vie personnelle, business, clients et secrets sans frontière claire.",
                "Laisser le client croire que le système s'auto-alimente sans action de sa part.",
                "Utiliser l'application Claude classique pour les opérations fichiers. Pour le vault local, utiliser Claude Code.",
                "Accepter des pages sans sources, sans questions ouvertes ou sans distinction entre fait et déduction.",
            ]
        )
    )

    story.append(section("12. Depannage rapide"))
    story.append(
        data_table(
            ["Probleme", "Solution"],
            [
                ["npx introuvable", "Installer Node.js, puis rouvrir le terminal."],
                ["Claude ne voit pas les skills", "Relancer Claude Code, vérifier l'installation skills, ou utiliser la méthode git clone + setup.sh."],
                ["Obsidian ne montre pas les notes", "Vérifier que le bon dossier est ouvert comme vault."],
                ["Pages en attente", "Expliquer staged writes : elles sont dans _staging jusqu'à validation."],
                ["Trop de doublons", "Lancer un audit wiki-lint et demander une fusion des concepts."],
                ["Source sensible détectée", "Arrêter l'ingestion, retirer le fichier, relancer sur un dossier nettoyé."],
            ],
            widths=[4.7 * cm, 11.5 * cm],
        )
    )

    story.append(section("13. Définition du succès"))
    story.append(
        number_list(
            [
                "Le client sait ouvrir Obsidian et naviguer dans les pages.",
                "Le client comprend que Claude Code maintient le wiki, mais ne lit rien sans autorisation.",
                "Une première page Moi et une première page Business Overview existent.",
                "Au moins une source non sensible a été ingérée avec succès.",
                "Le client sait lancer une mise à jour, poser une question et demander une revue hebdomadaire.",
            ]
        )
    )

    return story


def main():
    client_pdf = OUT_DIR / "lucid-lab-guide-client-obsidian-wiki.pdf"
    install_pdf = OUT_DIR / "lucid-lab-guide-installation-obsidian-wiki.pdf"

    build_pdf(client_pdf, "Guide client Obsidian Wiki", client_guide_story())
    build_pdf(install_pdf, "Guide installation Obsidian Wiki", installation_guide_story())

    print(f"Generated {client_pdf.relative_to(ROOT)}")
    print(f"Generated {install_pdf.relative_to(ROOT)}")


if __name__ == "__main__":
    main()