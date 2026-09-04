/**
 * Animación de carga de la portada.
 *
 * El logo se dibuja solo: arranca en el donut de origen (el "punto cero"),
 * los arcos del anillo y del óvalo crecen desde ahí en las dos direcciones y
 * se cierran arriba a la derecha, y por último la flecha se lanza y sale de
 * plano. Después la cortina sube y deja ver la web. Unos 2,5 s en total.
 *
 * Tres cosas que no son negociables aquí, porque el loader tapa la web entera:
 *   1. Si GSAP no carga (CDN caído o bloqueado), la cortina se quita al vuelo.
 *   2. Hay un tope duro por si algo se atasca a mitad de la animación.
 *   3. Con "reducir movimiento" activado no se anima nada: logo quieto y fuera.
 * En los tres casos se acaba llamando a quitar(), que es idempotente.
 */
(function () {
    'use strict';

    var loader = document.getElementById('pz-loader');
    if (!loader) return;

    var raiz = document.documentElement;
    var fuera = false;

    function quitar() {
        if (fuera) return;
        fuera = true;
        raiz.classList.remove('pz-cargando');
        // Ojo: si el logo ya aterrizó en la cabecera vive fuera del loader, así
        // que borrar el loader no se lo lleva por delante. Pero si algo falló a
        // medio viaje, se rescata antes de borrar.
        var marca = document.getElementById('pz-logo');
        var hueco = document.getElementById('pz-marca-slot');
        if (marca && hueco && loader.contains(marca)) hueco.appendChild(marca);
        if (loader.parentNode) loader.parentNode.removeChild(loader);
    }

    // Tope duro: pase lo que pase, la web se ve.
    var tope = setTimeout(quitar, 6000);

    function desvanecer(retardo) {
        setTimeout(function () {
            loader.classList.add('pz-fuera');
            setTimeout(quitar, 400);
        }, retardo);
    }

    // Sin GSAP no hay animación que valga: se quita y punto.
    if (typeof window.gsap === 'undefined') {
        clearTimeout(tope);
        quitar();
        return;
    }

    var gsap = window.gsap;

    // Quien ha pedido reducir movimiento ve el logo quieto un instante, nada más.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        loader.classList.add('pz-quieto');
        desvanecer(600);
        return;
    }

    // Sin DrawSVG los trazos no se pueden dibujar: se hace una entrada simple
    // en vez de dejar la animación a medias.
    var dibujable = !!window.DrawSVGPlugin;
    if (dibujable) gsap.registerPlugin(window.DrawSVGPlugin);

    var logo = document.getElementById('pz-logo');
    gsap.set(logo, { visibility: 'visible' });

    var tl = gsap.timeline({
        onComplete: function () {
            clearTimeout(tope);
            quitar();
        }
    });

    // El punto cero: todo nace de aquí.
    tl.from('.pz-origin', {
        scale: 0,
        duration: 0.45,
        ease: 'back.out(2)',
        svgOrigin: '62.15 182.3'
    }, 0.10);

    if (dibujable) {
        // Los cuatro arcos empiezan pegados al donut y cierran en el nodo de arriba.
        tl.from('.pz-ring', { drawSVG: '0%', duration: 0.85, ease: 'power2.inOut' }, 0.30);
        tl.from('.pz-oval', { drawSVG: '0%', duration: 0.80, ease: 'power2.inOut' }, 0.45);
    } else {
        tl.from(['.pz-ring', '.pz-oval'], { opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.30);
    }

    tl.from('.pz-node', {
        scale: 0,
        duration: 0.40,
        ease: 'back.out(2.5)',
        stagger: 0.055,
        transformOrigin: '50% 50%'
    }, 0.85);

    // La flecha se lanza desde el origen.
    if (dibujable) {
        tl.from('.pz-shaft', { drawSVG: '0%', duration: 0.40, ease: 'power2.in' }, 0.95);
    } else {
        tl.from('.pz-shaft', { opacity: 0, duration: 0.40 }, 0.95);
    }
    tl.from('.pz-hub', { scale: 0, duration: 0.35, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 1.20);
    tl.from('.pz-head', { scale: 0, duration: 0.32, ease: 'back.out(3)', svgOrigin: '190.17 44.63' }, 1.32);

    // Brillo corto al completarse, sin pasarse.
    tl.to('.pz-glow', { opacity: 0.38, scale: 1.10, duration: 0.30, ease: 'power2.out' }, 1.45);
    tl.to('.pz-glow', { opacity: 0, duration: 0.45, ease: 'power2.in' }, 1.75);

    // El logo no se desvanece: aterriza en la cabecera. Se anima con Flip, que
    // mide dónde está ahora y dónde acaba, y va de una posición a la otra. Así
    // el usuario ve un solo logo moviéndose, no uno que se va y otro que sale.
    var hueco = document.getElementById('pz-marca-slot');
    var puedeAterrizar = !!(window.Flip && hueco && window.matchMedia('(min-width: 1024px)').matches);

    if (puedeAterrizar) {
        gsap.registerPlugin(window.Flip);
        tl.add(function () {
            var estado = window.Flip.getState(logo);
            hueco.appendChild(logo);
            window.Flip.from(estado, {
                duration: 0.85,
                ease: 'power3.inOut',
                scale: true,
                onComplete: function () { hueco.classList.add('pz-marca-lista'); }
            });
        }, 1.90);
        // La cortina se va mientras el logo viaja, no después.
        tl.to('.pz-glow', { opacity: 0, duration: 0.2 }, 1.90);
        tl.to(loader, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, 2.05);
    } else {
        tl.to('.pz-stage', { scale: 1.06, opacity: 0, duration: 0.40, ease: 'power2.in' }, 1.90);
        tl.to(loader, { yPercent: -100, duration: 0.60, ease: 'power3.inOut' }, 1.98);
    }
})();
