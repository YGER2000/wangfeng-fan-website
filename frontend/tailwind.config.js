/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		fontFamily: {
			'display': ['Playfair Display', 'serif'],
			'cinzel': ['Cinzel', 'serif'],
			'bebas': ['Bebas Neue', 'sans-serif'],
			'montserrat': ['Montserrat', 'sans-serif'],
			'roboto': ['Roboto', 'sans-serif'],
			'sans': ['Montserrat', 'sans-serif'],
			'serif': ['Playfair Display', 'serif'],
		},
		extend: {
			colors: {
				border: '#8B5CF6',
				input: '#1a1a1a',
				ring: '#8B5CF6',
				background: '#000000',
				foreground: '#FFFFFF',
				primary: {
					DEFAULT: '#8B5CF6', // Wang Feng Purple (primary)
					foreground: '#FFFFFF',
					dark: '#7C3AED', // Dark Purple
					light: '#A855F7', // Light Purple
				},
				secondary: {
					DEFAULT: '#000000', // Black
					foreground: '#8B5CF6',
					dark: '#1a1a1a', // Dark Charcoal
				},
				accent: {
					DEFAULT: '#A855F7', // Light Purple
					foreground: '#000000',
				},
				// Wang Feng specific colors
				'wangfeng-purple': '#8B5CF6', // Main purple
				'wangfeng-light': '#A855F7', // Light purple
				'wangfeng-dark': '#7C3AED', // Dark purple
				'wangfeng-black': '#0F0F0F', // Deep black
				chrome: '#C0C0C0', // Chrome Silver (kept)
				gold: '#FFD700', // Gold accent for awards
				destructive: {
					DEFAULT: '#FF0000',
					foreground: '#FFFFFF',
				},
				muted: {
					DEFAULT: '#333333',
					foreground: '#CCCCCC',
				},
				popover: {
					DEFAULT: '#000000',
					foreground: '#FFFFFF',
				},
				card: {
					DEFAULT: '#1a1a1a',
					foreground: '#FFFFFF',
					border: '#8B5CF6',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 15px 5px rgba(139, 92, 246, 0.3)',
						textShadow: '0 0 10px rgba(139, 92, 246, 0.7)'
					},
					'50%': { 
						boxShadow: '0 0 25px 10px rgba(139, 92, 246, 0.5)',
						textShadow: '0 0 20px rgba(139, 92, 246, 1)'
					}
				},
				'text-flicker': {
					'0%, 100%': { opacity: 1 },
					'10%, 30%, 70%, 90%': { opacity: 0.9 },
					'20%, 40%, 60%, 80%': { opacity: 0.8 },
					'50%': { opacity: 0.7 }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 3s infinite',
				'text-flicker': 'text-flicker 3s infinite',
				'float': 'float 6s ease-in-out infinite',
			},
			textShadow: {
				'glow': '0 0 10px rgba(139, 92, 246, 0.7)',
				'strong-glow': '0 0 15px rgba(139, 92, 246, 1)',
				'white-glow': '0 0 10px rgba(255, 255, 255, 0.7)',
			},
			boxShadow: {
				'glow': '0 0 15px 5px rgba(139, 92, 246, 0.3)',
				'strong-glow': '0 0 25px 10px rgba(139, 92, 246, 0.5)',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'purple-gradient': 'linear-gradient(to right, #8B5CF6, #7C3AED, #A855F7)',
				'black-purple-gradient': 'linear-gradient(to bottom, #000000, #0F0F0F, #1a1a1a)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}