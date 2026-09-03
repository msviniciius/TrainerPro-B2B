import { PersonalTrainer, Student, WorkoutPlan, ExerciseLog, WorkoutSession } from '../types/database';
import { EXERCISES_DATABASE } from './exercisesData';

export const CURRENT_TRAINER: PersonalTrainer = {
  id: 'trainer-001',
  user_id: 'user-trainer-001',
  brand_name: 'TrainerPro Suite B2B',
  cref: 'CREF 041928-G/SP',
  phone: '+55 11 98877-6655',
  avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOaPkEfNADk9jx3Q1sAiAqWQ4QgJ87AI4mKmoxwaa3XZmJc2lDZGUNlFi1VhfVQdl9OAHsKzsEFEyedx0knVSMxlxpZT6EDXmx-tJ17Q6VXxYqjFjNqgyV8C3Ik3SPKRmBVZE5ZwLStQeloMjNxnxskjKnUMkxjchrM9tfu2qD6rcdNinm9oM6NLNJJDE3W_DerEIeT4BpNcb8hZIGTMI8lbfVOmurzvB5pJiAQoIw4DYb32Mgg9RGyQ',
  created_at: '2024-01-10T00:00:00Z'
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-001',
    trainer_id: 'trainer-001',
    user_id: 'user-student-001',
    full_name: 'Lucas Silveira da Rocha',
    email: 'lucas.silveira@email.com',
    phone: '+55 (11) 98765-4321',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJawI0M_3wgh-DTLaR56x_dZwIOeP89IpzvD0kmH__236rj9NXHDa6zQt1hfYHh8Z99w-Ed2iYKDz5sCh5TUjV0t_WaalusfRsNlLm7GZ9o-0QMRNvwOXmEFi6zLQZdPNUCFe6in54AvY6Q7leuSyVu0LiRsLpH9QBVvEr7KHiGg_FL_Dz4X64u_nSuNfpH7f-ku22jL-SWVqLQfPeMariVoqFoMtjDeoYWY12ds54QPMIhGZ9JCR7ug',
    plan_tier: 'trimestral',
    plan_name: 'Trimestral VIP',
    goal: 'Hipertrofia com Definição',
    cycle_info: 'Ciclo 4 • Hipertrofia',
    age: 29,
    weight_kg: 82.4,
    weight_diff_kg: -3.2,
    access_expiration_date: '2026-11-24', // Active
    is_active: true,
    auto_lock: true,
    last_workout_date: 'Hoje às 07:15',
    last_workout_name: 'Treino A - Peito e Ombros',
    created_at: '2024-08-01T00:00:00Z'
  },
  {
    id: 'student-002',
    trainer_id: 'trainer-001',
    user_id: 'user-student-002',
    full_name: 'Mariana Castro',
    email: 'mariana.castro@email.com',
    phone: '+55 (11) 97721-0021',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUUrKvRrC6q0BEV-8BE5Vqe2AeTlaUKGkAAjChZk4eIXtoGNplkZafFb2U0gOvVKEkCaRhU93Mkki5F3mYAVvWd8OOj1IzT9YOENAIjFWXa4F-8kbvLMtitG1H3vjq5IkoGODIET49fxT_fdeEyq_S9P2uJeZHyrhkk6r0QXWJEwaK6ww4ad6itnpj6wIiP6mA5SSlzEa1GEfgBOtjiSR0YRI7ud1MEM4p7LqYT-KTw4pmrAglyVghDQ',
    plan_tier: 'semestral',
    plan_name: 'Semestral VIP',
    goal: 'Emagrecimento 5x · Déficit Calórico',
    cycle_info: 'Ciclo 2 • Queima Acelerada',
    age: 26,
    weight_kg: 64.2,
    weight_diff_kg: -4.8,
    access_expiration_date: '2026-09-05', // Expiring in 2 days
    is_active: true,
    auto_lock: true,
    last_workout_date: 'Ontem às 18:40',
    last_workout_name: 'Treino B: Dorsais / Bíceps',
    created_at: '2024-03-01T00:00:00Z'
  },
  {
    id: 'student-003',
    trainer_id: 'trainer-001',
    user_id: 'user-student-003',
    full_name: 'Felipe Andrade',
    email: 'felipe.andrade@corp.com',
    phone: '+55 (11) 96543-2199',
    avatar_url: undefined,
    plan_tier: 'mensal',
    plan_name: 'Mensal Básico',
    goal: 'Força & Hipertrofia · 3x/sem',
    cycle_info: 'Ciclo 1 • Adaptação',
    age: 34,
    weight_kg: 78.5,
    weight_diff_kg: 1.2,
    access_expiration_date: '2026-09-07', // Expiring in 4 days
    is_active: true,
    auto_lock: true,
    last_workout_date: 'Há 4 dias',
    last_workout_name: 'Treino C: Pernas Completo',
    created_at: '2024-08-05T00:00:00Z'
  },
  {
    id: 'student-004',
    trainer_id: 'trainer-001',
    user_id: 'user-student-004',
    full_name: 'Carlos Eduardo',
    email: 'carlos.edu@fit.com',
    phone: '+55 (11) 95432-1100',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5BmFDGdLwMUiSV3x0Drhxqqm8M9IslP-oFzBGqGS1kAU7buNKc5tyK2Z1J_yHjOXg6HmIJZjyl5H5hdxqlIERO-Xe6qQI5C7EjmyUmxBnaI8X_QBreMrWDT5YQ-SIEbACfrGcyxiZiiqr86Y4Rzk0Q3XHz-vu2_04RZvBKbyzg00pMo37Y-Lru_9jt3I2mSAWEPQ9wYnRF1m5ZP0qIXmOmsGRS8mmUhtaoIIwYgmrTyS8ealDsu84tA',
    plan_tier: 'anual',
    plan_name: 'Plano Anual',
    goal: 'Performance Atlética',
    cycle_info: 'Ciclo 3 • Potência',
    age: 31,
    weight_kg: 88.0,
    weight_diff_kg: 0.0,
    access_expiration_date: '2026-08-28', // Expired / Blocked
    is_active: false,
    auto_lock: true,
    last_workout_date: 'Há 8 dias',
    last_workout_name: 'Sessão não concluída',
    created_at: '2023-08-28T00:00:00Z'
  },
  {
    id: 'student-005',
    trainer_id: 'trainer-001',
    user_id: 'user-student-005',
    full_name: 'Beatriz Lima',
    email: 'beatriz.lima@icloud.com',
    phone: '+55 (11) 94321-8765',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI6BtqUCbNb51golRGE10WFFn3DZ9n8TDQWDrVxwtpKQerANmCeSZWVJJ7jZ0QYYvac3hOQTHGoLRfJD3LuD7_5St3lC0yNSMZ8C3VC9IN_Q6DvtJ5e6v0Sts-RzrCw87K2Fhto_K-Wp0jp12Y4a5_Q4h1NUv7UyQQ6UfAvKwZoQiR79N5OECfFGAW6DtsOzZltNuh-GGKnKbV4l-AgjXgz3PLP2aatpzO_t3YSMcXnes9_uh-cxrF0Q',
    plan_tier: 'trimestral',
    plan_name: 'Trimestral',
    goal: 'Hipertrofia Glúteo / Inferiores',
    cycle_info: 'Ciclo 2 • Densidade',
    age: 27,
    weight_kg: 61.0,
    weight_diff_kg: 2.1,
    access_expiration_date: '2026-12-15', // Active
    is_active: true,
    auto_lock: true,
    last_workout_date: 'Hoje às 09:30',
    last_workout_name: 'Treino Inferior · 100% Carga',
    created_at: '2024-09-15T00:00:00Z'
  },
  {
    id: 'student-006',
    trainer_id: 'trainer-001',
    user_id: 'user-student-006',
    full_name: 'Gabriel Santos',
    email: 'gabriel.santos@email.com',
    phone: '+55 (11) 93210-9876',
    avatar_url: undefined,
    plan_tier: 'mensal',
    plan_name: 'Mensal Padrão',
    goal: 'Condicionamento Cardiorrespiratório',
    cycle_info: 'Ciclo 1 • Base Aeróbia',
    age: 40,
    weight_kg: 92.5,
    weight_diff_kg: -1.5,
    access_expiration_date: '2026-08-15', // Expired / Blocked
    is_active: false,
    auto_lock: true,
    last_workout_date: 'Há 12 dias',
    last_workout_name: 'Sessão de Pista',
    created_at: '2024-07-15T00:00:00Z'
  }
];

export const INITIAL_WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'plan-001',
    student_id: 'student-001',
    trainer_id: 'trainer-001',
    title: 'Treino A - Peitoral & Deltoide Ant.',
    split_day: 'A',
    focus_muscle: 'Peitoral & Deltoide Anterior',
    estimated_duration_min: 55,
    target_rpe: 8.5,
    rotator_cuff_safe: true,
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-04T00:00:00Z',
    exercises: [
      {
        id: 'we-001',
        workout_plan_id: 'plan-001',
        exercise_id: '0314',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0314'),
        order_index: 1,
        target_sets: 4,
        target_reps: '8 - 10',
        target_weight_kg: 28,
        rest_seconds: 90,
        coach_notes: 'Foco na cadência: 3s na descida controlada. Manter escápulas aduzidas sem bater os halteres no topo. Se sentir o ombro direito, parar 2cm antes do peito.',
        tempo: '3-0-1-0'
      },
      {
        id: 'we-002',
        workout_plan_id: 'plan-001',
        exercise_id: '0227',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0227'),
        order_index: 2,
        target_sets: 3,
        target_reps: '10 - 12',
        target_weight_kg: 55,
        rest_seconds: 60,
        coach_notes: 'Na última série realizar 1 drop de 30% até a falha concêntrica total. Não flexione excessivamente os cotovelos durante o retorno excêntrico.',
        intensity_tag: 'Drop-Set',
        tempo: '2-1-1-0'
      },
      {
        id: 'we-003',
        workout_plan_id: 'plan-001',
        exercise_id: '0405',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0405'),
        order_index: 3,
        target_sets: 4,
        target_reps: '10 - 12',
        target_weight_kg: 20,
        rest_seconds: 75,
        coach_notes: 'Cotovelos mantidos estritamente a 45° no plano escapular em relação ao tronco. Não realizar no banco reto 90° para evitar pinçamento do supraespinhal.',
        tempo: '2-0-1-0'
      },
      {
        id: 'we-004',
        workout_plan_id: 'plan-001',
        exercise_id: '0334',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0334'),
        order_index: 4,
        target_sets: 4,
        target_reps: '12 - 15',
        target_weight_kg: 12,
        rest_seconds: 45,
        coach_notes: 'Segurar 2 segundos cravados no topo da contração máxima de cada repetição. Sem balanço de quadril.',
        intensity_tag: 'Isometria 2s',
        tempo: '2-2-1-0'
      },
      {
        id: 'we-005',
        workout_plan_id: 'plan-001',
        exercise_id: '0241',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0241'),
        order_index: 5,
        target_sets: 3,
        target_reps: '12 - 15',
        target_weight_kg: 25,
        rest_seconds: 45,
        coach_notes: 'Abrir a corda no final estendendo o tríceps por completo sem mover o cotovelo.',
        tempo: '2-0-1-1'
      }
    ]
  },
  {
    id: 'plan-002',
    student_id: 'student-001',
    trainer_id: 'trainer-001',
    title: 'Treino B - Dorsal & Deltoide Post.',
    split_day: 'B',
    focus_muscle: 'Dorsal & Bíceps',
    estimated_duration_min: 52,
    target_rpe: 8.0,
    rotator_cuff_safe: true,
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-04T00:00:00Z',
    exercises: [
      {
        id: 'we-006',
        workout_plan_id: 'plan-002',
        exercise_id: '0150',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0150'),
        order_index: 1,
        target_sets: 4,
        target_reps: '8 - 10',
        target_weight_kg: 65,
        rest_seconds: 90,
        coach_notes: 'Puxar com o cotovelo apontando para baixo, apertando a grande dorsal.',
        tempo: '3-0-1-0'
      },
      {
        id: 'we-007',
        workout_plan_id: 'plan-002',
        exercise_id: '0027',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0027'),
        order_index: 2,
        target_sets: 4,
        target_reps: '10 - 12',
        target_weight_kg: 50,
        rest_seconds: 75,
        coach_notes: 'Coluna travada, puxando na linha do umbigo.',
        tempo: '2-1-1-0'
      },
      {
        id: 'we-008',
        workout_plan_id: 'plan-002',
        exercise_id: '0031',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0031'),
        order_index: 3,
        target_sets: 3,
        target_reps: '10 - 12',
        target_weight_kg: 24,
        rest_seconds: 60,
        coach_notes: 'Sem roubar no quadril. Pico de contração de 1 segundo.',
        tempo: '2-1-1-0'
      }
    ]
  },
  {
    id: 'plan-003',
    student_id: 'student-001',
    trainer_id: 'trainer-001',
    title: 'Treino C - Pernas Completo',
    split_day: 'C',
    focus_muscle: 'Quadríceps & Glúteos',
    estimated_duration_min: 65,
    target_rpe: 9.5,
    rotator_cuff_safe: true,
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-04T00:00:00Z',
    exercises: [
      {
        id: 'we-009',
        workout_plan_id: 'plan-003',
        exercise_id: '0043',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0043'),
        order_index: 1,
        target_sets: 4,
        target_reps: '6 - 8',
        target_weight_kg: 100,
        rest_seconds: 120,
        coach_notes: 'Descida profunda, peito erguido, joelhos alinhados com a ponta dos pés.',
        tempo: '3-0-1-0'
      },
      {
        id: 'we-010',
        workout_plan_id: 'plan-003',
        exercise_id: '0585',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0585'),
        order_index: 2,
        target_sets: 4,
        target_reps: '10 - 12',
        target_weight_kg: 240,
        rest_seconds: 90,
        coach_notes: 'Não estenda totalmente os joelhos no topo (trava articular proibida).',
        tempo: '3-1-1-0'
      },
      {
        id: 'we-011',
        workout_plan_id: 'plan-003',
        exercise_id: '0599',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0599'),
        order_index: 3,
        target_sets: 3,
        target_reps: '12 - 15',
        target_weight_kg: 45,
        rest_seconds: 60,
        coach_notes: 'Segurar 1s no topo e controlar 3s na descida excêntrica.',
        tempo: '3-0-1-1'
      }
    ]
  },
  {
    id: 'plan-004',
    student_id: 'student-001',
    trainer_id: 'trainer-001',
    title: 'Treino D - Posterior e Braços',
    split_day: 'D',
    focus_muscle: 'Isquiotibiais & Braços',
    estimated_duration_min: 52,
    target_rpe: 7.5,
    rotator_cuff_safe: true,
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-04T00:00:00Z',
    exercises: [
      {
        id: 'we-012',
        workout_plan_id: 'plan-004',
        exercise_id: '0085',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0085'),
        order_index: 1,
        target_sets: 4,
        target_reps: '8 - 10',
        target_weight_kg: 80,
        rest_seconds: 90,
        coach_notes: 'Alongamento profundo com quadril projetado para trás.',
        tempo: '3-0-1-0'
      },
      {
        id: 'we-013',
        workout_plan_id: 'plan-004',
        exercise_id: '0054',
        exercise: EXERCISES_DATABASE.find(e => e.id === '0054'),
        order_index: 2,
        target_sets: 3,
        target_reps: '10 - 12',
        target_weight_kg: 28,
        rest_seconds: 60,
        coach_notes: 'Cotovelos fechados apontando para o teto.',
        tempo: '2-1-1-0'
      }
    ]
  }
];

export const MOCK_EXERCISE_LOGS: ExerciseLog[] = [
  // Historic weekly logs for Lucas Silveira (Supino Reto progression week 1 to 8)
  { id: 'log-1', student_id: 'student-001', workout_exercise_id: 'we-001', exercise_id: '0289', exercise_name: 'Supino Reto com Halteres', split_day: 'A', set_number: 1, actual_reps: 10, actual_weight_kg: 22, previous_weight_kg: 20, rpe_rating: 7.5, completed_at: '2024-09-09T08:00:00Z' },
  { id: 'log-2', student_id: 'student-001', workout_exercise_id: 'we-001', exercise_id: '0289', exercise_name: 'Supino Reto com Halteres', split_day: 'A', set_number: 1, actual_reps: 10, actual_weight_kg: 24, previous_weight_kg: 22, rpe_rating: 8.0, completed_at: '2024-09-23T08:00:00Z' },
  { id: 'log-3', student_id: 'student-001', workout_exercise_id: 'we-001', exercise_id: '0289', exercise_name: 'Supino Reto com Halteres', split_day: 'A', set_number: 1, actual_reps: 10, actual_weight_kg: 26, previous_weight_kg: 24, rpe_rating: 8.5, completed_at: '2024-10-14T08:00:00Z' },
  { id: 'log-4', student_id: 'student-001', workout_exercise_id: 'we-001', exercise_id: '0289', exercise_name: 'Supino Reto com Halteres', split_day: 'A', set_number: 1, actual_reps: 10, actual_weight_kg: 28, previous_weight_kg: 26, rpe_rating: 8.5, completed_at: '2024-11-04T07:45:00Z' },
  // Additional sets for today's session
  { id: 'log-5', student_id: 'student-001', workout_exercise_id: 'we-001', exercise_id: '0289', exercise_name: 'Supino Reto com Halteres', split_day: 'A', set_number: 2, actual_reps: 10, actual_weight_kg: 28, previous_weight_kg: 26, rpe_rating: 8.5, completed_at: '2024-11-04T07:48:00Z' },
  { id: 'log-6', student_id: 'student-001', workout_exercise_id: 'we-001', exercise_id: '0289', exercise_name: 'Supino Reto com Halteres', split_day: 'A', set_number: 3, actual_reps: 8, actual_weight_kg: 28, previous_weight_kg: 26, rpe_rating: 9.0, completed_at: '2024-11-04T07:51:00Z' },
  { id: 'log-7', student_id: 'student-001', workout_exercise_id: 'we-001', exercise_id: '0289', exercise_name: 'Supino Reto com Halteres', split_day: 'A', set_number: 4, actual_reps: 8, actual_weight_kg: 28, previous_weight_kg: 26, rpe_rating: 9.0, completed_at: '2024-11-04T07:55:00Z' },
];

export const MOCK_SESSIONS: WorkoutSession[] = [
  {
    id: 'sess-001',
    student_id: 'student-001',
    split_day: 'A',
    workout_name: 'Treino A - Peito e Ombros',
    duration_minutes: 57,
    total_tonnage_kg: 7840,
    total_sets: 18,
    completed_exercises: 5,
    total_exercises: 5,
    rpe_average: 8.5,
    completed_at: 'Hoje, 04 Nov • 07:15 - 08:12',
    notes: 'Novo recorde pessoal nos halteres de 28kg!'
  },
  {
    id: 'sess-002',
    student_id: 'student-001',
    split_day: 'D',
    workout_name: 'Treino D - Posterior e Braços',
    duration_minutes: 52,
    total_tonnage_kg: 6920,
    total_sets: 16,
    completed_exercises: 4,
    total_exercises: 4,
    rpe_average: 7.5,
    completed_at: 'Sexta, 01 Nov • 18:30 - 19:22'
  },
  {
    id: 'sess-003',
    student_id: 'student-001',
    split_day: 'C',
    workout_name: 'Treino C - Pernas Completo',
    duration_minutes: 65,
    total_tonnage_kg: 11200,
    total_sets: 22,
    completed_exercises: 6,
    total_exercises: 6,
    rpe_average: 9.5,
    completed_at: 'Quarta, 30 Out • 07:00 - 08:05',
    notes: 'Agachamento pesado, sensação de exaustão.'
  },
  {
    id: 'sess-004',
    student_id: 'student-001',
    split_day: 'B',
    workout_name: 'Treino B - Dorsal e Tríceps',
    duration_minutes: 52,
    total_tonnage_kg: 7450,
    total_sets: 18,
    completed_exercises: 5,
    total_exercises: 5,
    rpe_average: 8.0,
    completed_at: 'Segunda, 28 Out • 07:10 - 08:02'
  }
];
