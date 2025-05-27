import type { Config } from 'tailwindcss'
import { colors } from './src/constants/colors'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vividOrange: colors.vividOrange,
        brandWhite: colors.white,
        jetBlack: colors.jetBlack,
        slateGray: colors.slateGray,
        lightGray: colors.lightGray,
        champagneGold: colors.champagneGold,
        roseGold: colors.roseGold,
        dustyOrange: colors.dustyOrange,
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-playfair-display)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
