import React, { useState } from 'react';
import { Student, WorkoutPlan, ExerciseLog, WorkoutSession, PersonalTrainer } from './types/database';
import { INITIAL_STUDENTS, INITIAL_WORKOUT_PLANS, MOCK_EXERCISE_LOGS, MOCK_SESSIONS, CURRENT_TRAINER } from './data/mockData';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { StudentManagement } from './components/trainer/StudentManagement';
import { WorkoutBuilder } from './components/trainer/WorkoutBuilder';
import { AnalyticsReport } from './components/trainer/AnalyticsReport';
import { TrainerProfileSettings } from './components/trainer/TrainerProfileSettings';
import { StudentPWA } from './components/student/StudentPWA';
import { SqlViewer } from './components/sql/SqlViewer';
import { LoginScreen } from './components/auth/LoginScreen';
import { Users, SplitSquareVertical, BarChart3, Smartphone, Database } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeView, setActiveView] = useState<
    'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'trainer-profile' | 'student-pwa' | 'supabase-sql'
  >('trainer-students');

  const [trainer, setTrainer] = useState<PersonalTrainer>(CURRENT_TRAINER);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student>(INITIAL_STUDENTS[0]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(INITIAL_WORKOUT_PLANS);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(MOCK_EXERCISE_LOGS);
  const [sessions, setSessions] = useState<WorkoutSession[]>(MOCK_SESSIONS);

  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add new student
  const handleAddStudent = (newStudentData: Partial<Student>) => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      trainer_id: 'trainer-001',
      full_name: newStudentData.full_name || 'Novo Aluno',
      email: newStudentData.email || 'aluno@email.com',
      phone: newStudentData.phone || '+55 (11) 98765-4321',
      plan_tier: newStudentData.plan_tier || 'trimestral',
      plan_name: newStudentData.plan_name || 'Trimestral VIP',
      goal: newStudentData.goal || 'Hipertrofia',
      cycle_info: 'Ciclo 1 • Início de Prescrição',
      age: newStudentData.age || 28,
      weight_kg: newStudentData.weight_kg || 75,
      weight_diff_kg: 0,
      access_expiration_date: newStudentData.access_expiration_date || '2026-12-01',
      is_active: true,
      auto_lock: newStudentData.auto_lock ?? true,
      last_workout_date: 'Aguardando 1º Treino',
      last_workout_name: 'Ficha Prescrita',
      created_at: new Date().toISOString()
    };

    setStudents(prev => [newStudent, ...prev]);
    setSelectedStudent(newStudent);
  };

  // Update student
  const handleUpdateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
    if (selectedStudent.id === id) {
      setSelectedStudent(prev => ({ ...prev, ...updates }));
    }
  };

  // Save workout plans
  const handleSaveWorkoutPlans = (newPlans: WorkoutPlan[]) => {
    setWorkoutPlans(newPlans);
  };

  // Log exercise set from PWA
  const handleLogExerciseSet = (logData: Partial<ExerciseLog>) => {
    const newLog: ExerciseLog = {
      id: `log-${Date.now()}`,
      student_id: selectedStudent.id,
      workout_exercise_id: logData.workout_exercise_id || '',
      exercise_id: logData.exercise_id || '',
      exercise_name: logData.exercise_name || 'Exercício',
      split_day: logData.split_day || 'A',
      set_number: logData.set_number || 1,
      actual_reps: logData.actual_reps || 10,
      actual_weight_kg: logData.actual_weight_kg || 20,
      previous_weight_kg: logData.previous_weight_kg || 20,
      rpe_rating: logData.rpe_rating || 8.0,
      completed_at: new Date().toISOString()
    };
    setExerciseLogs(prev => [newLog, ...prev]);
  };

  // Navigation handlers
  const handleEditWorkout = (student: Student) => {
    setSelectedStudent(student);
    setActiveView('trainer-builder');
  };

  const handleViewAnalytics = (student: Student) => {
    setSelectedStudent(student);
    setActiveView('trainer-analytics');
  };

  const handleSimulateAsStudent = (student: Student) => {
    setSelectedStudent(student);
    setActiveView('student-pwa');
  };

  // Authentication & Logout handlers
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleLoginTrainer = (email: string) => {
    if (email && email !== trainer.email) {
      setTrainer(prev => ({ ...prev, email }));
    }
    setIsAuthenticated(true);
    setActiveView('trainer-students');
  };

  const handleLoginStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsAuthenticated(true);
    setActiveView('student-pwa');
  };

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        trainer={trainer}
        students={students}
        onLoginTrainer={handleLoginTrainer}
        onLoginStudent={handleLoginStudent}
      />
    );
  }

  // If in PWA student mode, show full-screen mobile app layout
  if (activeView === 'student-pwa') {
    return (
      <StudentPWA
        student={selectedStudent}
        workoutPlans={workoutPlans}
        onLogExerciseSet={handleLogExerciseSet}
        onExitPWA={() => setActiveView('trainer-students')}
        onLogout={handleLogout}
        onUpdateStudent={handleUpdateStudent}
        trainer={trainer}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col">
      {/* Fixed Sidebar for Large screens */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        studentCount={students.length}
        trainer={trainer}
        onLogout={handleLogout}
      />

      {/* Top App Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewStudentModal={() => setIsNewStudentModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        trainer={trainer}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="lg:pl-64 pt-16 flex-1 pb-20 lg:pb-8">
        {activeView === 'trainer-students' && (
          <StudentManagement
            students={students}
            onSelectStudent={setSelectedStudent}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onViewAnalytics={handleViewAnalytics}
            onEditWorkout={handleEditWorkout}
            onSimulateAsStudent={handleSimulateAsStudent}
            isNewStudentModalOpen={isNewStudentModalOpen}
            setIsNewStudentModalOpen={setIsNewStudentModalOpen}
            searchQuery={searchQuery}
          />
        )}

        {activeView === 'trainer-profile' && (
          <TrainerProfileSettings
            trainer={trainer}
            onUpdateTrainer={(updated) => setTrainer(updated)}
            onLogout={handleLogout}
          />
        )}

        {activeView === 'trainer-builder' && (
          <WorkoutBuilder
            student={selectedStudent}
            workoutPlans={workoutPlans}
            onSaveWorkoutPlans={handleSaveWorkoutPlans}
            onViewStudentPWA={() => setActiveView('student-pwa')}
          />
        )}

        {activeView === 'trainer-analytics' && (
          <AnalyticsReport
            student={selectedStudent}
            exerciseLogs={exerciseLogs}
            sessions={sessions}
            onBackToStudents={() => setActiveView('trainer-students')}
            onEditWorkout={() => setActiveView('trainer-builder')}
          />
        )}

        {activeView === 'supabase-sql' && <SqlViewer />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#171f33]/95 backdrop-blur-md border-t border-[#3c4a42]/40 z-40 lg:hidden flex items-center justify-around px-1">
        <button
          onClick={() => setActiveView('trainer-students')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-semibold ${
            activeView === 'trainer-students' ? 'text-[#4edea3]' : 'text-[#86948a]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alunos</span>
        </button>

        <button
          onClick={() => setActiveView('trainer-builder')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-semibold ${
            activeView === 'trainer-builder' ? 'text-[#4edea3]' : 'text-[#86948a]'
          }`}
        >
          <SplitSquareVertical className="w-4 h-4" />
          <span>Prescritor</span>
        </button>

        <button
          onClick={() => setActiveView('trainer-analytics')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-semibold ${
            activeView === 'trainer-analytics' ? 'text-[#4edea3]' : 'text-[#86948a]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveView('student-pwa')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-semibold ${
            activeView === 'student-pwa' ? 'text-[#c0c1ff]' : 'text-[#86948a]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>App Aluno</span>
        </button>
      </nav>
    </div>
  );
}
