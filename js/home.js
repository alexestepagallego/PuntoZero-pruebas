/**
 * Animaciones de la portada con scroll (solo escritorio, >=1024px).
 *
 * Todo lo de aquí es decoración: si GSAP o Lenis no cargan, o si el usuario ha
 * pedido reducir movimiento, la página se queda quieta pero completa y legible.
 * Por eso nada se oculta desde CSS salvo bajo la clase .pz-anim, que solo se
 * pone cuando ya sabemos que vamos a poder animarlo.
 *
 * Piezas, por orden de aparición:
 *   1. Scroll suave (Lenis) enganchado al ticker de GSAP
 *   2. Cabecera que se compacta al bajar
 *   3. Hero: titular en paralaje + logo 3D girando con el scroll
 *   4. Revelados escalonados por sección
 *   5. Cinta infinita de clientes
 *   6. Palabra acentuada del titular + subrayados que se dibujan
 *   7. Micro-etiquetas editoriales en las demos
 *   8. Línea temporal horizontal de Sobre Nosotros (anclada + scroll lateral)
 *   9. Botones magnéticos
 */
(function () {
    'use strict';

    var ESCRITORIO = window.matchMedia('(min-width: 1024px)');
    if (!ESCRITORIO.matches) return;

    var raiz = document.documentElement;
    raiz.classList.add('pz-js');

    var gsap = window.gsap;
    if (!gsap || !window.ScrollTrigger) return;

    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.registerPlugin(window.ScrollTrigger);
    if (window.Flip) gsap.registerPlugin(window.Flip);
    var ST = window.ScrollTrigger;

    /* ---------------------------------------------------------------
       1. Scroll suave
       Lenis mueve el scroll real (no transforma la página), así que los
       paneles fixed y el canvas 3D siguen comportándose con normalidad.
       Se conduce desde el ticker de GSAP para que ScrollTrigger y el
       scroll vayan al mismo frame y no se vean desfases.
       --------------------------------------------------------------- */
    var lenis = null;
    if (window.Lenis && !reducido) {
        lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
        lenis.on('scroll', ST.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    /* Lenis mueve el scroll por su cuenta escuchando la rueda, así que no le
       afecta el overflow:hidden del body. Al abrir un panel de detalle hay que
       pararlo de verdad o el fondo sigue desplazándose por debajo. */
    window.pzScrollFondo = function (activo) {
        if (!lenis) return;
        if (activo) lenis.start();
        else lenis.stop();
    };

    // Lo usa NavDesk para bajar a una sección.
    window.pzScrollA = function (destino) {
        if (lenis) lenis.scrollTo(destino, { offset: -70, duration: 1.2 });
        else destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (reducido) return;   // A partir de aquí, todo es movimiento.
    raiz.classList.add('pz-anim');

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------------------------------------------------------------
       2. Cabecera que se compacta
       --------------------------------------------------------------- */
    var nav = $('.desk-nav');
    if (nav) {
        ST.create({
            start: 'top -80',
            end: 99999,
            onToggle: function (self) { nav.classList.toggle('pz-nav-compacta', self.isActive); }
        });
    }

    /* ---------------------------------------------------------------
       3. Hero: el titular sube más despacio que la página y el logo 3D
          gira con el recorrido completo.
       --------------------------------------------------------------- */
    var hero = $('.pz-hero');
    if (hero) {
        gsap.to('.hero-text-overlay', {
            yPercent: 32,
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
        });
        gsap.to('.pz-scroll-hint', {
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: '40% top', scrub: true }
        });
    }

    // El progreso global alimenta la escena Three.js (lo lee js/main.js).
    ST.create({
        trigger: '#desk-scroll',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: function (self) { window.pzAvanceScroll = self.progress; }
    });

    /* ---------------------------------------------------------------
       4. Revelado escalonado por sección
       --------------------------------------------------------------- */
    $$('.pz-sec').forEach(function (sec) {
        if (sec.classList.contains('pz-hero') ||
            sec.classList.contains('pz-sec-cinta') ||
            sec.classList.contains('pz-sec-sobre')) return;   // esta tiene la suya

        var piezas = $$('h2, h3, .desk-adapt-sub, .view-body > p, .desk-service-card, .team-member, .desk-sobre-photo, .btn-cta-full, .ej-buscador-wrap, .pz-sec-label', sec);
        if (!piezas.length) return;
        piezas.forEach(function (el) { el.classList.add('pz-reveal'); });

        gsap.fromTo(piezas,
            { opacity: 0, y: 34 },
            {
                opacity: 1,
                y: 0,
                duration: 0.75,
                ease: 'power3.out',
                stagger: 0.07,
                scrollTrigger: { trigger: sec, start: 'top 78%', once: true }
            });
    });

    /* ---------------------------------------------------------------
       5. Cinta infinita
       Se duplica la pista en el HTML: cuando la primera copia termina de
       salir, la segunda ya ocupa su sitio y el salto no se ve.
       --------------------------------------------------------------- */
    var marquee = $('.pz-marquee');
    if (marquee) {
        var pista = $('.pz-mq-track', marquee);
        var cinta = gsap.to('.pz-mq-track', {
            x: function () { return -pista.offsetWidth; },
            duration: 24,
            ease: 'none',
            repeat: -1
        });
        // Al pasar el ratón frena, no se para en seco.
        marquee.addEventListener('mouseenter', function () { gsap.to(cinta, { timeScale: 0.25, duration: 0.5 }); });
        marquee.addEventListener('mouseleave', function () { gsap.to(cinta, { timeScale: 1, duration: 0.5 }); });
        // La velocidad también reacciona a la dirección del scroll.
        ST.create({
            onUpdate: function (self) {
                var v = 1 + Math.min(Math.abs(self.getVelocity() / 900), 3);
                gsap.to(cinta, { timeScale: (self.direction === -1 ? -v : v), duration: 0.35, overwrite: true });
            }
        });
    }

    /* ---------------------------------------------------------------
       6. Palabra acentuada + subrayados dibujados
       --------------------------------------------------------------- */
    $$('.desk-grad').forEach(function (el) {
        el.classList.add('pz-acento');
        gsap.fromTo(el,
            { clipPath: 'inset(0 100% 0 0)' },
            {
                clipPath: 'inset(0 0% 0 0)',
                duration: 1.0,
                ease: 'power3.inOut',
                scrollTrigger: { trigger: el, start: 'top 82%', once: true }
            });
    });

    if (window.DrawSVGPlugin) {
        $$('.pz-sec h2').forEach(function (h) {
            if (h.querySelector('.pz-trazo')) return;
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'pz-trazo');
            svg.setAttribute('viewBox', '0 0 320 12');
            svg.setAttribute('aria-hidden', 'true');
            // Trazo a mano alzada, no una recta: se nota que está dibujado.
            svg.innerHTML = '<path d="M3 8 C 60 2, 120 11, 180 5 S 280 3, 317 7"/>';
            h.appendChild(svg);
            gsap.fromTo(svg.querySelector('path'),
                { drawSVG: '0%' },
                {
                    drawSVG: '100%',
                    duration: 0.9,
                    ease: 'power2.inOut',
                    scrollTrigger: { trigger: h, start: 'top 80%', once: true }
                });
        });
    }

    /* ---------------------------------------------------------------
       7. Micro-etiquetas: el dominio real de cada demo, no un dato inventado
          (se inyectan aunque la tarjeta esté oculta: al buscar ya las llevan)
       --------------------------------------------------------------- */
    $$('.ej-card').forEach(function (card) {
        if ($('.ej-meta', card)) return;
        var host;
        try { host = new URL(card.href).hostname.replace(/^www\./, ''); } catch (e) { return; }
        var meta = document.createElement('span');
        meta.className = 'ej-meta';
        meta.textContent = host;
        card.appendChild(meta);
    });

    /* ---------------------------------------------------------------
       8 bis. Línea temporal horizontal (Sobre Nosotros)

       La sección se ancla en pantalla y el scroll vertical se traduce en
       desplazamiento lateral de la tira. Detalles que importan:
         - ease 'none' en la tira: si no, el scroll y la posición dejan de ir
           a la par y el movimiento se siente elástico y raro.
         - refreshPriority alto: al anclar cambia la altura del documento, y
           los ScrollTrigger de las secciones de abajo tienen que recalcularse
           después de este, no antes.
         - containerAnimation: los hitos no entran por el scroll vertical sino
           por el avance de la tira, así que sus disparadores cuelgan de ella.
       --------------------------------------------------------------- */
    var tlSec = $('.pz-sec-sobre');
    var tlTrack = $('.pz-tl-track');
    var tlViewport = $('.pz-tl-viewport');

    if (tlSec && tlTrack && tlViewport) {
        var recorrido = function () {
            return Math.max(0, tlTrack.scrollWidth - tlViewport.clientWidth);
        };

        // Sin recorrido no hay nada que anclar (pantallas muy anchas).
        if (recorrido() > 40) {
            tlSec.classList.add('pz-tl-anclada');

            var tiraTween = gsap.to(tlTrack, {
                x: function () { return -recorrido(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: tlSec,
                    start: 'top top',
                    end: function () { return '+=' + recorrido(); },
                    pin: true,
                    scrub: 0.8,
                    invalidateOnRefresh: true,
                    anticipatePin: 1,
                    refreshPriority: 10
                }
            });

            // El raíl se va llenando al mismo ritmo.
            gsap.to('.pz-tl-rail-lleno', {
                width: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: tlSec,
                    start: 'top top',
                    end: function () { return '+=' + recorrido(); },
                    scrub: 0.8,
                    refreshPriority: 10
                }
            });

            // Cada hito entra al alcanzar el centro de la pantalla.
            $$('.pz-tl-hito', tlTrack).forEach(function (hito) {
                gsap.fromTo(hito,
                    { opacity: 0, y: 48 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: hito,
                            containerAnimation: tiraTween,
                            start: 'left 88%',
                            once: true,
                            onEnter: function () { hito.classList.add('pz-tl-visto'); }
                        }
                    });

                // Paralaje suave dentro de cada foto.
                var img = $('.pz-tl-foto img', hito);
                if (img) {
                    gsap.fromTo(img,
                        { xPercent: -8 },
                        {
                            xPercent: 8,
                            ease: 'none',
                            scrollTrigger: {
                                trigger: hito,
                                containerAnimation: tiraTween,
                                start: 'left right',
                                end: 'right left',
                                scrub: true
                            }
                        });
                }
            });
        }
    }

    /* ---------------------------------------------------------------
       9. Botones magnéticos
       --------------------------------------------------------------- */
    $$('.btn-cta-full, .btn-cta-landing, .desk-menu > a, .dropdown-trigger').forEach(function (btn) {
        var fuerza = btn.classList.contains('btn-cta-full') ? 0.35 : 0.18;
        var qx = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3.out' });
        var qy = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3.out' });
        btn.addEventListener('mousemove', function (e) {
            var r = btn.getBoundingClientRect();
            qx((e.clientX - (r.left + r.width / 2)) * fuerza);
            qy((e.clientY - (r.top + r.height / 2)) * fuerza);
        });
        btn.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });

    // Tras montarlo todo, recalcular por si las fuentes cambiaron alturas.
    window.addEventListener('load', function () { ST.refresh(); });
})();
