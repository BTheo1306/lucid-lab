-- =============================================================================
-- Lucid OS CRM Phase 1 foreign-key indexes
-- =============================================================================
-- Follow-up to the Phase 1 CRM migration based on Supabase performance advisor
-- results. These indexes cover optional relationship foreign keys used by the
-- client command-center UI and later automation queries.

CREATE INDEX idx_client_opportunities_primary_contact_id
	ON client_opportunities(primary_contact_id)
	WHERE primary_contact_id IS NOT NULL;

CREATE INDEX idx_client_interactions_contact_id
	ON client_interactions(contact_id)
	WHERE contact_id IS NOT NULL;

CREATE INDEX idx_client_interactions_opportunity_id
	ON client_interactions(opportunity_id)
	WHERE opportunity_id IS NOT NULL;

CREATE INDEX idx_client_tasks_contact_id
	ON client_tasks(contact_id)
	WHERE contact_id IS NOT NULL;

CREATE INDEX idx_client_tasks_interaction_id
	ON client_tasks(interaction_id)
	WHERE interaction_id IS NOT NULL;

CREATE INDEX idx_client_imports_organization_id
	ON client_imports(organization_id);
