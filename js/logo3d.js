/**
 * Logo de PuntoZero en 3D, generado por código.
 *
 * Por qué no se carga un modelo: Logo_PuntoZero.GLB no era un GLB sino un 3MF
 * (un proyecto de laminador de impresión 3D) renombrado, con 173.392 triángulos.
 * GLTFLoader nunca pudo abrirlo, así que el canvas del hero llevaba vacío desde
 * siempre mientras se descargaban 1,89 MB en cada visita.
 *
 * Se extruye aquí a partir de la misma geometría medida sobre el logo original
 * que usa el SVG del loader, así que las dos versiones son la misma pieza. Sale
 * gratis en descarga y con unos pocos miles de triángulos en vez de 173.000.
 *
 * Sistema de coordenadas: se trabaja en las unidades del SVG (viewBox 240,
 * centro en 120,120) pero con la Y hacia arriba, que es lo que espera Three.js.
 * Por eso todos los ángulos van negados respecto al SVG.
 */
(function () {
    'use strict';

    var R_ANILLO = 80.9, GROSOR = 14.0;
    var RX = 51.1, RY = 71.8;
    var ANG = -47.08 * Math.PI / 180;
    var UX = Math.cos(ANG), UY = Math.sin(ANG);
    var OX = 62.15 - 120, OY = 182.3 - 120;      // donut de origen, centrado
    var T_HUB = 162, T_BASE = 188, T_PUNTA = 215.2, SEMI = 7.2, PUNTA_SEMI = 18;
    var R_NODO = 86.1;

    // Cortes: donde la flecha atraviesa el anillo y el óvalo (holgura 12.5).
    var PHI = Math.atan2(0.6805, 0.7328) * 180 / Math.PI;
    var dAnillo = Math.acos(12.5 / R_ANILLO) * 180 / Math.PI;
    var A = RX * 0.7328, B = RY * 0.6805;
    var psi = Math.atan2(B, A) * 180 / Math.PI;
    var dOval = Math.acos(12.5 / Math.hypot(A, B)) * 180 / Math.PI;

    function rad(g) { return g * Math.PI / 180; }

    /** Punto del eje de la flecha, a distancia t y desplazamiento lateral s. */
    function eje(t, s) {
        s = s || 0;
        return [OX + t * UX - s * UY, -(OY + t * UY + s * UX)];
    }

    /**
     * Banda elíptica entre dos ángulos (en grados del sistema SVG).
     * Se recorre el borde exterior de a0 a a1 y se vuelve por el interior.
     */
    function banda(THREE, rx, ry, a0, a1) {
        var f = new THREE.Shape();
        var h = GROSOR / 2;
        f.absellipse(0, 0, rx + h, ry + h, rad(-a0), rad(-a1), true, 0);
        f.absellipse(0, 0, rx - h, ry - h, rad(-a1), rad(-a0), false, 0);
        f.closePath();
        return f;
    }

    /** Aro con hueco (los donuts y los nodos). */
    function aro(THREE, cx, cy, rExt, rInt) {
        var f = new THREE.Shape();
        f.absarc(cx, cy, rExt, 0, Math.PI * 2, false);
        var hueco = new THREE.Path();
        hueco.absarc(cx, cy, rInt, 0, Math.PI * 2, true);
        f.holes.push(hueco);
        return f;
    }

    /** Tramo recto de la flecha, como rectángulo orientado según el eje. */
    function tramo(THREE, t0, t1) {
        var p = [eje(t0, -SEMI), eje(t1, -SEMI), eje(t1, SEMI), eje(t0, SEMI)];
        var f = new THREE.Shape();
        f.moveTo(p[0][0], p[0][1]);
        for (var i = 1; i < 4; i++) f.lineTo(p[i][0], p[i][1]);
        f.closePath();
        return f;
    }

    window.pzCrearLogo3D = function (THREE, material, opciones) {
        var cfg = Object.assign({ curveSegments: 26, bevel: true }, opciones || {});
        var formas = [];

        // Anillo exterior, partido en dos por la flecha.
        var rc = [PHI + dAnillo, PHI - dAnillo, PHI + 180 - dAnillo, PHI + 180 + dAnillo]
            .map(function (a) { return (a % 360 + 360) % 360; }).sort(function (a, b) { return a - b; });
        formas.push(banda(THREE, R_ANILLO, R_ANILLO, rc[1], rc[2]));
        formas.push(banda(THREE, R_ANILLO, R_ANILLO, rc[3], rc[0] + 360));

        // Óvalo interior, también partido en dos.
        var oc = [psi + dOval, psi - dOval, psi + 180 - dOval, psi + 180 + dOval]
            .map(function (a) { return (a % 360 + 360) % 360; }).sort(function (a, b) { return a - b; });
        formas.push(banda(THREE, RX, RY, oc[1], oc[2]));
        formas.push(banda(THREE, RX, RY, oc[3], oc[0] + 360));

        // Flecha: dos tramos rectos con el nodo puenteando el hueco. Se parte
        // ahí a propósito para no perforar el rectángulo con un agujero casi
        // tan ancho como él, que dejaría astillas al triangular.
        formas.push(tramo(THREE, 10, T_HUB - 8));
        formas.push(tramo(THREE, T_HUB + 8, T_BASE));

        // Punta.
        var a = eje(T_PUNTA, 0), b = eje(T_BASE, PUNTA_SEMI), c = eje(T_BASE, -PUNTA_SEMI);
        var pta = new THREE.Shape();
        pta.moveTo(a[0], a[1]); pta.lineTo(b[0], b[1]); pta.lineTo(c[0], c[1]); pta.closePath();
        formas.push(pta);

        // Donut de origen y nodo de la flecha.
        var o = eje(0, 0), hub = eje(T_HUB, 0);
        formas.push(aro(THREE, o[0], o[1], 20, 9.5));
        formas.push(aro(THREE, hub[0], hub[1], 14, 7));

        // Nodos del anillo (arriba, izquierda, derecha, abajo) y del óvalo.
        [270, 180, 0, 90].forEach(function (g) {
            formas.push(aro(THREE, R_NODO * Math.cos(rad(g)), -R_NODO * Math.sin(rad(g)), 7.8, 3.2));
        });
        formas.push(aro(THREE, -RX, 0, 9.0, 3.2));
        formas.push(aro(THREE, RX, 0, 9.0, 3.2));

        var geo = new THREE.ExtrudeGeometry(formas, {
            depth: 13,
            bevelEnabled: cfg.bevel,
            bevelThickness: 1.4,
            bevelSize: 1.1,
            bevelSegments: 2,
            curveSegments: cfg.curveSegments
        });
        geo.center();

        var grupo = new THREE.Group();
        grupo.add(new THREE.Mesh(geo, material));
        return grupo;
    };
})();
