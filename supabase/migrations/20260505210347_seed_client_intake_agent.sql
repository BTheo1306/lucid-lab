WITH lucid_org AS (
	SELECT id
	FROM organizations
	WHERE slug = 'lucid-lab'
)
INSERT INTO agents (
	organization_id,
	name,
	slug,
	role,
	status,
	provider_preference,
	model_preference,
	prompt_version,
	system_prompt_ref,
	tools,
	approval_policy,
	memory_scope,
	config
)
SELECT
	id,
	'Client Intake Agent',
	'client-intake-agent',
	'Extracts structured client records from pasted meeting notes, email threads, LinkedIn context, and other intake documents.',
	'active',
	'anthropic',
	'claude-sonnet-4-5-20260115',
	'client-intake-agent-v1',
	'src/lib/admin/agents/client-intake-agent.ts',
	ARRAY['extract_client_intake', 'clients', 'knowledge_documents', 'knowledge_chunks', 'audit_events']::text[],
	'human_for_side_effects',
	'organization',
	jsonb_build_object(
		'source_module', 'src/lib/admin/agents/client-intake-agent.ts',
		'skill', 'extract_client_intake',
		'fallback', 'rules',
		'raw_notes_storage', 'knowledge_documents',
		'manual_fields_override_extraction', true
	)
FROM lucid_org
ON CONFLICT (organization_id, slug) DO UPDATE SET
	name = EXCLUDED.name,
	role = EXCLUDED.role,
	status = EXCLUDED.status,
	provider_preference = EXCLUDED.provider_preference,
	model_preference = EXCLUDED.model_preference,
	prompt_version = EXCLUDED.prompt_version,
	system_prompt_ref = EXCLUDED.system_prompt_ref,
	tools = EXCLUDED.tools,
	approval_policy = EXCLUDED.approval_policy,
	memory_scope = EXCLUDED.memory_scope,
	config = agents.config || EXCLUDED.config,
	updated_at = now();
