// @ts-check
import {defineConfig} from 'astro/config';

import alpinejs from '@astrojs/alpinejs';

import cloudflare from '@astrojs/cloudflare';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),

	integrations: [alpinejs()],

	vite: {
		plugins: [tailwindcss()],
	},
});
