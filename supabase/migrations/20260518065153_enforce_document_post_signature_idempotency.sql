-- Keep post-signature side effects idempotent even when DocuSeal emits both
-- form.completed and submission.completed, or when an admin refresh runs nearby.

WITH ranked_storage_locations AS (
	SELECT
		id,
		row_number() OVER (
			PARTITION BY organization_id, document_id, storage_provider, file_kind
			ORDER BY updated_at DESC NULLS LAST, created_at DESC, id DESC
		) AS row_rank
	FROM public.client_document_storage_locations
)
DELETE FROM public.client_document_storage_locations AS storage_location
USING ranked_storage_locations AS ranked
WHERE storage_location.id = ranked.id
	AND ranked.row_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_document_storage_unique_provider_kind
	ON public.client_document_storage_locations (organization_id, document_id, storage_provider, file_kind);

WITH ranked_signed_billing_events AS (
	SELECT
		id,
		row_number() OVER (
			PARTITION BY organization_id, document_id, event_type
			ORDER BY occurred_at DESC NULLS LAST, created_at DESC, id DESC
		) AS row_rank
	FROM public.client_billing_events
	WHERE document_id IS NOT NULL
		AND event_type = 'bdc_signed'
)
DELETE FROM public.client_billing_events AS billing_event
USING ranked_signed_billing_events AS ranked
WHERE billing_event.id = ranked.id
	AND ranked.row_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_billing_events_signed_document_unique
	ON public.client_billing_events (organization_id, document_id, event_type)
	WHERE document_id IS NOT NULL
		AND event_type = 'bdc_signed';
