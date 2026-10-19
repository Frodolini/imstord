import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Router as RouterIcon, Globe, Network, Move, Cable, Trash2, Plus, Send, RotateCcw, Terminal, CircleAlert, CircleCheck, Info,
} from 'lucide-react';
import { useStore } from './store.jsx';
import { SectionHead } from './ui.jsx';

const TYPES = {
  pc: { icon: Monitor, label: 'PC', fill: '#ffffff', stroke: '#b6a1ff', color: '#1b1640' },
  router: { icon: RouterIcon, label: 'Ruter', fill: '#1b1640', stroke: '#1b1640', color: '#ffffff' },
  switch: { icon: Network, label: 'Switch', fill: '#eef7ff', stroke: '#4aa3f7', color: '#1669c4' },
  internet: { icon: Globe, label: 'Internett', fill: '#e9e3ff', stroke: '#7c4df0', color: '#6834d6' },
};

const START = () => ({
  nodes: [
    { id: 'net', type: 'internet', x: 680, y: 110, name: 'Internett' },
    { id: 'r1', type: 'router', x: 470, y: 230, name: 'Ruter 1' },
    { id: 'pc1', type: 'pc', x: 150, y: 120, name: 'PC 1' },
    { id: 'pc2', type: 'pc', x: 150, y: 340, name: 'PC 2' },
  ],
  links: [{ a: 'net', b: 'r1' }],
});

function neighbours(links, id) {
  return links.filter((l) => l.a === id || l.b === id).map((l) => (l.a === id ? l.b : l.a));
}

function bfs(nodes, links, from, to) {
  const prev = { [from]: null };
  const q = [from];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  while (q.length) {
    const cur = q.shift();
    if (cur === to) break;
    for (const nb of neighbours(links, cur)) {
      if (nb in prev) continue;
      if (byId[nb].type === 'internet' && nb !== to) continue;
      if (byId[nb].type === 'pc' && nb !== to) continue;
      prev[nb] = cur;
      q.push(nb);
    }
  }
  if (!(to in prev)) return null;
  const path = [];
  for (let c = to; c !== null; c = prev[c]) path.unshift(c);
  return path;
}

function firstRouter(nodes, links, from) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const nb of neighbours(links, cur)) {
      if (seen.has(nb)) continue;
      seen.add(nb);
      if (byId[nb].type === 'router') return nb;
      if (byId[nb].type === 'switch') q.push(nb);
    }
  }
  return null;
}

let uid = 10;

export default function Simulator() {
  const { state, update } = useStore();
  const [net, setNet] = useState(START);
  const [mode, setMode] = useState('kople');
  const [pending, setPending] = useState(null);
  const [mouse, setMouse] = useState(null);
  const [src, setSrc] = useState('pc1');
  const [dst, setDst] = useState('net');
  const [packet, setPacket] = useState(null);
  const [log, setLog] = useState([{ t: 'info', m: 'Kople PC-ane til ruteren med kabel. Vel «Kople kabel» og trykk på to einingar.' }]);
  const svg = useRef(null);
  const drag = useRef(null);
  const { nodes, links } = net;
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const say = (t, m) => setLog((l) => [{ t, m }, ...l].slice(0, 7));

  const ips = useMemo(() => {
    const routers = nodes.filter((n) => n.type === 'router');
    const out = {};
    const counter = {};
    nodes.filter((n) => n.type === 'pc').forEach((pc) => {
      const r = firstRouter(nodes, links, pc.id);
      if (!r) { out[pc.id] = null; return; }
      const ri = routers.findIndex((x) => x.id === r);
      counter[r] = (counter[r] || 99) + 1;
      out[pc.id] = `192.168.${ri + 1}.${counter[r]}`;
    });
    return out;
  }, [nodes, links]);

  const online = useMemo(
    () => nodes.filter((n) => n.type === 'pc' && bfs(nodes, links, n.id, 'net')).length,
    [nodes, links],
  );

  useEffect(() => {
    if (online > state.simBest) update(() => ({ simBest: online }), 0);
  }, [online, state.simBest, update]);

  const pt = (e) => {
    const s = svg.current;
    const p = s.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const r = p.matrixTransform(s.getScreenCTM().inverse());
    return { x: Math.max(40, Math.min(760, r.x)), y: Math.max(40, Math.min(420, r.y)) };
  };

  const connect = (a, b) => {
    const A = byId[a], B = byId[b];
    if (a === b) return;
    if (links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))) return say('warn', 'Dei to er allereie kopla saman.');
    const types = [A.type, B.type].sort().join('-');
    if (types === 'pc-pc') return say('warn', 'Kople PC-ar via ein switch eller ein ruter, ikkje direkte.');
    if (A.type === 'internet' || B.type === 'internet') {
      const other = A.type === 'internet' ? B : A;
      if (other.type !== 'router') return say('warn', `${other.name} kan ikkje koplast rett til Internett. Berre ein ruter har WAN-port.`);
      if (neighbours(links, other.id).some((n) => byId[n].type === 'internet')) return say('warn', `${other.name} er allereie kopla til Internett.`);
    }
    for (const n of [A, B]) {
      if (n.type === 'pc' && neighbours(links, n.id).length >= 1) return say('warn', `${n.name} har berre éin nettverksport, og han er i bruk.`);
    }
    setNet((s) => ({ ...s, links: [...s.links, { a, b }] }));
    say('ok', `Kabel kopla: ${A.name} til ${B.name}.`);
  };

  const onNodeDown = (e, n) => {
    e.stopPropagation();
    if (mode === 'flytt') {
      const p = pt(e);
      drag.current = { id: n.id, dx: n.x - p.x, dy: n.y - p.y };
      svg.current.setPointerCapture?.(e.pointerId);
    } else if (mode === 'kople') {
      if (!pending) setPending(n.id);
      else { connect(pending, n.id); setPending(null); }
    } else if (mode === 'slett') {
      if (n.type === 'internet') return say('warn', 'Internett kan du ikkje slette.');
      setNet((s) => ({ nodes: s.nodes.filter((x) => x.id !== n.id), links: s.links.filter((l) => l.a !== n.id && l.b !== n.id) }));
      if (src === n.id) setSrc('');
      if (dst === n.id) setDst('net');
      say('info', `${n.name} vart fjerna.`);
    }
  };

  const onMove = (e) => {
    const p = pt(e);
    setMouse(p);
    if (drag.current) {
      const { id, dx, dy } = drag.current;
      setNet((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, x: p.x + dx, y: p.y + dy } : n)) }));
    }
  };

  const add = (type) => {
    const count = nodes.filter((n) => n.type === type).length;
    if (count >= (type === 'pc' ? 6 : 3)) return say('warn', `Det er ikkje plass til fleire av typen ${TYPES[type].label}.`);
    const nums = nodes.filter((n) => n.type === type).map((n) => +n.name.split(' ').pop());
    let k = 1; while (nums.includes(k)) k++;
    const id = `${type}${uid++}`;
    const node = { id, type, x: 260 + Math.random() * 200, y: 80 + Math.random() * 300, name: `${TYPES[type].label} ${k}` };
    setNet((s) => ({ ...s, nodes: [...s.nodes, node] }));
    if (type === 'pc' && !src) setSrc(id);
  };

  const removeLink = (i) => {
    if (mode !== 'slett') return;
    setNet((s) => ({ ...s, links: s.links.filter((_, j) => j !== i) }));
    say('info', 'Kabelen vart fjerna.');
  };

  const sendPacket = () => {
    const S = byId[src];
    if (!S) return say('warn', 'Vel kva PC som skal sende.');
    if (src === dst) return say('warn', 'Vel ein annan mottakar enn avsendaren.');
    const D = byId[dst];
    if (!ips[src]) {
      say('err', `${S.name} har ikkje fått IP-adresse. Han må koplast til ein ruter (direkte eller via switch).`);
      setPacket({ key: Date.now(), xs: [S.x, S.x + 30, S.x], ys: [S.y, S.y, S.y], ok: false });
      return;
    }
    const path = bfs(nodes, links, src, dst);
    if (!path) {
      say('err', `Ingen veg frå ${S.name} til ${D.name}. Pakken vart forkasta.`);
      const r = firstRouter(nodes, links, src);
      const R = byId[r];
      setPacket({ key: Date.now(), xs: [S.x, R.x, R.x], ys: [S.y, R.y, R.y], ok: false });
      return;
    }
    setPacket({ key: Date.now(), xs: path.map((p) => byId[p].x), ys: path.map((p) => byId[p].y), ok: true, path, to: dst });
  };

  const done = () => {
    if (!packet) return;
    if (packet.ok) {
      const names = packet.path.map((p) => byId[p]?.name).join(' → ');
      if (packet.to === 'net') {
        say('ok', `Levert! ${names}. Ruteren bytte avsendaradressa til den offentlege (NAT).`);
        update((s) => ({ packets: s.packets + 1 }), state.packets < 12 ? 6 : 0);
      } else {
        say('ok', `Levert lokalt i LAN: ${names}.`);
      }
    }
    setPacket(null);
  };

  const pcs = nodes.filter((n) => n.type === 'pc');
  const modes = [
    { id: 'kople', label: 'Kople kabel', icon: Cable },
    { id: 'flytt', label: 'Flytt', icon: Move },
    { id: 'slett', label: 'Slett', icon: Trash2 },
  ];

  return (
    <section id="simulator" className="scroll-mt-24 py-16">
      <SectionHead icon={Network} kicker="04 / Bygg" title="Nettverkssimulatoren" text="Kople saman PC-ar, switchar, ruterar og Internett. Sjå IP-adressene dukke opp, og send datapakkar gjennom nettet ditt." />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-iris-100 p-3">
          <div className="flex gap-1 rounded-2xl bg-iris-50 p-1">
            {modes.map((m) => (
              <button key={m.id} onClick={() => { setMode(m.id); setPending(null); }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === m.id ? 'bg-white text-iris-700 shadow-soft' : 'text-ink/60 hover:text-ink'}`}>
                <m.icon size={16} /> {m.label}
              </button>
            ))}
          </div>
          <div className="mx-1 hidden h-8 w-px bg-iris-100 sm:block" />
          <button onClick={() => add('pc')} className="btn-ghost !py-2 text-sm"><Plus size={15} /> PC</button>
          <button onClick={() => add('switch')} className="btn-ghost !py-2 text-sm"><Plus size={15} /> Switch</button>
          <button onClick={() => add('router')} className="btn-ghost !py-2 text-sm"><Plus size={15} /> Ruter</button>
          <button onClick={() => { setNet(START()); setPending(null); setSrc('pc1'); setDst('net'); say('info', 'Nettverket er nullstilt.'); }} className="btn-ghost !py-2 text-sm ml-auto"><RotateCcw size={15} /> Nullstill</button>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px]">
          <div className="relative bg-[linear-gradient(#f4f1ff_1px,transparent_1px),linear-gradient(90deg,#f4f1ff_1px,transparent_1px)] bg-[size:28px_28px]">
            <svg
              ref={svg}
              viewBox="0 0 800 460"
              className={`h-auto w-full touch-none select-none ${mode === 'flytt' ? 'cursor-move' : mode === 'slett' ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
              onPointerMove={onMove}
              onPointerUp={() => { drag.current = null; }}
              onPointerLeave={() => { drag.current = null; setMouse(null); }}
              onClick={() => setPending(null)}
            >
              {links.map((l, i) => {
                const A = byId[l.a], B = byId[l.b];
                if (!A || !B) return null;
                const wan = A.type === 'internet' || B.type === 'internet';
                return (
                  <g key={`${l.a}-${l.b}`} onClick={(e) => { e.stopPropagation(); removeLink(i); }} className={mode === 'slett' ? 'cursor-pointer' : ''}>
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="transparent" strokeWidth="18" />
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={wan ? '#4aa3f7' : '#b6a1ff'} strokeWidth="4" strokeLinecap="round" />
                    <motion.line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="white" strokeWidth="2" strokeDasharray="2 14" strokeLinecap="round"
                      animate={{ strokeDashoffset: [0, -32] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
                  </g>
                );
              })}
              {pending && mouse && byId[pending] && (
                <line x1={byId[pending].x} y1={byId[pending].y} x2={mouse.x} y2={mouse.y} stroke="#7c4df0" strokeWidth="3" strokeDasharray="6 6" pointerEvents="none" />
              )}
              {nodes.map((n) => {
                const T = TYPES[n.type];
                const I = T.icon;
                const big = n.type === 'internet';
                const s = big ? 42 : 30;
                const ip = n.type === 'pc' ? ips[n.id] : null;
                return (
                  <motion.g key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onPointerDown={(e) => onNodeDown(e, n)} onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                    {pending === n.id && <circle cx={n.x} cy={n.y} r={s + 12} fill="none" stroke="#7c4df0" strokeWidth="3" strokeDasharray="5 5" />}
                    {big ? (
                      <circle cx={n.x} cy={n.y} r={s} fill={T.fill} stroke={T.stroke} strokeWidth="2.5" />
                    ) : (
                      <rect x={n.x - s} y={n.y - s} width={s * 2} height={s * 2} rx="16" fill={T.fill} stroke={T.stroke} strokeWidth="2.5" />
                    )}
                    <foreignObject x={n.x - 13} y={n.y - 13} width="26" height="26" pointerEvents="none"><I size={26} color={T.color} /></foreignObject>
                    <text x={n.x} y={n.y + s + 16} textAnchor="middle" className="pointer-events-none fill-ink text-[12px] font-bold">{n.name}</text>
                    {n.type === 'pc' && (
                      <text x={n.x} y={n.y + s + 30} textAnchor="middle" className={`pointer-events-none font-mono text-[10px] font-bold ${ip ? 'fill-iris-600' : 'fill-rose-500'}`}>
                        {ip || 'ingen IP'}
                      </text>
                    )}
                    {n.type === 'router' && (
                      <text x={n.x} y={n.y + s + 30} textAnchor="middle" className="pointer-events-none fill-sky-600 font-mono text-[10px] font-bold">
                        {`192.168.${nodes.filter((x) => x.type === 'router').indexOf(n) + 1}.1`}
                      </text>
                    )}
                  </motion.g>
                );
              })}
              {packet && (
                <motion.g key={packet.key}>
                  <motion.circle r="11" fill={packet.ok ? '#7c4df0' : '#f43f5e'} stroke="white" strokeWidth="3"
                    initial={{ cx: packet.xs[0], cy: packet.ys[0] }}
                    animate={{ cx: packet.xs, cy: packet.ys, opacity: packet.ok ? 1 : [1, 1, 0] }}
                    transition={{ duration: 0.75 * (packet.xs.length - 1) + 0.2, ease: 'easeInOut' }}
                    onAnimationComplete={done} />
                </motion.g>
              )}
            </svg>
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="chip bg-white/90 text-ink/70 shadow-soft"><CircleCheck size={14} className="text-sky-500" /> {online} av {pcs.length} PC-ar på nett</span>
              {pending && <span className="chip bg-iris-600 text-white">Vel kva {byId[pending]?.name} skal koplast til</span>}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-iris-100 p-4 lg:border-l lg:border-t-0">
            <div>
              <div className="label mb-2">Send datapakke</div>
              <div className="grid grid-cols-2 gap-2">
                <select value={src} onChange={(e) => setSrc(e.target.value)} className="rounded-xl border border-iris-200 bg-white px-2 py-2 text-sm font-semibold">
                  <option value="">Frå …</option>
                  {pcs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={dst} onChange={(e) => setDst(e.target.value)} className="rounded-xl border border-iris-200 bg-white px-2 py-2 text-sm font-semibold">
                  <option value="net">Internett</option>
                  {pcs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button onClick={sendPacket} disabled={!!packet} className="btn-primary mt-2 w-full"><Send size={16} /> Send pakke</button>
            </div>
            <div className="flex-1">
              <div className="label mb-2 flex items-center gap-1.5"><Terminal size={13} /> Logg</div>
              <div className="flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {log.map((l, i) => (
                    <motion.div key={`${l.m}-${log.length - i}`} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-2 rounded-xl px-2.5 py-2 text-[13px] leading-snug ${l.t === 'ok' ? 'bg-sky-50 text-sky-700' : l.t === 'err' ? 'bg-rose-50 text-rose-600' : l.t === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-iris-50 text-iris-700'}`}>
                      {l.t === 'ok' ? <CircleCheck size={15} className="mt-0.5 shrink-0" /> : l.t === 'info' ? <Info size={15} className="mt-0.5 shrink-0" /> : <CircleAlert size={15} className="mt-0.5 shrink-0" />}
                      <span>{l.m}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            <p className="rounded-2xl bg-gradient-to-br from-iris-50 to-sky-50 p-3 text-[13px] leading-snug text-ink/70">
              Tips: Ein switch lar mange PC-ar dele éin port på ruteren. I «Slett»-modus kan du trykke på ein kabel for å fjerne han.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
