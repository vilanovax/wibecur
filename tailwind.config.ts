import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Note: In Tailwind v4, colors are defined in @theme in CSS
  // This config is kept for compatibility but colors should be in globals.css
};
export default config;

