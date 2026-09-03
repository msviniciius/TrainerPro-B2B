import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertTriangle, CheckCircle2, Sparkles, X, Brain, RotateCcw } from 'lucide-react';
import { WorkoutPlan, WorkoutAuditResult, Student } from '../../types/database';

interface WorkoutAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutPlan: WorkoutPlan;
  student: Student;
}

export const WorkoutAuditModal: React.FC<WorkoutAuditModalProps> = ({
  isOpen,
  onClose,
  workoutPlan,
  student
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<WorkoutAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      runAudit();
    } else {
      setAuditResult(null);
      setError(null);
    }
  }, [isOpen, workoutPlan.id]);

  if (!isOpen) return null;

  const runAudit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/optimize-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          split_day: workoutPlan.split_day,
          workout_title: workoutPlan.title,
          exercises: workoutPlan.exercises,
          student_goal: student.goal,
          limitations: 'Manguito e alinhamento lombar'
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao processar auditoria biomecânica');
      }

      const data: WorkoutAuditResult = await response.json();
      setAuditResult(data);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro na auditoria');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#171f33] rounded-2xl shadow-2xl border border-[#3c4a42]/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1f283d] flex items-center justify-between border-b border-[#3c4a42]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ffb95f] to-[#e29100] flex items-center justify-center shadow-lg shadow-[#ffb95f]/20">
              <Activity className="w-5 h-5 text-[#472a00]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#dae2fd]">
                Auditoria Biomecânica da Sessão (Gemini AI)
              </h2>
              <p className="text-xs text-[#bbcabf]">
                Treino {workoutPlan.split_day}: <strong>{workoutPlan.title}</strong>
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
          {error && (
            <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-xs text-[#ffdad6]">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#ffb95f] mx-auto animate-spin" />
              <p className="text-xs text-[#bbcabf]">
                Analisando curva de resistência, fadiga neural e sobreposições musculares...
              </p>
            </div>
          ) : auditResult ? (
            <div className="space-y-4">
              {/* Score & Risk Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#0b1326] p-4 rounded-xl border border-[#3c4a42]/40 flex flex-col items-center justify-center text-center">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-bold">Score Biomecânico</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-[#4edea3] font-mono-metric">{auditResult.overall_score}</span>
                    <span className="text-xs text-[#86948a]">/100</span>
                  </div>
                </div>

                <div className="bg-[#0b1326] p-4 rounded-xl border border-[#3c4a42]/40 flex flex-col items-center justify-center text-center">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-bold">Risco Articular</span>
                  <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold font-mono-metric ${
                    auditResult.biomechanical_risk_level === 'Baixo'
                      ? 'bg-[#10b981]/20 text-[#4edea3]'
                      : auditResult.biomechanical_risk_level === 'Moderado'
                      ? 'bg-[#ffb95f]/20 text-[#ffb95f]'
                      : 'bg-[#93000a]/30 text-[#ffb4ab]'
                  }`}>
                    {auditResult.biomechanical_risk_level}
                  </div>
                </div>

                <div className="bg-[#0b1326] p-4 rounded-xl border border-[#3c4a42]/40 flex flex-col items-center justify-center text-center">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a] font-bold">Status do Volume</span>
                  <span className="text-xs font-bold text-[#dae2fd] mt-2 truncate max-w-[140px]">
                    {auditResult.volume_assessment}
                  </span>
                </div>
              </div>

              {/* Joint Health */}
              <div className="bg-[#0b1326] p-4 rounded-xl border border-[#3c4a42]/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ffb95f]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Parecer sobre Saúde Articular & Eixo Muscular:</span>
                </div>
                <p className="text-xs text-[#bbcabf] leading-relaxed">
                  {auditResult.joint_health_notes}
                </p>
              </div>

              {/* Actionable Tips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#dae2fd] uppercase font-mono-metric flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Recomendações Práticas do Consultor IA:</span>
                </label>
                <div className="space-y-2">
                  {auditResult.actionable_tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#1f283d] border border-[#3c4a42]/50 text-xs text-[#dae2fd] flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#4edea3] flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1f283d] border-t border-[#3c4a42]/40 flex items-center justify-between">
          <button
            onClick={runAudit}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#bbcabf] hover:text-[#dae2fd] bg-[#0b1326] border border-[#3c4a42]/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reavaliar Treino</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#10b981] text-[#003824] font-bold text-xs hover:bg-[#4edea3] transition-all"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
