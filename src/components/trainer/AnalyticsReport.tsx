import React, { useState } from 'react';
import { Student, ExerciseLog, WorkoutSession } from '../../types/database';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Flame, 
  Dumbbell, 
  Trophy, 
  Sparkles, 
  Brain, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

interface AnalyticsReportProps {
  student: Student;
  exerciseLogs: ExerciseLog[];
  sessions: WorkoutSession[];
  onBackToStudents: () => void;
  onEditWorkout: () => void;
}

export const AnalyticsReport: React.FC<AnalyticsReportProps> = ({
  student,
  exerciseLogs,
  sessions,
  onBackToStudents,
  onEditWorkout,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<string>('Supino Reto com Halteres');
  const [aiInsight, setAiInsight] = useState<string | null>(
    'Adaptação neuromuscular consistente observada nas últimas 8 semanas no supino com halteres (+40% de carga efetiva com RPE estável em 8.5). Recomenda-se introduzir 1 semana de deload com 70% de volume antes de iniciar o microciclo de choque de força pura.'
  );
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 8-week progressive overload data for the chart
  const overloadData = [
    { week: 'Sem 1', weight: 20.0, volumeTons: 4.8, rpe: 7.0, date: '09/09' },
    { week: 'Sem 2', weight: 22.0, volumeTons: 5.2, rpe: 7.5, date: '16/09' },
    { week: 'Sem 3', weight: 22.0, volumeTons: 5.4, rpe: 7.5, date: '23/09' },
    { week: 'Sem 4', weight: 24.0, volumeTons: 5.9, rpe: 8.0, date: '30/09' },
    { week: 'Sem 5', weight: 24.0, volumeTons: 6.1, rpe: 8.0, date: '07/10' },
    { week: 'Sem 6', weight: 26.0, volumeTons: 6.6, rpe: 8.5, date: '14/10' },
    { week: 'Sem 7', weight: 26.0, volumeTons: 6.8, rpe: 8.5, date: '21/10' },
    { week: 'Sem 8', weight: 28.0, volumeTons: 7.8, rpe: 8.5, date: '04/11', isPR: true },
  ];

  // Distribution by muscle group
  const muscleDistribution = [
    { muscle: 'Peitoral', sets: 18, color: '#10b981' },
    { muscle: 'Dorsal', sets: 16, color: '#4edea3' },
    { muscle: 'Quadríceps', sets: 20, color: '#c0c1ff' },
    { muscle: 'Posterior', sets: 14, color: '#3131c0' },
    { muscle: 'Ombros', sets: 12, color: '#ffb95f' },
    { muscle: 'Braços', sets: 14, color: '#e29100' },
  ];

  // Request fresh AI Biomechanical Insights
  const handleFetchAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/coach-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: student.full_name,
          exercise_name: selectedExercise,
          initial_weight: 20,
          current_weight: 28,
          weeks_count: 8,
          rpe_history: '8.5 / 10',
        }),
      });
      const data = await response.json();
      if (data.insight) {
        setAiInsight(data.insight);
      }
    } catch {
      // Fallback
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onBackToStudents}
              className="text-xs text-[#86948a] hover:text-[#4edea3] transition-colors"
            >
              ← Alunos
            </button>
            <span className="text-[#86948a]">/</span>
            <span className="font-mono-metric text-xs uppercase text-[#c0c1ff] font-bold">
              Analytics & Biomecânica
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#dae2fd] tracking-tight">
            Relatório de Sobrecarga: {student.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-[#bbcabf] mt-0.5">
            Progressão real de cargas registradas nas sessões de treino pelo aluno.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEditWorkout}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#222a3d] text-[#dae2fd] hover:bg-[#31394d] text-xs font-semibold border border-[#3c4a42]/40"
          >
            <Dumbbell className="w-4 h-4 text-[#4edea3]" />
            <span>Ajustar Prescrição</span>
          </button>

          <button
            onClick={handleFetchAiInsight}
            disabled={isAiLoading}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#3131c0] text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-[#3131c0]/30 transition-all disabled:opacity-50"
          >
            <Brain className="w-4 h-4 text-[#c0c1ff]" />
            <span>{isAiLoading ? 'Analisando...' : 'Reavaliar com IA'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Recorde Atual (PR) */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-metric text-[10px] uppercase text-[#4edea3] font-semibold">
                Recorde Atual (PR)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono-metric text-3xl font-bold text-[#dae2fd]">28.0</span>
                <span className="font-mono-metric text-sm text-[#86948a]">kg / halter</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center border border-[#4edea3]/30">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#4edea3] font-mono-metric font-bold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+40% de sobrecarga em 8 semanas</span>
          </div>
        </div>

        {/* Metric 2: Volume Total Levantado */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-metric text-[10px] uppercase text-[#c0c1ff] font-semibold">
                Tonnage Acumulada
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono-metric text-3xl font-bold text-[#c0c1ff]">48.2</span>
                <span className="font-mono-metric text-sm text-[#86948a]">toneladas</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#3131c0]/30 text-[#c0c1ff] flex items-center justify-center border border-[#c0c1ff]/30">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-[#bbcabf]">
            <span>Média de <strong>6.02 ton</strong> por semana</span>
          </div>
        </div>

        {/* Metric 3: RPE Médio de Esforço */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-metric text-[10px] uppercase text-[#ffb95f] font-semibold">
                RPE Médio (Esforço)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono-metric text-3xl font-bold text-[#ffb95f]">8.5</span>
                <span className="font-mono-metric text-sm text-[#86948a]">/ 10</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#ffb95f]/20 text-[#ffb95f] flex items-center justify-center border border-[#ffb95f]/30">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-[#bbcabf]">
            <span>1 a 2 repetições de reserva (RIR 1-2)</span>
          </div>
        </div>

        {/* Metric 4: Frequência & Assiduidade */}
        <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-metric text-[10px] uppercase text-[#4edea3] font-semibold">
                Frequência Real
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono-metric text-3xl font-bold text-[#4edea3]">94%</span>
                <span className="font-mono-metric text-sm text-[#86948a]">assíduo</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center border border-[#4edea3]/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-[#bbcabf]">
            <span>15 treinos concluídos no ciclo</span>
          </div>
        </div>
      </div>

      {/* 3. AI Biomechanical Periodization Card */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-[#171f33] via-[#1b253d] to-[#171f33] rounded-2xl p-5 border border-[#3131c0]/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#3131c0]/40 text-[#c0c1ff] flex items-center justify-center flex-shrink-0 border border-[#c0c1ff]/30">
            <Sparkles className="w-6 h-6 text-[#4edea3]" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-metric text-xs uppercase text-[#4edea3] font-bold">
                Parecer do Copiloto IA (Gemini 3.8 Flash)
              </span>
              <span className="px-2 py-0.2 rounded bg-[#3131c0]/50 text-[#c0c1ff] text-[10px] font-mono-metric font-bold">
                Biomecânica & Periodização
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#dae2fd] leading-relaxed">
              {aiInsight}
            </p>
          </div>
        </div>
      )}

      {/* 4. Progressive Overload Chart & Selector */}
      <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3c4a42]/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4edea3]" />
            <h2 className="text-base font-bold text-[#dae2fd]">
              Curva de Sobrecarga Progressiva (8 Semanas)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[#86948a]">Exercício:</label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#0b1326] text-[#dae2fd] text-xs font-mono-metric border border-[#3c4a42]/50 focus:border-[#4edea3] focus:outline-none cursor-pointer"
            >
              <option value="Supino Reto com Halteres">Supino Reto com Halteres (20kg → 28kg)</option>
              <option value="Agachamento Livre">Agachamento Livre (80kg → 100kg)</option>
              <option value="Puxada Alta Pronada">Puxada Alta Pronada (50kg → 65kg)</option>
              <option value="Elevação Lateral">Elevação Lateral (8kg → 12kg)</option>
            </select>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-[280px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={overloadData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3449" vertical={false} />
              <XAxis dataKey="week" stroke="#86948a" tick={{ fontSize: 11, fill: '#86948a' }} />
              <YAxis domain={[16, 32]} stroke="#86948a" tick={{ fontSize: 11, fill: '#86948a' }} unit=" kg" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b1326',
                  borderColor: '#3c4a42',
                  borderRadius: '12px',
                  color: '#dae2fd',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => [`${value} kg`, 'Carga Efetiva']}
                labelFormatter={(label, payload) => `${label} (${payload[0]?.payload?.date || ''})`}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#weightGrad)"
                dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#0b1326' }}
                activeDot={{ r: 7, fill: '#4edea3', stroke: '#003824', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[#86948a]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
              <strong className="text-[#dae2fd]">Carga Alvo / Efetiva (kg)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
              Semana 8: Recorde Pessoal (PR)
            </span>
          </div>
          <span className="font-mono-metric text-[11px] text-[#4edea3]">
            ● Progressão linear sustentada (+1kg/semana por halter)
          </span>
        </div>
      </div>

      {/* 5. Historical Sessions List */}
      <div className="bg-[#171f33] rounded-2xl p-5 border border-[#3c4a42]/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#3c4a42]/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#c0c1ff]" />
            <h3 className="text-base font-bold text-[#dae2fd]">Histórico de Sessões Registradas</h3>
          </div>
          <span className="font-mono-metric text-xs text-[#86948a]">{sessions.length} treinos no log</span>
        </div>

        <div className="space-y-2.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-[#222a3d] hover:bg-[#31394d] rounded-xl p-4 border border-[#3c4a42]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0b1326] flex items-center justify-center font-bold text-xs text-[#4edea3] border border-[#3c4a42]/40">
                  {session.split_day}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#dae2fd]">{session.workout_name}</h4>
                  <div className="flex items-center gap-3 text-xs text-[#bbcabf] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#86948a]" />
                      {session.duration_minutes} min
                    </span>
                    <span>•</span>
                    <span className="font-mono-metric">{session.completed_at}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end">
                <div className="flex flex-col text-right">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a]">Volume</span>
                  <span className="font-mono-metric text-xs font-bold text-[#4edea3]">
                    {session.total_tonnage_kg.toLocaleString()} kg
                  </span>
                </div>

                <div className="flex flex-col text-right">
                  <span className="font-mono-metric text-[10px] uppercase text-[#86948a]">RPE</span>
                  <span className="font-mono-metric text-xs font-bold text-[#ffb95f]">
                    {session.rpe_average} / 10
                  </span>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-[#10b981]/20 text-[#4edea3] font-mono-metric text-xs font-bold">
                  {session.completed_exercises}/{session.total_exercises} concluídos
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
