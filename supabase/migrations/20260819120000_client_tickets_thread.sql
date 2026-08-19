-- Le systeme d'echanges du portail devient un vrai ticketing.
--
-- client_requests portait une seule reponse (response_note) : suffisant pour
-- une validation, pas pour un suivi de support a l'echelle. Cette migration
-- ajoute ce qui manque, sans rien casser de l'existant :
--   1) priority : basse / normale / haute / urgente (le client ne peut choisir
--      que normale ou urgente, l'allowlist est cote code).
--   2) reference : numero lisible (#42) pour parler d'un ticket dans un email
--      ou au telephone. Sequence globale, backfill ordonne par created_at.
--   3) request_type gagne 'incident' (bug, panne, probleme sur un livrable).
--   4) client_request_messages : le fil de discussion. Append-only (created_at
--      seul, comme portal_login_tokens). Le message d'ouverture reste
--      client_requests.body ; response_note reste alimentee en miroir avec la
--      derniere note pour ne pas casser les ecrans existants.
--
-- Machine a etats des tickets (direction client_to_agency) :
--   creation -> open ; equipe prend en charge -> in_progress ; equipe repond
--   -> waiting (en attente du client) ; resolution -> done / declined.
--   Toute reponse du client repasse le ticket a open (retour dans la file a
--   traiter). Le client peut aussi marquer son ticket comme resolu (done).
--   Les demandes agence vers client (approbations) gardent leur flux :
--   approved / changes_requested ne bougent pas.

-- 1) Priorite
alter table client_requests add column priority text not null default 'normal';
alter table client_requests add constraint client_requests_priority_check
	check (priority in ('low', 'normal', 'high', 'urgent'));

-- 2) Reference lisible. Backfill dans l'ordre de creation, puis la sequence
-- prend le relais pour les nouvelles lignes.
create sequence client_requests_reference_seq;
alter table client_requests add column reference bigint;
update client_requests
set reference = numbered.ref
from (
	select id, row_number() over (order by created_at, id) as ref
	from client_requests
) as numbered
where client_requests.id = numbered.id;
select setval(
	'client_requests_reference_seq',
	coalesce((select max(reference) from client_requests), 0) + 1,
	false
);
alter table client_requests alter column reference set default nextval('client_requests_reference_seq');
alter table client_requests alter column reference set not null;
alter sequence client_requests_reference_seq owned by client_requests.reference;
create unique index idx_client_requests_reference on client_requests(reference);

-- 3) Type incident
alter table client_requests drop constraint client_requests_type_check;
alter table client_requests add constraint client_requests_type_check
	check (request_type in ('question', 'change_request', 'asset_request', 'approval', 'info_request', 'incident'));

-- 4) Fil de discussion. Pas de trigger updated_at : la table est append-only,
-- et chaque mutation de reponse fait un UPDATE sur client_requests (meme a
-- statut identique), ce qui rafraichit client_requests.updated_at via le
-- trigger existant.
create table client_request_messages (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references organizations(id) on delete cascade,
	client_id uuid not null references clients(id) on delete cascade,
	request_id uuid not null references client_requests(id) on delete cascade,
	/** 'client' = le contact du portail, 'team' = l'equipe Lucid-Lab. */
	sender text not null,
	contact_id uuid references client_contacts(id) on delete set null,
	author_label text,
	body text not null,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	constraint client_request_messages_sender_check check (sender in ('client', 'team'))
);

create index idx_client_request_messages_request_created on client_request_messages(request_id, created_at);
create index idx_client_request_messages_client_created on client_request_messages(client_id, created_at desc);

alter table client_request_messages enable row level security;

comment on table client_request_messages is
	'Fil de discussion des demandes client_requests. Le message d''ouverture est client_requests.body ; chaque reponse (client ou equipe) est une ligne ici. Acces service-role uniquement, scope en code.';

-- 5) Reprise des reponses existantes dans le fil. Le sens depend de la
-- direction : sur une demande agence vers client, response_note est la reponse
-- du CLIENT ; sur un ticket client vers agence, c'est celle de l'EQUIPE.
insert into client_request_messages (organization_id, client_id, request_id, sender, contact_id, body, created_at)
select
	organization_id,
	client_id,
	id,
	case when direction = 'agency_to_client' then 'client' else 'team' end,
	responded_by_contact_id,
	response_note,
	coalesce(resolved_at, updated_at)
from client_requests
where response_note is not null and btrim(response_note) <> '';
