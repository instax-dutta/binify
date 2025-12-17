import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: '#0a0a0a',
                    secondary: '#111111',
                    tertiary: '#1a1a1a',
                },
                surface: {
                    DEFAULT: '#1a1a1a',
                    secondary: '#222222',
                    tertiary: '#2a2a2a',
                },
                text: {
                    primary: '#e5e5e5',
                    secondary: '#a0a0a0',
                    tertiary: '#6b7280',
                },
                accent: {
                    blue: '#3b82f6',
                    green: '#10b981',
                    yellow: '#f59e0b',
                    red: '#ef4444',
                },
                border: {
                    DEFAULT: '#2a2a2a',
                    hover: '#3a3a3a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Consolas', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
