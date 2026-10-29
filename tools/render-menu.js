#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
   Baut die Speisekarte aus content.json in index.html ein.
   Läuft im Deploy-Workflow, bevor per FTP hochgeladen wird, damit die Karte
   als statisches HTML ausgeliefert wird (SEO, kein JavaScript nötig).

   Aufruf:  node tools/render-menu.js [verzeichnis]
   ────────────────────────────────────────────────────────────────────────── */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || process.cwd());
const { buildMenu, buildSubnav } = require(path.join(root, 'menu-render.js'));

const indexPfad = path.join(root, 'index.html');
const contentPfad = path.join(root, 'content.json');

const content = JSON.parse(fs.readFileSync(contentPfad, 'utf8'));
const sections = content.speisekarte;

if (!Array.isArray(sections) || sections.length === 0) {
  console.error('FEHLER: content.json enthält keine speisekarte. Abbruch.');
  process.exit(1);
}

let html = fs.readFileSync(indexPfad, 'utf8');

function ersetze(quelle, marker, inhalt) {
  const start = `<!--${marker}-START-->`;
  const ende = `<!--${marker}-END-->`;
  const i = quelle.indexOf(start);
  const j = quelle.indexOf(ende);
  if (i === -1 || j === -1 || j < i) {
    console.error(`FEHLER: Marker ${marker} fehlt in index.html. Abbruch.`);
    process.exit(1);
  }
  return quelle.slice(0, i + start.length) + '\n' + inhalt + '\n' + quelle.slice(j);
}

html = ersetze(html, 'MENU', buildMenu(sections));
html = ersetze(html, 'SUBNAV', buildSubnav(sections));

fs.writeFileSync(indexPfad, html, 'utf8');

const positionen = sections.reduce(
  (n, s) => n + (s.eintraege || []).filter(e =>
    e.typ === 'gericht' || e.typ === 'getraenk' || e.typ === 'wein').length, 0);

console.log(`Speisekarte gerendert: ${sections.length} Sektionen, ${positionen} Positionen.`);
