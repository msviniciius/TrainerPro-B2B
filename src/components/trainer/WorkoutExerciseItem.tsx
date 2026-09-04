import React, { memo } from 'react';
import { WorkoutExercise } from '../../types/database';
import { EXERCISES_DATABASE } from '../../data/exercisesData';
import { ExerciseMedia } from '../common/ExerciseMedia';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';

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

interface WorkoutExerciseItemProps {
  workoutExercise: WorkoutExercise;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdateParam: (id: string, updates: Partial<WorkoutExercise>) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onDuplicate: (exercise: WorkoutExercise) => void;
  onRemove: (id: string) => void;
  onSubstitute: (exercise: WorkoutExercise) => void;
}

export const WorkoutExerciseItem = memo<WorkoutExerciseItemProps>(({
  workoutExercise,
  index,
  isFirst,
  isLast,
  onUpdateParam,
  onMove,
  onDuplicate,
  onRemove,
  onSubstitute
}) => {
  const exercise = workoutExercise.exercise || EXERCISES_DATABASE.find(e => e.id === workoutExercise.exercise_id);

  return (
    <div className="bg-[#171f33] rounded-2xl p-4 border border-[#3c4a42]/40 shadow-sm transition-all hover:border-[#4edea3]/40 flex flex-col gap-3 group">
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
            type="button"
            onClick={() => onSubstitute(workoutExercise)}
            className="p-1.5 rounded-lg text-[#4edea3] hover:bg-[#10b981]/20 transition-colors"
            title="Substituir por equivalente biomecânico (IA)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 'up')}
            disabled={isFirst}
            className="p-1.5 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#222a3d] disabled:opacity-30 transition-colors"
            title="Mover para cima"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 'down')}
            disabled={isLast}
            className="p-1.5 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#222a3d] disabled:opacity-30 transition-colors"
            title="Mover para baixo"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(workoutExercise)}
            className="p-1.5 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#222a3d] transition-colors"
            title="Duplicar exercício"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(workoutExercise.id)}
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
            onChange={(e) => onUpdateParam(workoutExercise.id, { target_sets: Number(e.target.value) })}
            className="h-9 px-3 rounded-lg bg-[#0b1326] text-center font-mono-metric font-bold text-sm text-[#dae2fd] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Repetições</label>
          <input
            type="text"
            value={workoutExercise.target_reps}
            onChange={(e) => onUpdateParam(workoutExercise.id, { target_reps: e.target.value })}
            className="h-9 px-3 rounded-lg bg-[#0b1326] text-center font-mono-metric font-bold text-sm text-[#4edea3] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Carga Alvo (kg)</label>
          <input
            type="number"
            value={workoutExercise.target_weight_kg}
            onChange={(e) => onUpdateParam(workoutExercise.id, { target_weight_kg: Number(e.target.value) })}
            className="h-9 px-3 rounded-lg bg-[#0b1326] text-center font-mono-metric font-bold text-sm text-[#dae2fd] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono-metric text-[10px] uppercase text-[#86948a] font-semibold">Descanso (s)</label>
          <input
            type="number"
            value={workoutExercise.rest_seconds}
            onChange={(e) => onUpdateParam(workoutExercise.id, { rest_seconds: Number(e.target.value) })}
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
            onChange={(e) => onUpdateParam(workoutExercise.id, { intensity_tag: e.target.value || undefined })}
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
            onChange={(e) => onUpdateParam(workoutExercise.id, { tempo: e.target.value })}
            className="h-7 px-2 rounded-lg bg-[#171f33] text-xs text-[#ffb95f] border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none cursor-pointer"
          >
            {TEMPO_PRESETS.map(t => (
              <option key={t} value={t.split(' ')[0]}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});

WorkoutExerciseItem.displayName = 'WorkoutExerciseItem';
