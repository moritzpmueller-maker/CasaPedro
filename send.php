<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Nur POST erlaubt');
}

// Spam-Falle: ausgefuellt heisst Bot
if (!empty($_POST['bot-field'])) {
    http_response_code(200);
    exit('OK');
}

function feld($key) {
    return trim(strip_tags($_POST[$key] ?? ''));
}

$name     = feld('name');
$email    = feld('email');
$telefon  = feld('telefon');
$personen = feld('personen');
$datum    = feld('datum');
$uhrzeit  = feld('uhrzeit');
$hinweise = feld('hinweise');

if ($name === '' || $email === '' || $personen === '' || $datum === '' || $uhrzeit === '') {
    http_response_code(400);
    exit('Pflichtfelder fehlen');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit('E-Mail ungueltig');
}
if (preg_match("/[\r\n]/", $name . $email)) {
    http_response_code(400);
    exit('Ungueltige Eingabe');
}

$an       = 'restaurant@casa-pedro.de';
$absender = 'noreply@casa-pedro.de';
$betreff  = 'Neue Tischreservierung: ' . $name . ' am ' . $datum;

$text = "Neue Reservierungsanfrage ueber casa-pedro.de\n\n"
      . "Name:      $name\n"
      . "E-Mail:    $email\n"
      . "Telefon:   " . ($telefon !== '' ? $telefon : '-') . "\n"
      . "Personen:  $personen\n"
      . "Datum:     $datum\n"
      . "Uhrzeit:   $uhrzeit\n"
      . "Hinweise:  " . ($hinweise !== '' ? $hinweise : '-') . "\n";

$header  = "From: Casa Pedro Website <$absender>\r\n";
$header .= "Reply-To: $name <$email>\r\n";
$header .= "MIME-Version: 1.0\r\n";
$header .= "Content-Type: text/plain; charset=UTF-8\r\n";

$ok = mail(
    $an,
    '=?UTF-8?B?' . base64_encode($betreff) . '?=',
    $text,
    $header,
    '-f ' . $absender
);

http_response_code($ok ? 200 : 500);
echo $ok ? 'OK' : 'Versand fehlgeschlagen';