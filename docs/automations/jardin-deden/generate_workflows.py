# Regenere les 3 workflows n8n (JSON importables) pour l'automatisation Jardin d'Eden.
# Colonnes = en-tetes reels du Sheet en ligne (accentues). Modele Claude a jour.
import json, os, uuid

OUT_DIR = os.path.expanduser('~/Downloads/eden-workflows')
os.makedirs(OUT_DIR, exist_ok=True)

SHEET_ID = '1WlXeh-pVluefxvM7tpDPVW3lIizC0VmtDECAftppMoU'
SHEET_URL = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}'
FAMILLES_FOLDER_ID = '1UmSu8VBxAoQoB78esAkVx9yaShX2S8JF'
EDEN_EMAIL = 'uccle@jardindeden.be'
LUCID_EMAIL = 'info@lucid-lab.fr'
CLAUDE_MODEL = 'claude-sonnet-5'
PACK_FILES = [
    ('1i_Valeghu7a8Ko6f7nUTVrMRq3xpPPtW', "Fiche d'inscription.docx"),
    ('1KTf4SxUXV87MhMMr1WVVMSerl1ZOQP_l', 'Accords financiers.pdf'),
    ('1NsHMtQWMd6naRry1RiaHw4NNK3ME7Ifl', 'Autorisation de quitter avec un tiers.docx'),
    ('1WabzzI7Nu_TtqjaSqTYeVLhRQbD051su', 'Documents et materiel a fournir.pdf'),
    ('1iWPfMyRQrFozl38EeA8ylyh2Bvkm_yrT', "Reglement d'ordre interieur.pdf"),
    ('1vcnv6RvEH5pKK8QqjHxATu2EzNSvjLiu', 'Familiarisation.pdf'),
    ('1CJLCFcs8_LDL-of_tt3RjyT1I-VzfxyY', 'Familiarisation en douceur.pdf'),
    ('1RdohIzwiOZHQ7y4q5otDcd_pLfR1Q6IE', 'Programme conges 2026.pdf'),
    ('1Duriclsis8cNj_Rz-sbPoc7wF0aHybIf', 'Projet pedagogique.pdf'),
]

CRED_OUTLOOK = {'microsoftOutlookOAuth2Api': {'name': 'Outlook Eden (uccle@jardindeden.be)'}}
CRED_GSHEETS = {'googleSheetsOAuth2Api': {'name': 'Google Lucid (info@lucid-lab.fr)'}}
CRED_GDRIVE = {'googleDriveOAuth2Api': {'name': 'Google Drive Lucid (info@lucid-lab.fr)'}}
CRED_ANTHROPIC = {'anthropicApi': {'name': 'Anthropic Lucid-Lab'}}

def P(col, row=0): return [col * 240, row * 220]

def node(name, ntype, params, col, row=0, tv=1, creds=None):
    n = {'parameters': params, 'id': str(uuid.uuid4()), 'name': name,
         'type': ntype, 'typeVersion': tv, 'position': P(col, row)}
    if creds: n['credentials'] = creds
    return n

def sticky(content, col, row=0, w=460, h=240):
    return {'parameters': {'content': content, 'width': w, 'height': h},
            'id': str(uuid.uuid4()), 'name': f'Note {uuid.uuid4().hex[:6]}',
            'type': 'n8n-nodes-base.stickyNote', 'typeVersion': 1, 'position': P(col, row)}

def wf(name, nodes, connections):
    return {'name': name, 'nodes': nodes, 'connections': connections,
            'settings': {'executionOrder': 'v1', 'timezone': 'Europe/Brussels'},
            'pinData': {}, 'meta': {'templateCredsSetupCompleted': False}}

def gsheets_read(name, sheet, col, row=0, lookup_col=None, lookup_val=None):
    p = {'operation': 'read',
         'documentId': {'__rl': True, 'value': SHEET_ID, 'mode': 'id'},
         'sheetName': {'__rl': True, 'value': sheet, 'mode': 'name'}, 'options': {}}
    if lookup_col:
        p['filtersUI'] = {'values': [{'lookupColumn': lookup_col, 'lookupValue': lookup_val}]}
    return node(name, 'n8n-nodes-base.googleSheets', p, col, row, tv=4.5, creds=CRED_GSHEETS)

def gsheets_append(name, sheet, mapping, col, row=0):
    return node(name, 'n8n-nodes-base.googleSheets', {
        'operation': 'append',
        'documentId': {'__rl': True, 'value': SHEET_ID, 'mode': 'id'},
        'sheetName': {'__rl': True, 'value': sheet, 'mode': 'name'},
        'columns': {'mappingMode': 'defineBelow', 'value': mapping, 'matchingColumns': [], 'schema': []},
        'options': {}}, col, row, tv=4.5, creds=CRED_GSHEETS)

def gsheets_update(name, sheet, mapping, col, row=0):
    m = dict(mapping); m['row_number'] = '={{ $json.row_number }}'
    return node(name, 'n8n-nodes-base.googleSheets', {
        'operation': 'update',
        'documentId': {'__rl': True, 'value': SHEET_ID, 'mode': 'id'},
        'sheetName': {'__rl': True, 'value': sheet, 'mode': 'name'},
        'columns': {'mappingMode': 'defineBelow', 'value': m, 'matchingColumns': ['row_number'], 'schema': []},
        'options': {}}, col, row, tv=4.5, creds=CRED_GSHEETS)

def journal(name, workflow, action, famille, detail, resultat, valide_par, col, row=0):
    return gsheets_append(name, 'Journal', {
        'Horodatage': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy HH:mm') }}",
        'Workflow': workflow, 'Action': action, 'Famille / Enfant': famille,
        'Détail': detail, 'Résultat': resultat, 'Validé par': valide_par}, col, row)

def outlook_send(name, to, subject, body, col, row=0, cc=None, attachments=False):
    p = {'resource': 'message', 'operation': 'send', 'toRecipients': to,
         'subject': subject, 'bodyContent': body,
         'additionalFields': {'bodyContentType': 'html'}}
    if cc: p['additionalFields']['ccRecipients'] = cc
    if attachments:
        p['additionalFields']['attachments'] = {'attachments': [{'binaryPropertyName': f'attachment_{i}'} for i in range(len(PACK_FILES))]}
    return node(name, 'n8n-nodes-base.microsoftOutlook', p, col, row, tv=2, creds=CRED_OUTLOOK)

def conn(mapping):
    out = {}
    for src, dests in mapping.items():
        if isinstance(dests, str): dests = [[dests]]
        elif dests and isinstance(dests[0], str): dests = [dests]
        out[src] = {'main': [[{'node': d, 'type': 'main', 'index': 0} for d in branch] for branch in dests]}
    return out

STAGING_NOTE = (
    '## MODE STAGING ACTIF\n'
    'Le node "Paramètres" a staging=true : TOUS les emails partent vers ' + LUCID_EMAIL + '\n'
    'au lieu des parents et d\'Eden. Basculer staging=false apres les tests de bout en bout.\n\n'
    'A l\'import : 1) mapper les credentials, 2) choisir les dossiers Outlook dans les nodes [DOSSIER].')

def parametres_node(col=1):
    return node('Paramètres', 'n8n-nodes-base.set', {
        'mode': 'raw',
        'jsonOutput': json.dumps({'staging': True, 'email_eden': EDEN_EMAIL,
                                  'email_lucid': LUCID_EMAIL, 'sheet_url': SHEET_URL}, ensure_ascii=False),
        'options': {}}, col, 0, tv=3.4)

DEST = "={{ $('Paramètres').item.json.staging ? $('Paramètres').item.json.email_lucid : %s }}"
def dest(expr): return DEST % expr
DEST_EDEN = dest("$('Paramètres').item.json.email_eden")

# ===================== WORKFLOW A =====================
extract_code = r'''
// Mail deplace par Eden dans "1 - Nouvelle inscription" : l'expediteur est le parent.
const m = $input.item.json;
const from = m.from?.emailAddress || m.sender?.emailAddress || {};
const email = (from.address || '').toLowerCase().trim();
const nom = from.name || '';
const interne = ['uccle@jardindeden.be', 'info@lucid-lab.fr'];
if (!email || interne.includes(email)) return [];
return [{ json: { email_parent: email, nom_expediteur: nom, sujet_origine: m.subject || '', message_id: m.id || '', recu_le: m.receivedDateTime || '' }}];
'''
pack_items_code = ('const files = ' + json.dumps([{'fileId': f, 'filename': n} for f, n in PACK_FILES], ensure_ascii=False) + ';\n'
    "return files.map(f => ({ json: { ...f, email_parent: $('Extraire le contact').item.json.email_parent } }));")
merge_binaries_code = r'''
const items = $input.all(); const binary = {};
items.forEach((it, i) => { const k = Object.keys(it.binary || {})[0]; if (k) binary[`attachment_${i}`] = it.binary[k]; });
return [{ json: { count: items.length }, binary }];
'''
PACK_BODY = (
    "<p>Madame, Monsieur,</p>"
    "<p>Nous vous remercions pour votre visite et pour l'int&eacute;r&ecirc;t que vous portez &agrave; notre cr&egrave;che.</p>"
    "<p>Vous trouverez en pi&egrave;ces jointes le dossier d'inscription complet : fiche d'inscription, accords financiers, autorisation de sortie, r&egrave;glement d'ordre int&eacute;rieur, projet p&eacute;dagogique, protocole de familiarisation et programme des cong&eacute;s.</p>"
    "<p>Merci de nous renvoyer par retour de mail : la fiche d'inscription compl&eacute;t&eacute;e, les accords financiers sign&eacute;s, l'autorisation de sortie, ainsi que la copie de la carte d'identit&eacute; des deux parents, de la carte d'assurance sant&eacute;, du carnet de vaccination et une composition de m&eacute;nage.</p>"
    "<p>Pour rappel, les entr&eacute;es se font uniquement le 1er du mois et l'inscription est valid&eacute;e &agrave; la r&eacute;ception des documents sign&eacute;s ainsi que du versement des frais de r&eacute;servation.</p>"
    "<p>Bien cordialement,<br>Eden Missioui<br>Le Jardin d'Eden<br>Avenue Winston Churchill 157, 1180 Bruxelles</p>")

wa_nodes = [
    sticky(STAGING_NOTE, 0, -1),
    node('[DOSSIER] Nouveau mail "1 - Nouvelle inscription"', 'n8n-nodes-base.microsoftOutlookTrigger',
         {'pollTimes': {'item': [{'mode': 'everyX', 'value': 5, 'unit': 'minutes'}]}, 'output': 'raw', 'filters': {}},
         0, 0, tv=1, creds=CRED_OUTLOOK),
    parametres_node(1),
    node('Extraire le contact', 'n8n-nodes-base.code', {'mode': 'runOnceForEachItem', 'jsCode': extract_code}, 2, 0, tv=2),
    gsheets_read('Chercher dans Inscriptions', 'Inscriptions', 3, 0, 'Email parent', "={{ $json.email_parent }}"),
    node('Déjà dans le pipeline ?', 'n8n-nodes-base.if', {
        'conditions': {'options': {'caseSensitive': False, 'typeValidation': 'loose', 'version': 2}, 'combinator': 'and',
                       'conditions': [{'leftValue': '={{ $json.row_number }}', 'rightValue': '',
                                       'operator': {'type': 'string', 'operation': 'notEmpty', 'singleValue': True}}]}}, 4, 0, tv=2.2),
    journal('Journal : doublon ignoré', 'A - Envoi pack', 'Pack NON renvoyé (déjà dans le pipeline)',
            "={{ $('Extraire le contact').item.json.email_parent }}",
            "={{ 'Mail: ' + $('Extraire le contact').item.json.sujet_origine }}", 'Ignoré', 'automatique', 5, -1),
    node('Préparer la liste des 9 documents', 'n8n-nodes-base.code', {'mode': 'runOnceForAllItems', 'jsCode': pack_items_code}, 5, 1, tv=2),
    node('Télécharger le document', 'n8n-nodes-base.googleDrive', {
        'resource': 'file', 'operation': 'download',
        'fileId': {'__rl': True, 'value': '={{ $json.fileId }}', 'mode': 'id'},
        'options': {'fileName': '={{ $json.filename }}'}}, 6, 1, tv=3, creds=CRED_GDRIVE),
    node('Assembler les pièces jointes', 'n8n-nodes-base.code', {'mode': 'runOnceForAllItems', 'jsCode': merge_binaries_code}, 7, 1, tv=2),
    outlook_send('Envoyer le pack (boîte Eden)', dest("$('Extraire le contact').item.json.email_parent"),
                 "Le Jardin d'Eden : dossier d'inscription", PACK_BODY, 8, 1, attachments=True),
    gsheets_append('Consigner dans Inscriptions', 'Inscriptions', {
        'Date demande': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy') }}",
        'Email parent': "={{ $('Extraire le contact').item.json.email_parent }}",
        'Nom famille': "={{ $('Extraire le contact').item.json.nom_expediteur }}",
        'Statut': 'Pack envoyé',
        'Pack envoyé le': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy') }}",
        'Relances envoyées': 0,
        'Message ID': "={{ $('Extraire le contact').item.json.message_id }}"}, 9, 1),
    node('[DOSSIER] Déplacer vers "2 - Pack envoyé"', 'n8n-nodes-base.microsoftOutlook', {
        'resource': 'message', 'operation': 'move',
        'messageId': "={{ $('Extraire le contact').item.json.message_id }}"}, 10, 1, tv=2, creds=CRED_OUTLOOK),
    journal('Journal : pack envoyé', 'A - Envoi pack', "Pack d'inscription envoyé",
            "={{ $('Extraire le contact').item.json.email_parent }}",
            '9 documents joints, depuis la boîte de la crèche', 'OK', 'automatique', 11, 1),
]
wa_conn = conn({
    '[DOSSIER] Nouveau mail "1 - Nouvelle inscription"': 'Paramètres',
    'Paramètres': 'Extraire le contact',
    'Extraire le contact': 'Chercher dans Inscriptions',
    'Chercher dans Inscriptions': 'Déjà dans le pipeline ?',
    'Déjà dans le pipeline ?': [['Journal : doublon ignoré'], ['Préparer la liste des 9 documents']],
    'Préparer la liste des 9 documents': 'Télécharger le document',
    'Télécharger le document': 'Assembler les pièces jointes',
    'Assembler les pièces jointes': 'Envoyer le pack (boîte Eden)',
    'Envoyer le pack (boîte Eden)': 'Consigner dans Inscriptions',
    'Consigner dans Inscriptions': '[DOSSIER] Déplacer vers "2 - Pack envoyé"',
    '[DOSSIER] Déplacer vers "2 - Pack envoyé"': 'Journal : pack envoyé'})
workflow_a = wf("Eden A - Envoi du pack d'inscription", wa_nodes, wa_conn)

# ===================== WORKFLOW B =====================
CLAUDE_PROMPT = (
    "Tu extrais les informations d'un dossier d'inscription en creche (documents remplis par des parents, "
    "souvent scannes ou photographies). Reponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au schema suivant :\n"
    '{"enfant": {"nom": string|null, "prenom": string|null, "naissance": "YYYY-MM-DD"|null, '
    '"entree": "YYYY-MM-DD"|null, "sortie_prevue": "YYYY-MM-DD"|null}, '
    '"mere": {"nom_prenom": string|null, "email": string|null, "tel": string|null, "profession": string|null}, '
    '"pere": {"nom_prenom": string|null, "email": string|null, "tel": string|null, "profession": string|null}, '
    '"adresse": string|null, "code_postal_ville": string|null, '
    '"pieces": {"fiche_inscription": bool, "accords_financiers_signes": bool, "autorisation_tiers": bool, '
    '"ci_parent_1": bool, "ci_parent_2": bool, "carte_assurance_sante": bool, "carnet_vaccination": bool, '
    '"composition_menage": bool}, "anomalies": [string]}\n'
    "Regles : une piece est true seulement si clairement presente. accords_financiers_signes true seulement si une signature est visible. "
    "Mets dans anomalies tout ce qui semble incoherent, illisible ou incomplet. N'invente aucune valeur.")

prep_claude_code = r'''
const item = $input.item; const bins = item.binary || {};
const content = []; let skipped = []; let totalBytes = 0;
for (const key of Object.keys(bins)) {
  const b = bins[key]; const mime = (b.mimeType || '').toLowerCase();
  const size = b.fileSize ? parseInt(b.fileSize) : (b.data ? b.data.length * 0.75 : 0);
  totalBytes += size;
  if (totalBytes > 25 * 1024 * 1024) { skipped.push(`${b.fileName} (limite de taille)`); continue; }
  const data = b.data;
  if (mime === 'application/pdf') content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } });
  else if (['image/jpeg','image/png','image/webp','image/gif'].includes(mime)) content.push({ type: 'image', source: { type: 'base64', media_type: mime, data } });
  else skipped.push(`${b.fileName || key} (format ${mime || 'inconnu'} non analysable)`);
}
content.push({ type: 'text', text: $('Paramètres').item.json.claude_prompt });
return [{ json: { skipped, claude_request: { model: '%MODEL%', max_tokens: 2000, messages: [{ role: 'user', content }] },
  email_parent: $('Chercher dans le pipeline').item.json['Email parent'],
  row_number: $('Chercher dans le pipeline').item.json.row_number }, binary: bins }];
'''.replace('%MODEL%', CLAUDE_MODEL)

validate_code = r'''
const resp = $input.item.json; let data;
try { const txt = (resp.content || []).map(c => c.text || '').join(''); data = JSON.parse(txt.replace(/^```json?\s*|\s*```$/g, '')); }
catch (e) { data = { enfant: {}, mere: {}, pere: {}, pieces: {}, anomalies: ['Extraction impossible : ' + e.message] }; }
const prev = $('Préparer la requête Claude').item.json;
const pieces = data.pieces || {};
const LIBELLES = { fiche_inscription: "fiche d'inscription completee", accords_financiers_signes: 'accords financiers signes',
  autorisation_tiers: 'autorisation de sortie avec un tiers', ci_parent_1: "carte d'identite du parent 1",
  ci_parent_2: "carte d'identite du parent 2", carte_assurance_sante: "carte d'assurance sante",
  carnet_vaccination: 'carnet de vaccination', composition_menage: 'composition de menage' };
const manquantes = Object.keys(LIBELLES).filter(k => !pieces[k]).map(k => LIBELLES[k]);
const problemes = [...(data.anomalies || []), ...(prev.skipped || [])];
const e = data.enfant || {};
if (!e.nom) problemes.push("Nom de l'enfant manquant");
if (!e.naissance) problemes.push('Date de naissance manquante');
if (!e.entree) problemes.push("Date d'entree manquante");
let entreeOK = false, section = '', ageEntreeMois = null;
if (e.entree) {
  const d = new Date(e.entree + 'T00:00:00'); entreeOK = d.getDate() === 1;
  if (!entreeOK) problemes.push(`Date d'entree ${e.entree} : les entrees se font uniquement le 1er du mois`);
  if (e.naissance) {
    const n = new Date(e.naissance + 'T00:00:00');
    ageEntreeMois = (d.getFullYear()-n.getFullYear())*12 + (d.getMonth()-n.getMonth()) - (d.getDate()<n.getDate()?1:0);
    section = ageEntreeMois < 18 ? 'ET (etage)' : (ageEntreeMois <= 36 ? 'RE (rez)' : "Trop age a l'entree !");
    if (ageEntreeMois > 36) problemes.push("Enfant de plus de 36 mois a la date d'entree");
  }
}
const complet = manquantes.length === 0 && problemes.length === 0;
const nomFamille = [data.pere?.nom_prenom, data.mere?.nom_prenom].filter(Boolean).join(' / ');
const ligne = (l, v) => `<tr><td style="padding:2px 12px 2px 0;color:#666">${l}</td><td><b>${v ?? '?'}</b></td></tr>`;
const recap = `<table style="border-collapse:collapse">
${ligne('Enfant', `${e.nom || '?'} ${e.prenom || ''}`)}
${ligne('Naissance', e.naissance)}
${ligne('Entree souhaitee', e.entree)}
${ligne("Section a l'entree", section || '?')}
${ligne("Age a l'entree", ageEntreeMois !== null ? ageEntreeMois + ' mois' : '?')}
${ligne('Mere', `${data.mere?.nom_prenom || '?'} (${data.mere?.email || '?'})`)}
${ligne('Pere', `${data.pere?.nom_prenom || '?'} (${data.pere?.email || '?'})`)}
${ligne('Adresse', `${data.adresse || '?'} ${data.code_postal_ville || ''}`)}</table>`;
const listeHtml = arr => arr.length ? '<ul>' + arr.map(x => `<li>${x}</li>`).join('') + '</ul>' : '<p>aucun</p>';
return [{ json: { extraction: data, complet, manquantes, problemes, section, ageEntreeMois,
  nom_famille: nomFamille, recap_html: recap, manquantes_html: listeHtml(manquantes), problemes_html: listeHtml(problemes),
  email_parent: prev.email_parent, row_number: prev.row_number }, binary: $input.item.binary }];
'''

numerotation_code = r'''
const rows = $input.all().map(i => i.json); let maxNum = 2200;
for (const r of rows) { const m = String(r['ID'] || '').match(/^C\d{2}-(\d{3,4})$/); if (m) maxNum = Math.max(maxNum, parseInt(m[1])); }
const num = maxNum + 1; const annee = String(new Date().getFullYear()).slice(-2); const numStr = String(num).padStart(4, '0');
const cs = (serie) => { const base = `${serie}${annee}${numStr}200`;
  const dg = String(BigInt(base) % 97n === 0n ? 97 : BigInt(base) % 97n).padStart(2, '0');
  const full = base + dg; return `+++${full.slice(0,3)}/${full.slice(3,7)}/${full.slice(7,12)}+++`; };
const v = $('Valider le dossier').item.json; const ex = v.extraction;
const nom1 = (ex.pere?.nom_prenom || '').split(' ')[0].toUpperCase();
const nom2 = (ex.mere?.nom_prenom || '').split(' ')[0].toUpperCase();
const nomDossier = [nom1, nom2].filter(Boolean).join(' - ') || (ex.enfant.nom || '').toUpperCase();
return [{ json: { id_enfant: `C${annee}-${numStr}`, cs_mensualite: cs('5'), cs_reservation: cs('9'), nom_dossier: nomDossier, ...v },
  binary: $('Valider le dossier').item.binary }];
'''

upload_pieces_code = r'''
const src = $('Numérotation et communications structurées').item; const bins = src.binary || {};
const folderId = $('Créer le dossier famille').item.json.id; const nom = src.json.nom_dossier;
return Object.keys(bins).map((key, i) => ({ json: { folderId, filename: `${src.json.id_enfant} - ${bins[key].fileName || 'document_' + i}` }, binary: { data: bins[key] } }));
'''

APPROVAL_BODY = (
    "<p>Bonjour Eden,</p><p>Un dossier d'inscription complet vient d'&ecirc;tre re&ccedil;u et v&eacute;rifi&eacute;. Voici le r&eacute;capitulatif :</p>"
    "{{ $json.recap_html }}<p><b>Pi&egrave;ces re&ccedil;ues :</b> toutes les pi&egrave;ces obligatoires sont pr&eacute;sentes.</p>"
    "<p><b>Points d'attention :</b></p>{{ $json.problemes_html }}"
    "<p>Si vous approuvez : l'enfant sera ajout&eacute; au fichier, le dossier famille cr&eacute;&eacute; dans le Drive, et la famille recevra la confirmation avec sa communication structur&eacute;e. Si vous refusez : rien ne sera modifi&eacute;.</p>")
CONFIRM_BODY = (
    "<p>Madame, Monsieur,</p><p>Nous avons bien re&ccedil;u votre dossier complet et confirmons la pr&eacute;-inscription de votre enfant.</p>"
    "<p>Pour finaliser, il reste &agrave; verser les frais de r&eacute;servation (trois mois de garde, au plus tard 4 mois pleins avant l'entr&eacute;e), "
    "sur le compte <b>KBC BE81 7410 1110 3324</b> avec la communication structur&eacute;e : "
    "<b>{{ $('Numérotation et communications structurées').item.json.cs_reservation }}</b></p>"
    "<p>Bien cordialement,<br>Eden Missioui<br>Le Jardin d'Eden</p>")
RELANCE_BODY = (
    "<p>Madame, Monsieur,</p><p>Nous avons bien re&ccedil;u votre envoi, merci. Apr&egrave;s v&eacute;rification, il manque encore :</p>"
    "{{ $json.manquantes_html }}{{ $json.problemes.length ? '<p>Points a corriger :</p>' + $json.problemes_html : '' }}"
    "<p>Merci de nous renvoyer ces &eacute;l&eacute;ments par retour de mail.</p><p>Bien cordialement,<br>Eden Missioui<br>Le Jardin d'Eden</p>")

wb_nodes = [
    sticky(STAGING_NOTE, 0, -1),
    sticky('## Validation d\'Eden\nLe node "Validation Eden" utilise Send and Wait d\'Outlook (boutons Approuver/Refuser dans l\'email, reponse via webhook n8n). Delai max 7 jours.', 8, -1),
    node('Nouveau mail avec pièces jointes', 'n8n-nodes-base.microsoftOutlookTrigger',
         {'pollTimes': {'item': [{'mode': 'everyX', 'value': 5, 'unit': 'minutes'}]}, 'output': 'raw', 'filters': {}},
         0, 0, tv=1, creds=CRED_OUTLOOK),
    parametres_node(1),
    node('Filtrer : PJ + expéditeur externe', 'n8n-nodes-base.code', {'mode': 'runOnceForEachItem', 'jsCode':
        r'''const m = $input.item.json; const from = (m.from?.emailAddress?.address || '').toLowerCase().trim();
const interne = ['uccle@jardindeden.be','info@lucid-lab.fr'];
if (!m.hasAttachments || !from || interne.includes(from)) return [];
return [{ json: { email_parent: from, message_id: m.id, sujet: m.subject || '' } }];'''}, 2, 0, tv=2),
    gsheets_read('Chercher dans le pipeline', 'Inscriptions', 3, 0, 'Email parent', '={{ $json.email_parent }}'),
    node('Dossier en cours ?', 'n8n-nodes-base.if', {
        'conditions': {'options': {'caseSensitive': False, 'typeValidation': 'loose', 'version': 2}, 'combinator': 'and',
                       'conditions': [
                           {'leftValue': '={{ $json.row_number }}', 'rightValue': '',
                            'operator': {'type': 'string', 'operation': 'notEmpty', 'singleValue': True}},
                           {'leftValue': "={{ ['Pack envoyé','Docs incomplets','Demande reçue','En validation'].includes($json['Statut']) }}",
                            'rightValue': 'true', 'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}]}}, 4, 0, tv=2.2),
    node('Télécharger les pièces jointes', 'n8n-nodes-base.microsoftOutlook', {
        'resource': 'messageAttachment', 'operation': 'getAll',
        'messageId': "={{ $('Filtrer : PJ + expéditeur externe').item.json.message_id }}",
        'returnAll': True, 'options': {'downloadAttachments': True}}, 5, 0, tv=2, creds=CRED_OUTLOOK),
    node('Regrouper les binaires', 'n8n-nodes-base.code', {'mode': 'runOnceForAllItems', 'jsCode':
        r'''const items = $input.all(); const binary = {};
items.forEach((it, i) => { for (const k of Object.keys(it.binary || {})) binary[`piece_${i}_${k}`] = it.binary[k]; });
return [{ json: {}, binary }];'''}, 6, 0, tv=2),
    node('Préparer la requête Claude', 'n8n-nodes-base.code', {'mode': 'runOnceForEachItem', 'jsCode': prep_claude_code}, 7, 0, tv=2),
    node('Claude : extraction du dossier', 'n8n-nodes-base.httpRequest', {
        'method': 'POST', 'url': 'https://api.anthropic.com/v1/messages',
        'authentication': 'predefinedCredentialType', 'nodeCredentialType': 'anthropicApi',
        'sendHeaders': True, 'headerParameters': {'parameters': [{'name': 'anthropic-version', 'value': '2023-06-01'}]},
        'sendBody': True, 'specifyBody': 'json', 'jsonBody': '={{ JSON.stringify($json.claude_request) }}',
        'options': {'timeout': 120000}}, 8, 0, tv=4.2, creds=CRED_ANTHROPIC),
    node('Valider le dossier', 'n8n-nodes-base.code', {'mode': 'runOnceForEachItem', 'jsCode': validate_code}, 9, 0, tv=2),
    node('Dossier complet ?', 'n8n-nodes-base.if', {
        'conditions': {'options': {'caseSensitive': True, 'typeValidation': 'loose', 'version': 2}, 'combinator': 'and',
                       'conditions': [{'leftValue': '={{ $json.complet }}', 'rightValue': 'true',
                                       'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}]}}, 10, 0, tv=2.2),
    # incomplet
    outlook_send('Relance au parent (pièces manquantes)', dest("$json.email_parent"),
                 "Le Jardin d'Eden : votre dossier d'inscription est incomplet", '=' + RELANCE_BODY, 11, 2, cc=DEST_EDEN),
    gsheets_update('MAJ Inscriptions : incomplet', 'Inscriptions', {
        'Statut': 'Docs incomplets',
        'Pièces manquantes': '={{ $("Valider le dossier").item.json.manquantes.join(", ") }}',
        'Docs reçus le': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy') }}",
        'Dernière relance': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy') }}"}, 12, 2),
    journal('Journal : dossier incomplet', 'B - Retour docs', 'Relance pièces manquantes envoyée',
            '={{ $("Valider le dossier").item.json.nom_famille || $("Valider le dossier").item.json.email_parent }}',
            '={{ "Manquantes : " + $("Valider le dossier").item.json.manquantes.join(", ") }}', 'Relance', 'automatique', 13, 2),
    # validation Eden
    gsheets_update('MAJ Inscriptions : en validation', 'Inscriptions', {
        'Statut': 'En validation',
        'Docs reçus le': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy') }}",
        'Pièces manquantes': ''}, 11, 0),
    node('Validation Eden (Approuver / Refuser)', 'n8n-nodes-base.microsoftOutlook', {
        'resource': 'message', 'operation': 'sendAndWait', 'toRecipients': DEST_EDEN,
        'subject': "=Validation : inscription {{ $('Valider le dossier').item.json.extraction.enfant.prenom }} {{ $('Valider le dossier').item.json.extraction.enfant.nom }}",
        'message': '=' + APPROVAL_BODY.replace('$json', "$('Valider le dossier').item.json"),
        'responseType': 'approval', 'approvalOptions': {'values': {'approvalType': 'double'}},
        'options': {'limitWaitTime': {'values': {'resumeUnit': 'days', 'resumeAmount': 7}}}}, 12, 0, tv=2, creds=CRED_OUTLOOK),
    node('Approuvé ?', 'n8n-nodes-base.if', {
        'conditions': {'options': {'caseSensitive': True, 'typeValidation': 'loose', 'version': 2}, 'combinator': 'and',
                       'conditions': [{'leftValue': '={{ $json.data && $json.data.approved }}', 'rightValue': 'true',
                                       'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}]}}, 13, 0, tv=2.2),
    # refuse
    journal('Journal : refusé par Eden', 'B - Retour docs', 'Inscription REFUSÉE (aucune modification)',
            '={{ $("Valider le dossier").item.json.nom_famille }}', 'Voir email de validation', 'Refusé', 'Eden', 14, 2),
    outlook_send('Notifier Lucid du refus', dest("$('Paramètres').item.json.email_lucid"),
                 '=Jardin d\'Eden : inscription refusée ({{ $("Valider le dossier").item.json.nom_famille }})',
                 '<p>Eden a refusé la validation. Aucune modification appliquée. Voir le Journal.</p>', 15, 2),
    # approuve
    gsheets_read('Lire Enfants (numérotation)', 'Enfants', 14, 0),
    node('Numérotation et communications structurées', 'n8n-nodes-base.code', {'mode': 'runOnceForAllItems', 'jsCode': numerotation_code}, 15, 0, tv=2),
    gsheets_append("Ajouter l'enfant au fichier", 'Enfants', {
        'ID': '={{ $json.id_enfant }}', 'Nom dossier': '={{ $json.nom_dossier }}',
        'Nom père': "={{ ($json.extraction.pere?.nom_prenom || '').split(' ')[0].toUpperCase() }}",
        'Nom mère': "={{ ($json.extraction.mere?.nom_prenom || '').split(' ')[0].toUpperCase() }}",
        'Prénom': '={{ $json.extraction.enfant.prenom }}',
        'Naissance': "={{ $json.extraction.enfant.naissance ? $json.extraction.enfant.naissance.split('-').reverse().join('/') : '' }}",
        'Entrée': "={{ $json.extraction.enfant.entree ? $json.extraction.enfant.entree.split('-').reverse().join('/') : '' }}",
        'Sortie attestation': "={{ $json.extraction.enfant.sortie_prevue ? $json.extraction.enfant.sortie_prevue.split('-').reverse().join('/') : '' }}",
        'Groupe': '', 'Mensualité contrat': 1199,
        'CS mensualité': '={{ $json.cs_mensualite }}', 'CS réservation': '={{ $json.cs_reservation }}',
        'Mail parent 1': '={{ $json.extraction.mere?.email }}', 'Mail parent 2': '={{ $json.extraction.pere?.email }}',
        'Adresse': '={{ $json.extraction.adresse }}', 'Code postal': '={{ $json.extraction.code_postal_ville }}',
        'Tel parent 1': '={{ $json.extraction.mere?.tel }}', 'Tel parent 2': '={{ $json.extraction.pere?.tel }}',
        'Statut données': 'Nouveau (n8n)'}, 16, 0),
    node('Créer le dossier famille', 'n8n-nodes-base.googleDrive', {
        'resource': 'folder', 'operation': 'create',
        'name': "={{ $('Numérotation et communications structurées').item.json.nom_dossier }} {{ $('Numérotation et communications structurées').item.json.extraction.enfant.prenom }}",
        'driveId': {'__rl': True, 'value': 'My Drive', 'mode': 'list'},
        'folderId': {'__rl': True, 'value': FAMILLES_FOLDER_ID, 'mode': 'id'}, 'options': {}}, 17, 0, tv=3, creds=CRED_GDRIVE),
    node('Préparer les pièces à classer', 'n8n-nodes-base.code', {'mode': 'runOnceForAllItems', 'jsCode': upload_pieces_code}, 18, 0, tv=2),
    node('Classer la pièce dans le Drive', 'n8n-nodes-base.googleDrive', {
        'resource': 'file', 'operation': 'upload', 'inputDataFieldName': 'data', 'name': '={{ $json.filename }}',
        'driveId': {'__rl': True, 'value': 'My Drive', 'mode': 'list'},
        'folderId': {'__rl': True, 'value': '={{ $json.folderId }}', 'mode': 'id'}, 'options': {}}, 19, 0, tv=3, creds=CRED_GDRIVE),
    outlook_send('Confirmation au parent (CS réservation)', dest("$('Valider le dossier').item.json.email_parent"),
                 "Le Jardin d'Eden : dossier validé, réservation de la place", '=' + CONFIRM_BODY, 20, 0, cc=DEST_EDEN),
    gsheets_update('MAJ Inscriptions : inscrit', 'Inscriptions', {
        'Statut': 'Inscrit',
        'Validé par Eden le': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy') }}",
        'ID Enfants': "={{ $('Numérotation et communications structurées').item.json.id_enfant }}"}, 21, 0),
    journal('Journal : inscription validée', 'B - Retour docs', 'Enfant ajouté + dossier Drive créé + confirmation envoyée',
            "={{ $('Numérotation et communications structurées').item.json.nom_dossier }}",
            "={{ 'ID ' + $('Numérotation et communications structurées').item.json.id_enfant + ' | CS réservation ' + $('Numérotation et communications structurées').item.json.cs_reservation }}",
            'OK', 'Eden (email)', 22, 0),
]
wb_conn = conn({
    'Nouveau mail avec pièces jointes': 'Paramètres',
    'Paramètres': 'Filtrer : PJ + expéditeur externe',
    'Filtrer : PJ + expéditeur externe': 'Chercher dans le pipeline',
    'Chercher dans le pipeline': 'Dossier en cours ?',
    'Dossier en cours ?': [['Télécharger les pièces jointes'], []],
    'Télécharger les pièces jointes': 'Regrouper les binaires',
    'Regrouper les binaires': 'Préparer la requête Claude',
    'Préparer la requête Claude': 'Claude : extraction du dossier',
    'Claude : extraction du dossier': 'Valider le dossier',
    'Valider le dossier': 'Dossier complet ?',
    'Dossier complet ?': [['MAJ Inscriptions : en validation'], ['Relance au parent (pièces manquantes)']],
    'Relance au parent (pièces manquantes)': 'MAJ Inscriptions : incomplet',
    'MAJ Inscriptions : incomplet': 'Journal : dossier incomplet',
    'MAJ Inscriptions : en validation': 'Validation Eden (Approuver / Refuser)',
    'Validation Eden (Approuver / Refuser)': 'Approuvé ?',
    'Approuvé ?': [['Lire Enfants (numérotation)'], ['Journal : refusé par Eden']],
    'Journal : refusé par Eden': 'Notifier Lucid du refus',
    'Lire Enfants (numérotation)': 'Numérotation et communications structurées',
    'Numérotation et communications structurées': "Ajouter l'enfant au fichier",
    "Ajouter l'enfant au fichier": 'Créer le dossier famille',
    'Créer le dossier famille': 'Préparer les pièces à classer',
    'Préparer les pièces à classer': 'Classer la pièce dans le Drive',
    'Classer la pièce dans le Drive': 'Confirmation au parent (CS réservation)',
    'Confirmation au parent (CS réservation)': 'MAJ Inscriptions : inscrit',
    'MAJ Inscriptions : inscrit': 'Journal : inscription validée'})
for n in wb_nodes:
    if n['name'] == 'Paramètres':
        raw = json.loads(n['parameters']['jsonOutput']); raw['claude_prompt'] = CLAUDE_PROMPT
        n['parameters']['jsonOutput'] = json.dumps(raw, ensure_ascii=False)
workflow_b = wf('Eden B - Retour de documents et validation', wb_nodes, wb_conn)

# ===================== WORKFLOW C =====================
relances_code = r'''
const params = $('Paramètres').item.json;
const rows = $input.all().map(i => i.json).filter(r => r['Email parent']);
const today = new Date(); today.setHours(0,0,0,0);
const parseFR = s => { if (!s) return null; const m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? new Date(+m[3], +m[2]-1, +m[1]) : null; };
const days = (a, b) => Math.floor((b - a) / 86400000);
const out = [];
for (const r of rows) {
  const statut = r['Statut']; const relances = parseInt(r['Relances envoyées'] || 0);
  const derniere = parseFR(r['Dernière relance']) || parseFR(r['Pack envoyé le']);
  const famille = r['Nom famille'] || r['Email parent'];
  if (statut === 'Pack envoyé' && relances < 2) {
    const ref = parseFR(r['Pack envoyé le']);
    if (ref && days(derniere || ref, today) >= 7) out.push({ type: 'pack', to: r['Email parent'], famille, row_number: r.row_number, relances,
      sujet: "Le Jardin d'Eden : votre dossier d'inscription",
      corps: `<p>Madame, Monsieur,</p><p>Nous vous avons transmis le dossier d'inscription il y a quelques jours et restons dans l'attente de votre retour. Souhaitez-vous toujours reserver une place ?</p><p>Bien cordialement,<br>Eden Missioui<br>Le Jardin d'Eden</p>` });
  }
  if (statut === 'Docs incomplets' && relances < 3) {
    const seuil = relances === 0 ? 3 : 7;
    if (derniere && days(derniere, today) >= seuil) out.push({ type: 'pieces', to: r['Email parent'], famille, row_number: r.row_number, relances,
      sujet: "Le Jardin d'Eden : pieces manquantes pour votre dossier",
      corps: `<p>Madame, Monsieur,</p><p>Petit rappel : il manque encore pour completer votre dossier :</p><p><b>${r['Pièces manquantes'] || 'voir notre precedent message'}</b></p><p>Merci de nous les renvoyer par retour de mail.</p><p>Bien cordialement,<br>Eden Missioui<br>Le Jardin d'Eden</p>` });
  }
  if ((statut === 'Pack envoyé' && relances >= 2) || (statut === 'Docs incomplets' && relances >= 3)) {
    out.push({ type: 'escalade', to: params.email_eden, famille, row_number: r.row_number, relances,
      sujet: `Jardin d'Eden : dossier ${famille} sans reponse apres relances`,
      corps: `<p>Bonjour Eden,</p><p>Le dossier <b>${famille}</b> (${r['Email parent']}) est au statut "${statut}" apres ${relances} relances automatiques. L'automatisation ne relancera plus : a traiter manuellement.</p><p><a href="${params.sheet_url}">Ouvrir le tableau</a></p>` });
  }
}
return out.map(o => ({ json: o }));
'''
wc_nodes = [
    sticky(STAGING_NOTE, 0, -1),
    node('Tous les jours à 7h30', 'n8n-nodes-base.scheduleTrigger',
         {'rule': {'interval': [{'field': 'days', 'triggerAtHour': 7, 'triggerAtMinute': 30}]}}, 0, 0, tv=1.2),
    parametres_node(1),
    gsheets_read('Lire les Inscriptions', 'Inscriptions', 2, 0),
    node('Calculer les relances dues', 'n8n-nodes-base.code', {'mode': 'runOnceForAllItems', 'jsCode': relances_code}, 3, 0, tv=2),
    outlook_send('Envoyer la relance (boîte Eden)', dest('$json.to'), '={{ $json.sujet }}', '={{ $json.corps }}', 4, 0,
                 cc="={{ $json.type === 'escalade' ? '' : ($('Paramètres').item.json.staging ? '' : $('Paramètres').item.json.email_eden) }}"),
    gsheets_update('MAJ compteur de relances', 'Inscriptions', {
        'Dernière relance': "={{ $now.setZone('Europe/Brussels').toFormat('dd/MM/yyyy') }}",
        'Relances envoyées': "={{ $json.type === 'escalade' ? $json.relances : $json.relances + 1 }}"}, 5, 0),
    journal('Journal : relance', 'C - Relances', "={{ 'Relance ' + $('Calculer les relances dues').item.json.type }}",
            "={{ $('Calculer les relances dues').item.json.famille }}",
            "={{ 'Envoyée à ' + $('Calculer les relances dues').item.json.to }}", 'OK', 'automatique', 6, 0),
]
wc_conn = conn({
    'Tous les jours à 7h30': 'Paramètres',
    'Paramètres': 'Lire les Inscriptions',
    'Lire les Inscriptions': 'Calculer les relances dues',
    'Calculer les relances dues': 'Envoyer la relance (boîte Eden)',
    'Envoyer la relance (boîte Eden)': 'MAJ compteur de relances',
    'MAJ compteur de relances': 'Journal : relance'})
workflow_c = wf('Eden C - Relances quotidiennes', wc_nodes, wc_conn)

for fname, w in [('eden-a-envoi-pack.json', workflow_a), ('eden-b-retour-docs.json', workflow_b), ('eden-c-relances.json', workflow_c)]:
    path = os.path.join(OUT_DIR, fname)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(w, f, ensure_ascii=False, indent=2)
    print('OK', path, os.path.getsize(path)//1024, 'Ko,', len(w['nodes']), 'nodes')
