import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Target, Award, ArrowUpCircle, X } from 'lucide-react';
import { useStore, BADGES } from './store.jsx';

export function SectionHead({ id, kicker, title, text, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
    >
      <div className="max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          {Icon && (
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-iris-500 text-white">
              <Icon size={16} strokeWidth={2.4} />
            </span>
          )}
          <span className="label">{kicker}</span>
        </div>
        <h2 className="h2" id={id ? `${id}-title` : undefined}>{title}</h2>
        {text && <p className="mt-3 text-[17px] leading-relaxed text-ink/70">{text}</p>}
      </div>
    </motion.div>
  );
}

function Toast({ t, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4200);
    return () => clearTimeout(timer);
  }, [onClose]);
  const badge = t.badge && BADGES.find((b) => b.id === t.badge);
  const Icon = badge ? badge.icon : t.kind === 'level' ? ArrowUpCircle : t.kind === 'badge' ? Award : Target;
  const tone = t.kind === 'level' ? 'from-sky-400 to-sky-600' : t.kind === 'badge' ? 'from-iris-400 to-sky-400' : 'from-iris-500 to-iris-700';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="pointer-events-auto flex w-80 max-w-[calc(100vw-32px)] items-center gap-3 rounded-2xl border border-iris-100 bg-white p-3 pr-2 shadow-lift"
      role="status"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="label !text-[10px]">{t.title}</div>
        <div className="truncate font-semibold">{t.text}</div>
      </div>
      {t.xp ? <span className="chip bg-iris-50 text-iris-700">+{t.xp} XP</span> : null}
      <button onClick={onClose} className="rounded-lg p-1 text-ink/40 hover:bg-iris-50 hover:text-ink" aria-label="Lukk">
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function Toasts() {
  const { state, dismiss } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {state.toasts.slice(-4).map((t) => (
          <Toast key={t.id} t={t} onClose={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Pill({ active, onClick, children, icon: Icon, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
        active ? 'text-white' : 'text-ink/70 hover:text-ink'
      }`}
    >
      {active && (
        <motion.span layoutId={undefined} className="absolute inset-0 rounded-xl bg-ink" initial={false} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
      )}
      <span className="relative flex items-center gap-2">
        {Icon && <Icon size={16} />}
        {children}
      </span>
    </button>
  );
}

export function Tabs({ items, value, onChange, group }) {
  return (
    <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-iris-100 bg-white p-1 shadow-soft">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => !it.locked && onChange(it.id)}
          disabled={it.locked}
          className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
            value === it.id ? 'text-white' : 'text-ink/65 hover:text-ink'
          }`}
        >
          {value === it.id && (
            <motion.span layoutId={`tab-${group}`} className="absolute inset-0 rounded-xl bg-gradient-to-r from-iris-600 to-sky-500" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          )}
          <span className="relative flex items-center gap-2">
            {it.icon && <it.icon size={16} />}
            {it.label}
          </span>
        </button>
      ))}
    </div>
  );
}
