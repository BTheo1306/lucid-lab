-- Prospection sortante : suivi des appels et des emails.
--
-- Le lead engine sait déjà décrire une cible (prospect_companies, prospect_people)
-- et son avancement large (status : contacted, replied, meeting_booked, converted).
-- Ce qui manquait, c'est la trace fine de chaque tentative : qui a appelé, quand,
-- et ce que ça a donné (barrage, répondeur, refus, rappel à programmer).
--
-- outreach_messages ne pouvait pas porter ça : ses contraintes de statut et
-- d'événement sont des CHECK fermés sur des canaux écrits, et le compte émetteur
-- n'accepte que linkedin et email. D'où cette table dédiée, volontairement simple.

CREATE TABLE prospection_touches (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	company_id uuid NOT NULL REFERENCES prospect_companies(id) ON DELETE CASCADE,
	person_id uuid REFERENCES prospect_people(id) ON DELETE SET NULL,
	channel text NOT NULL DEFAULT 'call',
	outcome text NOT NULL,
	notes text,
	owner_label text,
	occurred_at timestamptz NOT NULL DEFAULT now(),
	callback_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT prospection_touches_channel_check CHECK (channel IN (
		'call',
		'email',
		'linkedin',
		'other'
	)),
	CONSTRAINT prospection_touches_outcome_check CHECK (outcome IN (
		'barrage',
		'repondeur',
		'injoignable',
		'refus',
		'a_rappeler',
		'interesse',
		'rdv_pris',
		'email_envoye',
		'relance',
		'note'
	)),
	-- Un rappel n'a de sens que si on sait quand rappeler.
	CONSTRAINT prospection_touches_callback_check CHECK (outcome <> 'a_rappeler' OR callback_at IS NOT NULL)
);

CREATE INDEX idx_prospection_touches_company ON prospection_touches(company_id, occurred_at DESC);
CREATE INDEX idx_prospection_touches_callback ON prospection_touches(callback_at) WHERE callback_at IS NOT NULL;
CREATE INDEX idx_prospection_touches_workspace ON prospection_touches(workspace_id, occurred_at DESC);

ALTER TABLE prospection_touches ENABLE ROW LEVEL SECURITY;

-- Qui appelle quoi. Le secteur réutilise prospect_companies.industry.
ALTER TABLE prospect_companies ADD COLUMN IF NOT EXISTS owner_label text;

CREATE INDEX IF NOT EXISTS idx_prospect_companies_owner ON prospect_companies(owner_label) WHERE owner_label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospect_companies_industry ON prospect_companies(industry) WHERE industry IS NOT NULL;
