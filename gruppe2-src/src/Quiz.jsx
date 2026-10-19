import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Star, ArrowRight, RotateCcw, CircleCheck, CircleX, Flame, Sparkles, GraduationCap } from 'lucide-react';
import { useStore, chapterUnlocked } from './store.jsx';
import { SectionHead } from './ui.jsx';

const QUIZ = {
  1: {
    name: 'Grunnkurs', desc: 'Kva er ein ruter, og kva gjer han?',
    qs: [
      { q: 'Kva er hovudjobben til ein ruter?', o: ['Å lagre filer for familien', 'Å sende datapakkar mellom nettverk', 'Å lade mobilen trådlaust', 'Å vise nettsider på skjermen'], a: 1, w: 'Ein ruter les adressa på kvar pakke og sender han vidare mellom nettverk – til dømes mellom heimenettet og Internett.' },
      { q: 'Kva står Wi-Fi-signalet frå ruteren eigentleg for?', o: ['Lys', 'Lyd', 'Radiobølgjer', 'Straum i lufta'], a: 2, w: 'Wi-Fi sender data som radiobølgjer, vanlegvis på 2,4 GHz eller 5 GHz.' },
      { q: 'Kva port koplar du kabelen frå fiberboksen til?', o: ['LAN-port', 'USB-port', 'WAN-port', 'Straumkontakten'], a: 2, w: 'WAN-porten går ut mot Internett. LAN-portane er for einingar i heimenettet.' },
      { q: 'Kva er ei IP-adresse?', o: ['Passordet til Wi-Fi', 'Ei adresse som identifiserer ei eining i eit nettverk', 'Namnet på nettverket', 'Farten på Internett'], a: 1, w: 'IP-adressa er som ei postadresse for data, slik at pakkane kjem til rett eining.' },
      { q: 'Kva for ei av desse er ei vanleg privat IP-adresse heime?', o: ['8.8.8.8', '192.168.1.20', '300.1.1.1', '84.215.37.120'], a: 1, w: '192.168.x.x er eit privat område som ruterar brukar i heimenett.' },
      { q: 'Kva er LAN?', o: ['Det lokale nettet heime eller på skulen', 'Heile Internett', 'Ein type kabel', 'Eit dataspel'], a: 0, w: 'LAN = Local Area Network, det lokale nettverket.' },
    ],
  },
  2: {
    name: 'Heimenettverk', desc: 'IP, DHCP, LAN, WAN og Wi-Fi.',
    qs: [
      { q: 'Kva gjer DHCP i ruteren?', o: ['Krypterer Wi-Fi', 'Deler ut IP-adresser automatisk', 'Blokkerer virus', 'Gjer nettet raskare'], a: 1, w: 'DHCP gir kvar ny eining ei ledig IP-adresse automatisk, så du slepp å gjere det sjølv.' },
      { q: 'Kvifor har 5 GHz kortare rekkjevidd enn 2,4 GHz?', o: ['Det brukar mindre straum', 'Kortare bølgjer blir lettare stoppa av avstand og veggar', 'Det er ein eldre standard', 'Det er berre for mobilar'], a: 1, w: 'Høgare frekvens gir meir fart, men signalet blir fortare svekt av veggar og avstand.' },
      { q: 'Kva er WAN?', o: ['Det store nettet utanfor heimen', 'Ein Wi-Fi-standard', 'Ein port på PC-en', 'Eit antivirusprogram'], a: 0, w: 'WAN = Wide Area Network, det store nettverket som til saman blir Internett.' },
      { q: 'Kva gjer NAT?', o: ['Gir alle einingane heime éi felles offentleg adresse ut mot Internett', 'Stoppar reklame', 'Gjer kablane lengre', 'Lagar nye Wi-Fi-passord'], a: 0, w: 'NAT byter private adresser til ruteren si offentlege adresse, og hugsar kven som skal ha svaret.' },
      { q: 'Kvifor blir data delt opp i pakkar?', o: ['For å spare straum', 'Fordi små pakkar lettare kan sendast, ruta og sendast på nytt viss dei blir borte', 'Fordi skjermen er liten', 'Det blir dei ikkje'], a: 1, w: 'Små pakkar kan ta ulike vegar, og berre dei som blir borte treng sendast på nytt.' },
      { q: 'Kva er ein switch?', o: ['Ein boks som koplar saman mange einingar i same LAN', 'Ein annan namn på modem', 'Ein Wi-Fi-antenne', 'Ein brannmur'], a: 0, w: 'Ein switch gir fleire nettverksportar i same lokale nett. Han rutar ikkje mellom nett.' },
    ],
  },
  3: {
    name: 'Rutermeister', desc: 'For dei som vil vite meir.',
    qs: [
      { q: 'Kva er standard gateway for ein PC?', o: ['Adressa til ruteren i same nett', 'Adressa til nettstaden du besøkjer', 'MAC-adressa til PC-en', 'DNS-namnet til PC-en'], a: 0, w: 'Standard gateway er ruteren – døra PC-en sender pakkar til når mottakaren er i eit anna nett.' },
      { q: 'Med nettmaske 255.255.255.0, kor mange adresser kan brukast av einingar?', o: ['256', '255', '254', '100'], a: 2, w: '256 adresser totalt, men første (nettadressa) og siste (kringkasting) kan ikkje brukast: 254 att.' },
      { q: 'Kva for adresse kan IKKJE gis til ein PC i nettet 192.168.1.0/24?', o: ['192.168.1.2', '192.168.1.100', '192.168.1.255', '192.168.1.200'], a: 2, w: '.255 er kringkastingsadressa i dette nettet.' },
      { q: 'Kva er ei rutingtabell?', o: ['Ei liste over Wi-Fi-passord', 'Ei liste som fortel ruteren kvar pakkar til ulike nett skal sendast', 'Eit bord ruteren står på', 'Ei liste over kablar'], a: 1, w: 'Rutingtabellen seier kva port eller neste ruter pakkar til eit gitt nett skal gå vidare til.' },
      { q: 'Kva står TTL i ein datapakke for?', o: ['Total Transfer Length', 'Time To Live – kor mange ruterar pakken kan passere', 'Ein type Wi-Fi', 'Tid til lading'], a: 1, w: 'TTL blir talt ned med 1 for kvar ruter. Når han når 0, blir pakken kasta, så han ikkje sirklar for alltid.' },
      { q: 'Kva er det beste første steget når ingen i huset har Internett?', o: ['Kjøpe ny PC', 'Sjekke lampane og kablane på ruteren, og starte han på nytt', 'Byte Wi-Fi-namn', 'Slette nettlesaren'], a: 1, w: 'Feilsøk frå botnen: straum, kablar og lampar på ruteren først.' },
    ],
  },
};

export default function Quiz() {
  const { state, update } = useStore();
  const [level, setLevel] = useState(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [finished, setFinished] = useState(false);

  const unlocked = (lv) => chapterUnlocked(state, lv);
  const start = (lv) => { setLevel(lv); setI(0); setPick(null); setRight(0); setStreak(0); setPoints(0); setFinished(false); };
  const set = level && QUIZ[level];
  const cur = set && set.qs[i];

  const answer = (k) => {
    if (pick !== null) return;
    setPick(k);
    if (k === cur.a) {
      const ns = streak + 1;
      setStreak(ns);
      setRight((r) => r + 1);
      setPoints((p) => p + 100 + (ns - 1) * 25);
      update((s) => ({ bestStreak: Math.max(s.bestStreak, ns) }), 10);
    } else setStreak(0);
  };

  const next = () => {
    if (i + 1 < set.qs.length) { setI(i + 1); setPick(null); return; }
    setFinished(true);
    const passed = right >= 4;
    update((s) => ({ quiz: { ...s.quiz, [level]: Math.max(s.quiz[level] || 0, right) } }), passed ? 20 * level : 0);
  };

  const stars = right >= 6 ? 3 : right >= 5 ? 2 : right >= 4 ? 1 : 0;

  return (
    <section id="quiz" className="scroll-mt-24 py-16">
      <SectionHead icon={GraduationCap} kicker="06 / Test deg sjølv" title="Ruterquiz" text="Tre nivå. Rette svar på rad gir ekstra poeng. Fullfør oppdrag for å låse opp dei vanskelegaste nivåa." />
      <AnimatePresence mode="wait">
        {!level ? (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((lv) => {
              const open = unlocked(lv);
              const best = state.quiz[lv] || 0;
              return (
                <motion.button key={lv} onClick={() => open && start(lv)} disabled={!open}
                  whileHover={open ? { y: -6 } : {}} whileTap={open ? { scale: 0.98 } : {}}
                  className={`card relative overflow-hidden p-6 text-left ${open ? 'hover:shadow-lift' : 'cursor-not-allowed opacity-70'}`}>
                  <div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full ${lv === 1 ? 'bg-sky-100' : lv === 2 ? 'bg-iris-100' : 'bg-gradient-to-br from-iris-200 to-sky-200'}`} />
                  <div className="relative">
                    <div className="label">Nivå {lv}</div>
                    <div className="mt-1 font-display text-2xl font-extrabold">{QUIZ[lv].name}</div>
                    <p className="mt-1 text-sm text-ink/60">{QUIZ[lv].desc}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((s) => (
                          <Star key={s} size={20} className={(best >= 6 ? 3 : best >= 5 ? 2 : best >= 4 ? 1 : 0) >= s ? 'fill-iris-500 text-iris-500' : 'text-iris-200'} />
                        ))}
                      </div>
                      {open ? <span className="chip bg-ink text-white">Start <ArrowRight size={13} /></span> : <span className="chip bg-iris-50 text-iris-600"><Lock size={13} /> Kapittel {lv}</span>}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : finished ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card mx-auto max-w-xl p-8 text-center">
            <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-iris-500 to-sky-400 text-white shadow-lift">
              <Trophy size={38} />
            </motion.div>
            <h3 className="mt-5 font-display text-3xl font-extrabold">{stars ? 'Godt jobba!' : 'Nesten der!'}</h3>
            <p className="mt-1 text-ink/60">{right} av {set.qs.length} rette på nivå {level} · {points} poeng</p>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <motion.span key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25 + s * 0.15, type: 'spring' }}>
                  <Star size={40} className={stars >= s ? 'fill-iris-500 text-iris-500' : 'text-iris-100'} />
                </motion.span>
              ))}
            </div>
            <p className="mt-5 rounded-2xl bg-iris-50 p-3 text-sm text-iris-700">
              {stars ? <><Sparkles size={14} className="mr-1 inline" />Belønning: +{20 * level} XP i bonus{stars === 3 ? ' og prestasjonen «Feilfri»' : ''}.</> : 'Du treng minst 4 rette for å bestå. Prøv igjen!'}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={() => start(level)} className="btn-ghost"><RotateCcw size={16} /> Prøv igjen</button>
              <button onClick={() => setLevel(null)} className="btn-primary">Vel nivå <ArrowRight size={16} /></button>
            </div>
          </motion.div>
        ) : (
          <motion.div key={`q-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card mx-auto max-w-3xl p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button onClick={() => setLevel(null)} className="text-sm font-semibold text-ink/50 hover:text-ink">Avslutt</button>
              <div className="flex items-center gap-2">
                <span className="chip bg-iris-50 text-iris-700">{points} poeng</span>
                <span className={`chip ${streak >= 2 ? 'bg-gradient-to-r from-iris-500 to-sky-500 text-white' : 'bg-white text-ink/50 border border-iris-100'}`}><Flame size={13} /> x{streak}</span>
              </div>
            </div>
            <div className="mb-6 h-2 overflow-hidden rounded-full bg-iris-50">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-iris-500 to-sky-400" animate={{ width: `${((i + (pick !== null ? 1 : 0)) / set.qs.length) * 100}%` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                <div className="label mb-2">Spørsmål {i + 1} av {set.qs.length}</div>
                <h3 className="mb-6 font-display text-2xl font-extrabold leading-snug">{cur.q}</h3>
                <div className="grid gap-3">
                  {cur.o.map((o, k) => {
                    const st = pick === null ? 'idle' : k === cur.a ? 'right' : k === pick ? 'wrong' : 'dim';
                    return (
                      <motion.button key={k} onClick={() => answer(k)} whileHover={pick === null ? { x: 6 } : {}}
                        animate={st === 'wrong' ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                        className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-colors ${
                          st === 'right' ? 'border-sky-500 bg-sky-50 text-sky-700' : st === 'wrong' ? 'border-rose-400 bg-rose-50 text-rose-600' : st === 'dim' ? 'border-iris-50 text-ink/35' : 'border-iris-100 hover:border-iris-400 hover:bg-iris-50'
                        }`}>
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl font-mono text-sm font-bold ${st === 'right' ? 'bg-sky-500 text-white' : st === 'wrong' ? 'bg-rose-400 text-white' : 'bg-iris-100 text-iris-700'}`}>
                          {st === 'right' ? <CircleCheck size={16} /> : st === 'wrong' ? <CircleX size={16} /> : 'ABCD'[k]}
                        </span>
                        {o}
                      </motion.button>
                    );
                  })}
                </div>
                {pick !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-iris-50 to-sky-50 p-4 sm:flex-row sm:items-center">
                    <p className="flex-1 text-sm leading-relaxed text-ink/75">{cur.w}</p>
                    <button onClick={next} className="btn-primary shrink-0">{i + 1 < set.qs.length ? 'Neste' : 'Sjå resultat'} <ArrowRight size={16} /></button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
