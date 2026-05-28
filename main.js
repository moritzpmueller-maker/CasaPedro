    // Disable browser scroll restoration so refresh always lands at top
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.addEventListener('load', function() {
      window.scrollTo(0, 0);
    });

    function goTo(page, anchor) {
      closeNavMenu();
      document.querySelectorAll('.page').forEach(function(p) {
        p.style.display = 'none';
      });
      var el = document.getElementById('page-' + page);
      if (el) el.style.display = 'block';
      var subnav = document.getElementById('menu-subnav-fixed');
      if (subnav) subnav.style.display = page === 'speisekarte' ? 'flex' : 'none';
      // Wait for reflow after display:block before resetting scroll
      requestAnimationFrame(function() {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (anchor) {
          setTimeout(function() {
            var target = document.querySelector(anchor);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        }
      });
    }

    // ── Mobile nav ──────────────────────────────────────────
    function toggleNav() {
      var nav = document.querySelector('nav');
      var isOpen = nav.classList.toggle('nav-open');
      document.documentElement.classList.toggle('nav-is-open', isOpen);
    }
    function closeNavMenu() {
      document.querySelector('nav').classList.remove('nav-open');
      document.documentElement.classList.remove('nav-is-open');
    }

    // ── Speisekarte sub-nav ─────────────────────────────────────
    function menuNavClick(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update active immediately on click
      document.querySelectorAll('.menu-subnav-link').forEach(function(a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
      });
    }

    // Scrollspy via IntersectionObserver
    (function() {
      var sectionIds = [
        'menu-ensaladas','menu-entremeses-frios','menu-entremeses-calientes',
        'menu-sopas','menu-pescados','menu-carnes','menu-pollo',
        'menu-especialidades','menu-postres','menu-bebidas-calientes',
        'menu-bebidas','menu-vinos'
      ];

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            document.querySelectorAll('.menu-subnav-link').forEach(function(a) {
              a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
            });
          }
        });
      }, {
        rootMargin: '-72px 0px -60% 0px',
        threshold: 0
      });

      function startScrollspy() {
        observer.disconnect();
        sectionIds.forEach(function(id) {
          var el = document.getElementById(id);
          if (el) observer.observe(el);
        });
      }

      function stopScrollspy() {
        observer.disconnect();
        document.querySelectorAll('.menu-subnav-link').forEach(function(a) {
          a.classList.remove('is-active');
        });
      }

      // Hook into goTo to start/stop based on active page
      var origGoTo = window.goTo;
      window.goTo = function(page, anchor) {
        origGoTo(page, anchor);
        if (page === 'speisekarte') {
          setTimeout(startScrollspy, 100);
        } else {
          stopScrollspy();
        }
      };
    })();

    // ── Content-Loader (content.json) ───────────────────────────────────────
    function loadContent() {
      fetch('content.json')
        .then(function(res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function(data) {
          renderOeffnungszeiten(data.oeffnungszeiten);
          renderSpecials(data.specials);
          renderEventBanner(data.event_banner);
          renderPreise(data.speisekarte_preise);
        })
        .catch(function(err) {
          console.warn('content.json konnte nicht geladen werden:', err);
        });
    }

    function renderOeffnungszeiten(oez) {
      var container = document.getElementById('oez-rows');
      if (!container || !oez) return;
      container.innerHTML = oez.zeilen.map(function(z) {
        return '<div class="oez-row">' +
          '<span class="oez-day">' + z.tage + '</span>' +
          '<span class="oez-time">' + z.uhrzeit + '</span>' +
          '</div>';
      }).join('');
      var hinweis = document.getElementById('oez-hinweis');
      if (hinweis && oez.hinweis) hinweis.textContent = oez.hinweis;
    }

    function renderSpecials(specials) {
      var section = document.getElementById('specials-section');
      if (!section) return;
      if (!specials || !specials.aktiv || !specials.eintraege || !specials.eintraege.length) {
        section.style.display = 'none';
        return;
      }
      section.style.display = '';
      var grid = document.getElementById('specials-grid');
      if (!grid) return;
      grid.innerHTML = specials.eintraege.map(function(e) {
        return '<div class="special-item">' +
          '<p class="special-name">' + e.name + '</p>' +
          (e.beschreibung ? '<p class="special-desc">' + e.beschreibung + '</p>' : '') +
          '<p class="special-preis">' + e.preis + '&nbsp;€</p>' +
          '</div>';
      }).join('');
    }

    function renderEventBanner(banner) {
      var el = document.getElementById('event-banner');
      if (!el) return;
      if (!banner || !banner.aktiv || !banner.text) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      var textEl = document.getElementById('event-banner-text');
      if (textEl) textEl.textContent = banner.text;
      var linkEl = document.getElementById('event-banner-link');
      if (linkEl) {
        if (banner.link_url) {
          linkEl.href = banner.link_url;
          linkEl.textContent = banner.link_text || 'Mehr erfahren';
          linkEl.style.display = '';
        } else {
          linkEl.style.display = 'none';
        }
      }
    }

    function renderPreise(preise) {
      if (!preise) return;
      document.querySelectorAll('[data-price-key]').forEach(function(el) {
        var parts   = el.dataset.priceKey.split('.');
        var section = parts[0];
        var field   = parts[1];
        if (!preise[section] || preise[section][field] === undefined) return;
        var preis = preise[section][field];
        if (el.classList.contains('menu-row-price-split')) {
          // "12,50 / 21,50" → "12,50&nbsp;€ / 21,50&nbsp;€"
          el.innerHTML = preis.split(' / ').map(function(p) {
            return p + '&nbsp;€';
          }).join(' / ');
        } else {
          el.innerHTML = preis + '&nbsp;€';
        }
      });
    }

    // ── Reservation form: AJAX submit so the page doesn't reload ────────────
    (function() {
      var form = document.getElementById('reservierung-form');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        var body = new URLSearchParams(new FormData(form)).toString();
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        })
        .then(function(res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.style.display = 'none';
          var erfolg = document.getElementById('reservierung-erfolg');
          if (erfolg) erfolg.style.display = '';
        })
        .catch(function() {
          if (btn) btn.disabled = false;
          alert('Es gab einen Fehler beim Senden. Bitte rufen Sie uns an: 0212 590023');
        });
      });
    })();

    loadContent();
