-- Prospection sortante : deux issues de plus, pour les cas où c'est la donnée
-- qui est fausse et pas le prospect qui refuse.
--
-- Au téléphone, deux situations n'avaient pas d'issue et finissaient en
-- « injoignable », ce qui sortait la cible de la liste à appeler alors qu'elle
-- restait tout à fait appelable une fois la fiche corrigée :
--   - le numéro ne fonctionne pas ou ne correspond pas au cabinet ;
--   - on tombe sur quelqu'un, mais la personne nommée sur la fiche n'est pas le
--     bon interlocuteur.
--
-- Ces deux issues ne font PAS avancer prospect_companies.status : on corrige la
-- fiche depuis le board, et la cible reste dans « À appeler ».

ALTER TABLE prospection_touches DROP CONSTRAINT prospection_touches_outcome_check;

ALTER TABLE prospection_touches ADD CONSTRAINT prospection_touches_outcome_check CHECK (outcome IN (
	'barrage',
	'repondeur',
	'injoignable',
	'refus',
	'a_rappeler',
	'interesse',
	'rdv_pris',
	'email_envoye',
	'relance',
	'note',
	'mauvais_numero',
	'pas_le_bon_interlocuteur'
));
