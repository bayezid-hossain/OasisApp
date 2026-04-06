import {TextStyle} from 'react-native';

export const fontFamily = {
  manrope: 'Manrope-Regular',
  manropeBold: 'Manrope-Bold',
  inter: 'Inter-Regular',
} as const;

export const typography = {
  // Display — moments of arrival (Manrope)
  displayLg: {
    fontFamily: fontFamily.manropeBold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -0.02 * 56,
  } as TextStyle,
  displayMd: {
    fontFamily: fontFamily.manropeBold,
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: -0.02 * 45,
  } as TextStyle,

  // Headline — section headers (Manrope)
  headlineLg: {
    fontFamily: fontFamily.manropeBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.02 * 32,
  } as TextStyle,
  headlineMd: {
    fontFamily: fontFamily.manropeBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.02 * 28,
  } as TextStyle,
  headlineSm: {
    fontFamily: fontFamily.manropeBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.02 * 24,
  } as TextStyle,

  // Title — primary thought content (Inter)
  titleLg: {
    fontFamily: fontFamily.inter,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,
  titleMd: {
    fontFamily: fontFamily.inter,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.15,
  } as TextStyle,
  titleSm: {
    fontFamily: fontFamily.inter,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  // Body — long-form notes (Inter)
  bodyLg: {
    fontFamily: fontFamily.inter,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  } as TextStyle,
  bodyMd: {
    fontFamily: fontFamily.inter,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  } as TextStyle,
  bodySm: {
    fontFamily: fontFamily.inter,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  // Label — metadata (Inter)
  labelLg: {
    fontFamily: fontFamily.inter,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,
  labelMd: {
    fontFamily: fontFamily.inter,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  } as TextStyle,
  labelSm: {
    fontFamily: fontFamily.inter,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  } as TextStyle,
} as const;
