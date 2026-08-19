-- Assistant SAV du portail client (chatbot).
--
-- Conversations et messages du chatbot du portail. Tables volontairement
-- separees des conversations/messages du bot du site vitrine : celles-ci
-- hangent sur les contacts anonymes (localStorage) et passent par le cron de
-- retention ; ici les interlocuteurs sont des client_contacts identifies.
--
-- Quand l'assistant escalade, il cree un ticket client_requests (source
-- sav_bot dans metadata) et la conversation passe en escalated avec le lien
-- escalated_request_id. Acces service-role uniquement, scope en code.

create table portal_conversations (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references organizations(id) on delete cascade,
	client_id uuid not null references clients(id) on delete cascade,
	contact_id uuid references client_contacts(id) on delete set null,
	status text not null default 'active',
	/** Ticket cree par l'assistant quand la conversation a ete escaladee. */
	escalated_request_id uuid references client_requests(id) on delete set null,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	last_message_at timestamptz not null default now(),
	constraint portal_conversations_status_check check (status in ('active', 'escalated', 'closed'))
);

create index idx_portal_conversations_client on portal_conversations(client_id, last_message_at desc);

alter table portal_conversations enable row level security;

comment on table portal_conversations is
	'Conversations de l''assistant SAV du portail client. Distinctes des conversations du bot marketing (contacts anonymes).';

-- Append-only : created_at seul, pas de trigger.
create table portal_messages (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references organizations(id) on delete cascade,
	client_id uuid not null references clients(id) on delete cascade,
	conversation_id uuid not null references portal_conversations(id) on delete cascade,
	/** 'client' = le contact du portail, 'assistant' = le bot. */
	sender text not null,
	body text not null,
	/** { model, tokens } pour les messages de l'assistant. */
	ai_metadata jsonb,
	created_at timestamptz not null default now(),
	constraint portal_messages_sender_check check (sender in ('client', 'assistant'))
);

create index idx_portal_messages_conversation on portal_messages(conversation_id, created_at);

alter table portal_messages enable row level security;

comment on table portal_messages is
	'Messages des conversations de l''assistant SAV du portail client.';
