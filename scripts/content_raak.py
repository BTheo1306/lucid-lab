"""
Service Proposal - Lucid-Lab
RAAK Design - Robrecht Lambrechts
Personal AI OS: Claude + Obsidian Setup and Onboarding
Reference: PROP-2026-012 · 17 June 2026
"""

CONTENT = {
    "filename":      "12_PropositionBDC-RAAK-Design.pdf",
    "template_name": "proposition_bdc_template_en.html",
    "client_name":   "RAAK Design — Robrecht Lambrechts",
    "client_short":  "RAAK Design",
    "subtitle": (
        "Personal AI OS: Claude Code and Obsidian setup, hands-on onboarding, "
        "and optional team expansion and monthly support retainer."
    ),

    # Meta
    "meta": [
        ("Client",    "RAAK Design — Robrecht Lambrechts"),
        ("Date",      "17 June 2026"),
        ("Contact",   "Lucid-Lab — info@lucid-lab.fr"),
        ("Reference", "PROP-2026-012"),
        ("Validity",  "30 days from date of issue"),
    ],

    # Parties
    "client_block_bdc": (
        "The Client: RAAK Design, [legal entity to be confirmed], registered office: "
        "[address to be confirmed], Belgium, VAT number: [BE VAT number to be confirmed], "
        "represented by Mr Robrecht Lambrechts."
    ),

    # Objective
    "objectif": [
        (
            "RAAK Design is a product design and engineering studio working with world-class clients "
            "including Nike, Sony, Samsonite, and Barco. Across every project, the team produces "
            "extensive documentation: briefs, research notes, technical specifications, meeting summaries, "
            "client communications, and design rationale. Today, this knowledge is scattered across tools "
            "and inboxes, making it slow to retrieve, difficult to build upon, and hard to hand off "
            "to collaborators."
        ),
        (
            "The goal of this engagement is to transform the way Robrecht and the RAAK team interact "
            "with information and AI. By combining Claude (Anthropic's AI assistant) with Obsidian (a "
            "private, local-first knowledge base), Lucid-Lab sets up a Personal AI OS: a structured "
            "intelligence layer that ingests existing documents, maintains a living company memory, and "
            "lets the team interact with AI in a deeply context-aware way. The result is a system that "
            "thinks alongside you rather than in isolation."
        ),
        (
            "Two engagement paths are available: Option A for an individual setup (Robrecht), "
            "and Option B for a team rollout (additional seats for RAAK team members). "
            "Both paths can be complemented by an optional monthly retainer for ongoing support, "
            "new automations, and system maintenance. A Company AI Workshop is also available "
            "as an optional add-on for the full team."
        ),
    ],

    # Scope of Work
    "perimetre": [
        {
            "title": "Option A — Individual Setup (Robrecht) · 500 EUR",
            "bullets": [
                "Full Claude Code installation and configuration on Robrecht's machine.",
                "Obsidian vault designed and structured for a product design studio: projects, clients, research, process documentation, and meeting notes.",
                "Existing company documents ingested, organised, and made searchable within the vault.",
                "Hands-on onboarding session (remote, 3-4 hours): Jules controls the screen, installs everything live, and walks Robrecht through the complete system.",
                "1-2 custom automations built together during the session, tailored to Robrecht's specific workflows and priorities.",
                "Lucid-Lab Personal OS User Guide (PDF): a reference manual for using, maintaining, and expanding the system independently.",
            ],
        },
        {
            "title": "Option B — Team Expansion · 350 EUR per additional seat",
            "bullets": [
                "Same setup and onboarding as Option A, adapted to each team member's role and workflow.",
                "Individual onboarding session per seat: each person gets their own configured environment.",
                "Shared company vault layer: team members connect to a common knowledge structure.",
                "Can be added for any number of team members, at any time after Robrecht's initial setup.",
            ],
        },
        {
            "title": "Monthly Retainer (optional) · from 250 EUR / month",
            "bullets": [
                "1 monthly strategy and Q&A call (60 min): review what is working, troubleshoot, and plan next improvements.",
                "Async support via email: questions and guidance on demand, answered within 48 hours.",
                "Maintenance of existing automations: updates, fixes, and improvements as the system evolves.",
                "Hands-on help building new automations as the team's needs grow.",
                "Individual access: 250 EUR / month. Team access (multiple seats): 300 EUR / month.",
                "Minimum commitment: 3 months, then month-to-month.",
            ],
        },
        {
            "title": "Optional Add-on: Company AI Workshop · 600 EUR",
            "bullets": [
                "Half-day workshop for the full RAAK team (up to 8 participants).",
                "How to use AI effectively in a product design and engineering workflow: research, documentation, briefs, client communications.",
                "Prompting best practices and how to get consistent, high-quality output from Claude.",
                "Hands-on exercises tailored to RAAK's real projects and use cases.",
                "Delivered on a date to be agreed, remote or on-site.",
            ],
        },
    ],

    # Timeline
    "timeline": [
        {"date": "Week 0",   "label": "PREP",      "description": "Document review and session preparation"},
        {"date": "Session",  "label": "SETUP",     "description": "Full install and onboarding"},
        {"date": "Week 1-2", "label": "FOLLOW-UP", "description": "Support window and adjustments"},
        {"date": "Month 2+", "label": "RETAINER",  "description": "Monthly call and ongoing support"},
    ],
    "calendrier": [
        {
            "label": "Week 0 — Preparation",
            "text": (
                "Jules reviews the existing documents and materials RAAK wants to ingest (shared via "
                "Google Drive, Dropbox, or transfer). Vault structure and automation ideas are prepared "
                "ahead of the session."
            ),
        },
        {
            "label": "Session Day — Full Setup and Onboarding",
            "text": (
                "Remote session of 3-4 hours. Jules controls the screen, installs and configures Claude "
                "Code and Obsidian live, ingests documents, builds 1-2 automations together with Robrecht, "
                "and walks through the complete system."
            ),
        },
        {
            "label": "Week 1-2 — Follow-up Window",
            "text": (
                "One-week support window following the session. Questions answered, small adjustments made, "
                "and additional team member sessions scheduled if Option B is selected."
            ),
        },
        {
            "label": "Month 2 onward — Retainer (optional)",
            "text": (
                "If the retainer is selected: monthly call, async support, automation maintenance, "
                "and ongoing guidance as the system and the team's needs evolve."
            ),
        },
    ],
    "livrables": [
        ("Option A",  "Configured Claude Code + Obsidian vault · document ingestion · 1-2 automations · onboarding session · PDF user guide"),
        ("Option B",  "Same as Option A per seat · shared company vault layer"),
        ("Retainer",  "Monthly 60-min call · async support · automation maintenance · new automation guidance"),
        ("Workshop",  "Half-day session for up to 8 people · AI best practices · hands-on exercises"),
    ],

    # Investment
    "investissement": [
        ("Individual Setup — Option A (Robrecht)",       "500.00 EUR excl. VAT · one-time"),
        ("Additional Seat — Option B (per person)",      "350.00 EUR excl. VAT · one-time per seat"),
        ("Monthly Retainer — Individual access",         "250.00 EUR excl. VAT / month · 3-month minimum"),
        ("Monthly Retainer — Team access",               "300.00 EUR excl. VAT / month · 3-month minimum"),
        ("Company AI Workshop (optional add-on)",        "600.00 EUR excl. VAT · one-time"),
        ("VAT",                                          "0% — reverse charge, VAT due by recipient (art. 196 VAT Directive 2006/112/CE)"),
        ("Example A: Robrecht only + 3-month retainer",  "1,250.00 EUR excl. VAT (500 + 3 x 250)"),
        ("Example B: Robrecht + 2 seats, no retainer",   "1,200.00 EUR excl. VAT (500 + 2 x 350)"),
        ("Example C: Robrecht + 2 seats + 3-month team retainer", "2,100.00 EUR excl. VAT (1,200 + 3 x 300)"),
        ("Payment terms",                                "SEPA bank transfer only — see General Terms and Conditions"),
    ],

    # Costs not included
    "couts_exclus": {
        "intro": (
            "The fees above cover Lucid-Lab's work exclusively. The following costs remain "
            "the Client's direct responsibility, as they depend on actual usage:"
        ),
        "bullets": [
            "Anthropic API credits for Claude usage (billed directly by Anthropic; indicative cost: approximately 15-30 EUR / month per user for moderate use);",
            "Obsidian Sync subscription, if multi-device or team sync is desired (approximately 10 EUR / month; optional);",
            "Any third-party tool subscriptions required for specific automations agreed during the onboarding session;",
            "Travel and accommodation costs for any in-person session, if requested by the Client (by prior written agreement).",
        ],
        "outro": (
            "An indicative estimate of these costs can be provided on request, without binding commitment on Lucid-Lab's part."
        ),
    },

    # Payment ref
    "ref_client_rib": "PROP-2026-012 / RAAK Design",

    # Next steps
    "prochaines_etapes": [
        "Confirm the chosen option(s) by signing and returning this Proposal to info@lucid-lab.fr.",
        "Share the existing documents to be ingested (Google Drive link, Dropbox, or direct file transfer).",
        "Schedule the onboarding session at a mutually convenient time (remote, approximately 3-4 hours).",
        "Make the first payment to trigger the start of the engagement.",
        "For team expansion (Option B): confirm the team members to onboard and their roles.",
    ],

    # Contractual framework
    "cadre_contractuel": [
        (
            "Start of Services: upon signature of this Proposal, transmission of any required access or "
            "materials, and effective receipt of the first payment on Lucid-Lab's bank account "
            "(IBAN FR76 2823 3000 0119 9177 3651 869, BIC REVOFRP2, Revolut Bank UAB)."
        ),
        (
            "Contractual documents provided: (i) this Proposal acting as Order Form, "
            "(ii) the Service Contract, (iii) Lucid-Lab's General Terms and Conditions."
        ),
        (
            "Professional liability insurance: Lucid-Lab holds Professional Indemnity Insurance "
            "with Hiscox SA (policy RCPLP 3695175450, limit 100,000 EUR per insurance period, "
            "worldwide excluding USA/Canada)."
        ),
    ],

    # Acceptance
    "acceptation": {
        "intro": "The Client declares having read and fully accepts without reservation:",
        "bullets": [
            "the scope, deliverables, and timeline described above;",
            "the pricing structure for the chosen option(s) and the associated payment terms;",
            "Lucid-Lab's General Terms and Conditions, accessible at lucid-lab.fr/cgv;",
            "the obligation to make the first payment before any work begins.",
        ],
        "conclusion": (
            "Signing this Proposal constitutes full acceptance of the offer, formation of the Contract, "
            "and a firm order. It triggers the issuance of a pro forma invoice and the start of Services "
            "upon effective receipt of the first payment."
        ),
        "modalite": (
            "Selected option(s): [to be confirmed by the Client at signature]."
        ),
        "mention": (
            "Required handwritten note: \"Read and approved, firm order — [selected option(s) and total amount]\"."
        ),
    },

    # Mention manuscrite
    "mention_manuscrite": (
        "Read and approved, firm order — [selected option(s) and total amount]"
    ),

    # Signature
    "signature": {
        "client": "RAAK Design — Robrecht Lambrechts",
    },
}
