import type { CrosswindOptions } from '@cwcss/crosswind'

export default {
  content: [
    './resources/**/*.{html,js,ts,jsx,tsx,stx}',
    './storage/framework/defaults/**/*.{html,js,ts,jsx,tsx,stx}',
    './storage/framework/views/**/*.{html,js,ts,jsx,tsx,stx}',
  ],
  output: './storage/framework/assets/crosswind.css',
  minify: false,
} satisfies CrosswindOptions
