import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * "Ledger" theme: ruled-green accounting paper. The accent and the grid rules
 * share one hue so the records grid reads as the product's signature surface.
 */
const config = defineConfig({
  globalCss: {
    'html, body': {
      bg: 'canvas',
      color: 'ink',
      fontFeatureSettings: '"tnum" 1',
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'var(--font-sans), system-ui, sans-serif' },
        body: { value: 'var(--font-sans), system-ui, sans-serif' },
        mono: { value: 'var(--font-mono), ui-monospace, monospace' },
      },
      colors: {
        ledger: {
          50: { value: '#EEF7F2' },
          100: { value: '#D5EBDF' },
          200: { value: '#ADD6C0' },
          300: { value: '#7DBB9C' },
          400: { value: '#4A9A76' },
          500: { value: '#22785A' },
          600: { value: '#17624A' },
          700: { value: '#124E3C' },
          800: { value: '#0E3B2E' },
          900: { value: '#0A2A21' },
          950: { value: '#061A14' },
        },
      },
    },
    semanticTokens: {
      colors: {
        canvas: { value: { base: '#F4F7F5', _dark: '#0F1613' } },
        surface: { value: { base: '#FFFFFF', _dark: '#141D19' } },
        ink: { value: { base: '#18212B', _dark: '#E6EEE9' } },
        inkMuted: { value: { base: '#5B6670', _dark: '#93A39A' } },
        /** Grid rule lines. */
        rule: { value: { base: '#DCE8E1', _dark: '#23332B' } },
        /** Double margin rule beside row numbers, as on ledger paper. */
        marginRule: { value: { base: '#E8B4B1', _dark: '#5A2A28' } },
        rowHover: { value: { base: '#F2F8F4', _dark: '#18241F' } },
        danger: { value: { base: '#B42318', _dark: '#F97066' } },
        // Chakra's built-in tokens, remapped so its components share the ledger palette.
        bg: {
          DEFAULT: { value: '{colors.surface}' },
          panel: { value: '{colors.surface}' },
          subtle: { value: '{colors.canvas}' },
          muted: { value: { base: '#E9EFEB', _dark: '#1C2A24' } },
        },
        fg: {
          DEFAULT: { value: '{colors.ink}' },
          muted: { value: '{colors.inkMuted}' },
        },
        border: {
          DEFAULT: { value: '{colors.rule}' },
          muted: { value: '{colors.rule}' },
        },
        ledger: {
          solid: { value: { base: '{colors.ledger.500}', _dark: '{colors.ledger.400}' } },
          contrast: { value: { base: 'white', _dark: '{colors.ledger.950}' } },
          fg: { value: { base: '{colors.ledger.700}', _dark: '{colors.ledger.300}' } },
          muted: { value: { base: '{colors.ledger.100}', _dark: '{colors.ledger.900}' } },
          subtle: { value: { base: '{colors.ledger.50}', _dark: '{colors.ledger.950}' } },
          emphasized: { value: { base: '{colors.ledger.200}', _dark: '{colors.ledger.800}' } },
          focusRing: { value: { base: '{colors.ledger.500}', _dark: '{colors.ledger.400}' } },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
