/* =========================================================================
   PUNTOZERO - MAIN JS
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // Año en el footer de Desktop
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- MODAL LOGIC ---
    const modalBackdrop = document.getElementById('service-modal-backdrop');
    const modalImg = document.getElementById('modal-img');
    const modalDesc = document.getElementById('modal-desc');
    const modalBtnWA = document.getElementById('modal-wa');
    const modalClose = document.getElementById('modal-close');
    const modalBtns = document.querySelectorAll('.service-modal-btn');

    // Mapeo dinámico de datos conceptuales
    const modalData = {
        'llaveros': {
            img: 'llaveros_3d.webp',
            desc: 'Llaveros y merchandising técnico exclusivo para empresas.',
            planName: 'Merchandaising y llaveros personalizados'
        },
        'figuras': {
            img: 'Gato_3d.webp',
            desc: 'Figuras decorativas y coleccionismo con acabados de alta calidad.',
            planName: 'Figuras y Coleccionables'
        },
        'qrs': {
            img: 'ejemplo_qr_3d.webp',
            desc: 'Códigos QR extruidos funcionales para señalética y control.',
            planName: 'QRs de todo tipo'
        },
        'otro': {
            img: 'ejemplo_impresion.webp',
            desc: 'Modelado CAD de precisión y creación de piezas técnicas a medida.',
            planName: 'Cualquier otro diseño'
        }
    };

    function openModal(serviceKey) {
        if (!modalBackdrop) return;
        const data = modalData[serviceKey];
        if (data) {
            if (data.img) {
                modalImg.src = data.img;
                modalImg.style.display = 'block';
            } else {
                modalImg.style.display = 'none'; // Sin ilustración fotorrealista
            }
            modalDesc.textContent = data.desc;
            modalBtnWA.setAttribute('data-plan', data.planName);

            modalBackdrop.classList.add('is-open');
        }
    }

    function closeModal() {
        if (modalBackdrop) {
            modalBackdrop.classList.remove('is-open');
        }
    }

    modalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceKey = btn.getAttribute('data-service');
            openModal(serviceKey);
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                closeModal();
            }
        });
    }

    /* =========================================================================
       INICIALIZACIÓN CONDICIONAL
       El 3D arranca en ambos, pero en móvil con una escena mucho más barata.
       ========================================================================= */
    if (window.innerWidth >= 1024) {
        initDesktop3DScene();
    } else {
        initMobile3DScene();
    }
});

/* =========================================================================
   ROUTER MÓVIL (HASH ROUTING NATIVO)
   ========================================================================= */
function navigate(targetId) {
    window.location.hash = targetId;
}

// Alias para soportar el nombre de función 'Maps'
function Maps(targetId) {
    navigate(targetId);
}

// Escuchar los cambios en el hash
/* La portada móvil dejó de ser una pantalla y pasó a ser un recorrido, igual
   que en escritorio. Estos destinos ya no cambian de vista: bajan hasta su
   sección. El resto (cartas, web, 3D, arch3D) siguen siendo pantalla completa.
   Se conserva el enrutado por hash para que los enlaces sigan funcionando. */
const PZM_SECCIONES = [
    'view-landing',
    'view-services-list',
    'view-ejemplos',
    'view-sobre',
    'view-contacto-mobile'
];

function pzmCerrarVista() {
    document.querySelectorAll('#mobile-app .view').forEach(v => v.classList.remove('active-view'));
    document.body.classList.remove('pzm-panel-abierto');
}

function handleRouting() {
    const hash = window.location.hash.substring(1) || 'view-landing';

    if (PZM_SECCIONES.includes(hash)) {
        pzmCerrarVista();
        const destino = document.getElementById(hash);
        if (!destino) return;
        if (hash === 'view-landing') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    pzmCerrarVista();
    const targetView = document.getElementById(hash);
    if (targetView) {
        targetView.classList.add('active-view');
        document.body.classList.add('pzm-panel-abierto');
        targetView.scrollTop = 0;
    } else {
        window.scrollTo(0, 0);
    }
}

// Escuchar cuando el usuario pulsa botones (UI o Hardware)
window.addEventListener('hashchange', handleRouting);

// Ejecutar al cargar la página por primera vez
window.addEventListener('DOMContentLoaded', handleRouting);

/* =========================================================================
   ROUTER ESCRITORIO
   ========================================================================= */
/* =========================================================================
   BUSCADOR DE EJEMPLOS POR TIPO DE NEGOCIO
   ========================================================================= */
function normalizarTexto(txt) {
    return txt
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

/* =========================================================================
   BUSCADOR DE EJEMPLOS
   -------------------------------------------------------------------------
   Las 33 demos ya no se pintan de entrada: ocupaban media portada. Ahora hay
   tres estados — invitación a buscar, marca dibujándose, y resultados.
   ========================================================================= */

let pzClonN = 0;

/**
 * Copia el logo del loader para reutilizarlo aquí dentro, más pequeño.
 * Se clona en vez de repetir los trazados en el HTML: así solo hay una
 * definición del logo en todo el sitio. Hay que renumerar los id porque la
 * máscara del SVG no puede aparecer dos veces en el mismo documento, y hay
 * que limpiar los estilos en línea que GSAP dejó puestos al animarlo.
 */
function pzClonarMarca(destino) {
    const origen = document.getElementById('pz-logo');
    if (!origen || !destino) return null;

    const clon = origen.cloneNode(true);
    clon.removeAttribute('id');
    clon.removeAttribute('aria-hidden');
    clon.setAttribute('aria-hidden', 'true');
    clon.removeAttribute('style');
    clon.querySelectorAll('[style]').forEach(n => n.removeAttribute('style'));

    const sufijo = 'ej' + (++pzClonN);
    clon.querySelectorAll('[id]').forEach(nodo => {
        const viejo = nodo.id;
        const nuevo = viejo + '-' + sufijo;
        nodo.id = nuevo;
        clon.querySelectorAll('[mask="url(#' + viejo + ')"]').forEach(u => {
            u.setAttribute('mask', 'url(#' + nuevo + ')');
        });
    });

    destino.textContent = '';
    destino.appendChild(clon);
    return clon;
}

function pzMovimientoReducido() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Dibuja la marca, en corto. Devuelve la duración real que va a tardar. */
function pzAnimarMarca(marca) {
    const gsap = window.gsap;
    if (!gsap || !marca) return 0;
    // Quien ha pedido reducir movimiento no espera a ver un dibujo: resultados ya.
    if (pzMovimientoReducido()) return 0;

    const tl = gsap.timeline();
    if (window.DrawSVGPlugin) {
        tl.fromTo(marca.querySelectorAll('.pz-ring, .pz-oval'),
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut', stagger: 0.06 }, 0);
        tl.fromTo(marca.querySelector('.pz-shaft'),
            { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.28, ease: 'power2.in' }, 0.28);
    } else {
        tl.fromTo(marca, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0);
    }
    tl.fromTo(marca.querySelectorAll('.pz-origin, .pz-hub, .pz-node'),
        { scale: 0 },
        { scale: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.03, transformOrigin: '50% 50%' }, 0.34);
    tl.fromTo(marca.querySelector('.pz-head'),
        { scale: 0 },
        { scale: 1, duration: 0.26, ease: 'back.out(3)', svgOrigin: '190.17 44.63' }, 0.5);
    return 0.85;
}

function pzResultados(wrap, palabrasQuery) {
    const grid = wrap.querySelector('.ejemplos-grid-v2');
    const noResults = wrap.querySelector('.ej-no-results');
    let visibles = [];

    grid.querySelectorAll('.ej-card').forEach(card => {
        const palabrasCard = normalizarTexto([
            card.dataset.kw || '',
            card.querySelector('.ej-sector').textContent,
            card.querySelector('.ej-nombre').textContent
        ].join(' ')).split(/\s+/).filter(Boolean);

        // cada palabra escrita debe ser prefijo de alguna palabra de la ficha
        const coincide = palabrasQuery.every(pq => palabrasCard.some(pc => pc.startsWith(pq)));
        card.style.display = coincide ? '' : 'none';
        if (coincide) visibles.push(card);
    });

    wrap.classList.remove('ej-buscando');
    wrap.classList.add('ej-con-resultados');
    if (noResults) noResults.hidden = visibles.length > 0;

    if (window.gsap && visibles.length && !pzMovimientoReducido()) {
        window.gsap.fromTo(visibles,
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.035, clearProps: 'transform' });
    }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

function pzVolverAlInicio(wrap) {
    clearTimeout(wrap._pzTimer);
    wrap.classList.remove('ej-con-resultados', 'ej-buscando');
    const cargando = wrap.querySelector('.ej-cargando');
    if (cargando) cargando.hidden = true;
    const noResults = wrap.querySelector('.ej-no-results');
    if (noResults) noResults.hidden = true;
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

function filtrarEjemplos(input) {
    const wrap = input.closest('.ej-buscador-wrap');
    if (!wrap) return;

    const palabrasQuery = normalizarTexto(input.value.trim()).split(/\s+/).filter(Boolean);
    const consulta = palabrasQuery.join(' ');

    // Con menos de dos letras no merece la pena buscar: se vuelve al estado
    // inicial en vez de enseñar prácticamente el catálogo entero.
    if (consulta.length < 2) {
        pzVolverAlInicio(wrap);
        return;
    }

    // Si ya se mostró justo esta consulta, no se repite la animación mientras
    // el usuario sigue tecleando lo mismo.
    if (wrap._pzUltima === consulta && wrap.classList.contains('ej-con-resultados')) return;
    wrap._pzUltima = consulta;

    clearTimeout(wrap._pzTimer);
    wrap._pzTimer = setTimeout(() => {
        const cargando = wrap.querySelector('.ej-cargando');
        wrap.classList.remove('ej-con-resultados');
        wrap.classList.add('ej-buscando');

        let espera = 0;
        if (cargando) {
            cargando.hidden = false;
            espera = pzAnimarMarca(pzClonarMarca(cargando.querySelector('.ej-cargando-marca')));
        }

        setTimeout(() => {
            if (cargando) cargando.hidden = true;
            pzResultados(wrap, palabrasQuery);
        }, espera * 1000);
    }, 260);   // espera a que deje de teclear
}

/* La portada dejó de ser un panel y pasó a ser un recorrido con scroll, así que
   NavDesk tiene ahora dos comportamientos según el destino. Se mantiene el mismo
   nombre y la misma firma a propósito: hay 24 onclick en el HTML apuntando aquí
   y no hacía falta tocar ni uno. */
const PZ_SECCIONES = [
    'desk-home-view',
    'desk-services-view',
    'desk-view-ejemplos',
    'desk-view-sobre',
    'desk-view-contacto'
];

function pzCerrarPanel() {
    document.querySelectorAll('.desk-view').forEach(v => v.classList.remove('active-desk-view'));
    document.body.classList.remove('pz-panel-abierto');
    // El overflow:hidden del body no basta: hay que soltar también a Lenis.
    if (window.pzScrollFondo) window.pzScrollFondo(true);
}

function NavDesk(viewId) {
    // Destino dentro de la portada: se baja hasta la sección.
    if (PZ_SECCIONES.includes(viewId)) {
        pzCerrarPanel();
        const destino = document.getElementById(viewId);
        if (!destino) return;
        // window.pzScrollA lo instala js/home.js cuando Lenis está activo; si no,
        // se recurre al scroll nativo para no depender de que cargue.
        if (window.pzScrollA) window.pzScrollA(destino);
        else destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    // Destino de detalle: panel superpuesto, con el fondo bloqueado.
    pzCerrarPanel();
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active-desk-view');
        document.body.classList.add('pz-panel-abierto');
        targetView.scrollTop = 0;
        if (window.pzScrollFondo) window.pzScrollFondo(false);
    }
}

function initDesktop3DScene(opciones) {
    if (typeof THREE === 'undefined') return;

    // Los valores por defecto son los del escritorio, tal cual estaban. El móvil
    // llama a esta misma función pasando los suyos (ver initMobile3DScene).
    const cfg = Object.assign({
        contenedor: 'canvas-container',
        escala: 8,
        camaraZ: 12,
        pixelRatioMax: Infinity,
        inercia: true,
        curveSegments: 26,
        bevel: true
    }, opciones || {});

    const container = document.getElementById(cfg.contenedor);
    if (!container) return;

    // 1. ESCENA Y CAMARA
    const scene = new THREE.Scene();

    // El aspect ratio coincide directamente con las dimensiones del contenedor right
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = cfg.camaraZ;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, cfg.pixelRatioMax));
    container.appendChild(renderer.domElement);

    // 2. GEOMETRÍA DEL LOGO
    // Antes se cargaba 'Logo_PuntoZero.GLB' con GLTFLoader, pero ese fichero no
    // era un GLB: era un 3MF de laminador renombrado, así que la carga fallaba
    // siempre y el canvas quedaba vacío. Ahora la geometría se extruye por
    // código en js/logo3d.js, a partir de la misma medición del logo que usa el
    // SVG del loader. Ver ese fichero para el detalle.
    let logoModel = null;
    const baseRotX = 0; // La geometría ya nace mirando a cámara.

    if (typeof window.pzCrearLogo3D === 'function') {
        // Metal oscuro y mate. El material anterior (metalness .8 / roughness .15)
        // nunca llegó a verse porque el modelo no cargaba; con la geometría ya
        // visible ese acabado quemaba un reflejo blanco justo sobre el titular.
        const material = new THREE.MeshStandardMaterial({
            color: 0x161616,
            metalness: 0.55,
            roughness: 0.42
        });
        logoModel = window.pzCrearLogo3D(THREE, material, {
            curveSegments: cfg.curveSegments,
            bevel: cfg.bevel
        });

        // A z=12 con fov 45 se ven unas 9,9 unidades de alto: 8 deja el logo
        // grande de fondo pero entero en pantalla, sin comerse el texto.
        const box = new THREE.Box3().setFromObject(logoModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        logoModel.scale.setScalar(cfg.escala / maxDim);

        scene.add(logoModel);
    }

    // 3. ILUMINACIÓN TEATRAL
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(ambientLight);

    // Luz frontal contenida: lo justo para dibujar los biseles.
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.7);
    frontLight.position.set(2, 3, 10);
    scene.add(frontLight);

    // Rim azul, ahora suave: marca el contorno sin robar protagonismo.
    const blueLight = new THREE.PointLight(0x4488ff, 1.3, 60);
    blueLight.position.set(-9, 5, 3);
    scene.add(blueLight);

    // Contraluz cálido tenue por el otro lado, para que el logo no se funda
    // del todo con el negro del fondo.
    const rimLight = new THREE.PointLight(0xffd9a0, 0.7, 60);
    rimLight.position.set(9, -4, 4);
    scene.add(rimLight);

    // 4. INTERACTIVIDAD MOUSE INERCIAL
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    if (cfg.inercia) {
        document.addEventListener('mousemove', (event) => {
            // Obtenemos coordenadas para inercia (-1 a 1)
            mouseX = (event.clientX - windowHalfX) / windowHalfX;
            mouseY = (event.clientY - windowHalfY) / windowHalfY;
        });
    }

    // 5. RESPONSIVE RESIZE
    window.addEventListener('resize', () => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;

            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // 6. LOOP ANIMACIÓN
    function animate() {
        requestAnimationFrame(animate);
        // En un móvil esto va a batería: si la pestaña no está a la vista, no
        // hay nada que pintar.
        if (document.hidden) return;

        // Limitamos rotación inercial al 15 grados (~0.26 radianes)
        const rotLimit = 0.26;
        targetX = Math.max(-rotLimit, Math.min(rotLimit, mouseX * rotLimit));
        targetY = Math.max(-rotLimit, Math.min(rotLimit, mouseY * rotLimit));

        if (logoModel) {
            // Rotación constante mínima para vida cuando el ratón para
            logoModel.rotation.z += 0.001;

            // Aportación del scroll: js/home.js escribe aquí el progreso 0..1 del
            // recorrido. Si ese script no está, vale 0 y el logo se comporta
            // exactamente como antes.
            const avance = window.pzAvanceScroll || 0;
            logoModel.rotation.z += avance * 0.012;
            camera.position.z = cfg.camaraZ + avance * 5;

            // Lerp Ultra Inercial (giro pesado y colosal)
            logoModel.rotation.y += (targetX + avance * 2.4 - logoModel.rotation.y) * 0.02;

            // Aplicado al X con el desfase de baseRotX
            const targetRotationX = baseRotX + targetY;
            logoModel.rotation.x += (targetRotationX - logoModel.rotation.x) * 0.02;
        }

        renderer.render(scene, camera);
    }

    // Iniciar
    animate();
}

/**
 * Misma escena en móvil, más barata: menos segmentos de curva, sin bisel,
 * pixelRatio limitado a 2 y sin inercia de ratón (no hay ratón). La cámara se
 * aleja porque en vertical cabe menos de ancho.
 */
function initMobile3DScene() {
    initDesktop3DScene({
        contenedor: 'mobile-canvas',
        escala: 6.5,
        camaraZ: 15,
        pixelRatioMax: 2,
        inercia: false,
        curveSegments: 12,
        bevel: false
    });
}

/* =========================================================================
   CONTACTO DIRECTO (WhatsApp API)
   ========================================================================= */
function enviarWhatsApp(elemento) {
    const telefono = "34643605384";
    const plan = elemento.getAttribute('data-plan');
    const mensaje = `¡Hola PuntoZero! Vengo de vuestra web y estoy interesado en solicitar un presupuesto para: *${plan}*. ¿Podemos hablar?`;
    const textoCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${telefono}&text=${textoCodificado}`;

    if (window.innerWidth < 1024) {
        window.location.href = urlWhatsApp; // Evitar cuelgue PWA Apple/Android
    } else {
        window.open(urlWhatsApp, '_blank');
    }
}
