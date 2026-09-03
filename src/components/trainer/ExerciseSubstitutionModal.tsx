import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Check, X, ShieldAlert, ArrowRight, Brain, Dumbbell } from 'lucide-react';
import { WorkoutExercise, BiomechanicalSubstitute, Exercise } from '../../types/database';
import { EXERCISES_DATABASE } from '../../data/exercisesData';

interface ExerciseSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutExercise: WorkoutExercise | null;
  onConfirmSubstitution: (workoutExerciseId: string, newExercise: Exercise, note: string) => void;
}

export const ExerciseSubstitutionModal: React.FC<ExerciseSubstitutionModalProps> = ({
  isOpen,
  onClose,
  workoutExercise,
  onConfirmSubstitution
}) => {
  const [reason, setReason] = useState<string>('Adaptação biomecânica e conforto articular');
  const [isLoading, setIsLoading] = useState(false);
  const [substitutes, setSubstitutes] = useState<BiomechanicalSubstitute[]>([]);
  const [selectedSub, setSelectedSub] = useState<BiomechanicalSubstitute | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workoutExercise) {
      fetchSubstitutions();
    } else {
      setSubstitutes([]);
      setSelectedSub(null);
      setError(null);
    }
  }, [isOpen, workoutExercise]);

  if (!isOpen || !workoutExercise) return null;

  const currentExercise = workoutExercise.exercise || EXERCISES_DATABASE.find(e => e.id === workoutExercise.exercise_id);

  const fetchSubstitutions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/substitute-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_name: currentExercise?.name || 'Exercício',
          target_muscle: currentExercise?.target_muscle || 'Geral',
          current_equipment: currentExercise?.equipment || 'Geral',
          injury_or_reason: reason
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao obter substitutos biomecânicos');
      }

      const data = await response.json();
      if (data.substitutes && data.substitutes.length > 0) {
        setSubstitutes(data.substitutes);
        setSelectedSub(data.substitutes[0]);
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro na substituição');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySubstitution = () => {
    if (!selectedSub || !workoutExercise) return;

    // Find best match in our database
    const matchedExercise = EXERCISES_DATABASE.find(
      e => e.name.toLowerCase().includes(selectedSub.name.toLowerCase()) || selectedSub.name.toLowerCase().includes(e.name.toLowerCase())
    ) || {
      id: `custom-sub-${Date.now()}`,
      name: selectedSub.name,
      body_part: currentExercise?.body_part || 'Geral',
      target_muscle: selectedSub.target_muscle || currentExercise?.target_muscle || 'Geral',
      equipment: selectedSub.equipment || 'Halteres',
      gif_url: currentExercise?.gif_url || '',
      image_url: currentExercise?.image_url || '',
      instructions_pt: `Substituição biomecânica: ${selectedSub.biomechanical_advantage}`,
      biomechanics_tip: selectedSub.biomechanical_advantage
    };

    onConfirmSubstitution(
      workoutExercise.id,
      matchedExercise,
      `Substituição: ${selectedSub.biomechanical_advantage}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#171f33] rounded-2xl shadow-2xl border border-[#3c4a42]/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1f283d] flex items-center justify-between border-b border-[#3c4a42]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3131c0]/40 flex items-center justify-center border border-[#c0c1ff]/20">
              <RefreshCw className="w-5 h-5 text-[#c0c1ff]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#dae2fd]">
                Substituição Biomecânica Inteligente
              </h2>
              <p className="text-xs text-[#bbcabf]">
                Substituindo <strong>{currentExercise?.name}</strong> por vetor equivalente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#171f33]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Reason Input */}
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs font-semibold text-[#bbcabf]">
                Motivo da Substituição / Restrição Articular:
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Máquina ocupada, dor anterior de ombro, preferência por halteres..."
                className="w-full h-9 px-3 rounded-lg bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
              />
            </div>
            <button
              onClick={fetchSubstitutions}
              disabled={isLoading}
              className="h-9 px-4 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#3c4a42]/40 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Recalcular com IA</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-xs text-[#ffdad6]">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#4edea3] mx-auto animate-pulse" />
              <p className="text-xs text-[#bbcabf]">
                O Gemini está analisando os vetores de tensão e braço de momento para sugerir alternativas...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#dae2fd] uppercase font-mono-metric">
                Opções Biomecanicamente Compatíveis:
              </label>
              <div className="space-y-2.5">
                {substitutes.map((sub, idx) => {
                  const isSelected = selectedSub?.name === sub.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSub(sub)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-[#10b981]/15 border-[#4edea3] shadow-md shadow-[#10b981]/10'
                          : 'bg-[#0b1326] border-[#3c4a42]/50 hover:bg-[#222a3d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-xs font-bold font-mono-metric flex items-center justify-center ${
                            isSelected ? 'bg-[#10b981] text-[#003824]' : 'bg-[#2d3449] text-[#bbcabf]'
                          }`}>
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-xs text-[#dae2fd]">{sub.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-metric text-[10px] px-2 py-0.5 rounded bg-[#171f33] text-[#bbcabf]">
                            {sub.equipment}
                          </span>
                          <span className="font-mono-metric text-[10px] px-2 py-0.5 rounded bg-[#3131c0]/40 text-[#c0c1ff]">
                            {sub.target_muscle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs text-[#bbcabf]">
                        <Brain className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">{sub.biomechanical_advantage}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1f283d] border-t border-[#3c4a42]/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#bbcabf] hover:text-[#dae2fd]"
          >
            Cancelar
          </button>
          <button
            onClick={handleApplySubstitution}
            disabled={!selectedSub || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] text-[#003824] font-bold text-xs hover:bg-[#4edea3] shadow-lg shadow-[#10b981]/20 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Substituição</span>
          </button>
        </div>
      </div>
    </div>
  );
};
