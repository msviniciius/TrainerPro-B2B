import { Student, WorkoutPlan } from '../types/database';
import { INITIAL_STUDENTS, INITIAL_WORKOUT_PLANS } from '../data/mockData';

const STUDENTS_STORAGE_KEY = 'trainerpro_students_v1';
const PLANS_STORAGE_KEY = 'trainerpro_plans_v1';

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (!raw) {
      // Initialize with mock students and default credentials
      const defaultWithAuth: Student[] = INITIAL_STUDENTS.map((s, idx) => ({
        ...s,
        password: 'aluno123',
        password_set: idx !== 0, // First student can be either way, let's keep ready
        invite_token: s.id,
      }));
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(defaultWithAuth));
      return defaultWithAuth;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load students from localStorage:', err);
  }
  return INITIAL_STUDENTS;
}

export function saveStoredStudents(students: Student[]): void {
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch (err) {
    console.warn('Failed to save students to localStorage:', err);
  }
}

export function getStoredWorkoutPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(INITIAL_WORKOUT_PLANS));
      return INITIAL_WORKOUT_PLANS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load workout plans from localStorage:', err);
  }
  return INITIAL_WORKOUT_PLANS;
}

export function saveStoredWorkoutPlans(plans: WorkoutPlan[]): void {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (err) {
    console.warn('Failed to save workout plans to localStorage:', err);
  }
}

/**
 * Creates an initial set of workout plans (Treino A, B, C) for a newly registered student
 */
export function createDefaultPlansForStudent(student: Partial<Student>): WorkoutPlan[] {
  const studentId = student.id || `student-${Date.now()}`;
  const basePlans = INITIAL_WORKOUT_PLANS;

  return basePlans.map((base, idx) => ({
    ...base,
    id: `plan-${studentId}-${base.split_day}-${idx}`,
    student_id: studentId,
    title: base.title,
    split_day: base.split_day,
    focus_muscle: base.focus_muscle,
    created_at: new Date().toISOString(),
    exercises: base.exercises.map((ex, exIdx) => ({
      ...ex,
      id: `we-${studentId}-${base.split_day}-${exIdx}`,
      workout_plan_id: `plan-${studentId}-${base.split_day}-${idx}`,
    }))
  }));
}
