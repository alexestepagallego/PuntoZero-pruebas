/**
 * Animaciones de la portada móvil (< 1024px).
 *
 * Hermano de js/home.js, pero con criterio propio: un teléfono no es un
 * escritorio pequeño. Diferencias deliberadas respecto a la versión grande:
 *
 *   - Sin Lenis. El scroll suave por JS en táctil pelea con el del sistema y
 *     se siente pastoso; el nativo de iOS y Android ya va fino.
 *   - Sin anclajes (pin). Secuestrar el scroll con el dedo desorienta.
 *   - Sin botones magnéticos ni efectos de ratón: no hay ratón.
 *   - Menos recorrido en los paralajes y menos elementos animados a la vez,
 *     que aquí cada capa compuesta se paga en batería.
 *
 * Como en escritorio, todo esto es decoración: si GSAP no carga o se pide
 * reducir movimiento, la página queda quieta pero completa.
 */
(function () {
    'use strict';

    if (window.matchMedia('(min-width: 1024px)').matches) return;

    var gsap = window.gsap;
    if (!gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(window.ScrollTrigger);
    var ST = window.ScrollTrigger;

    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------------
       Línea temporal: se clona la de escritorio

       Los hitos viven en un solo sitio del HTML (#desk-view-sobre), aunque
       ahí estén ocultos en móvil. Clonarlos evita mantener dos copias del
       mismo contenido: se edita el de escritorio y el móvil sigue el cambio.

       Se recorre con el dedo, no anclando la sección: en táctil, que un
       gesto vertical mueva el contenido en horizontal desorienta. El raíl y
       los puntos se alimentan del scrollLeft de la tira.

       Va antes del corte por movimiento reducido a propósito: deslizar una
       tira es scroll nativo, no una animación, y quien reduce movimiento no
       tiene por qué quedarse sin el recorrido.
       --------------------------------------------------------------- */
    var tlCaja = $('.pzm-tl');
    var tlOrigen = $('#desk-view-sobre .pz-tl-track');
    var tlViewport = $('.pzm-tl-viewport');

    if (tlCaja && tlOrigen && tlViewport) {
        var clon = tlOrigen.cloneNode(true);
        tlViewport.appendChild(clon);
        tlCaja.hidden = false;

        // Con la temporal en pantalla, el bloque clásico sobra.
        var clasico = $('.pzm-sobre-clasico');
        if (clasico) clasico.hidden = true;

        var relleno = $('.pzm-tl-rail-lleno', tlCaja);
        var hitos = $$('.pz-tl-hito', clon);

        var pintar = function () {
            var max = tlViewport.scrollWidth - tlViewport.clientWidth;
            var avance = max > 0 ? tlViewport.scrollLeft / max : 1;
            if (relleno) relleno.style.width = (avance * 100).toFixed(2) + '%';

            // Un hito se marca cuando su centro ya ha entrado por la derecha.
            var borde = tlViewport.getBoundingClientRect().right - 40;
            hitos.forEach(function (h) {
                var r = h.getBoundingClientRect();
                if (r.left + r.width / 2 < borde) h.classList.add('pz-tl-visto');
            });
        };

        tlViewport.addEventListener('scroll', pintar, { passive: true });
        window.addEventListener('resize', pintar);
        pintar();

        // La tira entra al llegar la sección, como el resto.
        if (!reducido) gsap.fromTo(hitos,
            { opacity: 0, y: 22 },
            {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: 'power3.out',
                stagger: 0.05,
                scrollTrigger: { trigger: tlCaja, start: 'top 85%', once: true }
            });
    }

    if (reducido) return;   // A partir de aquí, todo es movimiento.
    document.documentElement.classList.add('pzm-anim');

    /* ---------------------------------------------------------------
       Progreso global: alimenta el logo 3D del fondo (lo lee js/main.js)
       --------------------------------------------------------------- */
    ST.create({
        trigger: '#app-content',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: function (self) { window.pzAvanceScroll = self.progress; }
    });

    /* ---------------------------------------------------------------
       Hero: el texto se va antes que la página, y la pista de scroll
       desaparece en cuanto se empieza a bajar.
       --------------------------------------------------------------- */
    var hero = $('.pzm-hero');
    if (hero) {
        gsap.to('.pzm-hero .landing-content', {
            yPercent: 18,
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 }
        });
        gsap.to('.pzm-scroll-hint', {
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: '35% top', scrub: true }
        });
    }

    /* ---------------------------------------------------------------
       Revelado por sección
       --------------------------------------------------------------- */
    $$('.pzm-sec').forEach(function (sec) {
        if (sec.classList.contains('pzm-hero') || sec.classList.contains('pzm-sec-cinta')) return;

        var piezas = $$('h2, h3, h4, .view-body > p, .service-card, .team-member, .team-photo-wrap, .btn-cta-full, .ej-buscador-wrap, .hero-intro', sec);
        if (!piezas.length) return;
        piezas.forEach(function (el) { el.classList.add('pzm-reveal'); });

        gsap.fromTo(piezas,
            { opacity: 0, y: 26 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power3.out',
                stagger: 0.06,
                scrollTrigger: { trigger: sec, start: 'top 85%', once: true }
            });
    });

    /* ---------------------------------------------------------------
       Cinta de clientes
       --------------------------------------------------------------- */
    var marquee = $('.pzm-marquee');
    if (marquee) {
        var pista = $('.pzm-mq-track', marquee);
        var cinta = gsap.to('.pzm-mq-track', {
            x: function () { return -pista.offsetWidth; },
            duration: 18,
            ease: 'none',
            repeat: -1
        });
        ST.create({
            onUpdate: function (self) {
                var v = 1 + Math.min(Math.abs(self.getVelocity() / 1200), 2.5);
                gsap.to(cinta, { timeScale: (self.direction === -1 ? -v : v), duration: 0.4, overwrite: true });
            }
        });
    }

    /* ---------------------------------------------------------------
       Palabra acentuada del titular
       --------------------------------------------------------------- */
    $$('.landing-grad').forEach(function (el) {
        gsap.fromTo(el,
            { clipPath: 'inset(0 100% 0 0)' },
            {
                clipPath: 'inset(0 0% 0 0)',
                duration: 0.9,
                ease: 'power3.inOut',
                delay: 0.2,
                scrollTrigger: { trigger: el, start: 'top 92%', once: true }
            });
    });

    /* ---------------------------------------------------------------
       Micro-etiquetas en las demos, igual que en escritorio
       --------------------------------------------------------------- */
    $$('#view-ejemplos .ej-card').forEach(function (card) {
        if ($('.ej-meta', card)) return;
        var host;
        try { host = new URL(card.href).hostname.replace(/^www\./, ''); } catch (e) { return; }
        var meta = document.createElement('span');
        meta.className = 'ej-meta';
        meta.textContent = host;
        card.appendChild(meta);
    });

    window.addEventListener('load', function () { ST.refresh(); });
})();
