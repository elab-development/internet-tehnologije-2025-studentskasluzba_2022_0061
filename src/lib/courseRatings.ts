export const COURSE_RATING_KEYS = [
  'TEZINA',
  'PRAKTI\u010CNOST',
  'KVALITET_NASTAVE',
  'ORGANIZACIJA',
  'KORISNOST',
] as const;

export type CourseRatingKey = (typeof COURSE_RATING_KEYS)[number];

export const COURSE_RATING_LABELS: Record<CourseRatingKey, string> = {
  TEZINA: 'Tezina',
  PRAKTI\u010CNOST: 'Prakticnost',
  KVALITET_NASTAVE: 'Kvalitet nastave',
  ORGANIZACIJA: 'Organizacija',
  KORISNOST: 'Korisnost',
};

export function normalizeCourseRatingKey(rawKey: string): CourseRatingKey | null {
  if (rawKey === 'TEZINA') return 'TEZINA';
  if (rawKey === 'KVALITET_NASTAVE') return 'KVALITET_NASTAVE';
  if (rawKey === 'ORGANIZACIJA') return 'ORGANIZACIJA';
  if (rawKey === 'KORISNOST') return 'KORISNOST';

  if (
    rawKey === 'PRAKTI\u00C4\u0152NOST' ||
    rawKey === 'PRAKTI\u010CNOST' ||
    rawKey === 'PRAKTIČNOST' ||
    rawKey === 'PRAKTICNOST'
  ) {
    return 'PRAKTI\u010CNOST';
  }

  return null;
}
