import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Router as RouterIcon, Laptop, Smartphone, Tv, Gamepad2, Printer, Watch, ArrowRight, Box, Network, Layers, GraduationCap,
  Target, LayoutDashboard, Zap, Lock, CircleCheck, ChevronRight, RotateCcw, ArrowLeft, Sparkles,
} from 'lucide-react';
import { useStore, levelFor, LEVELS, CHAPTERS, BADGES, ALL_MISSIONS, chapterUnlocked, scrollToId, PART_COUNT } from './store.jsx';
import { SectionHead, Toasts } from './ui.jsx';
import Router3D from './Router3D.jsx';
import Learn from './Learn.jsx';
import Simulator from './Simulator.jsx';
import Games from './Games.jsx';
import Quiz from './Quiz.jsx';

const NAV = [
  { id: 'dashboard', label: 'Oppdrag', icon: Target },
  { id: 'ruter', label: '3D-ruter', icon: Box },
  { id: 'laer', label: 'Lær', icon: Layers },
  { id: 'simulator', label: 'Simulator', icon: Network },
  { id: 'spel', label: 'Spel', icon: Gamepad2 },
  { id: 'quiz', label: 'Quiz', icon: GraduationCap },
];

function Nav() {
  const { state } = useStore();
  const [active, setActive] = useState('');
  const lv = levelFor(state.xp);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-iris-100/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 via-iris-500 to-iris-700 text-white shadow-lift">
            <RouterIcon size={18} strokeWidth={2.4} />
          </span>
          <span className="hidden font-display text-lg font-extrabold tracking-tight sm:block">Ruterlabben</span>
        </button>
        <nav className="no-scrollbar mx-auto flex gap-0.5 overflow-x-auto">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => scrollToId(n.id)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${active === n.id ? 'text-iris-700' : 'text-ink/55 hover:text-ink'}`}>
              {active === n.id && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-iris-50" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <n.icon size={15} className="relative" />
              <span className="relative hidden md:inline">{n.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => scrollToId('dashboard')} className="flex shrink-0 items-center gap-2 rounded-2xl border border-iris-100 bg-white py-1.5 pl-1.5 pr-3 shadow-soft">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink font-mono text-xs font-bold text-white">{lv.level}</span>
          <span className="flex flex-col items-start">
            <motion.span key={state.xp} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-mono text-xs font-bold leading-none text-iris-700">{state.xp} XP</motion.span>
            <span className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-iris-100">
              <motion.span className="block h-full bg-gradient-to-r from-iris-500 to-sky-400" animate={{ width: `${lv.pct * 100}%` }} />
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}

const ORBIT = [Laptop, Smartphone, Tv, Gamepad2, Printer, Watch];

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      <div className="absolute inset-[6%] rounded-full border-2 border-dashed border-iris-200" />
      <div className="absolute inset-[24%] rounded-full border border-sky-200" />
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute inset-[38%] rounded-full border-2 border-iris-300"
          animate={{ scale: [1, 2.6], opacity: [0.6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i, ease: 'easeOut' }} />
      ))}
      <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
        {ORBIT.map((I, k) => {
          const a = (k / ORBIT.length) * Math.PI * 2;
          const x = 50 + Math.cos(a) * 44, y = 50 + Math.sin(a) * 44;
          return (
            <div key={k} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="-ml-6 -mt-6 grid h-12 w-12 place-items-center rounded-2xl border border-iris-100 bg-white text-ink shadow-soft">
                <I size={22} />
              </motion.div>
            </div>
          );
        })}
        {ORBIT.map((_, k) => {
          const a = (k / ORBIT.length) * 360;
          return (
            <div key={`p${k}`} className="absolute left-1/2 top-1/2 h-0 w-[44%] origin-left" style={{ transform: `rotate(${a}deg)` }}>
              <motion.span className={`absolute -top-1.5 h-3 w-3 rounded-full ${k % 2 ? 'bg-sky-400' : 'bg-iris-500'}`}
                animate={{ left: k % 2 ? ['92%', '18%'] : ['18%', '92%'], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: k * 0.45, ease: 'easeInOut' }} />
            </div>
          );
        })}
      </motion.div>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.2 }}
        className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[32px] bg-gradient-to-br from-iris-500 via-iris-600 to-sky-500 text-white shadow-lift">
        <RouterIcon size={48} strokeWidth={1.8} />
        <span className="absolute -bottom-3 rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold text-iris-700 shadow-soft">192.168.1.1</span>
      </motion.div>
    </div>
  );
}

function Hero() {
  const words = ['les adressa', 'vel vegen', 'sender vidare'];
  const [w, setW] = useState(0);
  useEffect(() => { const t = setInterval(() => setW((x) => (x + 1) % words.length), 2200); return () => clearInterval(t); }, []);
  return (
    <section className="relative pb-10 pt-12 md:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="chip border border-iris-200 bg-white text-iris-700">
            <Sparkles size={13} /> For 10. trinn · Gruppe 2
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="mt-5 font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
            Boksen som
            <br />
            <span className="relative inline-block h-[1.1em] min-w-[7ch] overflow-hidden align-bottom">
              <AnimatePresence mode="wait">
                <motion.span key={w} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="block whitespace-nowrap bg-gradient-to-r from-iris-600 to-sky-500 bg-clip-text text-transparent">
                  {words[w]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
            Kvar gong du opnar ei app, sender ruteren heime tusenvis av små datapakkar ut i verda – og finn vegen tilbake. Her lærer du korleis, ved å snu, byggje, reparere og spele.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => scrollToId('dashboard')} className="btn-primary !px-5 !py-3">Start oppdraga <ArrowRight size={18} /></button>
            <button onClick={() => scrollToId('ruter')} className="btn-ghost !px-5 !py-3"><Box size={18} /> Sjå ruteren i 3D</button>
          </motion.div>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[['8', 'delar å utforske'], ['12', 'oppdrag'], ['3', 'quiznivå']].map(([n, t]) => (
              <div key={t} className="rounded-2xl border border-iris-100 bg-white/70 p-3">
                <div className="font-display text-2xl font-extrabold text-iris-600">{n}</div>
                <div className="text-xs font-semibold text-ink/55">{t}</div>
              </div>
            ))}
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function Dashboard() {
  const { state, reset } = useStore();
  const lv = levelFor(state.xp);
  const [confirm, setConfirm] = useState(false);
  const stats = [
    { l: 'Ruterdelar', v: `${state.parts.length}/${PART_COUNT}` },
    { l: 'Animasjonar', v: `${state.learned.length}/4` },
    { l: 'Pakkar levert', v: state.packets },
    { l: 'Nett reparert', v: state.fixed },
    { l: 'IP løyst', v: state.ipSolved },
    { l: 'Beste rekkje', v: state.bestStreak },
  ];

  return (
    <section id="dashboard" className="scroll-mt-24 py-16">
      <SectionHead icon={LayoutDashboard} kicker="01 / Dashboard" title="Din framgang" text="Ten XP ved å utforske, byggje og svare rett. Fullfør oppdrag for å låse opp nye kapittel og vanskelegare quiznivå." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card relative overflow-hidden p-6">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-iris-100 to-sky-100" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="relative grid h-28 w-28 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#e9e3ff" strokeWidth="9" />
                <motion.circle cx="50" cy="50" r="44" fill="none" stroke="url(#g)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44} animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - lv.pct) }} transition={{ duration: 0.8 }} />
                <defs><linearGradient id="g"><stop offset="0" stopColor="#7c4df0" /><stop offset="1" stopColor="#4aa3f7" /></linearGradient></defs>
              </svg>
              <div className="text-center">
                <div className="label !text-[9px]">Nivå</div>
                <div className="font-display text-4xl font-extrabold leading-none">{lv.level}</div>
              </div>
            </div>
            <div className="min-w-[180px] flex-1">
              <div className="font-display text-2xl font-extrabold">{lv.name}</div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold text-iris-600"><Zap size={15} /> {state.xp} XP</div>
              <p className="mt-2 text-sm text-ink/60">
                {lv.next ? <>Berre <b>{lv.next.xp - state.xp} XP</b> til nivå {lv.level + 1}: {lv.next.name}</> : 'Du har nådd toppnivået. Imponerande!'}
              </p>
            </div>
          </div>
          <div className="relative mt-6 flex gap-1">
            {LEVELS.map((l, k) => (
              <div key={l.name} className="flex-1">
                <div className={`h-2 rounded-full ${k <= lv.index ? 'bg-gradient-to-r from-iris-500 to-sky-400' : 'bg-iris-100'}`} />
                <div className={`mt-1.5 hidden text-[10px] font-semibold sm:block ${k <= lv.index ? 'text-iris-700' : 'text-ink/35'}`}>{l.name}</div>
              </div>
            ))}
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {stats.map((s) => (
              <div key={s.l} className="rounded-2xl bg-mist p-3">
                <div className="font-display text-xl font-extrabold">{s.v}</div>
                <div className="text-[11px] font-semibold leading-tight text-ink/50">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="label">Prestasjonar</span>
            <span className="font-mono text-sm font-bold text-iris-600">{state.badges.length}/{BADGES.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map((b) => {
              const got = state.badges.includes(b.id);
              return (
                <motion.div key={b.id} whileHover={{ y: -4 }} className="group relative flex flex-col items-center text-center" title={b.desc}>
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl transition-all ${got ? 'bg-gradient-to-br from-iris-500 to-sky-400 text-white shadow-lift' : 'border-2 border-dashed border-iris-200 text-iris-200'}`}>
                    {got ? <b.icon size={24} /> : <Lock size={18} />}
                  </div>
                  <div className={`mt-1.5 text-[11px] font-bold leading-tight ${got ? 'text-ink' : 'text-ink/40'}`}>{b.title}</div>
                  <div className="pointer-events-none absolute -top-10 z-10 hidden w-36 rounded-xl bg-ink px-2 py-1.5 text-[11px] text-white group-hover:block">{b.desc}</div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-iris-100 pt-4">
            <span className="text-xs text-ink/45">Framgangen blir lagra i nettlesaren.</span>
            {confirm ? (
              <span className="flex gap-1.5">
                <button onClick={() => { reset(); setConfirm(false); }} className="btn !py-1.5 text-xs bg-rose-500 text-white">Ja, nullstill</button>
                <button onClick={() => setConfirm(false)} className="btn-ghost !py-1.5 text-xs">Avbryt</button>
              </span>
            ) : (
              <button onClick={() => setConfirm(true)} className="btn-ghost !py-1.5 text-xs"><RotateCcw size={13} /> Nullstill</button>
            )}
          </div>
        </div>
      </div>
      <Missions />
    </section>
  );
}

function Missions() {
  const { state } = useStore();
  const total = ALL_MISSIONS.filter((m) => state.done.includes(m.id)).length;
  return (
    <div id="oppdrag" className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h3 className="font-display text-2xl font-extrabold">Oppdrag</h3>
        <span className="font-mono text-sm font-bold text-iris-600">{total}/{ALL_MISSIONS.length} fullført</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {CHAPTERS.map((c) => {
          const open = chapterUnlocked(state, c.id);
          const doneN = c.missions.filter((m) => state.done.includes(m.id)).length;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: c.id * 0.08 }}
              className={`card relative overflow-hidden p-5 ${open ? '' : 'bg-white/60'}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="label">Kapittel {c.id}</span>
                {open ? <span className="chip bg-sky-50 text-sky-600">{doneN}/4</span> : <span className="chip bg-iris-50 text-iris-600"><Lock size={12} /> Låst</span>}
              </div>
              <div className="font-display text-xl font-extrabold">{c.title}</div>
              <p className="mb-4 text-sm text-ink/55">{open ? c.desc : `Fullfør 3 oppdrag i kapittel ${c.id - 1} for å låse opp.`}</p>
              <div className={`flex flex-col gap-2 ${open ? '' : 'pointer-events-none select-none blur-[2px]'}`}>
                {c.missions.map((m) => {
                  const done = state.done.includes(m.id);
                  const [a, b] = m.prog(state);
                  return (
                    <button key={m.id} onClick={() => scrollToId(m.goto)}
                      className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${done ? 'border-sky-200 bg-sky-50' : 'border-iris-100 bg-white hover:border-iris-300 hover:shadow-soft'}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${done ? 'bg-sky-500 text-white' : 'bg-iris-50 text-iris-600'}`}>
                        {done ? <CircleCheck size={18} /> : <Target size={18} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold leading-snug ${done ? 'text-sky-700' : ''}`}>{m.title}</span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-iris-100">
                            <span className="block h-full rounded-full bg-gradient-to-r from-iris-500 to-sky-400 transition-all" style={{ width: `${Math.min(1, a / b) * 100}%` }} />
                          </span>
                          <span className="font-mono text-[10px] font-bold text-ink/50">+{m.xp}</span>
                        </span>
                      </span>
                      {!done && <ChevronRight size={16} className="text-ink/30 transition-transform group-hover:translate-x-1" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4">
        <Hero />
        <Dashboard />
        <Router3D />
        <Learn />
        <Simulator />
        <Games />
        <Quiz />
      </main>
      <footer className="mt-10 border-t border-iris-100 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-ink/55 sm:flex-row">
          <a href="index.html" className="flex items-center gap-1.5 font-semibold text-iris-700 hover:text-iris-500"><ArrowLeft size={15} /> Tilbake til VM i PROMPTING26</a>
          <span>Gruppe 2 · Ruter · IM Stord vgs</span>
        </div>
      </footer>
      <Toasts />
    </>
  );
}
