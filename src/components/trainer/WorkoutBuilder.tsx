import React, { useState, useMemo, useCallback } from 'react';
import { Student, WorkoutPlan, WorkoutExercise, Exercise } from '../../types/database';
import { ExerciseCatalog } from './ExerciseCatalog';
import { WorkoutExerciseItem } from './WorkoutExerciseItem';
import { ExerciseSubstitutionModal } from './ExerciseSubstitutionModal';
import { WorkoutAuditModal } from './WorkoutAuditModal';
import { AiCopilotAssistant } from './AiCopilotAssistant';
import { 
  Dumbbell, 
  Trash2, 
  Copy, 
  Save, 
  ShieldAlert, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Activity,
  Bot
} from 'lucide-react';

interface WorkoutBuilderProps {
  student: Student;
  workoutPlans: WorkoutPlan[];
  onSaveWorkoutPlans: (plans: WorkoutPlan[]) => void;
  onViewStudentPWA?: () => void;
}

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({
  student,
  workoutPlans,
  onSaveWorkoutPlans,
  onViewStudentPWA
}) => {
  const [activeSplitDay, setActiveSplitDay] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  // Ensure there are always initialized plans (A, B, C) for this student
  const defaultInitializedPlans = useMemo<WorkoutPlan[]>(() => {
    if (workoutPlans && workoutPlans.length > 0) {
      return workoutPlans;
    }
    return [
      {
        id: `plan-${student.id}-A`,
        student_id: student.id,
        split_day: 'A',
        title: 'Treino A - Peito e Tríceps',
        target_muscle_groups: ['Peito', 'Tríceps', 'Ombro'],
        estimated_duration_min: 50,
        target_rpe: 8,
        exercises: []
      },
      {
        id: `plan-${student.id}-B`,
        student_id: student.id,
        split_day: 'B',
        title: 'Treino B - Dorsais e Bíceps',
        target_muscle_groups: ['Costas', 'Bíceps'],
        estimated_duration_min: 50,
        target_rpe: 8,
        exercises: []
      },
      {
        id: `plan-${student.id}-C`,
        student_id: student.id,
        split_day: 'C',
        title: 'Treino C - Membros Inferiores',
        target_muscle_groups: ['Quadríceps', 'Posterior', 'Panturrilha'],
        estimated_duration_min: 55,
        target_rpe: 8.5,
        exercises: []
      }
    ];
  }, [student.id, workoutPlans]);

  const [plans, setPlans] = useState<WorkoutPlan[]>(defaultInitializedPlans);

  // Synchronize when student changes
  React.useEffect(() => {
    setPlans(defaultInitializedPlans);
  }, [defaultInitializedPlans]);

  // Modals & Drawers
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [substitutionTarget, setSubstitutionTarget] = useState<WorkoutExercise | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Active workout plan for currently selected split day
  const currentPlan = plans.find(p => p.split_day === activeSplitDay) || plans[0];

  // In-plan counts mapping for the catalog
  const inPlanCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentPlan?.exercises.forEach(we => {
      counts[we.exercise_id] = (counts[we.exercise_id] || 0) + 1;
    });
    return counts;
  }, [currentPlan?.exercises]);

  // Volume calculations per muscle group for current workout
  const muscleVolumeBreakdown = useMemo(() => {
    const map: { [key: string]: number } = {};
    currentPlan?.exercises.forEach(we => {
      const muscle = we.exercise?.body_part || 'Outro';
      const sets = Number(we.target_sets) || 0;
      map[muscle] = (map[muscle] || 0) + sets;
    });
    return map;
  }, [currentPlan?.exercises]);

  // Total sets in active session
  const totalVolumeSets = useMemo(() => {
    return currentPlan?.exercises.reduce((sum, ex) => sum + (Number(ex.target_sets) || 0), 0) || 0;
  }, [currentPlan?.exercises]);

  // Add exercise to current workout plan
  const handleAddExerciseToPlan = useCallback((exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      workout_plan_id: currentPlan.id,
      exercise_id: exercise.id,
      exercise: exercise,
      order_index: currentPlan.exercises.length + 1,
      target_sets: 4,
      target_reps: '8 - 10',
      target_weight_kg: 20,
      rest_seconds: 60,
      coach_notes: exercise.biomechanics_tip || 'Manter a cadência controlada na fase excêntrica.',
      tempo: '3-0-1-0'
    };

    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          exercises: [...p.exercises, newWorkoutExercise]
        };
      }
      return p;
    }));
  }, [currentPlan.id, currentPlan.exercises.length]);

  // Remove exercise from current plan
  const handleRemoveExercise = useCallback((exerciseId: string) => {
    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          exercises: p.exercises.filter(e => e.id !== exerciseId)
        };
      }
      return p;
    }));
  }, [currentPlan.id]);

  // Move exercise Up / Down
  const handleMoveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id !== currentPlan.id) return p;
      if (direction === 'up' && index === 0) return p;
      if (direction === 'down' && index === p.exercises.length - 1) return p;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const reordered = [...p.exercises];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(newIndex, 0, moved);

      return { ...p, exercises: reordered };
    }));
  }, [currentPlan.id]);

  // Update inline parameters of an exercise
  const handleUpdateExerciseParam = useCallback((exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          exercises: p.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e)
        };
      }
      return p;
    }));
  }, [currentPlan.id]);

  // Duplicate an exercise
  const handleDuplicateExercise = useCallback((exercise: WorkoutExercise) => {
    const duplicated: WorkoutExercise = {
      ...exercise,
      id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      order_index: currentPlan.exercises.length + 1
    };

    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === currentPlan.id) {
        return { ...p, exercises: [...p.exercises, duplicated] };
      }
      return p;
    }));
  }, [currentPlan.id, currentPlan.exercises.length]);

  // Handle Biomechanical Substitution Callback
  const handleConfirmSubstitution = useCallback((workoutExerciseId: string, newExercise: Exercise, note: string) => {
    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          exercises: p.exercises.map(e => {
            if (e.id === workoutExerciseId) {
              return {
                ...e,
                exercise_id: newExercise.id,
                exercise: newExercise,
                coach_notes: `${note} | ${e.coach_notes || ''}`
              };
            }
            return e;
          })
        };
      }
      return p;
    }));

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  }, [currentPlan.id]);

  const handleSubstitute = useCallback((exercise: WorkoutExercise) => {
    setSubstitutionTarget(exercise);
  }, []);

  // Clear current day
  const handleClearCurrentDay = () => {
    if (window.confirm(`Tem certeza que deseja limpar todos os exercícios do Treino ${currentPlan.split_day}?`)) {
      setPlans(prevPlans => prevPlans.map(p => {
        if (p.id === currentPlan.id) {
          return { ...p, exercises: [] };
        }
        return p;
      }));
    }
  };

  // Duplicate whole split day
  const handleDuplicateSplitDay = () => {
    const nextDays: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
    const currentIdx = nextDays.indexOf(activeSplitDay);
    const targetDay = nextDays[(currentIdx + 1) % nextDays.length];

    setPlans(prevPlans => prevPlans.map(p => {
      if (p.split_day === targetDay) {
        return {
          ...p,
          title: `Cópia do Treino ${activeSplitDay}`,
          focus_muscle: currentPlan.focus_muscle,
          exercises: currentPlan.exercises.map(e => ({
            ...e,
            id: `we-copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
          }))
        };
      }
      return p;
    }));

    setActiveSplitDay(targetDay);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Save and publish
  const handleSaveAndPublish = () => {
    onSaveWorkoutPlans(plans);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto">
      {/* 1. Context Banner & Action Cluster */}
      <section className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-metric text-xs text-[#4edea3] font-bold uppercase tracking-wider bg-[#10b981]/15 px-3 py-1 rounded-full border border-[#4edea3]/30 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-[#4edea3]" />
                Prescritor Studio & Biomecânica
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#dae2fd] tracking-tight">
                Ficha de Treino: {student.full_name}
              </h1>
              <span className="font-mono-metric text-xs px-2.5 py-0.5 rounded-full bg-[#2d3449] text-[#bbcabf]">
                ID #{student.id.slice(-5)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222a3d] text-[#bbcabf] text-xs font-medium border border-[#3c4a42]/30">
                <Dumbbell className="w-3.5 h-3.5 text-[#4edea3]" />
                {student.goal}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222a3d] text-[#bbcabf] text-xs font-medium border border-[#3c4a42]/30">
                <Clock className="w-3.5 h-3.5 text-[#ffb95f]" />
                Vigência: {new Date(student.access_expiration_date).toLocaleDateString('pt-BR')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3131c0]/40 text-[#c0c1ff] text-xs font-medium border border-[#c0c1ff]/20">
                <Flame className="w-3.5 h-3.5 text-[#c0c1ff]" />
                {currentPlan?.focus_muscle || 'Hipertrofia'}
              </span>
              {currentPlan?.rotator_cuff_safe && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#4edea3] font-mono-metric text-[11px] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Manguito Protegido (Plano Escapular)
                </span>
              )}
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* AI Biomechanical Audit */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#222a3d] text-[#ffb95f] hover:bg-[#31394d] transition-colors text-xs font-semibold border border-[#ffb95f]/30 active:scale-95 cursor-pointer"
              title="Auditoria biomecânica e segurança articular do treino"
            >
              <Activity className="w-4 h-4" />
              <span>Auditoria Biomecânica</span>
            </button>

            {/* AI Copilot Chat Toggle */}
            <button
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className={`flex items-center gap-2 h-10 px-3.5 rounded-xl transition-all text-xs font-semibold border cursor-pointer ${
                isCopilotOpen
                  ? 'bg-[#10b981] text-[#003824] border-[#10b981]'
                  : 'bg-[#222a3d] text-[#dae2fd] hover:bg-[#31394d] border-[#3c4a42]/40'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Copiloto IA</span>
            </button>

            {/* Save & Publish */}
            <button
              onClick={handleSaveAndPublish}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#10b981] text-[#003824] font-bold text-xs hover:bg-[#4edea3] transition-all shadow-lg shadow-[#10b981]/20 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Ficha</span>
            </button>
          </div>
        </div>

        {/* Save Toast */}
        {saveToast && (
          <div className="absolute bottom-2 right-4 bg-[#10b981] text-[#003824] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ficha salva e sincronizada com sucesso!</span>
          </div>
        )}
      </section>

      {/* 2. Workspace 2-Column Studio Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Exercise Catalogue (Optimized & Paginated) */}
        <ExerciseCatalog
          activeSplitDay={activeSplitDay}
          inPlanCounts={inPlanCounts}
          onAddExercise={handleAddExerciseToPlan}
        />

        {/* RIGHT PANEL: Workout Split Structure & Parameters (7 cols) */}
        <section className="xl:col-span-7 flex flex-col gap-4">
          {/* Split Day Tabs & Batch Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#171f33] p-2 rounded-2xl border border-[#3c4a42]/40 shadow-md">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['A', 'B', 'C', 'D', 'E'] as const).map(day => {
                const plan = plans.find(p => p.split_day === day);
                const isActive = activeSplitDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveSplitDay(day)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#10b981] text-[#003824] shadow-md'
                        : 'text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#003824]' : 'bg-[#4edea3]'}`}></span>
                    <span>Treino {day}</span>
                    <span className={`font-mono-metric text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isActive ? 'bg-[#003824]/20 text-[#003824]' : 'bg-[#2d3449] text-[#bbcabf]'
                    }`}>
                      {plan?.exercises.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Split Day Utility Actions */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={handleDuplicateSplitDay}
                className="p-2 rounded-lg text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#222a3d] transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title="Copiar estrutura deste treino para o próximo dia"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Duplicar Divisão</span>
              </button>
              <button
                onClick={handleClearCurrentDay}
                className="p-2 rounded-lg text-[#ffb4ab] hover:bg-[#93000a]/20 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title="Limpar exercícios deste dia"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </div>
          </div>

          {/* Volume Summary & Muscle Breakdown Radar */}
          <div className="bg-[#131b2e] rounded-2xl p-4 border border-[#3c4a42]/40 flex flex-col gap-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex flex-col">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Volume da Sessão</span>
                  <span className="font-mono-metric text-lg font-bold text-[#4edea3]">{totalVolumeSets} séries</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Duração Média</span>
                  <span className="font-mono-metric text-lg font-bold text-[#dae2fd]">{currentPlan?.estimated_duration_min || 50} min</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">RPE Alvo</span>
                  <span className="font-mono-metric text-lg font-bold text-[#ffb95f]">{currentPlan?.target_rpe || 8.5} / 10</span>
                </div>
              </div>

              {/* Weekly load indicator */}
              <div className="flex flex-col min-w-[180px] flex-1 max-w-xs">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-[#bbcabf]">Teto de Volume por Sessão</span>
                  <span className="font-mono-metric text-[#4edea3] font-bold">{totalVolumeSets}/22 séries</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#2d3449] overflow-hidden flex">
                  <div 
                    className={`h-full transition-all ${totalVolumeSets > 22 ? 'bg-[#ffb4ab]' : 'bg-[#10b981]'}`}
                    style={{ width: `${Math.min(100, (totalVolumeSets / 22) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Muscle distribution pills */}
            {Object.keys(muscleVolumeBreakdown).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#3c4a42]/30">
                <span className="text-[10px] font-mono-metric uppercase text-[#86948a] mr-1">
                  Volume por Músculo:
                </span>
                {Object.entries(muscleVolumeBreakdown).map(([muscle, sets]) => (
                  <span
                    key={muscle}
                    className="font-mono-metric text-[11px] px-2.5 py-0.5 rounded-full bg-[#222a3d] text-[#dae2fd] border border-[#3c4a42]/40 flex items-center gap-1.5"
                  >
                    <span className="font-semibold">{muscle}:</span>
                    <strong className="text-[#4edea3]">{sets} séries</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Workout Exercises Stack */}
          <div className="flex flex-col gap-3">
            {currentPlan?.exercises.length === 0 ? (
              <div className="p-12 text-center bg-[#171f33] rounded-2xl border border-dashed border-[#3c4a42]/60 space-y-3">
                <Dumbbell className="w-12 h-12 mx-auto text-[#86948a] opacity-40" />
                <h3 className="text-base font-bold text-[#dae2fd]">Nenhum exercício neste treino</h3>
                <p className="text-xs text-[#bbcabf] max-w-sm mx-auto">
                  Selecione os exercícios no catálogo à esquerda e clique em "+ Adicionar" para montar a ficha deste treino.
                </p>
              </div>
            ) : (
              currentPlan?.exercises.map((workoutExercise, index) => (
                <WorkoutExerciseItem
                  key={workoutExercise.id}
                  workoutExercise={workoutExercise}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === currentPlan.exercises.length - 1}
                  onUpdateParam={handleUpdateExerciseParam}
                  onMove={handleMoveExercise}
                  onDuplicate={handleDuplicateExercise}
                  onRemove={handleRemoveExercise}
                  onSubstitute={handleSubstitute}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Modals and Copilot Drawer */}
      <ExerciseSubstitutionModal
        isOpen={!!substitutionTarget}
        onClose={() => setSubstitutionTarget(null)}
        workoutExercise={substitutionTarget}
        onConfirmSubstitution={handleConfirmSubstitution}
      />

      <WorkoutAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        workoutPlan={currentPlan}
        student={student}
      />

      <AiCopilotAssistant
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentPlan={currentPlan}
        student={student}
      />
    </div>
  );
};
