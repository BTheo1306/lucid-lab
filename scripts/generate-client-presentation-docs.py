"""
Generate 3 client proposal .docx files from Resume_Projets_Prestations.

Run: python3 scripts/generate-client-presentation-docs.py
"""

from pathlib import Path
from datetime import date

from _lucid_doc import (
    init_document,
    add_cover,
    add_section,
    add_paragraph,
    add_subheading,
    add_bullet,
    add_kv_row,
    add_signature_block,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "docs" / "client-presentations"


CLIENTS = [
    {
        "slug": "sophia-kanouni-bsp37",
        "display_name": "BSP 37 — Sophia Kanouni",
        "subtitle": (
            "Refonte du site web et gestion Meta Ads pour le film solaire "
            "à partir du 1er septembre 2026."
        ),
        "objective": (
            "BSP 37 est un groupement familial ancré dans l'artisanat depuis 1989. "
            "L'objectif de cet accompagnement est double : moderniser la présence "
            "digitale de l'entreprise avec un site plus performant, puis ouvrir un canal "
            "d'acquisition pour l'activité d'installation de film solaire via Meta Ads "
            "(Facebook / Instagram) à partir du 1er septembre 2026."
        ),
        "scope": [
            ("Refonte du site web — bsp37.com", [
                "Audit du site Wix existant et recommandations.",
                "Refonte complète sur une technologie moderne : meilleure performance, SEO et contrôle total sans abonnement Wix.",
                "Intégration du catalogue produits, galerie de réalisations, pages de services et formulaires de contact.",
                "Déploiement et configuration du nom de domaine.",
                "Maintenance mensuelle : mises à jour, corrections, suivi des performances SEO.",
            ]),
            ("Meta Ads — Film solaire à partir du 1er septembre 2026", [
                "Création et configuration du compte Meta Ads (Facebook / Instagram).",
                "Définition de la cible locale : zone géographique, audiences et ciblages d'intérêt.",
                "Création d'une landing page dédiée à la génération de leads film solaire.",
                "Création de deux publicités Meta Ads pour le lancement : 250 € HT en frais unique.",
                "Gestion mensuelle des campagnes : 100 € HT / mois à partir du 1er septembre 2026, incluant optimisation, tests visuels et reporting mensuel.",
                "Mise en place d'un suivi des leads : formulaire dédié + tableau de bord partagé.",
                "Note : le budget publicitaire Meta est distinct des frais de gestion et reste réglé directement par Sophia auprès de Meta.",
            ]),
        ],
        "calendar": [
            ("Semaine 1", "Audit du site existant, cadrage du nouveau site et préparation du brief Meta Ads."),
            ("Semaines 2–3", "Refonte du site web : structure, design, contenus et intégrations."),
            ("Semaine 4", "Mise en ligne du site et validation du parcours de génération de leads film solaire."),
            ("À partir du 1er septembre 2026", "Création des deux publicités, lancement et gestion mensuelle des campagnes Meta Ads."),
        ],
        "pricing": (
            "Site web — refonte + maintenance : 150 € HT / mois.\n"
            "Gestion Meta Ads — Film solaire : 100 € HT / mois à partir du 1er septembre 2026.\n"
            "Forfait mensuel total site + gestion Meta Ads : 250 € HT / mois à partir du 1er septembre 2026.\n"
            "Création de deux publicités Meta Ads : 250 € HT en frais unique.\n"
            "Budget publicitaire Meta : non inclus, réglé directement par Sophia auprès de Meta."
        ),
        "next_steps": [
            "Valider le périmètre site web et Meta Ads.",
            "Confirmer le budget publicitaire Meta Ads mensuel à régler directement à Meta.",
            "Accès à fournir : hébergement/domaine bsp37.com, accès Wix et compte Meta Business.",
            "Valider le lancement de la gestion Meta Ads au 1er septembre 2026.",
            "Signature de la proposition et règlement du premier mois pour démarrer.",
        ],
    },
    {
        "slug": "eden-creche",
        "display_name": "Crèche Eden",
        "subtitle": (
            "Automatisation administrative, acquisition Meta Ads et socle SEO "
            "pour lisser l'occupation de la crèche."
        ),
        "objective": (
            "Mettre en place un back-office simple et fiable qui réduit les "
            "relances manuelles, structure les documents entrants et soutient "
            "l'acquisition via Meta Ads."
        ),
        "scope": [
            ("Automatisation administrative", [
                "Transposition du fichier Excel principal vers Google Sheets avec formules, automatisations et suivi des virements par client.",
                "Connexion entre le fichier principal, Google Drive et les emails entrants.",
                "Gestion des disponibilités pour faciliter les lancements Meta Ads et lisser l'occupation.",
                "Classement automatique des documents reçus, détection des pièces manquantes et vérification documentaire.",
                "Relances automatiques par email aux échéances utiles.",
                "Demandes automatiques de signature et de documentation, classement dans Drive.",
                "Automatisation des demandes d'avis Google.",
            ]),
            ("Acquisition et contenu", [
                "Prise en charge de la gestion Meta Ads.",
                "Récupération du compte Meta Ads existant via le compte Eden, ou création complète d'un nouveau compte.",
                "Ajout d'un WhatsApp Business pour fluidifier les échanges entrants.",
                "Programmation mensuelle de posts blog orientés SEO.",
            ]),
        ],
        "calendar": [
            ("Semaine 1", "Audit du fichier, Drive, emails et flux documents."),
            ("Semaines 2–3", "Google Sheets, automatisations, relances et classement."),
            ("Semaine 4", "Meta Ads, WhatsApp Business et routine SEO."),
        ],
        "pricing": (
            "259 € HT / mois pendant 12 mois (au lieu de 329 € HT) "
            "ou 2 590 € HT en paiement unique (au lieu de 3 290 € HT)."
        ),
        "next_steps": [
            "Confirmer l'accès au fichier Excel principal, au Drive et aux emails utiles.",
            "Confirmer la situation du compte Meta Ads existant.",
            "Valider la structure des échéances de relance documentaire.",
        ],
    },
    {
        "slug": "clement-sinibaldi",
        "display_name": "Sinibaldi Architecte",
        "subtitle": (
            "Nouvelle page WordPress, acquisition Meta Ads et agent IA "
            "d'inspiration Instagram pour développer le service de conseil."
        ),
        "objective": (
            "Structurer l'offre de conseil, créer la page de conversion "
            "associée, puis soutenir l'acquisition et la visibilité par Meta "
            "Ads et contenu social."
        ),
        "scope": [
            ("Développement WordPress", [
                "Développement d'une page dédiée au service de conseil.",
                "Intégration de la nouvelle page dans le site WordPress existant.",
                "Mise en place d'une automatisation des posts blog.",
            ]),
            ("Gestion Meta Ads", [
                "Gestion des campagnes Meta Ads pour promouvoir le service de conseil.",
                "Objectif prioritaire : génération de leads et acquisition.",
            ]),
            ("Agent IA — contenu Instagram", [
                "Agent IA proposant des idées de contenu Instagram.",
                "Trames inspirationnelles mensuelles pour les réseaux sociaux.",
                "Suggestions de posts et d'amélioration du contenu existant.",
            ]),
            ("À discuter", [
                "Sujet SaaS prévu lors du prochain call, à planifier rapidement.",
            ]),
        ],
        "calendar": [
            ("Semaine 1", "Cadrage de l'offre conseil et architecture de la page."),
            ("Semaines 2–3", "Développement WordPress, blog automation et campagnes Meta Ads."),
            ("Semaine 4", "Agent IA Instagram et routine de contenu mensuelle."),
        ],
        "pricing": (
            "159 € HT / mois pendant 12 mois (au lieu de 269 € HT) "
            "ou 1 590 € HT en paiement unique (au lieu de 2 690 € HT)."
        ),
        "next_steps": [
            "Donner l'accès WordPress et les éléments de positionnement du service de conseil.",
            "Confirmer le budget publicitaire Meta Ads.",
            "Planifier le prochain call sur le sujet SaaS.",
        ],
    },
    {
        "slug": "fany-rother",
        "display_name": "Fany Rother",
        "subtitle": (
            "Bots WhatsApp et Instagram, relance avis Google et exploration "
            "des automatisations utiles au programme de coaching."
        ),
        "objective": (
            "Automatiser les points de contact répétitifs pour libérer du "
            "temps, fluidifier les conversations clients et renforcer la "
            "preuve sociale via les avis Google."
        ),
        "scope": [
            ("Suivi et bots conversationnels", [
                "Bot WhatsApp et support pour la communauté WhatsApp.",
                "Bot Instagram pour répondre aux clients et prospects.",
                "Point de suivi prévu dans deux semaines.",
            ]),
            ("Avis Google et automatisations", [
                "Configuration de la relance Google Review dans Système.io.",
                "Cadrage des automatisations potentielles et de leurs priorités.",
                "Garder l'humain sur les moments à forte valeur, automatiser les relances répétitives.",
            ]),
        ],
        "calendar": [
            ("Semaine 1", "Cadrage des scénarios WhatsApp, Instagram et Système.io."),
            ("Semaines 2–3", "Configuration des bots et relance avis Google."),
            ("Semaine 4", "Point de suivi et priorisation des automatisations suivantes."),
        ],
        "pricing": (
            "225 € HT / mois pendant 12 mois (au lieu de 260 € HT) "
            "ou 2 250 € HT en paiement unique (au lieu de 2 600 € HT)."
        ),
        "next_steps": [
            "Confirmer les accès Système.io, WhatsApp Business et Instagram.",
            "Lister les questions fréquentes et messages types à automatiser.",
            "Maintenir le point de suivi dans deux semaines.",
        ],
    },
]


def build(client: dict):
    doc = init_document()
    today = date.today().strftime("%d %B %Y")
    display_name = client["display_name"]

    add_cover(
        doc,
        eyebrow="Proposition d'accompagnement",
        title=display_name,
        subtitle=client["subtitle"],
        meta=[
            ("Client", display_name),
            ("Date", today),
            ("Contact", "Lucid-Lab — info@lucid-lab.fr"),
        ],
    )

    add_section(doc, "Objectif", new_page=False)
    add_paragraph(doc, client["objective"])

    add_section(doc, "Périmètre", new_page=False)
    for name, items in client["scope"]:
        add_subheading(doc, name)
        for item in items:
            add_bullet(doc, item)

    add_section(doc, "Calendrier", new_page=False)
    for label, value in client["calendar"]:
        add_kv_row(doc, label, value)

    add_section(doc, "Investissement", new_page=False)
    add_paragraph(doc, client["pricing"])

    add_section(doc, "Prochaines étapes", new_page=False)
    for step in client["next_steps"]:
        add_bullet(doc, step)

    add_signature_block(doc, display_name)

    return doc


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for client in CLIENTS:
        path = OUTPUT_DIR / f"{client['slug']}-proposition-lucid-lab.docx"
        build(client).save(path)
        print(f"Generated {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
