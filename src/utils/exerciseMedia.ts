/**
 * Exercise Media helper for exercises-dataset
 * Primary Mirror & Fast CDN: omercotkd/exercises-gifs assets
 * Secondary: raw.githubusercontent.com
 */

export const DATASET_REPO = 'omercotkd/exercises-gifs';

export function getExerciseGifUrl(exerciseId: string): string {
  // Normalize 4-digit ID
  const paddedId = exerciseId.padStart(4, '0');
  
  // Fast global CDN via jsdelivr (primary)
  return `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${paddedId}.gif`;
}

export function getExerciseFallbackGifUrl(exerciseId: string): string {
  const paddedId = exerciseId.padStart(4, '0');
  // Raw GitHub fallback
  return `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${paddedId}.gif`;
}

export function getExerciseStaticCdnUrl(exerciseId: string): string {
  const paddedId = exerciseId.padStart(4, '0');
  return `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${paddedId}.gif`;
}
