/* ==========================================================
   circuit-bg.js
   Animación de fondo tipo circuito impreso.

   Adaptada a la paleta oficial de BilboByte:
   #056CF2 / #0460D9 / #034AA6 / #022859 / #0D0D0D

   Características:
   - Fondo base #0D0D0D con trazas en azul marino #034AA6
   - CPU con base #022859 y el logo "Cerebro Master Premium.png"
     con tamaño prominente ocupando gran parte del chip para
     máxima visibilidad de los visitantes
   - Chispas y destellos eléctricos con cambio de color reactivo:
     * HOME: Azul eléctrico #056CF2 (5, 108, 242)
     * SOLUCIONES: Cian Neón Tecnológico (0, 215, 255)
     * CONTACTO: Violeta Neón de Señales (138, 75, 255)
   - Transición cromática suave e interpolada entre secciones
   ========================================================== */

(() => {

    /* ===== COLORES POR SECCIÓN PARA LOS PULSOS ELÉCTRICOS ===== */

    const SECTION_COLORS = {
        home:      { r: 5,   g: 108, b: 242 }, // #056CF2 Azul Eléctrico BilboByte
        solutions: { r: 0,   g: 215, b: 255 }, // Cian Neón Tecnológico
        contact:   { r: 138, g: 75,  b: 255 }  // Violeta Neón de Comunicación
    };

    let currentRGB = { r: 5, g: 108, b: 242 };
    let targetRGB  = { r: 5, g: 108, b: 242 };

    /* Permite cambiar el color desde cube.js o eventos externos */
    function setSection(sectionName) {
        if (SECTION_COLORS[sectionName]) {
            targetRGB = SECTION_COLORS[sectionName];
        }
    }
    window.setCircuitSection = setSection;
    window.addEventListener('sectionchange', (e) => {
        if (e.detail && e.detail.section) {
            setSection(e.detail.section);
        }
    });


    /* ===== CONFIGURACIÓN GENERAL ===== */

    const CFG = {
        grid:       14,                          // tamaño de celda (px)
        traceColor: 'rgba(3, 74, 166, 0.32)',    // trazas: #034AA6 suave
        padColor:   'rgba(4, 96, 217, 0.45)',    // pads: #0460D9 medio
        maxPulses:  5,
        speed:      [140, 280],                  // px/s
        tail:       [24, 38],                    // largo de la estela px
        densityDiv: 9000,
        cpuSize:    0.28,                        // tamaño generoso para destacar el chip
        cpuLabel:   ''                           // se usa el logo en vez de texto
    };

    const wrap = document.getElementById('circuit-bg');
    if (!wrap) return;

    const canvas = wrap.querySelector('canvas');
    const ctx    = canvas.getContext('2d');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    const rand    = (a, b) => a + Math.random() * (b - a);
    const randInt = (a, b) => Math.floor(rand(a, b + 1));

    let W, H, dpr, traces = [], pulses = [], cpu, layer, raf, last = 0;


    /* ===== CARGA Y PROCESADO DEL LOGO CEREBRO MASTER PREMIUM ===== */

    const cpuLogo = new Image();
    let logoLoaded = false;
    let processedLogo = null;

    function processLogo(img) {
        try {
            const oc = document.createElement('canvas');
            const maxDim = 1000;
            const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
            oc.width = Math.round(img.naturalWidth * scale);
            oc.height = Math.round(img.naturalHeight * scale);
            const octx = oc.getContext('2d');

            octx.drawImage(img, 0, 0, oc.width, oc.height);
            const imgData = octx.getImageData(0, 0, oc.width, oc.height);
            const d = imgData.data;

            for (let i = 0; i < d.length; i += 4) {
                const r = d[i], g = d[i+1], b = d[i+2];
                // Luminancia perceptual
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                // Eliminar el fondo negro original para que no actúe como un parche
                if (lum < 14) {
                    d[i+3] = 0;
                    continue;
                }

                // Suavizado anti-aliasing en los bordes para eliminar cualquier borde oscuro
                if (lum < 38) {
                    const factor = (lum - 14) / (38 - 14);
                    d[i+3] = Math.round(d[i+3] * factor);
                }

                // CONSERVAR LOS COLORES ORIGINALES:
                // El cerebro conserva sus tonos azules/eléctricos auténticos
                // y las tuercas/engranajes conservan su acabado plateado metálico.
                d[i]   = r;
                d[i+1] = g;
                d[i+2] = b;
            }

            octx.putImageData(imgData, 0, 0);
            return oc;
        } catch (err) {
            console.warn('Fallback a imagen estándar:', err);
            return img;
        }
    }

    cpuLogo.src = 'assets/images/cerebro-master-premium.png';
    cpuLogo.onload = () => {
        logoLoaded = true;
        processedLogo = processLogo(cpuLogo);
        if (layer) {
            buildStatic();
        }
    };


    /* ----- Utilidades de pista ----- */

    function finalize(pts, endPad = true) {
        const cum = [0];
        for (let i = 1; i < pts.length; i++)
            cum.push(cum[i-1] + Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]));
        return { pts, cum, length: cum[cum.length - 1], endPad };
    }

    function pointAt(t, dist) {
        dist = Math.max(0, Math.min(t.length, dist));
        let i = 1;
        while (i < t.cum.length - 1 && t.cum[i] < dist) i++;
        const seg = t.cum[i] - t.cum[i-1] || 1;
        const k   = (dist - t.cum[i-1]) / seg;
        return [
            t.pts[i-1][0] + (t.pts[i][0] - t.pts[i-1][0]) * k,
            t.pts[i-1][1] + (t.pts[i][1] - t.pts[i-1][1]) * k
        ];
    }


    /* ----- Pistas aleatorias (45° y 90°) ----- */

    function makeTrace() {
        const g = CFG.grid, cols = Math.floor(W / g), rows = Math.floor(H / g);
        let cx = randInt(1, cols - 1), cy = randInt(1, rows - 1);
        let d  = randInt(0, 7);
        const pts  = [[cx * g, cy * g]];
        const segs = randInt(2, 5);
        for (let s = 0; s < segs; s++) {
            const len = randInt(3, 12);
            let moved = 0;
            for (let i = 0; i < len; i++) {
                const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
                if (nx < 0 || ny < 0 || nx > cols || ny > rows) break;
                cx = nx; cy = ny; moved++;
            }
            if (moved) pts.push([cx * g, cy * g]);
            d = (d + (Math.random() < .5 ? 1 : -1) + 8) % 8;
        }
        return pts.length < 3 ? null : finalize(pts);
    }


    /* ----- CPU: cuerpo, pines y pistas que salen de él ----- */

    function clipToScreen(pts) {
        const out = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
            const a = out[out.length - 1], b = pts[i];
            if (b[0] >= 0 && b[0] <= W && b[1] >= 0 && b[1] <= H) { out.push(b); continue; }
            let t = 1;
            if (b[0] < 0) t = Math.min(t, (0 - a[0]) / (b[0] - a[0]));
            if (b[0] > W) t = Math.min(t, (W - a[0]) / (b[0] - a[0]));
            if (b[1] < 0) t = Math.min(t, (0 - a[1]) / (b[1] - a[1]));
            if (b[1] > H) t = Math.min(t, (H - a[1]) / (b[1] - a[1]));
            out.push([a[0] + (b[0]-a[0]) * t, a[1] + (b[1]-a[1]) * t]);
            return { pts: out, clipped: true };
        }
        return { pts: out, clipped: false };
    }

    function buildCpu() {
        const g    = CFG.grid;
        const h    = Math.max(5, Math.min(10, Math.round(Math.min(W, H) * CFG.cpuSize / 2 / g)));
        const cx   = Math.round(W / 2 / g) * g;
        const cy   = Math.round(H / 2 / g) * g;
        const half = h * g;
        cpu = { cx, cy, half, h, pins: [], traces: [] };

        for (const [ox, oy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
            const lx = -oy, ly = ox;
            const s   = randInt(1,3),  m  = randInt(2,5),  L  = randInt(3,14),
                  m2  = randInt(2,6),  L2 = randInt(2,10), sg2 = Math.random() < .5 ? 1 : -1;
            for (let k = -(h - 1); k <= h - 1; k++) {
                const sg = Math.sign(k);
                const px = cx + ox * half + lx * k * g;
                const py = cy + oy * half + ly * k * g;
                cpu.pins.push([px, py]);
                const P = [[px, py]];
                const add = (dx, dy, n) => { const l = P[P.length-1]; P.push([l[0]+dx*n*g, l[1]+dy*n*g]); };
                add(ox, oy, s);
                add(ox + lx*sg,  oy + ly*sg,  m);
                add(ox, oy, L);
                add(ox + lx*sg2, oy + ly*sg2, m2);
                add(ox, oy, L2);
                const { pts, clipped } = clipToScreen(P);
                if (pts.length >= 2) cpu.traces.push(finalize(pts, !clipped));
            }
        }
    }

    function hitsCpu(t) {
        const lim = cpu.half + CFG.grid * 4;
        for (let d = 0; d <= t.length; d += 7) {
            const p = pointAt(t, d);
            if (Math.abs(p[0] - cpu.cx) < lim && Math.abs(p[1] - cpu.cy) < lim) return true;
        }
        return false;
    }


    /* ----- Capa estática: pistas + cuerpo de CPU + logo ----- */

    function buildStatic() {
        layer        = document.createElement('canvas');
        layer.width  = W * dpr;
        layer.height = H * dpr;
        const c      = layer.getContext('2d');
        c.scale(dpr, dpr);
        c.lineWidth  = 1;
        c.lineJoin   = 'round';

        const pad = (x, y) => { c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill(); };

        /* Trazas de circuito impreso */
        for (const t of traces) {
            c.strokeStyle = CFG.traceColor;
            c.beginPath();
            t.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
            c.stroke();
            c.fillStyle = CFG.padColor;
            pad(t.pts[0][0], t.pts[0][1]);
            if (t.endPad) pad(t.pts[t.pts.length-1][0], t.pts[t.pts.length-1][1]);
        }

        /* Cuerpo del chip CPU — usa #022859 para integrarse en la paleta */
        const { cx, cy, half } = cpu;
        const x0 = cx - half, y0 = cy - half, S = half * 2;
        const rr = (x, y, w, h, r) => {
            c.beginPath();
            c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
        };

        /* Placa base del chip: sustrato de silicio con degradado de profundidad */
        rr(x0, y0, S, S, 6);
        const gradBase = c.createLinearGradient(x0, y0, x0 + S, y0 + S);
        gradBase.addColorStop(0, '#011633');
        gradBase.addColorStop(0.5, '#022859');
        gradBase.addColorStop(1, '#011126');
        c.fillStyle   = gradBase;
        c.fill();
        c.strokeStyle = 'rgba(5, 108, 242, 0.55)';
        c.lineWidth   = 1.5;
        c.stroke();

        /* Muesca de orientación del chip (Pin 1) */
        c.beginPath();
        c.arc(x0 + 10, y0 + 10, 3.5, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(5, 108, 242, 0.45)';
        c.lineWidth   = 1;
        c.stroke();

        /* Die interno amplio */
        const ins = Math.round(CFG.grid * 1.2);
        const dx = x0 + ins, dy = y0 + ins, ds = S - ins * 2;
        
        // Sustrato reflectivo interno del die
        const gradDie = c.createRadialGradient(cx, cy, ds * 0.1, cx, cy, ds * 0.75);
        gradDie.addColorStop(0, 'rgba(3, 74, 166, 0.28)');
        gradDie.addColorStop(1, 'rgba(1, 18, 42, 0.88)');
        rr(dx, dy, ds, ds, 4);
        c.fillStyle = gradDie;
        c.fill();

        c.strokeStyle = 'rgba(5, 108, 242, 0.45)';
        c.lineWidth   = 1;
        c.stroke();

        /* Micro-trazas del bus interno del procesador */
        c.strokeStyle = 'rgba(5, 108, 242, 0.12)';
        c.lineWidth   = 1;
        for (let i = 1; i < 6; i++) {
            c.beginPath();
            c.moveTo(dx + ds * i / 6, dy);
            c.lineTo(dx + ds * i / 6, dy + ds);
            c.moveTo(dx, dy + ds * i / 6);
            c.lineTo(dx + ds, dy + ds * i / 6);
            c.stroke();
        }

        /* Marcas fiduciales de alineación en las 4 esquinas del die */
        c.strokeStyle = 'rgba(5, 108, 242, 0.45)';
        const fidLen = 6;
        for (const [fx, fy, sx, sy] of [
            [dx + 4, dy + 4, 1, 1],
            [dx + ds - 4, dy + 4, -1, 1],
            [dx + 4, dy + ds - 4, 1, -1],
            [dx + ds - 4, dy + ds - 4, -1, -1]
        ]) {
            c.beginPath();
            c.moveTo(fx, fy + sy * fidLen);
            c.lineTo(fx, fy);
            c.lineTo(fx + sx * fidLen, fy);
            c.stroke();
        }

        /* Presentar el logo integrado como grabado láser sobre el silicio */
        const logoTarget = processedLogo || (logoLoaded ? cpuLogo : null);
        if (logoTarget) {
            const maxW   = ds * 0.88;
            const maxH   = ds * 0.88;
            const targetW = logoTarget.naturalWidth || logoTarget.width;
            const targetH = logoTarget.naturalHeight || logoTarget.height;
            const aspect = targetW / targetH;

            let lw = maxW;
            let lh = lw / aspect;
            if (lh > maxH) {
                lh = maxH;
                lw = lh * aspect;
            }

            const lx = cx - lw / 2;
            const ly = cy - lh / 2;

            c.save();
            rr(dx + 2, dy + 2, ds - 4, ds - 4, 3);
            c.clip();

            // Sombra de oclusión ambiental para que el logo se sienta montado con relieve en el silicio
            c.shadowColor = 'rgba(0, 0, 0, 0.65)';
            c.shadowBlur  = 12;
            c.shadowOffsetY = 2;
            c.globalAlpha = 0.96;
            c.drawImage(logoTarget, lx, ly, lw, lh);

            c.shadowBlur  = 0;
            c.shadowOffsetY = 0;
            c.restore();
        }

        /* Pines del chip */
        c.fillStyle = CFG.padColor;
        for (const [px, py] of cpu.pins) pad(px, py);
    }


    /* ----- Setup ----- */

    function setup() {
        dpr            = Math.min(window.devicePixelRatio || 1, 2);
        W              = wrap.clientWidth;
        H              = wrap.clientHeight;
        canvas.width   = W * dpr;
        canvas.height  = H * dpr;

        buildCpu();

        const count = Math.min(200, Math.max(30, Math.round(W * H / CFG.densityDiv)));
        const rnd   = [];
        for (let tries = 0; rnd.length < count && tries < count * 20; tries++) {
            const t = makeTrace();
            if (t && !hitsCpu(t)) rnd.push(t);
        }
        traces = rnd.concat(cpu.traces);
        buildStatic();

        pulses = [];
        const n = Math.min(CFG.maxPulses, Math.round(count / 12));
        for (let i = 0; i < n; i++) pulses.push(newPulse(true));
        draw(0);
    }

    function newPulse(initial) {
        const useCpu = cpu.traces.length && Math.random() < 0.65;
        const pool   = useCpu ? cpu.traces : traces;
        const t      = pool[randInt(0, pool.length - 1)];
        return {
            t,
            rev:  useCpu && Math.random() < .5,
            d:    initial ? -rand(0, 600) : -rand(0, 200),
            v:    rand(...CFG.speed),
            tail: rand(...CFG.tail)
        };
    }


    /* ----- Renderizado continuo ----- */

    function draw(ts) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(layer, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        /* Interpolación suave del color de los destellos hacia el de la sección activa */
        currentRGB.r += (targetRGB.r - currentRGB.r) * 0.06;
        currentRGB.g += (targetRGB.g - currentRGB.g) * 0.06;
        currentRGB.b += (targetRGB.b - currentRGB.b) * 0.06;

        const pr = Math.round(currentRGB.r);
        const pg = Math.round(currentRGB.g);
        const pb = Math.round(currentRGB.b);
        const pulseRGB = `${pr}, ${pg}, ${pb}`;

        /* Respiración luminiscente del die con el color activo */
        const ins = Math.round(CFG.grid * 1.2), ds = cpu.half * 2 - ins * 2;
        ctx.fillStyle = `rgba(${pulseRGB}, ${0.035 + 0.02 * Math.sin(ts / 1500)})`;
        ctx.fillRect(cpu.cx - cpu.half + ins, cpu.cy - cpu.half + ins, ds, ds);

        /* El grabado del logo respira y se ilumina sutilmente con los pulsos de la sección activa */
        const logoTarget = processedLogo || (logoLoaded ? cpuLogo : null);
        if (logoTarget && cpu) {
            const maxW = ds * 0.88, maxH = ds * 0.88;
            const targetW = logoTarget.naturalWidth || logoTarget.width;
            const targetH = logoTarget.naturalHeight || logoTarget.height;
            const aspect = targetW / targetH;
            let lw = maxW, lh = lw / aspect;
            if (lh > maxH) { lh = maxH; lw = lh * aspect; }
            const lx = cpu.cx - lw / 2, ly = cpu.cy - lh / 2;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.08 + 0.05 * Math.sin(ts / 1200);
            ctx.drawImage(logoTarget, lx, ly, lw, lh);
            ctx.restore();
        }

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';

        /* Destellos eléctricos por las pistas */
        for (const p of pulses) {
            if (p.d < 0) continue;
            const at = dist => pointAt(p.t, p.rev ? p.t.length - dist : dist);
            const step = 6, n = Math.ceil(p.tail / step);
            let prev = at(p.d);
            for (let i = 1; i <= n; i++) {
                const dist = p.d - i * step;
                if (dist < 0 - step) break;
                const cur = at(dist);
                const a   = Math.pow(1 - i / n, 1.6);
                ctx.strokeStyle = `rgba(${pulseRGB},${a * 0.22})`; ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
                ctx.strokeStyle = `rgba(${pulseRGB},${a * 0.85})`; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
                prev = cur;
            }
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    function frame(ts) {
        const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
        for (let i = 0; i < pulses.length; i++) {
            const p = pulses[i];
            p.d += p.v * dt;
            if (p.d - p.tail > p.t.length) pulses[i] = newPulse(false);
        }
        draw(ts);
        raf = requestAnimationFrame(frame);
    }

    function start() {
        if (reduceMotion || raf) return;
        last = performance.now();
        raf  = requestAnimationFrame(frame);
    }

    function stop() { cancelAnimationFrame(raf); raf = null; }


    /* ----- Eventos ----- */

    let rt;
    addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => { stop(); setup(); start(); }, 200);
    });
    document.addEventListener('visibilitychange', () =>
        document.hidden ? stop() : start()
    );

    setup();
    start();

})();
