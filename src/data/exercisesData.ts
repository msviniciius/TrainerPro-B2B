import { Exercise } from '../types/database';
import allExercisesJson from './allExercises.json';

/**
 * Catálogo Completo de 1.324 Exercícios
 * Integrado ao dataset com animações GIF de alta disponibilidade
 */
export const EXERCISES_DATABASE: Exercise[] = allExercisesJson as Exercise[];
