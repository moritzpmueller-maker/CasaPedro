/* ──────────────────────────────────────────────────────────────────────────
   Casa Pedro – Speisekarten-Renderer
   Baut aus content.json → speisekarte das HTML der Karte und des Sprungmenüs.

   Wird an zwei Stellen benutzt:
     1. tools/render-menu.js (Node) beim Deploy, erzeugt statisches HTML
     2. main.js im Browser als Fallback, falls das HTML noch leer ist
   Deshalb kein import/export, sondern globals + optionales module.exports.
   ────────────────────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function preis(p) {
    return esc(p) + '&nbsp;€';
  }

  function allergen(code) {
    return code ? ' <span class="allergen">(' + esc(code) + ')</span>' : '';
  }

  function vegBadge(on) {
    return on ? ' <span class="veg-badge" title="vegetarisch">vegetarisch</span>' : '';
  }

  /* ── einzelne Eintragstypen ──────────────────────────────────────────── */

  function rowGericht(e) {
    var desc = esc(e.beschreibung_de) + allergen(e.allergene);
    if (e.beschreibung_en) {
      desc += (desc ? ' · ' : '') + esc(e.beschreibung_en);
    }
    var preisHtml = e.preis_zweit
      ? '<p class="menu-row-price-split">' + preis(e.preis) + ' / ' + preis(e.preis_zweit) + '</p>'
      : '<p class="menu-row-price">' + preis(e.preis) + '</p>';
    return '<div class="menu-row"><div class="menu-row-info">' +
      '<p class="menu-row-name">' + esc(e.name) + vegBadge(e.vegetarisch) + '</p>' +
      (desc ? '<p class="menu-row-desc">' + desc + '</p>' : '') +
      '</div>' + preisHtml + '</div>';
  }

  function rowGetraenk(e) {
    var vol = e.menge ? ' <span class="menu-row-bev-vol">' + esc(e.menge) + '</span>' : '';
    return '<div class="menu-row-beverage">' +
      '<span class="menu-row-bev-name">' + esc(e.name) + allergen(e.allergene) + vol + '</span>' +
      '<span class="menu-row-bev-price">' + preis(e.preis) + '</span></div>';
  }

  function rowWein(e) {
    var preise = (e.preise || []).map(function (p) {
      return '<div class="wine-price-pair">' +
        '<span class="menu-row-wine-price">' + preis(p.preis) + '</span>' +
        '<span class="menu-row-wine-vol">· ' + esc(p.menge) + '</span></div>';
    }).join('');
    return '<div class="menu-row" style="align-items:flex-start;"><div class="menu-row-info">' +
      '<p class="menu-row-name">' + esc(e.name) + allergen(e.allergene) + '</p>' +
      (e.beschreibung_de ? '<p class="menu-wine-desc">' + esc(e.beschreibung_de) + '</p>' : '') +
      '</div><div class="menu-row-wine-prices">' + preise + '</div></div>';
  }

  function rowUeberschrift(e) {
    return '<p class="menu-drinks-subheading">' + esc(e.text) + '</p>';
  }

  function renderEintrag(e) {
    switch (e.typ) {
      case 'gericht':      return rowGericht(e);
      case 'getraenk':     return rowGetraenk(e);
      case 'wein':         return rowWein(e);
      case 'ueberschrift': return rowUeberschrift(e);
      default:             return '';
    }
  }

  /* ── Sektion ─────────────────────────────────────────────────────────── */

  function sectionTitle(sec) {
    var parts = [];
    if (sec.titel_es) parts.push('<span class="lang-es">' + esc(sec.titel_es) + '</span>');
    if (sec.titel_de) parts.push('<span class="lang-de">' + esc(sec.titel_de) + '</span>');
    if (sec.titel_en) parts.push('<span class="lang-en">' + esc(sec.titel_en) + '</span>');
    return '<h3 class="menu-section-title">' +
      parts.join('<span class="lang-sep">·</span>') + '</h3>';
  }

  function renderSection(sec) {
    var eintraege = sec.eintraege || [];
    var body;

    if (sec.layout === 'zweispaltig') {
      var links = [], rechts = [], ziel = links;
      eintraege.forEach(function (e) {
        if (e.typ === 'spaltenwechsel') { ziel = rechts; return; }
        ziel.push(renderEintrag(e));
      });
      body = '<div class="menu-drinks-cols"><div>' + links.join('') +
             '</div><div>' + rechts.join('') + '</div></div>';
    } else {
      body = eintraege.filter(function (e) { return e.typ !== 'spaltenwechsel'; })
                      .map(renderEintrag).join('');
    }

    return '<div class="menu-section">' +
      '<div id="menu-' + esc(sec.id) + '" class="menu-anchor"></div>' +
      sectionTitle(sec) + body + '</div>';
  }

  /* ── öffentliche Bauer ───────────────────────────────────────────────── */

  var SEP = '<div class="menu-section-sep" aria-hidden="true">' +
            '<div class="menu-section-sep-diamond"></div></div>';

  function buildMenu(sections) {
    if (!Array.isArray(sections)) return '';
    return sections.map(renderSection).join(SEP);
  }

  function buildSubnav(sections) {
    if (!Array.isArray(sections)) return '';
    return sections.map(function (sec) {
      var id = 'menu-' + sec.id;
      return '<a href="#' + esc(id) + '" class="menu-subnav-link" onclick="menuNavClick(\'' +
        esc(id) + '\'); return false;"><span class="menu-subnav-dot"></span>' +
        '<span class="menu-subnav-label">' + esc(sec.nav_label || sec.titel_de || sec.titel_es) +
        '</span></a>';
    }).join('');
  }

  var api = { buildMenu: buildMenu, buildSubnav: buildSubnav };
  root.CasaPedroMenu = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
