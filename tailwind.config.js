/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#08090a',
        panel: '#0f1011',
        surface: '#16181d',
        line: 'rgba(255,255,255,0.08)',
        quiet: '#8a8f98',
        primary: '#7170ff',
        primaryDeep: '#5e6ad2',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(59, 130, 246, 0.18)',
        panel:
          '0 0 0 1px rgba(255,255,255,0.05), 0 24px 48px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)',
        soft:
          '0 0 0 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.22)',
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at 18% 18%, rgba(113, 112, 255, 0.22), transparent 30%), radial-gradient(circle at 82% 12%, rgba(34, 211, 238, 0.16), transparent 28%), linear-gradient(180deg, rgba(8, 9, 10, 1), rgba(11, 12, 16, 1))',
        mesh:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
