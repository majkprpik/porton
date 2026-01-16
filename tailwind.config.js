/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
    darkMode: ['selector', '[class="app-dark"]'],
    content: ['./src/**/*.{html,ts,scss,css}', './index.html'],
    plugins: [PrimeUI],
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        },
        extend: {
            // Custom colors for glassmorphism
            colors: {
                glass: {
                    bg: 'var(--glass-bg)',
                    'bg-hover': 'var(--glass-bg-hover)',
                    border: 'var(--glass-border)',
                    'border-accent': 'var(--glass-border-accent)',
                },
                indigo: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
            },
            // Glassmorphism utilities
            backdropBlur: {
                glass: '12px',
                'glass-heavy': '20px',
            },
            boxShadow: {
                glass: '0 8px 32px rgba(99, 102, 241, 0.15)',
                'glass-elevated': '0 12px 40px rgba(99, 102, 241, 0.2)',
                'glass-soft': '0 4px 16px rgba(99, 102, 241, 0.1)',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                'app-gradient-light': 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 50%, #eff6ff 100%)',
                'app-gradient-dark': 'linear-gradient(135deg, #1e1b4b 0%, #172554 50%, #0f172a 100%)',
            },
        },
    }
};
