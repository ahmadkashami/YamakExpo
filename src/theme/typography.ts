export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  brand: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
  },
  error: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
  },
} as const;
