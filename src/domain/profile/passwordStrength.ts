/**
 * Pure password strength scoring for the profile domain.
 * No React, no side effects — safe to unit test and reuse.
 */

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrength {
  /** 0-4 score (0 = empty). */
  score: number;
  level: PasswordStrengthLevel;
}

/** Scores a password 0-4: length, mixed case, digits and symbols. */
export function scorePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, level: 'empty' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const levels: Record<typeof clamped, PasswordStrengthLevel> = {
    0: 'empty',
    1: 'weak',
    2: 'fair',
    3: 'good',
    4: 'strong',
  };

  return { score: clamped, level: levels[clamped] };
}

/** Visual tone per level, mapped to semantic design tokens only. */
export function strengthTone(level: PasswordStrengthLevel): 'error' | 'warning' | 'success' | 'none' {
  switch (level) {
    case 'weak':
      return 'error';
    case 'fair':
    case 'good':
      return 'warning';
    case 'strong':
      return 'success';
    default:
      return 'none';
  }
}
