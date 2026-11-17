<?php
/**
 * Envoi du formulaire de contact (hébergement LWS, PHP mail()).
 * Anti-spam : champ piège (honeypot) + délai minimal de saisie + limitation par adresse IP.
 * Répond en JSON au script du site ; sans JavaScript, redirige vers la page Contact.
 *
 * À CONFIGURER : l'adresse de réception (constante DESTINATAIRE) doit être validée par DAVYCAS.
 */
declare(strict_types=1);

const DESTINATAIRE = 'contact@davycas.com';
const EXPEDITEUR = 'site@davycas.com';     // adresse du domaine, pour respecter le SPF de LWS
const DELAI_MIN_SECONDES = 3;
const MAX_ENVOIS_PAR_HEURE = 5;

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
function repondre(bool $ok, string $erreur = ''): void {
    global $wantsJson;
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['ok' => $ok, 'error' => $erreur], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: /contact/?envoi=' . ($ok ? 'ok' : 'erreur'), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') repondre(false, 'Méthode non autorisée');

// 1. Champ piège : un robot le remplit, un humain ne le voit pas
if (!empty($_POST['site_web'])) repondre(true);

// 2. Délai minimal entre l'affichage et l'envoi
$t = (int)($_POST['t'] ?? 0);
if ($t > 0 && (time() - intdiv($t, 1000)) < DELAI_MIN_SECONDES) repondre(false, 'Envoi trop rapide');

// 3. Limitation simple par IP (fichier temporaire)
$ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __FILE__);
$fichier = sys_get_temp_dir() . '/davycas-contact-' . $ip;
$horodatages = array_filter(array_map('intval', @file($fichier, FILE_IGNORE_NEW_LINES) ?: []), fn($h) => $h > time() - 3600);
if (count($horodatages) >= MAX_ENVOIS_PAR_HEURE) repondre(false, 'Trop de messages, réessayez plus tard');

// 4. Validation
$propre = fn(string $v, int $max) => trim(mb_substr(str_replace(["\r", "\n", "\0"], ' ', $v), 0, $max));
$nom = $propre((string)($_POST['nom'] ?? ''), 120);
$email = filter_var(trim((string)($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$organisation = $propre((string)($_POST['organisation'] ?? ''), 160);
$objets = ['partenariat', 'projet', 'stelab', 'rapports', 'soutien', 'candidature', 'autre'];
$objet = in_array($_POST['objet'] ?? '', $objets, true) ? $_POST['objet'] : '';
$message = trim(mb_substr(str_replace("\0", '', (string)($_POST['message'] ?? '')), 0, 5000));
$consentement = ($_POST['consentement'] ?? '') === 'oui';

if ($nom === '' || !$email || $objet === '' || mb_strlen($message) < 20 || !$consentement) {
    repondre(false, 'Formulaire incomplet');
}

// 5. Envoi
$sujet = '=?UTF-8?B?' . base64_encode("[Site DAVYCAS] $objet — $nom") . '?=';
$corps = "Nouveau message depuis davycas.com\n\n"
    . "Nom : $nom\nE-mail : $email\nOrganisation : " . ($organisation ?: '—') . "\nObjet : $objet\n\n"
    . "Message :\n$message\n";
$entetes = implode("\r\n", [
    'From: DAVYCAS International <' . EXPEDITEUR . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$envoye = mail(DESTINATAIRE, $sujet, $corps, $entetes, '-f' . EXPEDITEUR);
if (!$envoye) repondre(false, 'Le serveur de messagerie n’a pas accepté le message');

$horodatages[] = time();
@file_put_contents($fichier, implode("\n", $horodatages));
repondre(true);
