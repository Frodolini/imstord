export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Figtree"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#1b1640',
        mist: '#f5f7ff',
        sky: { 50:'#eef7ff',100:'#d9edff',200:'#b6dcff',300:'#82c3ff',400:'#4aa3f7',500:'#2384e6',600:'#1669c4' },
        iris: { 50:'#f4f1ff',100:'#e9e3ff',200:'#d4c8ff',300:'#b6a1ff',400:'#9672fb',500:'#7c4df0',600:'#6834d6',700:'#5527b0' },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27,22,64,.06), 0 8px 24px -8px rgba(27,22,64,.12)',
        lift: '0 2px 4px rgba(27,22,64,.06), 0 20px 40px -12px rgba(104,52,214,.25)',
      },
    },
  },
  plugins: [],
};
