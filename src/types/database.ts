export type StudentStatus = 'active' | 'expiring' | 'blocked';

export type PlanTier = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export interface Exercise {
  id: string; // e.g. "0001"
  name: string;
  body_part: string; // "Peitoral", "Dorsal", "Quadríceps", etc.
  target_muscle: string; // "Peitoral Maior", "Deltoide Lateral", etc.
  equipment: string; // "Halteres", "Barra", "Polia / Cabo", "Máquina", "Peso Corporal"
  gif_url: string;
  image_url: string;
  instructions_pt: string;
  biomechanics_tip?: string;
}

export interface ConsultingPlan {
  id: string;
  name: string;
  tier: PlanTier;
  duration_days: number;
  price_brl: number;
  description: string;
  benefits: string[];
  is_popular?: boolean;
  payment_link?: string;
  is_active: boolean;
}

export interface PersonalTrainer {
  id: string;
  user_id: string;
  full_name: string;
  brand_name: string;
  cref: string;
  email: string;
  phone: string;
  bio?: string;
  specialties?: string[];
  instagram?: string;
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  avatar_url?: string;
  roster_capacity?: number;
  auto_block_defaulters?: boolean;
  welcome_message?: string;
  plans: ConsultingPlan[];
  created_at: string;
}

export interface Student {
  id: string;
  trainer_id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  plan_tier: PlanTier;
  plan_name: string;
  goal: string;
  cycle_info: string;
  age: number;
  weight_kg: number;
  weight_diff_kg: number;
  access_expiration_date: string; // YYYY-MM-DD
  is_active: boolean;
  auto_lock: boolean;
  last_workout_date?: string;
  last_workout_name?: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_plan_id: string;
  exercise_id: string;
  exercise?: Exercise;
  order_index: number;
  target_sets: number;
  target_reps: string; // e.g. "8 - 10"
  target_weight_kg: number;
  rest_seconds: number;
  coach_notes: string;
  intensity_tag?: string; // "Drop-Set", "Isometria 2s", "Rest-Pause"
  tempo?: string; // e.g. "3-0-1-0"
}

export interface WorkoutPlan {
  id: string;
  student_id: string;
  trainer_id: string;
  title: string; // e.g. "Treino A - Peitoral & Deltoide Ant."
  split_day: 'A' | 'B' | 'C' | 'D' | 'E';
  focus_muscle: string;
  estimated_duration_min: number;
  target_rpe: number;
  rotator_cuff_safe: boolean;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseLog {
  id: string;
  student_id: string;
  workout_exercise_id: string;
  exercise_id: string;
  exercise_name: string;
  split_day: string;
  set_number: number;
  actual_reps: number;
  actual_weight_kg: number;
  previous_weight_kg?: number;
  rpe_rating?: number;
  completed_at: string;
}

export interface WorkoutSession {
  id: string;
  student_id: string;
  split_day: string;
  workout_name: string;
  duration_minutes: number;
  total_tonnage_kg: number;
  total_sets: number;
  completed_exercises: number;
  total_exercises: number;
  rpe_average: number;
  completed_at: string;
  notes?: string;
}

export interface AnamnesisInput {
  student_name: string;
  age: number;
  goal: string; // "Hipertrofia", "Emagrecimento", "Força", "Condicionamento"
  experience_level: 'Iniciante' | 'Intermediário' | 'Avançado';
  days_per_week: number;
  available_equipment: string[];
  injuries_or_limitations: string;
  focus_muscles: string;
  split_template?: string;
  intensity_preference?: string;
}

export interface GeneratedAiWorkout {
  title: string;
  cycle_description: string;
  periodization_phase?: string;
  weekly_volume_summary?: string;
  splits: {
    split_day: 'A' | 'B' | 'C' | 'D' | 'E';
    title: string;
    focus: string;
    estimated_duration_min: number;
    target_rpe: number;
    rotator_cuff_safe: boolean;
    warmup_activation?: string;
    exercises: {
      exercise_id?: string;
      name: string;
      target_muscle: string;
      equipment: string;
      sets: number;
      reps: string;
      weight_kg: number;
      rest_seconds: number;
      coach_notes: string;
      intensity_tag?: string;
      tempo?: string;
    }[];
  }[];
  coach_insights: string;
}

export interface BiomechanicalSubstitute {
  name: string;
  target_muscle: string;
  equipment: string;
  biomechanical_advantage: string;
  recommended_tempo?: string;
  sets?: number;
  reps?: string;
}

export interface WorkoutAuditResult {
  overall_score: number;
  volume_assessment: string;
  biomechanical_risk_level: 'Baixo' | 'Moderado' | 'Alto';
  joint_health_notes: string;
  actionable_tips: string[];
}

