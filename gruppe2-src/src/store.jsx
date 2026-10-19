import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Radio, Package, Medal, Flame, Stethoscope, Compass, TrendingUp, Crown } from 'lucide-react';

const KEY = 'ruterlabben-v1';

export const LEVELS = [
  { xp: 0, name: 'Nykomar' },
  { xp: 120, name: 'Kabelkoplar' },
  { xp: 300, name: 'Pakkesendar' },
  { xp: 550, name: 'Nettverksbyggjar' },
  { xp: 850, name: 'Rutermeister' },
  { xp: 1200, name: 'Nettverksarkitekt' },
];

export const PART_COUNT = 8;
export const LEARN_COUNT = 4;

export const CHAPTERS = [
  {
    id: 1,
    title: 'Første tilkopling',
    desc: 'Bli kjend med ruteren og send din første datapakke.',
    missions: [
      { id: 'c1-parts', title: 'Utforsk tre delar av 3D-ruteren', xp: 40, goto: 'ruter', check: (s) => s.parts.length >= 3, prog: (s) => [s.parts.length, 3] },
      { id: 'c1-learn', title: 'Sjå to av animasjonane', xp: 40, goto: 'laer', check: (s) => s.learned.length >= 2, prog: (s) => [s.learned.length, 2] },
      { id: 'c1-packet', title: 'Send ein pakke ut på Internett i simulatoren', xp: 50, goto: 'simulator', check: (s) => s.packets >= 1, prog: (s) => [s.packets, 1] },
      { id: 'c1-quiz', title: 'Bestå quiz nivå 1 (minst 4 av 6)', xp: 60, goto: 'quiz', check: (s) => (s.quiz[1] || 0) >= 4, prog: (s) => [s.quiz[1] || 0, 4] },
    ],
  },
  {
    id: 2,
    title: 'Heimenettverket',
    desc: 'Bygg, forstå og reparer eit heilt heimenett.',
    missions: [
      { id: 'c2-parts', title: 'Utforsk alle delane av ruteren', xp: 60, goto: 'ruter', check: (s) => s.parts.length >= PART_COUNT, prog: (s) => [s.parts.length, PART_COUNT] },
      { id: 'c2-learn', title: 'Sjå alle fire animasjonane', xp: 60, goto: 'laer', check: (s) => s.learned.length >= LEARN_COUNT, prog: (s) => [s.learned.length, LEARN_COUNT] },
      { id: 'c2-build', title: 'Bygg eit nett der tre PC-ar når Internett', xp: 80, goto: 'simulator', check: (s) => s.simBest >= 3, prog: (s) => [Math.min(s.simBest, 3), 3] },
      { id: 'c2-fix', title: 'Reparer eitt øydelagt nettverk', xp: 80, goto: 'spel', check: (s) => s.fixed >= 1, prog: (s) => [s.fixed, 1] },
    ],
  },
  {
    id: 3,
    title: 'Rutermeister',
    desc: 'Dei vanskelegaste utfordringane. Berre for dei modige.',
    missions: [
      { id: 'c3-ip', title: 'Løys 8 IP-utfordringar', xp: 90, goto: 'spel', check: (s) => s.ipSolved >= 8, prog: (s) => [s.ipSolved, 8] },
      { id: 'c3-fix', title: 'Reparer tre nettverk', xp: 100, goto: 'spel', check: (s) => s.fixed >= 3, prog: (s) => [s.fixed, 3] },
      { id: 'c3-quiz2', title: 'Bestå quiz nivå 2', xp: 100, goto: 'quiz', check: (s) => (s.quiz[2] || 0) >= 4, prog: (s) => [s.quiz[2] || 0, 4] },
      { id: 'c3-quiz3', title: 'Bestå quiz nivå 3', xp: 150, goto: 'quiz', check: (s) => (s.quiz[3] || 0) >= 4, prog: (s) => [s.quiz[3] || 0, 4] },
    ],
  },
];

export const ALL_MISSIONS = CHAPTERS.flatMap((c) => c.missions);

export const BADGES = [
  { id: 'first', title: 'Første signal', desc: 'Ten dine første XP', icon: Radio, check: (s) => s.xp > 0 },
  { id: 'explorer', title: 'Utforskar', desc: 'Finn alle delane på 3D-ruteren', icon: Compass, check: (s) => s.parts.length >= PART_COUNT },
  { id: 'packets', title: 'Pakkepost', desc: 'Lever 10 pakkar i simulatoren', icon: Package, check: (s) => s.packets >= 10 },
  { id: 'streak', title: 'På rulle', desc: '5 rette svar på rad', icon: Flame, check: (s) => s.bestStreak >= 5 },
  { id: 'perfect', title: 'Feilfri', desc: 'Alle rett på ein quiz', icon: Medal, check: (s) => Object.values(s.quiz).some((v) => v >= 6) },
  { id: 'doctor', title: 'Nettverksdoktor', desc: 'Reparer tre nettverk', icon: Stethoscope, check: (s) => s.fixed >= 3 },
  { id: 'level3', title: 'Oppover', desc: 'Nå nivå 3', icon: TrendingUp, check: (s) => levelFor(s.xp).index >= 2 },
  { id: 'master', title: 'Rutermeister', desc: 'Fullfør alle oppdrag', icon: Crown, check: (s) => ALL_MISSIONS.every((m) => s.done.includes(m.id)) },
];

export function levelFor(xp) {
  let index = 0;
  LEVELS.forEach((l, i) => { if (xp >= l.xp) index = i; });
  const cur = LEVELS[index];
  const next = LEVELS[index + 1];
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index, level: index + 1, name: cur.name, next, pct };
}

export function chapterUnlocked(s, id) {
  if (id === 1) return true;
  const prev = CHAPTERS.find((c) => c.id === id - 1);
  return prev.missions.filter((m) => s.done.includes(m.id)).length >= 3 && chapterUnlocked(s, id - 1);
}

const initial = {
  xp: 0, parts: [], learned: [], packets: 0, simBest: 0, fixed: 0, ipSolved: 0,
  quiz: {}, bestStreak: 0, done: [], badges: [], toasts: [],
};

let toastId = 1;

function settle(s) {
  let next = { ...s };
  let changed = true;
  while (changed) {
    changed = false;
    for (const ch of CHAPTERS) {
      if (!chapterUnlocked(next, ch.id)) continue;
      for (const m of ch.missions) {
        if (!next.done.includes(m.id) && m.check(next)) {
          next = {
            ...next, xp: next.xp + m.xp, done: [...next.done, m.id],
            toasts: [...next.toasts, { id: toastId++, kind: 'mission', title: 'Oppdrag fullført', text: m.title, xp: m.xp }],
          };
          changed = true;
        }
      }
    }
    for (const b of BADGES) {
      if (!next.badges.includes(b.id) && b.check(next)) {
        next = {
          ...next, badges: [...next.badges, b.id],
          toasts: [...next.toasts, { id: toastId++, kind: 'badge', title: 'Ny prestasjon', text: b.title, badge: b.id }],
        };
        changed = true;
      }
    }
  }
  const before = levelFor(s.xp).index;
  const after = levelFor(next.xp).index;
  if (after > before) {
    next.toasts = [...next.toasts, { id: toastId++, kind: 'level', title: `Nivå ${after + 1}`, text: LEVELS[after].name }];
  }
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    case 'update': {
      const patch = action.fn(state);
      return settle({ ...state, ...patch, xp: state.xp + (action.xp || 0) });
    }
    case 'dismiss':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'reset':
      return { ...initial };
    default:
      return state;
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw), toasts: [] };
  } catch {
    return initial;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      const { toasts, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch { /* lagring er valfritt */ }
  }, [state]);

  const update = useCallback((fn, xp = 0) => dispatch({ type: 'update', fn, xp }), []);
  const addXP = useCallback((xp) => dispatch({ type: 'update', fn: () => ({}), xp }), []);
  const dismiss = useCallback((id) => dispatch({ type: 'dismiss', id }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return <Ctx.Provider value={{ state, update, addXP, dismiss, reset }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
