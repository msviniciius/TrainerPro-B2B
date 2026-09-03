import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Terminal, Key, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const SqlViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const fullSqlContent = `-- ==============================================================================
-- TRAINERPRO B2B - SCHEMA POSTGRESQL & POLÍTICAS RLS PARA SUPABASE
-- Plataforma Multitenant de Gestão de Treinos & PWA para Alunos
-- ==============================================================================

-- 1. EXTENSÕES OBRIGATÓRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE DOMÍNIO
DO $$ BEGIN
    CREATE TYPE plan_tier_enum AS ENUM ('mensal', 'trimestral', 'semestral', 'anual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE split_day_enum AS ENUM ('A', 'B', 'C', 'D', 'E');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE body_part_enum AS ENUM (
        'Peitoral', 'Dorsal', 'Quadríceps', 'Isquiotibiais', 
        'Deltoides', 'Tríceps', 'Bíceps', 'Abdômen', 'Panturrilhas', 'Cardio'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA: EXERCISES (Catálogo Global de Exercícios com Mídia Técnica)
CREATE TABLE IF NOT EXISTS public.exercises (
    id VARCHAR(32) PRIMARY KEY, -- Ex: "0001", "0025"
    name TEXT NOT NULL,
    body_part TEXT NOT NULL,
    target_muscle TEXT NOT NULL,
    equipment TEXT NOT NULL,
    gif_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    instructions_pt TEXT NOT NULL,
    biomechanics_tip TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para busca rápida de exercícios por nome, grupo muscular e equipamento
CREATE INDEX IF NOT EXISTS idx_exercises_body_part ON public.exercises(body_part);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises(equipment);

-- 4. TABELA: PERSONAL_TRAINERS (Perfil do Treinador / Tenant Principal)
CREATE TABLE IF NOT EXISTS public.personal_trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    brand_name TEXT NOT NULL DEFAULT 'TrainerPro Coaching',
    cref TEXT NOT NULL,
    phone TEXT NOT NULL,
    avatar_url TEXT,
    roster_capacity INT DEFAULT 50 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELA: STUDENTS (Alunos com Data de Vencimento e Controle de Trava)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES public.personal_trainers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Preenchido após o aluno criar a conta
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    avatar_url TEXT,
    plan_tier plan_tier_enum DEFAULT 'trimestral' NOT NULL,
    plan_name TEXT DEFAULT 'Trimestral Pro' NOT NULL,
    goal TEXT DEFAULT 'Hipertrofia com Definição' NOT NULL,
    cycle_info TEXT DEFAULT 'Ciclo 4 • Mesociclo Carga',
    age INT DEFAULT 28,
    weight_kg NUMERIC(5,2) DEFAULT 80.00,
    access_expiration_date DATE NOT NULL, -- Data limite de acesso ao App
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    auto_lock BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_trainer_id ON public.students(trainer_id);
CREATE INDEX IF NOT EXISTS idx_students_access_expiration ON public.students(access_expiration_date);

-- 6. TABELA: WORKOUT_PLANS (Divisões de Treino A, B, C, D)
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES public.personal_trainers(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- Ex: "Treino A - Peitoral & Deltoide Ant."
    split_day split_day_enum NOT NULL DEFAULT 'A',
    focus_muscle TEXT NOT NULL,
    estimated_duration_min INT DEFAULT 55,
    target_rpe NUMERIC(3,1) DEFAULT 8.5,
    rotator_cuff_safe BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_plans_student ON public.workout_plans(student_id);

-- 7. TABELA: WORKOUT_EXERCISES (Exercícios Prescritos com Parâmetros)
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    exercise_id VARCHAR(32) NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    order_index INT NOT NULL DEFAULT 1,
    target_sets INT NOT NULL DEFAULT 4,
    target_reps TEXT NOT NULL DEFAULT '8 - 10',
    target_weight_kg NUMERIC(5,2) DEFAULT 0.00,
    rest_seconds INT NOT NULL DEFAULT 60,
    coach_notes TEXT,
    intensity_tag TEXT, -- 'Drop-Set', 'Isometria 2s', etc.
    tempo TEXT DEFAULT '3-0-1-0',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_plan ON public.workout_exercises(workout_plan_id);

-- 8. TABELA: EXERCISE_LOGS (Registro de Execução do Aluno com Carga Real)
CREATE TABLE IF NOT EXISTS public.exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    exercise_id VARCHAR(32) NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    set_number INT NOT NULL,
    actual_reps INT NOT NULL,
    actual_weight_kg NUMERIC(5,2) NOT NULL,
    rpe_rating NUMERIC(3,1),
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_student_date ON public.exercise_logs(student_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_exercise ON public.exercise_logs(workout_exercise_id);

-- 9. FUNÇÕES E TRIGGERS DE SEGURANÇA E ACESSO

-- A) Função para verificar status de acesso em tempo real
CREATE OR REPLACE FUNCTION public.check_student_access_status(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_student RECORD;
    v_is_expired BOOLEAN;
    v_days_left INT;
BEGIN
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Aluno não encontrado');
    END IF;

    v_days_left := (v_student.access_expiration_date - CURRENT_DATE);
    v_is_expired := (CURRENT_DATE > v_student.access_expiration_date);

    RETURN jsonb_build_object(
        'student_id', v_student.id,
        'full_name', v_student.full_name,
        'access_expiration_date', v_student.access_expiration_date,
        'days_remaining', v_days_left,
        'is_blocked', (v_is_expired AND v_student.auto_lock) OR (NOT v_student.is_active),
        'status', CASE 
            WHEN (v_is_expired AND v_student.auto_lock) OR (NOT v_student.is_active) THEN 'blocked'
            WHEN v_days_left <= 5 THEN 'expiring'
            ELSE 'active'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B) Trigger para atualização automática de timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_students_updated ON public.students;
CREATE TRIGGER on_students_updated
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_workout_plans_updated ON public.workout_plans;
CREATE TRIGGER on_workout_plans_updated
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE ISOLAMENTO POR PERSONAL (MULTITENANT)
-- ==============================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- 1) EXERCISES: Leitura livre para qualquer usuário autenticado (Personal ou Aluno)
DROP POLICY IF EXISTS "Exercícios visíveis para todos os usuários autenticados" ON public.exercises;
CREATE POLICY "Exercícios visíveis para todos os usuários autenticados"
    ON public.exercises FOR SELECT
    TO authenticated
    USING (true);

-- 2) PERSONAL_TRAINERS: Treinador gerencia seu próprio registro
DROP POLICY IF EXISTS "Personal visualiza seu perfil" ON public.personal_trainers;
CREATE POLICY "Personal visualiza seu perfil"
    ON public.personal_trainers FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Personal atualiza seu perfil" ON public.personal_trainers;
CREATE POLICY "Personal atualiza seu perfil"
    ON public.personal_trainers FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3) STUDENTS: Personal só gerencia seus próprios alunos. Aluno só vê seu perfil.
DROP POLICY IF EXISTS "Personal gerencia seus alunos" ON public.students;
CREATE POLICY "Personal gerencia seus alunos"
    ON public.students FOR ALL
    TO authenticated
    USING (
        trainer_id IN (
            SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        trainer_id IN (
            SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Aluno visualiza seu próprio cadastro" ON public.students;
CREATE POLICY "Aluno visualiza seu próprio cadastro"
    ON public.students FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 4) WORKOUT_PLANS: Personal gerencia treinos dos seus alunos. Aluno visualiza apenas se ativo.
DROP POLICY IF EXISTS "Personal gerencia fichas de treino" ON public.workout_plans;
CREATE POLICY "Personal gerencia fichas de treino"
    ON public.workout_plans FOR ALL
    TO authenticated
    USING (
        trainer_id IN (
            SELECT id FROM public.personal_trainers WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Aluno com acesso vigente visualiza suas fichas" ON public.workout_plans;
CREATE POLICY "Aluno com acesso vigente visualiza suas fichas"
    ON public.workout_plans FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE user_id = auth.uid() 
            AND (access_expiration_date >= CURRENT_DATE OR auto_lock = FALSE)
            AND is_active = TRUE
        )
    );

-- 5) WORKOUT_EXERCISES: Segue o vínculo do workout_plan
DROP POLICY IF EXISTS "Personal gerencia exercícios da ficha" ON public.workout_exercises;
CREATE POLICY "Personal gerencia exercícios da ficha"
    ON public.workout_exercises FOR ALL
    TO authenticated
    USING (
        workout_plan_id IN (
            SELECT wp.id FROM public.workout_plans wp
            JOIN public.personal_trainers pt ON pt.id = wp.trainer_id
            WHERE pt.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Aluno ativo visualiza exercícios da ficha" ON public.workout_exercises;
CREATE POLICY "Aluno ativo visualiza exercícios da ficha"
    ON public.workout_exercises FOR SELECT
    TO authenticated
    USING (
        workout_plan_id IN (
            SELECT wp.id FROM public.workout_plans wp
            JOIN public.students s ON s.id = wp.student_id
            WHERE s.user_id = auth.uid()
            AND (s.access_expiration_date >= CURRENT_DATE OR s.auto_lock = FALSE)
            AND s.is_active = TRUE
        )
    );

-- 6) EXERCISE_LOGS: Aluno ativo insere e consulta seus logs. Personal consulta logs dos seus alunos.
DROP POLICY IF EXISTS "Aluno ativo insere logs de treino" ON public.exercise_logs;
CREATE POLICY "Aluno ativo insere logs de treino"
    ON public.exercise_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students 
            WHERE user_id = auth.uid() 
            AND (access_expiration_date >= CURRENT_DATE OR auto_lock = FALSE)
            AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Aluno visualiza seus próprios logs de treino" ON public.exercise_logs;
CREATE POLICY "Aluno visualiza seus próprios logs de treino"
    ON public.exercise_logs FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Personal visualiza logs de todos os seus alunos" ON public.exercise_logs;
CREATE POLICY "Personal visualiza logs de todos os seus alunos"
    ON public.exercise_logs FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT s.id FROM public.students s
            JOIN public.personal_trainers pt ON pt.id = s.trainer_id
            WHERE pt.user_id = auth.uid()
        )
    );`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono-metric text-xs uppercase text-[#ffb95f] font-bold bg-[#ffb95f]/15 px-2.5 py-0.5 rounded-full border border-[#ffb95f]/30">
              Supabase PostgreSQL · RLS Multitenancy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#dae2fd] tracking-tight">
            Schema Relacional & Políticas de Segurança
          </h1>
          <p className="text-xs sm:text-sm text-[#bbcabf] mt-1">
            Schema completo com as 6 tabelas (incluindo <code className="text-[#4edea3] font-mono-metric">workout_exercises</code> e <code className="text-[#4edea3] font-mono-metric">exercise_logs</code>), índices, triggers e RLS.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-[#ffb95f] to-[#e29100] text-[#472a00] font-bold text-xs hover:brightness-110 shadow-lg shadow-[#ffb95f]/20 active:scale-95 transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copiado para Clipboard!' : 'Copiar SQL Completo'}</span>
        </button>
      </div>

      {/* RLS Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#171f33] rounded-2xl p-4 border border-[#3c4a42]/40 space-y-2">
          <div className="flex items-center gap-2 text-[#4edea3] font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Multitenancy por Personal Trainer</span>
          </div>
          <p className="text-xs text-[#bbcabf]">
            Políticas RLS garantem isolamento estrito entre treinadores e permissões granulares para os alunos.
          </p>
        </div>

        <div className="bg-[#171f33] rounded-2xl p-4 border border-[#3c4a42]/40 space-y-2">
          <div className="flex items-center gap-2 text-[#ffb95f] font-bold text-xs">
            <Lock className="w-4 h-4" />
            <span>Access Guard & Trava de Vencimento</span>
          </div>
          <p className="text-xs text-[#bbcabf]">
            A função <code className="font-mono-metric text-[#ffb95f]">check_student_access_status</code> bloqueia a leitura de fichas caso o aluno esteja vencido ou inativo.
          </p>
        </div>

        <div className="bg-[#171f33] rounded-2xl p-4 border border-[#3c4a42]/40 space-y-2">
          <div className="flex items-center gap-2 text-[#c0c1ff] font-bold text-xs">
            <Key className="w-4 h-4" />
            <span>6 Tabelas Relacionais & Foreign Keys</span>
          </div>
          <p className="text-xs text-[#bbcabf]">
            Estrutura com <code className="font-mono-metric text-[#c0c1ff]">exercises</code>, <code className="font-mono-metric text-[#c0c1ff]">workout_exercises</code> e <code className="font-mono-metric text-[#c0c1ff]">exercise_logs</code> em cascata.
          </p>
        </div>
      </div>

      {/* Quick notice box */}
      <div className="bg-[#0b1326] border border-[#10b981]/30 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#4edea3] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#bbcabf] space-y-1">
          <p className="font-bold text-[#dae2fd]">Instrução para execução no Supabase SQL Editor:</p>
          <p>
            Copie todo o código abaixo e cole diretamente na aba <strong>SQL Editor</strong> do painel do seu projeto Supabase e clique em <strong>Run</strong>. Todas as 6 tabelas, índices e políticas de segurança RLS serão criadas em ordem correta sem conflitos.
          </p>
        </div>
      </div>

      {/* SQL Code Box */}
      <div className="bg-[#0b1326] rounded-2xl overflow-hidden border border-[#3c4a42]/60 shadow-2xl">
        <div className="px-5 py-3 bg-[#131b2e] border-b border-[#3c4a42]/40 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono-metric text-xs text-[#bbcabf]">
            <Terminal className="w-4 h-4 text-[#4edea3]" />
            <span>supabase_schema.sql (320 linhas)</span>
          </div>
          <span className="font-mono-metric text-[11px] text-[#86948a]">PostgreSQL 15+ / Supabase</span>
        </div>
        <pre className="p-5 font-mono-metric text-xs text-[#4edea3] leading-relaxed overflow-x-auto select-all max-h-[600px]">
          {fullSqlContent}
        </pre>
      </div>
    </div>
  );
};
