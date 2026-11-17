<?php
/**
 * Formulaire de contact DAVYCAS (hébergement LWS, fonction mail()).
 * Anti-spam : champ piège + durée minimale de saisie (mesurée par le navigateur) + 5 envois / heure / IP.
 * Réponse JSON pour le script du site ; sans JavaScript, redirection vers la page Contact avec ?envoi=ok|erreur.
 * À FAIRE VALIDER : adresse de réception (DESTINATAIRE).
 */
declare(strict_types=1);

const DESTINATAIRE = 'contact@davycas.com';
const EXPEDITEUR = 'site@davycas.com';
const DUREE_MIN = 3;
const MAX_PAR_HEURE = 5;

$json = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
$en = ($_POST['langue'] ?? '') === 'en';
function fin(bool $ok, string $code = ''): void {
    global $json, $en;
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['ok' => $ok, 'error' => $code]);
    } else {
        header('Location: ' . ($en ? '/en' : '') . '/contact.html?envoi=' . ($ok ? 'ok' : 'erreur') . '#formulaire', true, 303);
    }
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fin(false, 'method');
if (!empty($_POST['site_web'])) fin(true);                       // robot : on fait comme si
if (isset($_POST['duree']) && (int)$_POST['duree'] < DUREE_MIN) fin(false, 'too-fast');

$cle = sys_get_temp_dir() . '/davycas-contact-' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __FILE__);
$traces = array_filter(array_map('intval', @file($cle, FILE_IGNORE_NEW_LINES) ?: []), fn($t) => $t > time() - 3600);
if (count($traces) >= MAX_PAR_HEURE) fin(false, 'rate-limit');

$ligne = fn(string $v, int $max) => trim(mb_substr(str_replace(["\r", "\n", "\0"], ' ', $v), 0, $max));
$prenom = $ligne((string)($_POST['prenom'] ?? ''), 80);
$nom = $ligne((string)($_POST['nom'] ?? ''), 80);
$email = filter_var(trim((string)($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$organisation = $ligne((string)($_POST['organisation'] ?? ''), 160);
$objets = ['partenariat' => 'Partenariat', 'projet' => 'Projet terrain', 'information' => "Demande d'information", 'collaboration' => 'Collaboration technique', 'don' => 'Don / Soutien', 'autre' => 'Autre'];
$objet = $objets[$_POST['objet'] ?? ''] ?? '';
$message = trim(mb_substr(str_replace("\0", '', (string)($_POST['message'] ?? '')), 0, 5000));
if ($prenom === '' || $nom === '' || !$email || $objet === '' || mb_strlen($message) < 20 || ($_POST['consentement'] ?? '') !== 'oui') fin(false, 'invalid');

$sujet = mb_encode_mimeheader("[Site DAVYCAS] $objet — $prenom $nom", 'UTF-8');
$corps = wordwrap("Nouveau message reçu depuis davycas.com\n\nNom : $prenom $nom\nE-mail : $email\nOrganisation : " . ($organisation ?: '—') . "\nObjet : $objet\nLangue : " . ($en ? 'EN' : 'FR') . "\n\nMessage :\n$message\n", 900, "\n", true);
$entetes = implode("\r\n", ['From: DAVYCAS International <' . EXPEDITEUR . '>', 'Reply-To: ' . $email, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit']);
if (!mail(DESTINATAIRE, $sujet, $corps, $entetes, '-f' . EXPEDITEUR)) fin(false, 'mail');
$traces[] = time();
@file_put_contents($cle, implode("\n", $traces));
fin(true);
