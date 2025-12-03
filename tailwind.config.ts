import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'background-deep': '#020203',
        'background-base': '#050506',
        'background-elevated': '#0a0a0c',

        // Surface colors
        'surface': 'rgba(255, 255, 255, 0.05)',
        'surface-hover': 'rgba(255, 255, 255, 0.08)',

        // Foreground colors
        'foreground': '#EDEDEF',
        'foreground-muted': '#8A8F98',
        'foreground-subtle': 'rgba(255, 255, 255, 0.60)',

        // Accent colors
        'accent': '#5E6AD2',
        'accent-bright': '#6872D9',
        'accent-glow': 'rgba(94, 106, 210, 0.3)',

        // Border colors
        'border-default': 'rgba(255, 255, 255, 0.06)',
        'border-hover': 'rgba(255, 255, 255, 0.10)',
        'border-accent': 'rgba(94, 106, 210, 0.30)',
      },
      animation: {
        'float': 'float 10s ease-in-out infinite',
        'float-reverse': 'float-reverse 12s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'scaleIn': 'scaleIn 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(1deg)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(20px) rotate(-1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.2' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
