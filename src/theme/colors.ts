export const colors = {
  // Base surfaces
  surface: '#0f1415',
  surfaceContainerLowest: '#0a0f10',
  surfaceContainerLow: '#171c1d',
  surfaceContainer: '#1b2021',
  surfaceContainerHigh: '#262b2c',
  surfaceContainerHighest: '#313637',
  surfaceBright: '#353a3b',
  background: '#0f1415',

  // Tertiary — Oasis Ring accent
  tertiary: '#3adccc',
  tertiaryContainer: '#004c46',
  onTertiary: '#003732',
  onTertiaryContainer: '#00c5b6',

  // Primary
  primary: '#94d3c1',
  primaryContainer: '#004d40',
  onPrimary: '#003731',
  onPrimaryContainer: '#7ebdac',

  // Secondary
  secondary: '#b1cbC4',
  secondaryContainer: '#324b45',
  onSecondary: '#1d3530',
  onSecondaryContainer: '#cde8e0',

  // On surfaces
  onSurface: '#dfe3e4',
  onSurfaceVariant: '#bfc9c4',
  inverseSurface: '#dfe3e4',
  inverseOnSurface: '#2c3132',
  inversePrimary: '#006756',

  // Outline
  outline: '#89938f',
  outlineVariant: '#3f4945',

  // Error
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onErrorContainer: '#ffdad6',

  // Scrim / shadow
  scrim: '#000000',
  shadow: '#000000',
} as const;

export type ColorKey = keyof typeof colors;
