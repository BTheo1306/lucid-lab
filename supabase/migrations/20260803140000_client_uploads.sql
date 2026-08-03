-- Documents déposés par le client depuis son portail.
--
-- Table distincte de client_documents, qui décrit ce que l'agence émet
-- (bons de commande, factures, contrats) avec son cycle de signature. Ici
-- c'est l'inverse : le client remet une pièce, elle part sur son dossier Drive
-- comme le reste, et l'équipe est notifiée.

create table if not exists client_uploads (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references organizations(id) on delete cascade,
	client_id uuid not null references clients(id) on delete cascade,
	contact_id uuid references client_contacts(id) on delete set null,
	/** Document de l'agence auquel cette pièce répond, par exemple un bon de commande signé. */
	document_id uuid references client_documents(id) on delete set null,
	file_name text not null,
	mime_type text,
	size_bytes bigint,
	note text,
	storage_provider text not null default 'google_drive',
	file_id text,
	folder_id text,
	url text,
	status text not null default 'received'
		check (status in ('received', 'reviewed', 'archived')),
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_client_uploads_client on client_uploads(client_id, created_at desc);
create index if not exists idx_client_uploads_document on client_uploads(document_id) where document_id is not null;

alter table client_uploads enable row level security;

comment on table client_uploads is
	'Pieces deposees par le client depuis le portail. Stockees sur le dossier Drive du client, comme les documents emis.';
