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
	'COO Agent',
	'coo-agent',
	'Routes operational requests from Telegram and Lucid OS to specialized agents, tools, tasks, and approvals.',
	'active',
	'anthropic',
	'claude-sonnet-4-5-20260115',
	'coo-agent-v1',
	'src/lib/admin/agents/coo-agent.ts',
	ARRAY[
		'telegram_coo_ingest',
		'agent_runs',
		'agent_tasks',
		'agent_approvals',
		'audit_events',
		'documents_draft',
		'crm_read'
	]::text[],
	'human_for_side_effects',
	'organization',
	jsonb_build_object(
		'source_module', 'src/lib/admin/agents/coo-agent.ts',
		'telegram_access', 'allowlist',
		'side_effects', 'approval_required',
		'phase', 'phase_1_safe_triage'
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
