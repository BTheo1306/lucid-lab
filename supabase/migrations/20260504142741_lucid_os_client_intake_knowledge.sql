-- =============================================================================
-- Lucid OS Client Intake Knowledge
-- =============================================================================
-- Durable runtime knowledge for the admin-side client intake workflow.

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
), upserted_document AS (
	INSERT INTO knowledge_documents (
		organization_id,
		source_system,
		source_uri,
		title,
		slug,
		status,
		visibility,
		freshness_at,
		summary,
		content,
		metadata
	)
	SELECT
		id,
		'github',
		'src/app/admin/(dashboard)/lucid-os/clients',
		'Lucid OS Client Intake Workflow',
		'lucid-os-client-intake-workflow',
		'active',
		'internal',
		now(),
		'Admin workflow for quickly adding prospects and clients, capturing meeting state and notes, and indexing pasted context as client-scoped agent memory.',
		'Lucid OS client intake should minimize admin friction. The admin clients page provides one form for client/company name, contact details, status, intake stage, meeting status, booked/done dates, what the client wants, meeting notes, budget, timeline, next step, source, and a pasted context document. The server action upserts the clients row using organization_id + slug, stores pipeline/meeting details in clients.metadata.intake, and can index the pasted notes as a client-scoped knowledge_documents record with a knowledge_chunks retrieval chunk. Each intake records audit_events for traceability. Use this workflow before creating heavier client/project automation so Lucid-Lab can capture useful context immediately after calls, LinkedIn replies, referrals, or website leads.',
		jsonb_build_object(
			'workflow', 'client_intake',
			'admin_route', '/admin/lucid-os/clients',
			'server_action', 'recordClientIntakeAction',
			'data_layer', 'upsertLucidClientIntake',
			'stores_client_scoped_knowledge', true
		)
	FROM lucid_org
	ON CONFLICT (organization_id, slug) DO UPDATE SET
		source_uri = EXCLUDED.source_uri,
		status = EXCLUDED.status,
		visibility = EXCLUDED.visibility,
		freshness_at = EXCLUDED.freshness_at,
		summary = EXCLUDED.summary,
		content = EXCLUDED.content,
		metadata = knowledge_documents.metadata || EXCLUDED.metadata,
		updated_at = now()
	RETURNING id, organization_id
)
INSERT INTO knowledge_chunks (organization_id, document_id, chunk_index, heading, content, metadata)
SELECT
	organization_id,
	id,
	0,
	'Client intake workflow',
	'Use /admin/lucid-os/clients to add or update a prospect/client in one pass. Capture client/company info, contact info, status, intake stage, meeting status, booked/done dates, desired outcome, notes, budget, timeline, next step, source, and pasted context. The workflow writes clients.metadata.intake and can index pasted context into knowledge_documents/knowledge_chunks linked to the client. This reduces friction by letting Jules paste one messy note after a meeting while still creating structured CRM fields and agent-retrievable memory.',
	jsonb_build_object('workflow', 'client_intake', 'source', 'migration')
FROM upserted_document
ON CONFLICT (document_id, chunk_index) DO UPDATE SET
	heading = EXCLUDED.heading,
	content = EXCLUDED.content,
	metadata = knowledge_chunks.metadata || EXCLUDED.metadata;

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
), client_intake_doc AS (
	SELECT kd.id, kd.organization_id
	FROM knowledge_documents kd
	JOIN lucid_org lo ON lo.id = kd.organization_id
	WHERE kd.slug = 'lucid-os-client-intake-workflow'
)
INSERT INTO audit_events (organization_id, actor_type, event_type, target_table, target_id, risk_level, summary, details)
SELECT
	organization_id,
	'system',
	'knowledge_document_upserted',
	'knowledge_documents',
	id,
	'low',
	'Lucid OS client intake workflow added to runtime knowledge.',
	jsonb_build_object('workflow', 'client_intake', 'migration', '20260504142741_lucid_os_client_intake_knowledge')
FROM client_intake_doc;
