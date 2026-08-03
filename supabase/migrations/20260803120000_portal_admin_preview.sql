-- Aperçu admin du portail client.
--
-- Permet à un administrateur de voir le portail exactement comme le voit un
-- contact client, sans usurper sa session : l'aperçu est en LECTURE SEULE et
-- toutes les mutations du portail le refusent.
--
-- Le passage de l'admin (admin.lucid-lab.fr) au portail (client.lucid-lab.fr)
-- se fait par un jeton à usage unique et à durée très courte, sur le même
-- mécanisme que le lien de connexion : un cookie ne peut pas être posé d'un
-- domaine sur l'autre.

alter table portal_login_tokens
	drop constraint if exists portal_login_tokens_purpose_check;

alter table portal_login_tokens
	add constraint portal_login_tokens_purpose_check
	check (purpose in ('login', 'invite', 'admin_preview'));

comment on column portal_login_tokens.purpose is
	'login = lien de connexion client, invite = invitation initiale, admin_preview = ouverture d''un aperçu admin en lecture seule';
