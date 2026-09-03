import React, { useState, useMemo } from 'react';
import { Student, WorkoutPlan, WorkoutExercise, Exercise } from '../../types/database';
import { EXERCISES_DATABASE } from '../../data/exercisesData';
import { ExerciseMedia } from '../common/ExerciseMedia';
import { ExerciseSubstitutionModal } from './ExerciseSubstitutionModal';
import { WorkoutAuditModal } from './WorkoutAuditModal';
import { AiCopilotAssistant } from './AiCopilotAssistant';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Save, 
  Check, 
  RotateCcw, 
  ShieldAlert, 
  Search, 
  SlidersHorizontal, 
  Clock, 
  Layers, 
  Flame, 
  CheckCircle2, 
  X,
  RefreshCw,
  Activity,
  Bot,
  Zap,
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';

interface WorkoutBuilderProps {
  student: Student;
  workoutPlans: WorkoutPlan[];
  onSaveWorkoutPlans: (plans: WorkoutPlan[]) => void;
  onViewStudentPWA: () => void;
}

const INTENSITY_PRESETS = [
  'Drop-Set 3x',
  'Rest-Pause 20s',
  'Isometria 2s',
  'Excêntrica 4s',
  'Cluster Set',
  'Super-série (Bi-set)',
  'Back-off Set (-20%)',
  'Pico de Contração'
];

const TEMPO_PRESETS = [
  '3-0-1-0 (Hipertrofia Padrão)',
  '4-1-1-0 (Alta Tensão Excêntrica)',
  '2-0-1-0 (Potência & Carga)',
  '2-2-1-0 (Isometria no Ponto Zero)',
  '3-1-1-1 (Contração de Pico)'
];

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({
  student,
  workoutPlans,
  onSaveWorkoutPlans,
  onViewStudentPWA
}) => {
  const [activeSplitDay, setActiveSplitDay] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [plans, setPlans] = useState<WorkoutPlan[]>(workoutPlans);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');

  // Modals & Drawers
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [substitutionTarget, setSubstitutionTarget] = useState<WorkoutExercise | null>(null);

  const [saveToast, setSaveToast] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Active workout plan for currently selected split day
  const currentPlan = plans.find(p => p.split_day === activeSplitDay) || plans[0];

  // Exercises filtered in catalogue
  const filteredCatalog = useMemo(() => {
    return EXERCISES_DATABASE.filter(ex => {
      if (selectedMuscle !== 'all') {
        const matchBody = ex.body_part.toLowerCase() === selectedMuscle.toLowerCase();
        const matchTarget = ex.target_muscle.toLowerCase().includes(selectedMuscle.toLowerCase());
        const matchPernas = selectedMuscle === 'Quadríceps' && (ex.target_muscle.toLowerCase().includes('quad') || (ex.body_part === 'Pernas' && !ex.target_muscle.includes('Isquio') && !ex.target_muscle.includes('Glúteo')));
        const matchIsquios = selectedMuscle === 'Isquiotibiais' && (ex.target_muscle.toLowerCase().includes('isquio') || ex.target_muscle.toLowerCase().includes('hamstring') || ex.target_muscle.toLowerCase().includes('femoral'));
        const matchGluteos = selectedMuscle === 'Glúteos' && ex.target_muscle.toLowerCase().includes('glúteo');
        const matchDorsal = selectedMuscle === 'Dorsal' && (ex.body_part === 'Dorsal' || ex.target_muscle.includes('Dorsal') || ex.target_muscle.includes('Trapézio'));
        const matchBracos = selectedMuscle === 'Bíceps' ? ex.target_muscle.includes('Bíceps') : selectedMuscle === 'Tríceps' ? ex.target_muscle.includes('Tríceps') : false;

        if (!matchBody && !matchTarget && !matchPernas && !matchIsquios && !matchGluteos && !matchDorsal && !matchBracos) {
          return false;
        }
      }
      if (selectedEquipment !== 'all' && !ex.equipment.toLowerCase().includes(selectedEquipment.toLowerCase())) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchName = ex.name.toLowerCase().includes(q);
        const matchTarget = ex.target_muscle.toLowerCase().includes(q);
        const matchBody = ex.body_part.toLowerCase().includes(q);
        const matchEquip = ex.equipment.toLowerCase().includes(q);
        if (!matchName && !matchTarget && !matchBody && !matchEquip) return false;
      }
      return true;
    });
  }, [selectedMuscle, selectedEquipment, searchFilter]);

  // Volume calculations per muscle group for current workout
  const muscleVolumeBreakdown = useMemo(() => {
    const map: { [key: string]: number } = {};
    currentPlan?.exercises.forEach(we => {
      const muscle = we.exercise?.body_part || 'Outro';
      const sets = Number(we.target_sets) || 0;
      map[muscle] = (map[muscle] || 0) + sets;
    });
    return map;
  }, [currentPlan]);

  // Total sets in active session
  const totalVolumeSets = currentPlan?.exercises.reduce((sum, ex) => sum + (Number(ex.target_sets) || 0), 0) || 0;

  // Add exercise to current workout plan
  const handleAddExerciseToPlan = (exercise: Exercise) => {
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

    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          exercises: [...p.exercises, newWorkoutExercise]
        };
      }
      return p;
    });

    setPlans(updatedPlans);
    setJustAddedId(exercise.id);
    setTimeout(() => setJustAddedId(null), 1200);
  };

  // Remove exercise from current plan
  const handleRemoveExercise = (exerciseId: string) => {
    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          exercises: p.exercises.filter(e => e.id !== exerciseId)
        };
      }
      return p;
    });
    setPlans(updatedPlans);
  };

  // Move exercise Up / Down
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentPlan.exercises.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...currentPlan.exercises];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        return { ...p, exercises: reordered };
      }
      return p;
    });
    setPlans(updatedPlans);
  };

  // Update inline parameters of an exercise
  const handleUpdateExerciseParam = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        return {
          ...p,
          exercises: p.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e)
        };
      }
      return p;
    });
    setPlans(updatedPlans);
  };

  // Duplicate an exercise
  const handleDuplicateExercise = (exercise: WorkoutExercise) => {
    const duplicated: WorkoutExercise = {
      ...exercise,
      id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      order_index: currentPlan.exercises.length + 1
    };

    const updatedPlans = plans.map(p => {
      if (p.id === currentPlan.id) {
        return { ...p, exercises: [...p.exercises, duplicated] };
      }
      return p;
    });
    setPlans(updatedPlans);
  };

  // Clear current day
  const handleClearCurrentDay = () => {
    if (window.confirm(`Tem certeza que deseja limpar todos os exercícios do Treino ${currentPlan.split_day}?`)) {
      const updatedPlans = plans.map(p => {
        if (p.id === currentPlan.id) {
          return { ...p, exercises: [] };
        }
        return p;
      });
      setPlans(updatedPlans);
    }
  };

  // Duplicate whole split day
  const handleDuplicateSplitDay = () => {
    const nextDays: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
    const currentIdx = nextDays.indexOf(activeSplitDay);
    const targetDay = nextDays[(currentIdx + 1) % nextDays.length];

    const updatedPlans = plans.map(p => {
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
    });

    setPlans(updatedPlans);
    setActiveSplitDay(targetDay);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Handle Biomechanical Substitution Callback
  const handleConfirmSubstitution = (workoutExerciseId: string, newExercise: Exercise, note: string) => {
    const updatedPlans = plans.map(p => {
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
    });

    setPlans(updatedPlans);
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
              className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#222a3d] text-[#ffb95f] hover:bg-[#31394d] transition-colors text-xs font-semibold border border-[#ffb95f]/30 active:scale-95"
              title="Auditoria biomecânica e segurança articular do treino"
            >
              <Activity className="w-4 h-4" />
              <span>Auditoria Biomecânica</span>
            </button>

            {/* AI Copilot Chat Toggle */}
            <button
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className={`flex items-center gap-2 h-10 px-3.5 rounded-xl transition-all text-xs font-semibold border ${
                isCopilotOpen
                  ? 'bg-[#10b981] text-[#003824] border-[#10b981]'
                  : 'bg-[#222a3d] text-[#dae2fd] hover:bg-[#31394d] border-[#3c4a42]/40'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Copiloto IA</span>
            </button>

            {/* Test on Student PWA */}
            <button
              onClick={onViewStudentPWA}
              className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#222a3d] text-[#dae2fd] hover:bg-[#31394d] transition-colors text-xs font-semibold border border-[#3c4a42]/40"
              title="Visualizar exatamente como o aluno verá no celular"
            >
              <span>Ver no App do Aluno</span>
            </button>

            {/* Save & Publish */}
            <button
              onClick={handleSaveAndPublish}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#10b981] text-[#003824] font-bold text-xs hover:bg-[#4edea3] transition-all shadow-lg shadow-[#10b981]/20 active:scale-95"
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
        {/* LEFT PANEL: Exercise Catalogue Search & Insertion (5 cols) */}
        <aside className="xl:col-span-5 bg-[#171f33] rounded-2xl p-4 sm:p-5 border border-[#3c4a42]/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#4edea3]" />
              <h2 className="text-base font-bold text-[#dae2fd]">Catálogo Técnico de Exercícios</h2>
            </div>
            <span className="font-mono-metric text-xs text-[#86948a] font-semibold">
              {EXERCISES_DATABASE.length} catalogados
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, músculo ou equipamento..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0b1326] text-[#dae2fd] placeholder:text-[#86948a] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Muscle Group Chips Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'Peitoral', label: 'Peitoral' },
              { id: 'Dorsal', label: 'Dorsal' },
              { id: 'Quadríceps', label: 'Quadríceps' },
              { id: 'Isquiotibiais', label: 'Isquiotibiais' },
              { id: 'Glúteos', label: 'Glúteos' },
              { id: 'Deltoides', label: 'Deltoides' },
              { id: 'Tríceps', label: 'Tríceps' },
              { id: 'Bíceps', label: 'Bíceps' },
              { id: 'Abdômen', label: 'Abdômen' },
            ].map(muscle => (
              <button
                key={muscle.id}
                onClick={() => setSelectedMuscle(muscle.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedMuscle === muscle.id
                    ? 'bg-[#10b981] text-[#003824] font-bold shadow-sm'
                    : 'bg-[#0b1326] text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
                }`}
              >
                {muscle.label}
              </button>
            ))}
          </div>

          {/* Equipment Dropdown Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#86948a] flex-shrink-0" />
            <label className="text-xs text-[#bbcabf] font-semibold">Equipamento:</label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
            >
              <option value="all">Todos Equipamentos</option>
              <option value="Halteres">Halteres (Dumbbells)</option>
              <option value="Barra">Barra Livre (Barbell)</option>
              <option value="Polia">Polia / Cabo (Cable Machine)</option>
              <option value="Máquina">Máquinas Articuladas</option>
              <option value="Peso Corporal">Peso Corporal (Calistenia)</option>
              <option value="Elástico">Elásticos / Bands</option>
            </select>
          </div>

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[720px] pr-1">
            {filteredCatalog.map(exercise => {
              const inPlanCount = currentPlan?.exercises.filter(e => e.exercise_id === exercise.id).length || 0;
              const isJustAdded = justAddedId === exercise.id;

              return (
                <div
                  key={exercise.id}
                  className="flex flex-col bg-[#222a3d] hover:bg-[#283248] rounded-xl overflow-hidden border border-[#3c4a42]/40 shadow-sm transition-all group"
                >
                  <div className="relative w-full h-[130px] bg-[#0b1326] overflow-hidden">
                    <ExerciseMedia
                      exerciseId={exercise.id}
                      name={exercise.name}
                      targetMuscle={exercise.target_muscle}
                      equipment={exercise.equipment}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                    <div>
                      <h3 className="font-bold text-xs text-[#dae2fd] line-clamp-1 group-hover:text-[#4edea3] transition-colors" title={exercise.name}>
                        {exercise.name}
                      </h3>
                      <p className="text-[11px] text-[#bbcabf] line-clamp-2 mt-1 leading-relaxed">
                        {exercise.instructions_pt}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddExerciseToPlan(exercise)}
                      className={`w-full mt-2 h-9 px-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm whitespace-nowrap cursor-pointer select-none ${
                        isJustAdded
                          ? 'bg-[#4edea3] text-[#003824] shadow-md shadow-[#4edea3]/30 scale-[1.01]'
                          : 'bg-[#10b981] hover:bg-[#4edea3] text-[#003824] shadow-md shadow-[#10b981]/20'
                      }`}
                      title={`Adicionar ${exercise.name} ao Treino ${activeSplitDay}`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span className="whitespace-nowrap">Adicionado!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
                          <span className="whitespace-nowrap tracking-tight">Adicionar ao Treino {activeSplitDay}</span>
                          {inPlanCount > 0 && (
                            <span className="ml-0.5 font-mono-metric text-[10px] bg-[#003824]/20 text-[#003824] px-1.5 py-0.2 rounded-full font-extrabold">
                              {inPlanCount}x
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
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
                className="p-2 rounded-lg text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#222a3d] transition-colors text-xs flex items-center gap-1"
                title="Copiar estrutura deste treino para o próximo dia"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Duplicar Divisão</span>
              </button>
              <button
                onClick={handleClearCurrentDay}
                className="p-2 rounded-lg text-[#ffb4ab] hover:bg-[#93000a]/20 transition-colors text-xs flex items-center gap-1"
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
              currentPlan?.exercises.map((workoutExercise, index) => {
                const exercise = workoutExercise.exercise || EXERCISES_DATABASE.find(e => e.id === workoutExercise.exercise_id);

                return (
                  <div
                    key={workoutExercise.id}
                    className="bg-[#171f33] rounded-2xl p-4 border border-[#3c4a42]/40 shadow-sm transition-all hover:border-[#4edea3]/40 flex flex-col gap-3 group"
                  >
                    {/* Item Top Bar */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-[#0b1326] overflow-hidden flex-shrink-0 border border-[#3c4a42]/40">
                          {exercise && (
                            <ExerciseMedia
                              exerciseId={exercise.id}
                              name={exercise.name}
                              showBadges={false}
                              className="w-full h-full"
                            />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-metric text-xs text-[#4edea3] font-bold">
                              #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                            </span>
                            <h4 className="font-bold text-sm text-[#dae2fd] truncate">
                              {exercise?.name || 'Exercício'}
                            </h4>
                            {workoutExercise.intensity_tag && (
                              <span className="font-mono-metric text-[10px] px-2 py-0.5 rounded-full bg-[#3131c0]/40 text-[#c0c1ff] uppercase font-bold border border-[#c0c1ff]/20">
                                {workoutExercise.intensity_tag}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono-metric text-[11px] px-2 py-0.2 rounded bg-[#222a3d] text-[#bbcabf]">
                              {exercise?.target_muscle || 'Músculo Alvo'}
                            </span>
                            <span className="font-mono-metric text-[11px] text-[#86948a]">
                              {exercise?.equipment}
                            </span>
                            {workoutExercise.tempo && (
                              <span className="font-mono-metric text-[10px] text-[#ffb95f] bg-[#ffb95f]/10 px-1.5 py-0.2 rounded">
                                Cadência: {workoutExercise.tempo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ordering Controls & Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Biomechanical Substitute Button */}
                        <button
                          onClick={() => setSubstitutionTarget(workoutExercise)}
                          className="p-1.5 rounded-lg text-[#4edea3] hover:bg-[#10b981]/20 transition-colors"
                          title="Substituir por equivalente biomecânico (IA)"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveExercise(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#222a3d] disabled:opacity-30 transition-colors"
                          title="Mover para cima"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveExercise(index, 'down')}
                          disabled={index === currentPlan.exercises.length - 1}
                          className="p-1.5 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#222a3d] disabled:opacity-30 transition-colors"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateExercise(workoutExercise)}
                          className="p-1.5 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#222a3d] transition-colors"
                          title="Duplicar exercício"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveExercise(workoutExercise.id)}
                          className="p-1.5 rounded-lg text-[#ffb4ab] hover:bg-[#93000a]/30 transition-colors"
                          title="Remover exercício"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Parameters Grid (Séries, Reps, Carga, Descanso) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#131b2e] p-2.5 rounded-xl border border-[#3c4a42]/30">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Séries</label>
                        <input
                          type="number"
                          value={workoutExercise.target_sets}
                          onChange={(e) => handleUpdateExerciseParam(workoutExercise.id, { target_sets: Number(e.target.value) })}
                          className="h-9 px-3 rounded-lg bg-[#0b1326] text-center font-mono-metric font-bold text-sm text-[#dae2fd] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Repetições</label>
                        <input
                          type="text"
                          value={workoutExercise.target_reps}
                          onChange={(e) => handleUpdateExerciseParam(workoutExercise.id, { target_reps: e.target.value })}
                          className="h-9 px-3 rounded-lg bg-[#0b1326] text-center font-mono-metric font-bold text-sm text-[#4edea3] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Carga Alvo (kg)</label>
                        <input
                          type="number"
                          value={workoutExercise.target_weight_kg}
                          onChange={(e) => handleUpdateExerciseParam(workoutExercise.id, { target_weight_kg: Number(e.target.value) })}
                          className="h-9 px-3 rounded-lg bg-[#0b1326] text-center font-mono-metric font-bold text-sm text-[#dae2fd] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Descanso (s)</label>
                        <input
                          type="number"
                          value={workoutExercise.rest_seconds}
                          onChange={(e) => handleUpdateExerciseParam(workoutExercise.id, { rest_seconds: Number(e.target.value) })}
                          className="h-9 px-3 rounded-lg bg-[#0b1326] text-center font-mono-metric font-bold text-sm text-[#ffb95f] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Techniques & Cadência Selector Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0b1326] p-2.5 rounded-xl border border-[#3c4a42]/30">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Técnica:</span>
                        <select
                          value={workoutExercise.intensity_tag || ''}
                          onChange={(e) => handleUpdateExerciseParam(workoutExercise.id, { intensity_tag: e.target.value || undefined })}
                          className="h-7 px-2 rounded-lg bg-[#171f33] text-xs text-[#c0c1ff] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhuma (Série Normal)</option>
                          {INTENSITY_PRESETS.map(tech => (
                            <option key={tech} value={tech}>{tech}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Cadência:</span>
                        <select
                          value={workoutExercise.tempo || '3-0-1-0'}
                          onChange={(e) => handleUpdateExerciseParam(workoutExercise.id, { tempo: e.target.value })}
                          className="h-7 px-2 rounded-lg bg-[#171f33] text-xs text-[#ffb95f] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                        >
                          {TEMPO_PRESETS.map(t => (
                            <option key={t} value={t.split(' ')[0]}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Coach Notes Field */}
                    <div className="flex items-start gap-2.5 bg-[#0b1326] p-3 rounded-xl border border-[#3c4a42]/30">
                      <Info className="w-4 h-4 text-[#4edea3] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <span className="font-mono-metric text-[10px] uppercase text-[#4edea3] font-bold">
                          Observação Técnica & Instrução de Execução:
                        </span>
                        <input
                          type="text"
                          value={workoutExercise.coach_notes}
                          onChange={(e) => handleUpdateExerciseParam(workoutExercise.id, { coach_notes: e.target.value })}
                          placeholder="Instruções de cadência, ângulo de banco, proteção articular..."
                          className="w-full bg-transparent text-xs text-[#bbcabf] focus:outline-none focus:text-[#dae2fd] border-b border-transparent focus:border-[#4edea3]/50 pb-0.5"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
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
