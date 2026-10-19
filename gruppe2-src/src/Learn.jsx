import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, Hash, Network, Boxes, BrickWall, Router as RouterIcon, Smartphone, Laptop, Tv, Gamepad2, Globe,
  Send, Shuffle, Printer, Server, School, Building2, Play, RotateCcw, Layers, PackageX,
} from 'lucide-react';
import { useStore } from './store.jsx';
import { SectionHead, Tabs } from './ui.jsx';

const TOPICS = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'ip', label: 'IP-adresser', icon: Hash },
  { id: 'lanwan', label: 'LAN og WAN', icon: Network },
  { id: 'pakkar', label: 'Datapakkar', icon: Boxes },
];

function Explain({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-2xl font-extrabold">{title}</h3>
      <div className="space-y-3 leading-relaxed text-ink/75">{children}</div>
    </div>
  );
}

function Key({ children, tone = 'iris' }) {
  return <span className={`rounded-md px-1.5 py-0.5 font-mono text-[0.9em] font-bold ${tone === 'sky' ? 'bg-sky-100 text-sky-600' : 'bg-iris-100 text-iris-700'}`}>{children}</span>;
}

/* ---------------- Wi-Fi ---------------- */
function WifiDemo({ touch }) {
  const [dist, setDist] = useState(8);
  const [wall, setWall] = useState(false);
  const [band, setBand] = useState('2.4');
  const range = band === '2.4' ? 46 : 26;
  const loss = wall ? (band === '2.4' ? 0.72 : 0.5) : 1;
  const strength = Math.max(0, Math.min(1, (1 - dist / range) * loss + (wall ? 0 : 0.05)));
  const max = band === '2.4' ? 150 : 900;
  const speed = Math.round(max * Math.pow(strength, 1.4));
  const bars = strength <= 0.02 ? 0 : Math.ceil(strength * 4);
  const phoneX = 90 + (dist / 40) * 470;
  const waveLen = band === '2.4' ? 46 : 22;

  const wave = useMemo(() => {
    let d = 'M 110 130';
    for (let x = 110; x <= phoneX - 24; x += 2) {
      const amp = 22 * Math.max(0.15, 1 - (x - 110) / 520) * (wall && x > 300 ? loss : 1);
      d += ` L ${x} ${130 + Math.sin((x / waveLen) * Math.PI * 2) * amp}`;
    }
    return d;
  }, [phoneX, waveLen, wall, loss]);

  const color = band === '2.4' ? '#2384e6' : '#7c4df0';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-3xl bg-gradient-to-b from-sky-50 to-white p-4">
        <svg viewBox="0 0 600 260" className="w-full">
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={`${band}-${i}`}
              cx="80" cy="130" fill="none" stroke={color} strokeWidth="2"
              initial={{ r: 20, opacity: 0.6 }}
              animate={{ r: range * 6, opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
            />
          ))}
          <motion.path d={wave} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.85}
            animate={{ strokeDashoffset: [0, -40] }} strokeDasharray="1000 0" />
          <AnimatePresence>
            {wall && (
              <motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <rect x="292" y="40" width="22" height="180" rx="4" fill="#d4c8ff" />
                {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="292" x2="314" y1={60 + i * 28} y2={60 + i * 28} stroke="#b6a1ff" strokeWidth="2" />)}
                <text x="303" y="236" textAnchor="middle" className="fill-iris-600 font-mono text-[11px] font-bold">BETONG</text>
              </motion.g>
            )}
          </AnimatePresence>
          <rect x="52" y="104" width="56" height="52" rx="14" fill="#1b1640" />
          <foreignObject x="64" y="114" width="32" height="32"><RouterIcon color="white" size={32} /></foreignObject>
          <motion.g animate={{ x: phoneX - 300 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
            <rect x="282" y="98" width="36" height="64" rx="9" fill="white" stroke="#1b1640" strokeWidth="3" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={289 + i * 6} y={146 - i * 6} width="4" height={8 + i * 6} rx="1.5" fill={i < bars ? color : '#e2e8f0'} />
            ))}
          </motion.g>
          <text x="80" y="185" textAnchor="middle" className="fill-ink font-mono text-[11px] font-bold">RUTER</text>
        </svg>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-semibold"><span>Avstand</span><span className="font-mono text-iris-600">{dist} m</span></span>
            <input type="range" min="2" max="40" value={dist} onChange={(e) => { setDist(+e.target.value); touch(); }} className="w-full accent-iris-600" />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            {['2.4', '5'].map((b) => (
              <button key={b} onClick={() => { setBand(b); touch(); }} className={`btn !py-2 text-sm ${band === b ? 'bg-ink text-white' : 'border border-iris-100 bg-white'}`}>{b} GHz</button>
            ))}
            <button onClick={() => { setWall((w) => !w); touch(); }} className={`btn !py-2 text-sm ${wall ? 'bg-iris-600 text-white' : 'border border-iris-100 bg-white'}`}>
              <BrickWall size={16} /> Vegg
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-iris-50 p-4">
            <div className="label">Signal</div>
            <div className="font-display text-3xl font-extrabold">{Math.round(strength * 100)}%</div>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <div className="label !text-sky-600">Fart</div>
            <div className="font-display text-3xl font-extrabold">{speed}<span className="text-base font-bold text-ink/50"> Mbit/s</span></div>
          </div>
        </div>
        <Explain title="Wi-Fi er radio">
          <p>Ruteren sender data gjennom lufta som radiobølgjer. <Key tone="sky">2,4 GHz</Key> har lange bølgjer som når langt og kjem gjennom veggar, men går seinare.</p>
          <p><Key>5 GHz</Key> har korte bølgjer. Dei kan bere mykje meir data, men blir fort svakare med avstand og veggar. Prøv sjølv med glidaren og vegg-knappen.</p>
        </Explain>
      </div>
    </div>
  );
}

/* ---------------- IP / NAT ---------------- */
const DEVICES = [
  { id: 'pc', name: 'Laptop', icon: Laptop, ip: '192.168.1.23' },
  { id: 'mob', name: 'Mobil', icon: Smartphone, ip: '192.168.1.42' },
  { id: 'tv', name: 'Smart-TV', icon: Tv, ip: '192.168.1.57' },
  { id: 'ps', name: 'Konsoll', icon: Gamepad2, ip: '192.168.1.88' },
];

function IpDemo({ touch }) {
  const [dev, setDev] = useState('pc');
  const [step, setStep] = useState(0);
  const timers = useRef([]);
  const d = DEVICES.find((x) => x.id === dev);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    touch();
    timers.current.forEach(clearTimeout);
    setStep(1);
    timers.current = [setTimeout(() => setStep(2), 1300), setTimeout(() => setStep(3), 2600), setTimeout(() => setStep(4), 3900)];
  };

  const devIndex = DEVICES.findIndex((x) => x.id === dev);
  const pos = [
    { x: 90, y: 50 + devIndex * 56 },
    { x: 90, y: 50 + devIndex * 56 },
    { x: 300, y: 140 },
    { x: 510, y: 140 },
    { x: 510, y: 140 },
  ][step];
  const label = step <= 1 ? d.ip : '84.215.37.120';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-3xl bg-gradient-to-b from-iris-50 to-white p-4">
        <svg viewBox="0 0 600 280" className="w-full">
          <rect x="20" y="16" width="230" height="248" rx="24" fill="white" stroke="#d4c8ff" strokeDasharray="6 6" strokeWidth="2" />
          <text x="36" y="40" className="fill-iris-500 font-mono text-[11px] font-bold">HEIMENETT (PRIVAT)</text>
          {DEVICES.map((x, i) => {
            const I = x.icon;
            const on = x.id === dev;
            return (
              <g key={x.id} onClick={() => { setDev(x.id); setStep(0); touch(); }} className="cursor-pointer">
                <rect x="34" y={30 + i * 56 + 4} width="200" height="44" rx="12" fill={on ? '#e9e3ff' : '#f8f7ff'} stroke={on ? '#7c4df0' : 'transparent'} strokeWidth="2" />
                <foreignObject x="44" y={30 + i * 56 + 14} width="24" height="24"><I size={22} color={on ? '#6834d6' : '#1b1640'} /></foreignObject>
                <text x="76" y={30 + i * 56 + 26} className="fill-ink text-[12px] font-semibold">{x.name}</text>
                <text x="76" y={30 + i * 56 + 41} className="fill-iris-600 font-mono text-[11px]">{x.ip}</text>
              </g>
            );
          })}
          <rect x="268" y="104" width="64" height="72" rx="16" fill="#1b1640" />
          <foreignObject x="284" y="116" width="32" height="32"><RouterIcon color="white" size={32} /></foreignObject>
          <text x="300" y="166" textAnchor="middle" className="fill-white font-mono text-[9px]">NAT</text>
          <text x="300" y="196" textAnchor="middle" className="fill-ink font-mono text-[10px] font-bold">LAN 192.168.1.1</text>
          <text x="300" y="210" textAnchor="middle" className="fill-sky-600 font-mono text-[10px] font-bold">WAN 84.215.37.120</text>
          <circle cx="510" cy="140" r="54" fill="#eef7ff" stroke="#82c3ff" strokeWidth="2" />
          <foreignObject x="490" y="104" width="40" height="40"><Globe size={40} color="#2384e6" /></foreignObject>
          <text x="510" y="164" textAnchor="middle" className="fill-ink text-[12px] font-bold">nettstad.no</text>
          <text x="510" y="178" textAnchor="middle" className="fill-sky-600 font-mono text-[10px]">195.88.54.16</text>
          <line x1="236" y1="140" x2="268" y2="140" stroke="#b6a1ff" strokeWidth="3" />
          <line x1="332" y1="140" x2="456" y2="140" stroke="#82c3ff" strokeWidth="3" />
          {step > 0 && step < 4 && (
            <motion.g initial={false} animate={{ x: pos.x - 90, y: pos.y - 50 }} transition={{ duration: 1.1, ease: 'easeInOut' }}>
              <rect x="40" y="34" width="118" height="32" rx="10" fill={step >= 2 ? '#2384e6' : '#7c4df0'} />
              <text x="99" y="54" textAnchor="middle" className="fill-white font-mono text-[10px] font-bold">frå {label}</text>
            </motion.g>
          )}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button onClick={run} className="btn-primary"><Send size={16} /> Send førespurnad frå {d.name.toLowerCase()}</button>
          <span className="text-sm text-ink/60">
            {['Vel ei eining og send.', 'Pakken har den private adressa.', 'Ruteren byter til den offentlege adressa (NAT).', 'Nettstaden ser berre ruteren si adresse.', 'Svaret går tilbake same veg, og ruteren hugsar kven som spurde.'][step]}
          </span>
        </div>
      </div>
      <Explain title="Kvar eining har ei adresse">
        <p>Ei IP-adresse er som ei postadresse for data. Alle einingane heime får ei <Key>privat adresse</Key> frå ruteren, til dømes <Key>192.168.1.23</Key>.</p>
        <p>Ut mot Internett deler heile huset éi <Key tone="sky">offentleg adresse</Key>. Ruteren held styr på kven som sende kva – det heiter NAT. Trykk på ei eining og send ein pakke.</p>
      </Explain>
    </div>
  );
}

/* ---------------- LAN / WAN ---------------- */
function LanWanDemo({ touch }) {
  const [focus, setFocus] = useState('begge');
  const [trip, setTrip] = useState(null);
  const key = useRef(0);

  const send = (kind) => { touch(); key.current += 1; setTrip({ kind, k: key.current }); };
  const lanOn = focus !== 'wan';
  const wanOn = focus !== 'lan';
  const path = trip?.kind === 'lan'
    ? { x: [110, 230, 110], y: [90, 140, 200] }
    : { x: [110, 230, 300, 420, 500], y: [90, 140, 140, 120, 90] };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-3xl bg-gradient-to-b from-sky-50 to-white p-4">
        <svg viewBox="0 0 600 280" className="w-full">
          <motion.ellipse cx="140" cy="145" rx="125" ry="118" fill="#f4f1ff" stroke="#9672fb" strokeWidth="2.5" strokeDasharray="8 6" animate={{ opacity: lanOn ? 1 : 0.25 }} />
          <motion.path d="M 330 60 Q 380 0 450 40 Q 540 10 570 90 Q 610 170 540 220 Q 470 270 400 230 Q 320 250 320 170 Q 280 110 330 60 Z" fill="#eef7ff" stroke="#4aa3f7" strokeWidth="2.5" animate={{ opacity: wanOn ? 1 : 0.25 }} />
          <text x="60" y="44" className="fill-iris-600 font-display text-[18px] font-extrabold">LAN</text>
          <text x="470" y="62" className="fill-sky-600 font-display text-[18px] font-extrabold">WAN</text>
          {[
            { I: Laptop, x: 96, y: 76, t: 'PC' },
            { I: Printer, x: 96, y: 186, t: 'Skrivar' },
            { I: Smartphone, x: 40, y: 130, t: 'Mobil' },
          ].map(({ I, x, y, t }) => (
            <g key={t}>
              <circle cx={x + 14} cy={y + 14} r="22" fill="white" stroke="#d4c8ff" />
              <foreignObject x={x + 2} y={y + 2} width="24" height="24"><I size={24} color="#1b1640" /></foreignObject>
              <text x={x + 14} y={y + 50} textAnchor="middle" className="fill-ink text-[10px] font-semibold">{t}</text>
            </g>
          ))}
          {[
            { I: School, x: 380, y: 70, t: 'Skule' },
            { I: Server, x: 480, y: 76, t: 'Server' },
            { I: Building2, x: 420, y: 170, t: 'Bedrift' },
            { I: Globe, x: 510, y: 160, t: 'Nettstad' },
          ].map(({ I, x, y, t }) => (
            <g key={t}>
              <circle cx={x + 14} cy={y + 14} r="22" fill="white" stroke="#b6dcff" />
              <foreignObject x={x + 2} y={y + 2} width="24" height="24"><I size={24} color="#1669c4" /></foreignObject>
              <text x={x + 14} y={y + 50} textAnchor="middle" className="fill-ink text-[10px] font-semibold">{t}</text>
            </g>
          ))}
          <rect x="236" y="112" width="64" height="58" rx="16" fill="#1b1640" />
          <foreignObject x="252" y="124" width="32" height="32"><RouterIcon color="white" size={32} /></foreignObject>
          <text x="268" y="190" textAnchor="middle" className="fill-ink font-mono text-[10px] font-bold">RUTER</text>
          {trip && (
            <motion.circle key={trip.k} r="9" fill={trip.kind === 'lan' ? '#7c4df0' : '#2384e6'} stroke="white" strokeWidth="3"
              initial={{ cx: path.x[0], cy: path.y[0], opacity: 1 }}
              animate={{ cx: path.x, cy: path.y, opacity: [1, 1, 1, 1, 0].slice(0, path.x.length) }}
              transition={{ duration: 2.2, ease: 'easeInOut' }} />
          )}
        </svg>
        <div className="mt-2 flex flex-wrap gap-2">
          {['lan', 'wan', 'begge'].map((f) => (
            <button key={f} onClick={() => { setFocus(f); touch(); }} className={`btn !py-2 text-sm ${focus === f ? 'bg-ink text-white' : 'border border-iris-100 bg-white'}`}>
              <Layers size={15} /> {f === 'begge' ? 'Begge' : f.toUpperCase()}
            </button>
          ))}
          <button onClick={() => send('lan')} className="btn !py-2 text-sm bg-iris-100 text-iris-700"><Printer size={15} /> Skriv ut</button>
          <button onClick={() => send('wan')} className="btn !py-2 text-sm bg-sky-100 text-sky-600"><Globe size={15} /> Opne nettstad</button>
        </div>
      </div>
      <Explain title="Heime og ute">
        <p><Key>LAN</Key> er det lokale nettet ditt: alt som er kopla til ruteren heime eller på skulen. Trafikk til skrivaren treng aldri forlate huset.</p>
        <p><Key tone="sky">WAN</Key> er det store nettet utanfor – alle andre nett i verda, til saman Internett. Ruteren står på grensa og sender pakkar over berre når dei skal ut.</p>
      </Explain>
    </div>
  );
}

/* ---------------- Datapakkar ---------------- */
function PacketDemo({ touch }) {
  const [msg, setMsg] = useState('Hei frå Stord! Ruterar er kule.');
  const [phase, setPhase] = useState('klar');
  const [lose, setLose] = useState(false);
  const [order, setOrder] = useState([]);
  const [lost, setLost] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const chunks = useMemo(() => {
    const out = [];
    for (let i = 0; i < msg.length; i += 6) out.push(msg.slice(i, i + 6));
    return out.slice(0, 8);
  }, [msg]);

  const send = () => {
    touch();
    timers.current.forEach(clearTimeout);
    const idx = chunks.map((_, i) => i).sort(() => Math.random() - 0.5);
    const missing = lose && chunks.length > 1 ? idx[Math.floor(Math.random() * idx.length)] : null;
    setLost(missing);
    setOrder(idx.filter((i) => i !== missing));
    setPhase('sender');
    timers.current = [setTimeout(() => setPhase(missing !== null ? 'manglar' : 'framme'), 2200)];
  };
  const resend = () => {
    setOrder((o) => [...o, lost]);
    setLost(null);
    setPhase('framme');
  };
  const assemble = () => { setOrder((o) => [...o].sort((a, b) => a - b)); setPhase('samla'); };
  const reset = () => { setPhase('klar'); setOrder([]); setLost(null); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-3xl bg-gradient-to-b from-iris-50 to-white p-5">
        <label className="mb-1 block text-sm font-semibold">Melding som skal sendast</label>
        <input
          value={msg}
          maxLength={48}
          onChange={(e) => { setMsg(e.target.value || ' '); reset(); }}
          className="w-full rounded-2xl border border-iris-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-iris-500 focus:ring-4 focus:ring-iris-100"
        />
        <div className="mt-4 label">Avsendar deler opp i pakkar</div>
        <div className="mt-2 flex min-h-[54px] flex-wrap gap-2">
          {chunks.map((c, i) => (
            <motion.div key={`${i}-${c}`} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: phase === 'klar' ? 1 : 0.35 }}
              className="flex items-center gap-1.5 rounded-xl border border-iris-200 bg-white px-2 py-1.5 font-mono text-xs">
              <span className="rounded-md bg-iris-600 px-1.5 py-0.5 text-[10px] font-bold text-white">#{i + 1}</span>
              <span className="whitespace-pre">{c}</span>
            </motion.div>
          ))}
        </div>
        <div className="relative my-4 h-16 overflow-hidden rounded-2xl bg-white">
          <div className="absolute inset-x-4 top-1/2 h-px bg-iris-200" />
          {phase === 'sender' && chunks.map((_, i) => (
            <motion.div key={i}
              className={`absolute top-3 grid h-10 w-10 place-items-center rounded-xl font-mono text-xs font-bold text-white ${i === lost ? 'bg-rose-400' : i % 2 ? 'bg-sky-500' : 'bg-iris-500'}`}
              initial={{ left: '-10%', y: ((i * 13) % 3 - 1) * 10 }}
              animate={i === lost ? { left: ['-10%', '45%'], opacity: [1, 1, 0], scale: [1, 1, 0.3] } : { left: '105%' }}
              transition={{ duration: 1.1 + ((i * 7) % 5) * 0.2, delay: ((i * 3) % 4) * 0.15, ease: 'easeInOut' }}
            >#{i + 1}</motion.div>
          ))}
          {phase === 'klar' && <div className="absolute inset-0 grid place-items-center text-sm text-ink/40">Internett</div>}
        </div>
        <div className="label !text-sky-600">Mottakar</div>
        <div className="mt-2 flex min-h-[54px] flex-wrap gap-2">
          <AnimatePresence>
            {phase !== 'klar' && phase !== 'sender' && order.map((i) => (
              <motion.div key={i} layout initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2 py-1.5 font-mono text-xs">
                <span className="rounded-md bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white">#{i + 1}</span>
                <span className="whitespace-pre">{chunks[i]}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {phase === 'samla' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-2xl bg-white p-3 font-mono text-sm font-bold text-iris-700">{chunks.join('')}</motion.p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={send} disabled={phase === 'sender'} className="btn-primary"><Play size={16} /> Send</button>
          {phase === 'manglar' && <button onClick={resend} className="btn bg-rose-100 text-rose-600"><PackageX size={16} /> Be om pakke #{lost + 1} på nytt</button>}
          {phase === 'framme' && <button onClick={assemble} className="btn-sky"><Shuffle size={16} /> Set saman i rett rekkjefølgje</button>}
          <button onClick={() => { setLose((l) => !l); touch(); }} className={`btn text-sm ${lose ? 'bg-rose-500 text-white' : 'border border-iris-100 bg-white'}`}>
            <PackageX size={16} /> Mist ein pakke
          </button>
          <button onClick={reset} className="btn-ghost"><RotateCcw size={16} /></button>
        </div>
      </div>
      <Explain title="Alt blir delt i småbitar">
        <p>Når du sender noko på nettet, blir det delt opp i små <Key>datapakkar</Key>. Kvar pakke har eit nummer og adressa til mottakaren.</p>
        <p>Pakkane kan ta ulike vegar og kome fram i feil rekkjefølgje. Mottakaren brukar nummera til å setje dei saman igjen, og ber om å få tilsendt pakkar som har kome bort. Slå på «Mist ein pakke» og sjå kva som skjer.</p>
      </Explain>
    </div>
  );
}

export default function Learn() {
  const { state, update } = useStore();
  const [tab, setTab] = useState('wifi');
  const touch = (id) => {
    if (!state.learned.includes(id)) update((s) => ({ learned: s.learned.includes(id) ? s.learned : [...s.learned, id] }), 15);
  };
  const choose = (id) => { setTab(id); touch(id); };
  const Comp = { wifi: WifiDemo, ip: IpDemo, lanwan: LanWanDemo, pakkar: PacketDemo }[tab];

  return (
    <section id="laer" className="scroll-mt-24 py-16">
      <SectionHead icon={Layers} kicker="03 / Lær" title="Sjå korleis nettet verkar" text="Fire interaktive animasjonar. Dra, trykk og prøv – kvar ny animasjon du testar gir XP." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs group="learn" value={tab} onChange={choose} items={TOPICS.map((t) => ({ ...t, label: state.learned.includes(t.id) ? `${t.label}` : t.label }))} />
        <span className="chip bg-white text-ink/60 shadow-soft">{state.learned.length}/4 sett</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="card p-5 md:p-7">
          <Comp touch={() => touch(tab)} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
