import React, { useState } from 'react';
import { Student, WorkoutPlan, WorkoutExercise, Exercise, AnamnesisInput, GeneratedAiWorkout } from '../../types/database';
import { EXERCISES_DATABASE } from '../../data/exercisesData';
import { ExerciseMedia } from '../common/ExerciseMedia';
import { 
  Dumbbell, 
  Sparkles, 
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
  Brain, 
  Clock, 
  Layers, 
  Flame, 
  CheckCircle2, 
  X,
  History,
  Timer,
  AlertCircle
} from 'lucide-react';

interface WorkoutBuilderProps {
  student: Student;
  workoutPlans: WorkoutPlan[];
  onSaveWorkoutPlans: (plans: WorkoutPlan[]) => void;
  onViewStudentPWA: () => void;
}

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({
  student,
  workoutPlans,
  onSaveWorkoutPlans,
  onViewStudentPWA
}) => {
  const [activeSplitDay, setActiveSplitDay] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [plans, setPlans] = useState<WorkoutPlan[]>(workoutPlans);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');

  // AI Copilot Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [anamnesis, setAnamnesis] = useState<AnamnesisInput>({
    student_name: student.full_name,
    age: student.age || 29,
    goal: student.goal || 'Hipertrofia com Definição',
    experience_level: 'Intermediário',
    days_per_week: 4,
    available_equipment: ['Halteres', 'Barra Livre', 'Polia / Cabo', 'Máquinas'],
    injuries_or_limitations: 'Manguito rotador direito sensível a cargas axiais 90° livres',
    focus_muscles: 'Peitoral Clavicular e Braços',
  });

  const [saveToast, setSaveToast] = useState(false);

  // Active workout plan for currently selected split day
  const currentPlan = plans.find(p => p.split_day === activeSplitDay) || plans[0];

  // Exercises filtered in catalogue
  const filteredCatalog = EXERCISES_DATABASE.filter(ex => {
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
      id: `we-${Date.now()}`,
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

  // Commit and save workout plans
  const handleSaveAndPublish = () => {
    onSaveWorkoutPlans(plans);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Gemini AI Draft Generation Call
  const handleGenerateAiWorkout = async () => {
    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/draft-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anamnesis),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor Gemini');
      }

      const aiData: GeneratedAiWorkout = await response.json();

      if (aiData.splits && aiData.splits.length > 0) {
        // Convert AI output to our WorkoutPlan schema
        const generatedPlans: WorkoutPlan[] = aiData.splits.map((split, index) => {
          return {
            id: `plan-ai-${Date.now()}-${index}`,
            student_id: student.id,
            trainer_id: 'trainer-001',
            title: split.title || `Treino ${split.split_day} - ${split.focus}`,
            split_day: split.split_day,
            focus_muscle: split.focus || 'Hipertrofia',
            estimated_duration_min: split.estimated_duration_min || 50,
            target_rpe: split.target_rpe || 8.0,
            rotator_cuff_safe: split.rotator_cuff_safe ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            exercises: split.exercises.map((ex, exIndex) => {
              const matchedCatalog = EXERCISES_DATABASE.find(
                cat => cat.name.toLowerCase().includes(ex.name.toLowerCase()) || ex.name.toLowerCase().includes(cat.name.toLowerCase())
              ) || EXERCISES_DATABASE[exIndex % EXERCISES_DATABASE.length];

              return {
                id: `we-ai-${Date.now()}-${exIndex}`,
                workout_plan_id: `plan-ai-${Date.now()}-${index}`,
                exercise_id: matchedCatalog.id,
                exercise: matchedCatalog,
                order_index: exIndex + 1,
                target_sets: ex.sets || 4,
                target_reps: ex.reps || '8 - 10',
                target_weight_kg: ex.weight_kg || 20,
                rest_seconds: ex.rest_seconds || 60,
                coach_notes: ex.coach_notes || matchedCatalog.biomechanics_tip || 'Execução controlada.',
                intensity_tag: ex.intensity_tag,
                tempo: '3-0-1-0'
              };
            })
          };
        });

        setPlans(generatedPlans);
        setIsAiModalOpen(false);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3000);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erro ao processar inteligência artificial';
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Calculations for current active day
  const totalVolumeSets = currentPlan?.exercises.reduce((sum, ex) => sum + (Number(ex.target_sets) || 0), 0) || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto">
      {/* 1. Context Banner & Action Cluster */}
      <section className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-metric text-xs text-[#4edea3] font-bold uppercase tracking-wider bg-[#10b981]/15 px-3 py-1 rounded-full border border-[#4edea3]/30">
                Prescrição Inteligente
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
                  Manguito Protegido (0 overhead 90°)
                </span>
              )}
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-3">
            {/* AI Copilot Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-to-r from-[#3131c0] via-[#3131c0] to-[#10b981] text-white font-semibold text-xs hover:brightness-110 shadow-lg shadow-[#3131c0]/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#4edea3] animate-pulse" />
              <span>Rascunhar com IA</span>
              <span className="font-mono-metric text-[10px] uppercase bg-black/40 text-[#4edea3] px-1.5 py-0.5 rounded ml-1 font-bold">
                Gemini
              </span>
            </button>

            {/* Test on Student PWA */}
            <button
              onClick={onViewStudentPWA}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#222a3d] text-[#dae2fd] hover:bg-[#31394d] transition-colors text-xs font-semibold border border-[#3c4a42]/40"
              title="Visualizar exatamente como o aluno verá no celular"
            >
              <span>Abrir no App do Aluno</span>
            </button>

            {/* Save & Publish */}
            <button
              onClick={handleSaveAndPublish}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#10b981] text-[#003824] font-bold text-xs hover:bg-[#4edea3] transition-all shadow-lg shadow-[#10b981]/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar & Publicar no App</span>
            </button>
          </div>
        </div>
      </section>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#10b981] text-[#003824] font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span>Ficha de treino salva e sincronizada com sucesso!</span>
        </div>
      )}

      {/* 2-Column Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Exercise Library Catalog (5 cols) */}
        <aside className="xl:col-span-5 flex flex-col gap-4 bg-[#171f33] rounded-2xl p-4 sm:p-5 border border-[#3c4a42]/40 shadow-lg">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#4edea3]" />
                <h2 className="text-base font-bold text-[#dae2fd]">Catálogo de Exercícios</h2>
              </div>
              <span className="font-mono-metric text-xs text-[#86948a]">1.324 catalogados</span>
            </div>

            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86948a] w-4 h-4" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por nome ou músculo alvo (ex: Supino, Puxada)..."
                className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#0b1326] text-[#dae2fd] placeholder:text-[#86948a] text-xs border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none shadow-inner"
              />
            </div>

            {/* Muscle Group Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-nowrap select-none">
              {['all', 'Peitoral', 'Dorsal', 'Quadríceps', 'Isquiotibiais', 'Deltoides', 'Tríceps', 'Bíceps', 'Abdômen'].map(muscle => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`px-3 py-1 rounded-full font-mono-metric text-xs font-semibold transition-all ${
                    selectedMuscle === muscle
                      ? 'bg-[#10b981] text-[#003824] shadow-sm'
                      : 'bg-[#222a3d] text-[#bbcabf] hover:bg-[#31394d] hover:text-[#dae2fd]'
                  }`}
                >
                  {muscle === 'all' ? 'Todos' : muscle}
                </button>
              ))}
            </div>

            {/* Equipment Filter Dropdown */}
            <div className="flex items-center justify-between bg-[#131b2e] px-3 py-2 rounded-xl border border-[#3c4a42]/30">
              <span className="text-xs text-[#bbcabf] flex items-center gap-1.5 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#86948a]" />
                Filtrar Equipamento:
              </span>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="bg-[#0b1326] text-[#dae2fd] text-xs font-mono-metric px-2.5 py-1 rounded-lg border border-[#3c4a42]/50 focus:outline-none focus:border-[#4edea3] cursor-pointer"
              >
                <option value="all">Todos Equipamentos</option>
                <option value="Halteres">Halteres</option>
                <option value="Barra">Barra Livre</option>
                <option value="Polia">Polia / Cabo</option>
                <option value="Máquina">Máquinas Articuladas</option>
                <option value="Corporal">Peso Corporal</option>
              </select>
            </div>
          </div>

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[750px] pr-1">
            {filteredCatalog.map(exercise => (
              <div
                key={exercise.id}
                className="flex flex-col bg-[#222a3d] hover:bg-[#283248] rounded-xl overflow-hidden border border-[#3c4a42]/40 shadow-sm transition-all group"
              >
                <div className="relative w-full h-[130px] bg-[#0b1326] overflow-hidden">
                  <ExerciseMedia
                    exerciseId={exercise.id}
                    name={exercise.name}
                    muscle={exercise.target_muscle}
                    equipment={exercise.equipment}
                    className="group-hover:scale-105 transition-transform duration-300"
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
                    onClick={() => handleAddExerciseToPlan(exercise)}
                    className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981] text-[#4edea3] hover:text-[#003824] text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] border border-[#10b981]/25 hover:border-[#10b981] shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT PANEL: Workout Split Structure & Parameters (7 cols) */}
        <section className="xl:col-span-7 flex flex-col gap-4">
          {/* Split Day Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#171f33] p-2 rounded-2xl border border-[#3c4a42]/40 shadow-md">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['A', 'B', 'C', 'D'] as const).map(day => {
                const plan = plans.find(p => p.split_day === day);
                const isActive = activeSplitDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveSplitDay(day)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#10b981] text-[#003824] shadow-md'
                        : 'text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#003824]' : 'bg-[#4edea3]'}`}></span>
                    <span>Treino {day} - {plan?.focus_muscle || `Divisão ${day}`}</span>
                    <span className={`font-mono-metric text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isActive ? 'bg-[#003824]/20 text-[#003824]' : 'bg-[#2d3449] text-[#bbcabf]'
                    }`}>
                      {plan?.exercises.length || 0} ex
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Summary Banner */}
          <div className="bg-[#131b2e] rounded-2xl p-4 border border-[#3c4a42]/40 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex flex-col">
                <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Volume Estimado</span>
                <span className="font-mono-metric text-lg font-bold text-[#4edea3]">{totalVolumeSets} séries</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Duração Média</span>
                <span className="font-mono-metric text-lg font-bold text-[#dae2fd]">{currentPlan?.estimated_duration_min || 50} min</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">RPE Médio Alvo</span>
                <span className="font-mono-metric text-lg font-bold text-[#ffb95f]">{currentPlan?.target_rpe || 8.5} / 10</span>
              </div>
            </div>

            <div className="flex flex-col min-w-[180px] flex-1 max-w-xs">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#bbcabf]">Distribuição Semanal</span>
                <span className="font-mono-metric text-[#4edea3] font-bold">{totalVolumeSets}/20 séries</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#2d3449] overflow-hidden flex">
                <div className="h-full bg-[#10b981]" style={{ width: `${Math.min(100, (totalVolumeSets / 20) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Workout Exercises Stack */}
          <div className="flex flex-col gap-3">
            {currentPlan?.exercises.length === 0 ? (
              <div className="p-12 text-center bg-[#171f33] rounded-2xl border border-dashed border-[#3c4a42]/60">
                <Dumbbell className="w-12 h-12 mx-auto text-[#86948a] mb-3 opacity-40" />
                <h3 className="text-base font-bold text-[#dae2fd]">Nenhum exercício neste treino</h3>
                <p className="text-xs text-[#bbcabf] mt-1 max-w-sm mx-auto">
                  Clique no botão "+ Adicionar" nos cards da biblioteca à esquerda ou use o "Rascunhar com IA".
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
                              <span className="font-mono-metric text-[10px] px-2 py-0.2 rounded bg-[#3131c0]/40 text-[#c0c1ff] uppercase font-bold">
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
                          </div>
                        </div>
                      </div>

                      {/* Ordering Controls & Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
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

                    {/* Coach Notes Field */}
                    <div className="flex items-start gap-2.5 bg-[#0b1326] p-3 rounded-xl border border-[#3c4a42]/30">
                      <Brain className="w-4 h-4 text-[#4edea3] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <span className="font-mono-metric text-[10px] uppercase text-[#4edea3] font-bold">
                          Observação Técnica & Cadência do Treinador:
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

      {/* 3. AI Workout Draft Modal (Gemini Copilot) */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#171f33] rounded-2xl shadow-2xl border border-[#3c4a42]/60 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-[#222a3d] flex items-start justify-between border-b border-[#3c4a42]/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#4edea3]" />
                  <h2 className="text-lg font-bold text-[#dae2fd]">
                    Copiloto IA Gemini: Rascunho de Ficha Automática
                  </h2>
                </div>
                <p className="text-xs text-[#bbcabf]">
                  Prescrição baseada na anamnese, histórico de lesões e equipamentos disponíveis.
                </p>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#171f33]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {aiError && (
                <div className="p-3.5 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-center gap-3 text-xs text-[#ffdad6]">
                  <AlertCircle className="w-5 h-5 text-[#ffb4ab] flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Goal & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#bbcabf]">Objetivo do Aluno</label>
                  <input
                    type="text"
                    value={anamnesis.goal}
                    onChange={(e) => setAnamnesis({ ...anamnesis, goal: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#bbcabf]">Nível de Experiência</label>
                  <select
                    value={anamnesis.experience_level}
                    onChange={(e) => setAnamnesis({ ...anamnesis, experience_level: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>
              </div>

              {/* Days & Focus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#bbcabf]">Frequência Semanal</label>
                  <select
                    value={anamnesis.days_per_week}
                    onChange={(e) => setAnamnesis({ ...anamnesis, days_per_week: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
                  >
                    <option value={3}>3 Dias (Split A, B, C)</option>
                    <option value={4}>4 Dias (Split A, B, C, D)</option>
                    <option value={5}>5 Dias (Split A, B, C, D, E)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#bbcabf]">Foco Muscular Principal</label>
                  <input
                    type="text"
                    value={anamnesis.focus_muscles}
                    onChange={(e) => setAnamnesis({ ...anamnesis, focus_muscles: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>
              </div>

              {/* Injury / Biomechanics Safeguard */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#ffb95f] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Restrições Articulares / Lesões (Proteção Biomecânica da IA)</span>
                </label>
                <textarea
                  rows={2}
                  value={anamnesis.injuries_or_limitations}
                  onChange={(e) => setAnamnesis({ ...anamnesis, injuries_or_limitations: e.target.value })}
                  placeholder="Ex: Manguito rotador sensível, evitar sobrecarga axial em 90°..."
                  className="w-full p-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#0b1326] border border-[#3c4a42]/40 text-xs text-[#bbcabf] space-y-1">
                <div className="flex items-center gap-2 text-[#4edea3] font-bold">
                  <Brain className="w-4 h-4" />
                  <span>Modelo Gemini 3.8 Flash Integrado</span>
                </div>
                <p>
                  A IA gerará as séries, repetições ideais, cargas sugeridas e notas de cadência com foco nas limitações acima.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#222a3d] border-t border-[#3c4a42]/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#bbcabf] hover:text-[#dae2fd]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGenerateAiWorkout}
                disabled={isAiLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-bold text-xs hover:brightness-110 shadow-lg shadow-[#10b981]/20 disabled:opacity-50 transition-all"
              >
                {isAiLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Gerando Prescrição com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Ficha Completa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
