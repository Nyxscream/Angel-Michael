/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#0C2135',
    tint: '#16A7B5',

    // Core surfaces
    background: '#F4F8FB',
    foreground: '#0C2135',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#0C2135',

    // Primary action color (buttons, links, active states)
    primary: '#0C2135',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E4F4F5',
    secondaryForeground: '#0C5C69',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EDF2F5',
    mutedForeground: '#6A7B8C',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FFF4D5',
    accentForeground: '#765B00',

    // Destructive actions (delete, error states)
    destructive: '#D95454',
    destructiveForeground: '#ffffff',
    destructiveSurface: '#FCE5E5',
    primaryGlow: '#D9F1F2',
    primaryMuted: '#B5D8DE',

    // Borders and input outlines
    border: '#D7E2E8',
    input: '#D7E2E8',
  },

  dark: {
    text: '#F4FAFC',
    tint: '#38D2D1',
    background: '#07131F',
    foreground: '#F4FAFC',
    card: '#102538',
    cardForeground: '#F4FAFC',
    primary: '#38D2D1',
    primaryForeground: '#07131F',
    secondary: '#16394A',
    secondaryForeground: '#A6F2EF',
    muted: '#122A3B',
    mutedForeground: '#91A9B8',
    accent: '#3D3218',
    accentForeground: '#FFD66B',
    destructive: '#F06F70',
    destructiveForeground: '#200B0B',
    destructiveSurface: '#4B2022',
    primaryGlow: '#16465A',
    primaryMuted: '#9BC7CD',
    border: '#244253',
    input: '#244253',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
