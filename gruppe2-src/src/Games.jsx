import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2, Stethoscope, Binary, Globe, Router as RouterIcon, Monitor, Smartphone, WifiOff, Wifi, Plug, Power,
  CircleCheck, CircleX, Activity, RefreshCw, ArrowRight, Flame, Timer, X, Settings2,
} from 'lucide-react';
import { useStore } from './store.jsx';
import { SectionHead, Tabs } from './ui.jsx';

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

/* ================= Nettverksdoktor ================= */
const FAULTS = ['wan', 'lanA', 'lanB', 'power', 'ipA', 'ipB', 'wifi'];
const OK = { wan: true, lanA: true, lanB: true, power: true, ipA: true, ipB: true, wifi: true };

function newRound(level) {
  const n = Math.min(2 + Math.floor(level / 2), 4);
  const picked = shuffle(FAULTS).slice(0, n);
  const st = { ...OK };
  picked.forEach((f) => { st[f] = false; });
  return { st, faults: n, start: Date.now(), mistakes: 0, done: false, key: Math.random() };
}

const BAD_IP = { ipA: '10.0.0.15', ipB: '192.168.7.30' };
const GOOD_IP = { ipA: '192.168.1.20', ipB: '192.168.1.31' };

function Doctor() {
  const { state, update } = useStore();
  const [round, setRound] = useState(() => newRound(state.fixed));
  const [msg, setMsg] = useState({ t: 'info', m: 'Nokre einingar har ikkje Internett. Trykk på kablar og einingar for å finne og rette feila.' });
  const [ipFor, setIpFor] = useState(null);
  const [tested, setTested] = useState(false);
  const [now, setNow] = useState(Date.now());
  const st = round.st;

  useEffect(() => {
    if (round.done) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [round.done]);

  const online = {
    pcA: st.wan && st.power && st.lanA && st.ipA,
    pcB: st.wan && st.power && st.lanB && st.ipB,
    mob: st.wan && st.power && st.wifi,
  };
  const allOk = Object.values(st).every(Boolean);
  const secs = Math.floor(((round.done ? round.end : now) - round.start) / 1000);

  const fix = (key, okText, fixText) => {
    if (round.done) return;
    setTested(false);
    if (st[key]) {
      setRound((r) => ({ ...r, mistakes: r.mistakes + 1 }));
      setMsg({ t: 'warn', m: okText });
    } else {
      setRound((r) => ({ ...r, st: { ...r.st, [key]: true } }));
      setMsg({ t: 'ok', m: fixText });
    }
  };

  const clickPC = (key) => {
    if (round.done) return;
    if (st[key]) { setRound((r) => ({ ...r, mistakes: r.mistakes + 1 })); setMsg({ t: 'warn', m: 'IP-innstillingane på denne PC-en ser rette ut.' }); return; }
    setIpFor(key);
  };

  const ipOptions = useMemo(() => shuffle(['192.168.1.20', '192.168.1.255', '10.0.0.15', '192.168.2.20']), [round.key, ipFor]);

  const chooseIp = (ip) => {
    if (ip === '192.168.1.20') {
      setRound((r) => ({ ...r, st: { ...r.st, [ipFor]: true } }));
      setMsg({ t: 'ok', m: 'Rett! Adressa er i same nett som ruteren (192.168.1.x) og er ikkje reservert.' });
      setIpFor(null);
    } else {
      setRound((r) => ({ ...r, mistakes: r.mistakes + 1 }));
      setMsg({ t: 'err', m: ip.endsWith('.255') ? '.255 er kringkastingsadressa i nettet – ho kan ikkje brukast av ein PC.' : 'Den adressa er i eit anna nett enn ruteren (192.168.1.x).' });
    }
  };

  const test = () => {
    setTested(true);
    if (allOk) {
      const bonus = Math.max(0, 30 - secs) + Math.max(0, 20 - round.mistakes * 5);
      setRound((r) => ({ ...r, done: true, end: Date.now() }));
      setMsg({ t: 'ok', m: `Alt fungerer! Nettverket er reparert på ${secs} sekund. Bonus: ${bonus} XP.` });
      update((s) => ({ fixed: s.fixed + 1 }), 40 + bonus);
    } else {
      const off = Object.entries(online).filter(([, v]) => !v).length;
      setMsg({ t: 'err', m: `Testen feila: ${off} eining${off === 1 ? '' : 'ar'} manglar framleis Internett.` });
    }
  };

  const next = () => { setRound(newRound(state.fixed)); setTested(false); setMsg({ t: 'info', m: 'Nytt nettverk – nye feil. Lukke til!' }); };

  const cable = (key, x1, y1, x2, y2, label) => {
    const on = st[key];
    const mx = x1 + (x2 - x1) * 0.62, my = y1 + (y2 - y1) * 0.62;
    return (
      <g onClick={() => fix(key, 'Denne kabelen sit godt i begge endar.', `Du kopla i ${label}.`)} className="cursor-pointer">
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="22" />
        {on ? (
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={key === 'wan' ? '#4aa3f7' : '#b6a1ff'} strokeWidth="5" strokeLinecap="round" />
        ) : (
          <>
            <line x1={x1} y1={y1} x2={mx} y2={my} stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 8" />
            <rect x={mx - 12} y={my - 12} width="24" height="24" rx="7" fill="#fff1f2" stroke="#fb7185" strokeWidth="2" />
            <foreignObject x={mx - 8} y={my - 8} width="16" height="16"><Plug size={16} color="#e11d48" /></foreignObject>
          </>
        )}
      </g>
    );
  };

  const Device = ({ x, y, icon: I, name, ok, sub, subBad, onClick, extra }) => (
    <g onClick={onClick} className="cursor-pointer">
      <rect x={x - 34} y={y - 34} width="68" height="68" rx="18" fill="white" stroke={tested ? (ok ? '#38bdf8' : '#fb7185') : '#d4c8ff'} strokeWidth="2.5" />
      <foreignObject x={x - 14} y={y - 14} width="28" height="28"><I size={28} color="#1b1640" /></foreignObject>
      <text x={x} y={y + 52} textAnchor="middle" className="fill-ink text-[12px] font-bold">{name}</text>
      {sub && <text x={x} y={y + 66} textAnchor="middle" className={`font-mono text-[10px] font-bold ${subBad ? 'fill-rose-500' : 'fill-iris-600'}`}>{sub}</text>}
      {extra}
    </g>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="relative rounded-3xl bg-gradient-to-b from-iris-50 to-white p-3">
        <svg viewBox="0 0 720 340" className="w-full select-none">
          {cable('wan', 360, 170, 610, 70, 'WAN-kabelen')}
          {cable('lanA', 360, 170, 110, 80, 'kabelen til PC A')}
          {cable('lanB', 360, 170, 110, 260, 'kabelen til PC B')}
          {st.power && st.wifi && [0, 1].map((i) => (
            <motion.circle key={i} cx="360" cy="170" fill="none" stroke="#9672fb" strokeWidth="2" initial={{ r: 30, opacity: 0.5 }} animate={{ r: 140, opacity: 0 }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1 }} />
          ))}
          <g onClick={() => fix('power', 'Ruteren er allereie på.', 'Du skrudde på ruteren. Lampane lyser igjen.')} className="cursor-pointer">
            <rect x="314" y="128" width="92" height="84" rx="22" fill={st.power ? '#1b1640' : '#64748b'} />
            <foreignObject x="344" y="140" width="32" height="32"><RouterIcon size={32} color="white" /></foreignObject>
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={336 + i * 16} cy="192" r="4" fill={st.power ? (i === 0 ? '#4ade80' : '#7dd3fc') : '#475569'} />
            ))}
            {!st.power && <foreignObject x="392" y="116" width="26" height="26"><div className="grid h-[26px] w-[26px] place-items-center rounded-full bg-rose-500"><Power size={14} color="white" /></div></foreignObject>}
            <text x="360" y="232" textAnchor="middle" className="fill-ink text-[12px] font-bold">Ruter</text>
          </g>
          <g>
            <circle cx="610" cy="70" r="40" fill="#eef7ff" stroke="#4aa3f7" strokeWidth="2.5" />
            <foreignObject x="592" y="52" width="36" height="36"><Globe size={36} color="#2384e6" /></foreignObject>
          </g>
          <Device x={110} y={80} icon={Monitor} name="PC A" ok={online.pcA} sub={st.ipA ? GOOD_IP.ipA : BAD_IP.ipA} subBad={!st.ipA} onClick={() => clickPC('ipA')} />
          <Device x={110} y={260} icon={Monitor} name="PC B" ok={online.pcB} sub={st.ipB ? GOOD_IP.ipB : BAD_IP.ipB} subBad={!st.ipB} onClick={() => clickPC('ipB')} />
          <Device x={600} y={250} icon={Smartphone} name="Mobil" ok={online.mob} onClick={() => fix('wifi', 'Wi-Fi er allereie slått på.', 'Du slo av flymodus. Mobilen koplar seg til Wi-Fi.')}
            extra={<foreignObject x="622" y="208" width="24" height="24"><div className={`grid h-6 w-6 place-items-center rounded-full ${st.wifi ? 'bg-sky-500' : 'bg-rose-500'}`}>{st.wifi ? <Wifi size={13} color="white" /> : <WifiOff size={13} color="white" />}</div></foreignObject>} />
        </svg>

        <AnimatePresence>
          {ipFor && (
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              className="absolute inset-0 grid place-items-center rounded-3xl bg-white/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-3xl border border-iris-100 bg-white p-5 shadow-lift">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display text-lg font-extrabold"><Settings2 size={18} /> IP-innstillingar, {ipFor === 'ipA' ? 'PC A' : 'PC B'}</div>
                  <button onClick={() => setIpFor(null)} className="rounded-lg p-1 hover:bg-iris-50" aria-label="Lukk"><X size={18} /></button>
                </div>
                <p className="mb-3 text-sm text-ink/70">Ruteren har adressa <b className="font-mono">192.168.1.1</b>. No har PC-en <b className="font-mono text-rose-500">{BAD_IP[ipFor]}</b>. Vel ei betre adresse:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ipOptions.map((ip) => (
                    <button key={ip} onClick={() => chooseIp(ip)} className="rounded-xl border border-iris-200 bg-iris-50 px-3 py-2.5 font-mono text-sm font-bold text-iris-700 transition hover:border-iris-500 hover:bg-white">{ip}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-iris-50 p-3"><div className="label">Feil</div><div className="font-display text-2xl font-extrabold">{round.faults}</div></div>
          <div className="rounded-2xl bg-sky-50 p-3"><div className="label !text-sky-600 flex items-center gap-1"><Timer size={11} />Tid</div><div className="font-display text-2xl font-extrabold">{secs}s</div></div>
          <div className="rounded-2xl bg-rose-50 p-3"><div className="label !text-rose-500">Bom</div><div className="font-display text-2xl font-extrabold">{round.mistakes}</div></div>
        </div>
        <div className="rounded-2xl border border-iris-100 bg-white p-3">
          <div className="label mb-2">Status etter siste test</div>
          {[['pcA', 'PC A'], ['pcB', 'PC B'], ['mob', 'Mobil']].map(([k, n]) => (
            <div key={k} className="flex items-center justify-between py-1 text-sm font-semibold">
              <span>{n}</span>
              {!tested ? <span className="text-ink/40">ikkje testa</span> : online[k]
                ? <span className="flex items-center gap-1 text-sky-600"><CircleCheck size={15} /> på nett</span>
                : <span className="flex items-center gap-1 text-rose-500"><CircleX size={15} /> ingen Internett</span>}
            </div>
          ))}
        </div>
        <motion.div key={msg.m} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-3 text-sm leading-snug ${msg.t === 'ok' ? 'bg-sky-50 text-sky-700' : msg.t === 'err' ? 'bg-rose-50 text-rose-600' : msg.t === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-iris-50 text-iris-700'}`}>
          {msg.m}
        </motion.div>
        {round.done ? (
          <button onClick={next} className="btn-primary"><RefreshCw size={16} /> Nytt nettverk</button>
        ) : (
          <button onClick={test} className="btn-sky"><Activity size={16} /> Test nettverket</button>
        )}
        <p className="text-xs text-ink/50">Reparerte nettverk: {state.fixed}. Kvar runde blir litt vanskelegare.</p>
      </div>
    </div>
  );
}

/* ================= IP-utfordring ================= */
function makeQuestion() {
  const kind = rnd(0, 4);
  const N = rnd(0, 20) * 1 + (Math.random() < 0.5 ? 1 : 0);
  if (kind === 0) {
    const host = rnd(2, 254);
    return {
      q: `Ruteren har adressa 192.168.${N}.1 med nettmaske 255.255.255.0. Kva adresse kan du gi ein ny PC?`,
      opts: shuffle([`192.168.${N}.${host}`, `192.168.${N + 1}.${host}`, `192.168.${N}.255`, `192.168.${N}.256`]),
      a: `192.168.${N}.${host}`,
      why: `PC-en må vere i same nett (192.168.${N}.x). .255 er kringkastingsadressa, og 256 er for stort – kvart tal går berre frå 0 til 255.`,
    };
  }
  if (kind === 1) {
    const priv = Math.random() < 0.5;
    const ip = priv
      ? shuffle([`192.168.${rnd(0, 254)}.${rnd(2, 254)}`, `10.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(2, 254)}`, `172.${rnd(16, 31)}.${rnd(0, 255)}.${rnd(2, 254)}`])[0]
      : shuffle([`84.${rnd(200, 220)}.${rnd(0, 255)}.${rnd(2, 254)}`, `8.8.8.8`, `151.101.${rnd(0, 255)}.${rnd(2, 254)}`, `195.88.${rnd(0, 255)}.${rnd(2, 254)}`])[0];
    return {
      q: `Er ${ip} ei privat eller ei offentleg IP-adresse?`,
      opts: ['Privat', 'Offentleg'],
      a: priv ? 'Privat' : 'Offentleg',
      why: 'Private adresser startar med 10., 172.16–31. eller 192.168. Dei blir berre brukte inne i lokale nett. Alle andre er offentlege og kan nåast frå Internett.',
    };
  }
  if (kind === 2) {
    const good = `${rnd(1, 223)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
    return {
      q: 'Kva av desse er ei gyldig IPv4-adresse?',
      opts: shuffle([good, `${rnd(1, 200)}.${rnd(256, 320)}.${rnd(0, 255)}.${rnd(1, 254)}`, `${rnd(1, 200)}.${rnd(0, 255)}.${rnd(1, 254)}`, `${rnd(1, 200)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}.${rnd(1, 9)}`]),
      a: good,
      why: 'Ei IPv4-adresse har nøyaktig fire tal skilde med punktum, og kvart tal er mellom 0 og 255.',
    };
  }
  if (kind === 3) {
    const host = rnd(20, 200);
    return {
      q: `Ein PC har adressa 10.0.${N}.${host}. Ruteren (standard gateway) har vanlegvis første adressa i nettet. Kva er ho?`,
      opts: shuffle([`10.0.${N}.1`, `10.0.${N}.255`, `10.1.${N}.1`, `192.168.1.${host}`]),
      a: `10.0.${N}.1`,
      why: 'Standard gateway er ruteren si adresse i same nett som PC-en. Svært ofte er det den første adressa, som endar på .1.',
    };
  }
  const base = rnd(10, 90);
  return {
    q: `Kva eining er i same lokale nett som 192.168.${N}.${base} (nettmaske 255.255.255.0)?`,
    opts: shuffle([`192.168.${N}.${base + rnd(5, 100)}`, `192.168.${N + 2}.${base}`, `192.169.${N}.${base}`, `10.168.${N}.${base}`]),
    a: null,
    why: `Med nettmaska 255.255.255.0 må dei tre første tala vere like: 192.168.${N}. Berre det siste talet skil einingane.`,
  };
}

function IpChallenge() {
  const { state, update } = useStore();
  const [q, setQ] = useState(() => fixQ(makeQuestion()));
  const [pick, setPick] = useState(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ r: 0, t: 0 });

  function fixQ(x) { return x.a ? x : { ...x, a: x.opts.find((o) => o.startsWith(x.q.match(/192\.168\.\d+\./)[0])) }; }

  const answer = (o) => {
    if (pick) return;
    setPick(o);
    const right = o === q.a;
    setScore((s) => ({ r: s.r + (right ? 1 : 0), t: s.t + 1 }));
    if (right) {
      const ns = streak + 1;
      setStreak(ns);
      update((s) => ({ ipSolved: s.ipSolved + 1, bestStreak: Math.max(s.bestStreak, ns) }), 10 + Math.min(ns, 5) * 2);
    } else setStreak(0);
  };
  const next = () => { setQ(fixQ(makeQuestion())); setPick(null); };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="chip bg-iris-50 text-iris-700">Løyst totalt: {state.ipSolved}</span>
        <span className="chip bg-sky-50 text-sky-600">Denne økta: {score.r}/{score.t}</span>
        <span className={`chip ${streak >= 3 ? 'bg-gradient-to-r from-iris-500 to-sky-500 text-white' : 'bg-white text-ink/60 border border-iris-100'}`}><Flame size={13} /> Rekkje: {streak}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.q + q.opts.join()} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          <h3 className="mb-5 font-display text-xl font-extrabold leading-snug md:text-2xl">{q.q}</h3>
          <div className={`grid gap-3 ${q.opts.length === 2 ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
            {q.opts.map((o) => {
              const state = !pick ? 'idle' : o === q.a ? 'right' : o === pick ? 'wrong' : 'dim';
              return (
                <motion.button key={o} whileHover={!pick ? { y: -3 } : {}} whileTap={!pick ? { scale: 0.97 } : {}} onClick={() => answer(o)}
                  animate={state === 'wrong' ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                  className={`flex items-center justify-between rounded-2xl border-2 px-4 py-4 text-left font-mono text-base font-bold transition-colors ${
                    state === 'right' ? 'border-sky-500 bg-sky-50 text-sky-700' : state === 'wrong' ? 'border-rose-400 bg-rose-50 text-rose-600' : state === 'dim' ? 'border-iris-100 bg-white text-ink/35' : 'border-iris-100 bg-white hover:border-iris-400'
                  }`}>
                  {o}
                  {state === 'right' && <CircleCheck size={20} />}
                  {state === 'wrong' && <CircleX size={20} />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {pick && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-iris-50 to-sky-50 p-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm leading-relaxed text-ink/75"><b>{pick === q.a ? 'Rett!' : 'Ikkje heilt.'}</b> {q.why}</p>
            <button onClick={next} className="btn-primary shrink-0">Neste <ArrowRight size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Games() {
  const [tab, setTab] = useState('doktor');
  return (
    <section id="spel" className="scroll-mt-24 py-16">
      <SectionHead icon={Gamepad2} kicker="05 / Spel" title="Minispel" text="Bli nettverksdoktor og finn feila før tida renn ut, eller test IP-kunnskapane dine i stadig nye utfordringar." />
      <div className="mb-5">
        <Tabs group="games" value={tab} onChange={setTab} items={[{ id: 'doktor', label: 'Nettverksdoktor', icon: Stethoscope }, { id: 'ip', label: 'IP-utfordring', icon: Binary }]} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="card p-4 md:p-7">
          {tab === 'doktor' ? <Doctor /> : <IpChallenge />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
