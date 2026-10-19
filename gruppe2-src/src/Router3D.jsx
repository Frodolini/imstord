import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, Check, Box, Lightbulb, MousePointerClick } from 'lucide-react';
import { useStore, PART_COUNT } from './store.jsx';
import { SectionHead } from './ui.jsx';

const W = 340, D = 210, H = 54;

export const PARTS = {
  antenner: {
    n: 1, title: 'Antenner', face: 'front', view: { x: -18, y: 20 },
    text: 'Antennene sender og tek imot Wi-Fi-signal som radiobølgjer. Fleire antenner gjer at ruteren kan snakke med fleire einingar samtidig og sikte signalet mot dei (beamforming).',
    fact: 'Wi-Fi brukar radiobølgjer på 2,4 GHz og 5 GHz – same type bølgjer som radio, berre med mykje høgare frekvens.',
  },
  lamper: {
    n: 2, title: 'Statuslampar', face: 'front', view: { x: -10, y: 0 },
    text: 'Lampane viser kva ruteren held på med: straum, Internett-tilkopling, Wi-Fi og kva LAN-portar som er i bruk. Blinkande lys betyr at data blir sendt.',
    fact: 'Lyser Internett-lampa raudt eller oransje, er det ofte første teikn på at noko er gale med tilkoplinga ut.',
  },
  wan: {
    n: 3, title: 'WAN-port', face: 'back', view: { x: -12, y: 180 },
    text: 'WAN (Wide Area Network) er døra ut mot Internett. Her koplar du kabelen frå fiberboksen eller modemet. Ruteren får ei offentleg IP-adresse på denne porten.',
    fact: 'WAN-porten har ofte ein annan farge enn LAN-portane, slik at du ikkje koplar feil.',
  },
  lan: {
    n: 4, title: 'LAN-portar', face: 'back', view: { x: -12, y: 180 },
    text: 'LAN (Local Area Network) er heimenettet ditt. Her koplar du PC, spelkonsoll eller TV med nettverkskabel. Kabel er ofte raskare og meir stabilt enn Wi-Fi.',
    fact: 'Ruteren deler ut lokale IP-adresser, til dømes 192.168.1.20, til alt som koplar seg til LAN – det heiter DHCP.',
  },
  straum: {
    n: 5, title: 'Straumkontakt', face: 'back', view: { x: -12, y: 180 },
    text: 'Ruteren brukar lite straum, men står på heile døgnet. Utan straum har heile heimenettet stoppa – både kabel og Wi-Fi.',
    fact: '«Har du prøvd å skru han av og på?» fungerer ofte fordi ruteren startar alle tenestene sine på nytt.',
  },
  reset: {
    n: 6, title: 'Reset-knapp', face: 'back', view: { x: -12, y: 180 },
    text: 'Held du inne reset-knappen i ca. 10 sekund, går ruteren tilbake til fabrikkinnstillingane. Då forsvinn eige Wi-Fi-namn og passord.',
    fact: 'Knappen er senka inn i boksen slik at ingen trykkjer på han ved eit uhell – du treng ein binders.',
  },
  usb: {
    n: 7, title: 'USB-port', face: 'right', view: { x: -12, y: -90 },
    text: 'Mange ruterar har USB slik at du kan kople til ein harddisk eller skrivar og dele han med alle i heimenettet.',
    fact: 'Ein harddisk på ruteren kan fungere som ei lita, privat sky for heile familien.',
  },
  hjerne: {
    n: 8, title: 'Prosessor og kjøling', face: 'top', view: { x: -72, y: 0 },
    text: 'Inne i ruteren sit ein liten datamaskin med prosessor, minne og eige operativsystem. Han les adressa på kvar datapakke og vel kvar pakken skal sendast vidare – det er sjølve rutinga.',
    fact: 'Ventilasjonsrillene på toppen slepper ut varme. Ein ruter som blir for varm, kan bli treg eller starte på nytt.',
  },
};

function Hotspot({ id, style, onPick, active, visited }) {
  const p = PARTS[id];
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onPick(id); }}
      className="group absolute"
      style={{ ...style, transform: `${style.transform || ''} translate(-50%,-50%) translateZ(2px)` }}
      aria-label={p.title}
    >
      <span className={`absolute inset-0 rounded-full ${active ? 'bg-iris-400' : 'bg-sky-400'} animate-ping opacity-40`} />
      <span
        className={`relative grid h-7 w-7 place-items-center rounded-full border-2 border-white font-mono text-[11px] font-bold text-white shadow-lg transition-transform group-hover:scale-125 ${
          active ? 'bg-iris-600 scale-125' : visited ? 'bg-sky-500' : 'bg-iris-500'
        }`}
      >
        {visited && !active ? <Check size={13} strokeWidth={3} /> : p.n}
      </span>
    </button>
  );
}

function Face({ w, h, transform, className = '', children }) {
  return (
    <div
      className={`absolute backface-hidden ${className}`}
      style={{ width: w, height: h, left: -w / 2, top: -h / 2, transform }}
    >
      {children}
    </div>
  );
}

function Antenna({ x, tilt, children }) {
  const L = 150;
  return (
    <div
      className="absolute preserve-3d"
      style={{ left: 0, top: 0, transform: `translate3d(${x}px, ${-H / 2}px, ${-D / 2 + 14}px) rotateZ(${tilt}deg)`, transformOrigin: '0 0' }}
    >
      {[0, 90].map((r) => (
        <div
          key={r}
          className="absolute rounded-t-full"
          style={{
            width: 14, height: L, left: -7, top: -L,
            transform: `rotateY(${r}deg)`,
            background: r === 0 ? 'linear-gradient(90deg,#ddd6fe,#f5f3ff 45%,#c4b5fd)' : 'linear-gradient(90deg,#c4b5fd,#ede9fe)',
          }}
        >
          {r === 0 && children}
        </div>
      ))}
      <div className="absolute rounded-full bg-iris-300" style={{ width: 24, height: 24, left: -12, top: -12, transform: 'rotateX(90deg)' }} />
    </div>
  );
}

export default function Router3D() {
  const { state, update } = useStore();
  const [sel, setSel] = useState('antenner');
  const [auto, setAuto] = useState(true);
  const rx = useMotionValue(-22), ry = useMotionValue(32), sc = useMotionValue(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.78 : 1);
  const srx = useSpring(rx, { stiffness: 90, damping: 18 });
  const sry = useSpring(ry, { stiffness: 90, damping: 18 });
  const ssc = useSpring(sc, { stiffness: 160, damping: 22 });
  const drag = useRef(null);
  const stage = useRef(null);

  useEffect(() => {
    if (!auto) return;
    let raf;
    const tick = () => {
      if (!drag.current) ry.set(ry.get() + 0.18);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto, ry]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      sc.set(Math.min(1.6, Math.max(0.55, sc.get() - e.deltaY * 0.0012)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [sc]);

  const pick = (id) => {
    setSel(id);
    setAuto(false);
    const v = PARTS[id].view;
    const cur = ry.get();
    const target = v.y + 360 * Math.round((cur - v.y) / 360);
    ry.set(target);
    rx.set(v.x);
    if (!state.parts.includes(id)) update((s) => ({ parts: [...s.parts, id] }), 10);
  };

  const onDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, rx: rx.get(), ry: ry.get() };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const d = drag.current;
    ry.set(d.ry + (e.clientX - d.x) * 0.45);
    rx.set(Math.max(-85, Math.min(30, d.rx - (e.clientY - d.y) * 0.45)));
  };
  const onUp = () => { drag.current = null; };

  const resetView = () => { rx.set(-22); ry.set(32 + 360 * Math.round((ry.get() - 32) / 360)); sc.set(window.innerWidth < 640 ? 0.78 : 1); };

  const hs = (id, style) => (
    <Hotspot id={id} style={style} onPick={pick} active={sel === id} visited={state.parts.includes(id)} />
  );

  const part = PARTS[sel];

  return (
    <section id="ruter" className="scroll-mt-24 py-16">
      <SectionHead
        icon={Box}
        kicker="02 / Utforsk"
        title="Ruteren i 3D"
        text="Dra for å snu ruteren, scroll eller bruk knappane for å zoome. Trykk på dei nummererte punkta for å lære kva kvar del gjer."
      />
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#eef7ff,transparent_65%)]" />
          <div
            ref={stage}
            className="relative h-[440px] cursor-grab touch-none select-none active:cursor-grabbing md:h-[500px]"
            style={{ perspective: 1300 }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className="absolute left-1/2 top-[68%] h-10 w-[360px] -translate-x-1/2 rounded-[50%] bg-iris-600/15 blur-xl" />
            <motion.div className="absolute left-1/2 top-[58%] preserve-3d" style={{ rotateX: srx, rotateY: sry, scale: ssc }}>
              {/* topp */}
              <Face w={W} h={D} transform={`rotateX(90deg) translateZ(${H / 2}px)`} className="rounded-[22px]">
                <div className="h-full w-full rounded-[22px] border border-iris-100 bg-gradient-to-br from-white via-[#f7f5ff] to-iris-100">
                  <div className="absolute left-1/2 top-[22%] grid -translate-x-1/2 grid-cols-9 gap-2">
                    {Array.from({ length: 27 }).map((_, i) => (
                      <span key={i} className="h-5 w-1.5 rounded-full bg-iris-200" />
                    ))}
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-display text-sm font-extrabold tracking-[.3em] text-iris-400">NETLINK</div>
                  {hs('hjerne', { left: '50%', top: '38%' })}
                </div>
              </Face>
              {/* botn */}
              <Face w={W} h={D} transform={`rotateX(-90deg) translateZ(${H / 2}px)`} className="rounded-[22px] bg-iris-200" />
              {/* front */}
              <Face w={W} h={H} transform={`translateZ(${D / 2}px)`} className="rounded-xl">
                <div className="flex h-full w-full items-center justify-center gap-3 rounded-xl border border-iris-100 bg-gradient-to-b from-white to-[#f1efff] px-6">
                  {['#22c55e', '#38bdf8', '#a78bfa', '#a78bfa', '#38bdf8', '#38bdf8', '#cbd5e1', '#38bdf8'].map((c, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: c, boxShadow: c !== '#cbd5e1' ? `0 0 8px ${c}` : 'none', animation: i > 1 && c !== '#cbd5e1' ? `blink ${0.6 + (i % 3) * 0.35}s infinite` : 'none' }}
                    />
                  ))}
                  {hs('lamper', { left: '50%', top: '-2px' })}
                </div>
              </Face>
              {/* bak */}
              <Face w={W} h={H} transform={`rotateY(180deg) translateZ(${D / 2}px)`} className="rounded-xl">
                <div className="relative flex h-full w-full items-center gap-2.5 rounded-xl border border-iris-100 bg-gradient-to-b from-[#f4f2ff] to-iris-100 px-5">
                  <span className="h-5 w-5 rounded-full border-4 border-ink/70 bg-ink/20" />
                  <span className="mx-1 h-2.5 w-2.5 rounded-full bg-ink/60 ring-2 ring-iris-200" />
                  <span className="h-6 w-8 rounded-md border-2 border-sky-600 bg-sky-400" />
                  <span className="mx-1 h-8 w-px bg-iris-300" />
                  {[0, 1, 2, 3].map((i) => <span key={i} className="h-6 w-8 rounded-md border-2 border-amber-500 bg-amber-300" />)}
                  {hs('straum', { left: '30px', top: '6px' })}
                  {hs('reset', { left: '62px', top: '48px' })}
                  {hs('wan', { left: '104px', top: '6px' })}
                  {hs('lan', { left: '220px', top: '6px' })}
                </div>
              </Face>
              {/* høgre */}
              <Face w={D} h={H} transform={`rotateY(90deg) translateZ(${W / 2}px)`} className="rounded-xl">
                <div className="flex h-full w-full items-center justify-center rounded-xl border border-iris-100 bg-gradient-to-b from-[#efedff] to-iris-100">
                  <span className="h-3 w-8 rounded-sm border-2 border-ink/60 bg-white" />
                  {hs('usb', { left: '50%', top: '10px' })}
                </div>
              </Face>
              {/* venstre */}
              <Face w={D} h={H} transform={`rotateY(-90deg) translateZ(${W / 2}px)`} className="rounded-xl border border-iris-100 bg-gradient-to-b from-[#efedff] to-iris-100" />
              <Antenna x={-125} tilt={-8} />
              <Antenna x={0} tilt={0}>{hs('antenner', { left: '50%', top: '22px' })}</Antenna>
              <Antenna x={125} tilt={8} />
            </motion.div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5 rounded-2xl border border-iris-100 bg-white/90 p-1 shadow-soft backdrop-blur">
              <button className="rounded-xl p-2 hover:bg-iris-50" onClick={() => sc.set(Math.min(1.6, sc.get() + 0.15))} aria-label="Zoom inn"><ZoomIn size={18} /></button>
              <button className="rounded-xl p-2 hover:bg-iris-50" onClick={() => sc.set(Math.max(0.55, sc.get() - 0.15))} aria-label="Zoom ut"><ZoomOut size={18} /></button>
              <button className="rounded-xl p-2 hover:bg-iris-50" onClick={resetView} aria-label="Nullstill visning"><RotateCcw size={18} /></button>
              <button className="rounded-xl p-2 hover:bg-iris-50" onClick={() => setAuto((a) => !a)} aria-label={auto ? 'Stopp rotasjon' : 'Start rotasjon'}>
                {auto ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
            <span className="chip bg-white/90 text-ink/60 shadow-soft"><MousePointerClick size={14} /> Dra for å snu</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="label">Utforska delar</span>
              <span className="font-mono text-sm font-bold text-iris-600">{state.parts.length}/{PART_COUNT}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PARTS).map(([id, p]) => (
                <button
                  key={id}
                  onClick={() => pick(id)}
                  className={`rounded-xl border px-2 py-2 text-left text-xs font-semibold transition-all ${
                    sel === id ? 'border-iris-500 bg-iris-50 text-iris-700' : state.parts.includes(id) ? 'border-sky-200 bg-sky-50 text-sky-600' : 'border-iris-100 text-ink/60 hover:border-iris-300'
                  }`}
                >
                  <span className="font-mono">{p.n}</span> {p.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={sel}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="card flex-1 p-6"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-iris-600 font-mono font-bold text-white">{part.n}</span>
                <h3 className="font-display text-2xl font-extrabold">{part.title}</h3>
              </div>
              <p className="leading-relaxed text-ink/75">{part.text}</p>
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-sky-50 to-iris-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-sky-600"><Lightbulb size={16} /> Visste du?</div>
                <p className="text-sm leading-relaxed text-ink/70">{part.fact}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
