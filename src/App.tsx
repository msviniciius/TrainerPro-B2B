import React, { useState, useEffect } from 'react';
import { Student, WorkoutPlan, ExerciseLog, WorkoutSession, PersonalTrainer } from './types/database';
import { INITIAL_STUDENTS, INITIAL_WORKOUT_PLANS, MOCK_EXERCISE_LOGS, MOCK_SESSIONS, CURRENT_TRAINER } from './data/mockData';
import { 
  getStoredStudents, 
  saveStoredStudents, 
  getStoredWorkoutPlans, 
  saveStoredWorkoutPlans, 
  createDefaultPlansForStudent 
} from './utils/storage';
import { parseStudentInviteFromUrl } from './utils/invite';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { StudentManagement } from './components/trainer/StudentManagement';
import { WorkoutBuilder } from './components/trainer/WorkoutBuilder';
import { AnalyticsReport } from './components/trainer/AnalyticsReport';
import { TrainerProfileSettings } from './components/trainer/TrainerProfileSettings';
import { StudentPWA } from './components/student/StudentPWA';
import { SqlViewer } from './components/sql/SqlViewer';
import { LoginScreen } from './components/auth/LoginScreen';
import { StudentSetPasswordScreen } from './components/auth/StudentSetPasswordScreen';
import { Users, SplitSquareVertical, BarChart3, Smartphone, Database, CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Check invite immediately upon app initialization (synchronous - zero flicker!)
  const initialData = React.useMemo(() => {
    const loadedStudents = getStoredStudents();
    const loadedPlans = getStoredWorkoutPlans();
    const inviteResult = parseStudentInviteFromUrl(loadedStudents);

    let finalStudents = loadedStudents;
    let finalPlans = loadedPlans;

    if (inviteResult && inviteResult.isNew) {
      finalStudents = [inviteResult.student, ...loadedStudents];
      saveStoredStudents(finalStudents);
      // New student starts awaiting trainer prescription - no fake/dummy plans!
    }

    return {
      students: finalStudents,
      plans: finalPlans,
      onboardingStudent: inviteResult ? inviteResult.student : null
    };
  }, []);

  const [trainer, setTrainer] = useState<PersonalTrainer>(CURRENT_TRAINER);
  const [students, setStudents] = useState<Student[]>(initialData.students);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(initialData.plans);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(MOCK_EXERCISE_LOGS);
  const [sessions, setSessions] = useState<WorkoutSession[]>(MOCK_SESSIONS);

  const [onboardingStudent, setOnboardingStudent] = useState<Student | null>(initialData.onboardingStudent);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!initialData.onboardingStudent);
  const [activeView, setActiveView] = useState<
    'trainer-students' | 'trainer-builder' | 'trainer-analytics' | 'trainer-profile' | 'student-pwa' | 'supabase-sql'
  >(initialData.onboardingStudent ? 'student-pwa' : 'trainer-students');

  const [selectedStudent, setSelectedStudent] = useState<Student>(
    initialData.onboardingStudent || initialData.students[0] || INITIAL_STUDENTS[0]
  );
  const [onboardingSuccessToast, setOnboardingSuccessToast] = useState<string | null>(null);

  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist students to localStorage whenever updated
  useEffect(() => {
    saveStoredStudents(students);
  }, [students]);

  // Persist workout plans to localStorage whenever updated
  useEffect(() => {
    saveStoredWorkoutPlans(workoutPlans);
  }, [workoutPlans]);

  // Listen for URL or popstate changes with invite params
  useEffect(() => {
    const handleCheckUrlInvite = () => {
      const result = parseStudentInviteFromUrl(students);
      if (result) {
        if (result.isNew) {
          const updatedStudents = [result.student, ...students];
          setStudents(updatedStudents);
          saveStoredStudents(updatedStudents);
          // New student starts awaiting prescription - no fake/dummy plans
        }
        setSelectedStudent(result.student);
        setOnboardingStudent(result.student);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('popstate', handleCheckUrlInvite);
    window.addEventListener('hashchange', handleCheckUrlInvite);
    return () => {
      window.removeEventListener('popstate', handleCheckUrlInvite);
      window.removeEventListener('hashchange', handleCheckUrlInvite);
    };
  }, [students, workoutPlans]);

  // Add new student (Created with "Aguardando Prescrição" until trainer builds workout)
  const handleAddStudent = (newStudentData: Partial<Student>) => {
    const studentId = newStudentData.id || `student-${Date.now()}`;
    const newStudent: Student = {
      id: studentId,
      trainer_id: 'trainer-001',
      full_name: newStudentData.full_name || 'Novo Aluno',
      email: newStudentData.email || `${(newStudentData.full_name || 'aluno').toLowerCase().replace(/\s+/g, '.')}@aluno.com`,
      phone: newStudentData.phone || '+55 (11) 98765-4321',
      plan_tier: newStudentData.plan_tier || 'trimestral',
      plan_name: newStudentData.plan_name || 'Trimestral VIP',
      goal: newStudentData.goal || 'Hipertrofia',
      cycle_info: 'Ciclo 1 • Início de Prescrição',
      age: newStudentData.age || 28,
      weight_kg: newStudentData.weight_kg || 75,
      weight_diff_kg: 0,
      access_expiration_date: newStudentData.access_expiration_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      is_active: true,
      auto_lock: newStudentData.auto_lock ?? true,
      last_workout_date: 'Aguardando Prescrição',
      last_workout_name: 'Ficha Pendente',
      created_at: new Date().toISOString(),
      invite_token: studentId,
      password_set: false
    };

    // Synchronously save student without creating dummy workout plans
    const updatedStudents = [newStudent, ...students];
    setStudents(updatedStudents);
    saveStoredStudents(updatedStudents);
    setSelectedStudent(newStudent);

    return newStudent;
  };

  // Complete onboarding from link (Sets password & logs in to view workout sheet)
  const handleCompleteOnboarding = (updatedStudent: Student, password?: string) => {
    const finalizedStudent: Student = {
      ...updatedStudent,
      password: password || updatedStudent.password || 'aluno123',
      password_set: true,
      is_active: true
    };

    // Update students list
    const updatedStudents = students.some(s => s.id === finalizedStudent.id)
      ? students.map(s => s.id === finalizedStudent.id ? finalizedStudent : s)
      : [finalizedStudent, ...students];

    setStudents(updatedStudents);
    saveStoredStudents(updatedStudents);

    setSelectedStudent(finalizedStudent);
    setOnboardingStudent(null);
    setIsAuthenticated(true);
    setActiveView('student-pwa');

    // Clean URL query parameters smoothly
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}

    setOnboardingSuccessToast(`🎉 Senha cadastrada com sucesso! Bem-vindo(a) à sua área de treino, ${finalizedStudent.full_name}!`);
    setTimeout(() => setOnboardingSuccessToast(null), 6000);
  };

  // Cancel or switch from onboarding to login
  const handleCancelOnboarding = () => {
    setOnboardingStudent(null);
    setIsAuthenticated(false);
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
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
    // Preserve other students' plans and update this student's plans
    const otherPlans = workoutPlans.filter(p => p.student_id !== selectedStudent.id);
    const updated = [...newPlans, ...otherPlans];
    setWorkoutPlans(updated);
    saveStoredWorkoutPlans(updated);

    const hasAnyExercises = newPlans.some(p => p.exercises && p.exercises.length > 0);
    handleUpdateStudent(selectedStudent.id, {
      last_workout_name: hasAnyExercises ? 'Ficha Prescrita' : 'Ficha Pendente',
      last_workout_date: hasAnyExercises ? 'Prescrito Hoje' : 'Aguardando Prescrição'
    });
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

  // 1. If arriving through student invite link, show password creation screen
  if (onboardingStudent) {
    return (
      <StudentSetPasswordScreen
        student={onboardingStudent}
        trainer={trainer}
        onComplete={handleCompleteOnboarding}
        onCancelOrLogin={handleCancelOnboarding}
      />
    );
  }

  // 2. If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        trainer={trainer}
        students={students}
        onLoginTrainer={handleLoginTrainer}
        onLoginStudent={handleLoginStudent}
        onOpenInviteOnboarding={(st) => setOnboardingStudent(st)}
      />
    );
  }

  // Effective workout plans strictly for the selected student
  const studentPlans = workoutPlans.filter(p => p.student_id === selectedStudent.id);

  // 3. If in PWA student mode, show full-screen mobile app layout
  if (activeView === 'student-pwa') {
    return (
      <div className="relative min-h-screen">
        {onboardingSuccessToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-[#003824] px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-[#4edea3]/40">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{onboardingSuccessToast}</span>
            <button onClick={() => setOnboardingSuccessToast(null)} className="ml-2 hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <StudentPWA
          student={selectedStudent}
          workoutPlans={studentPlans}
          onLogExerciseSet={handleLogExerciseSet}
          onExitPWA={() => setActiveView('trainer-students')}
          onLogout={handleLogout}
          onUpdateStudent={handleUpdateStudent}
          trainer={trainer}
        />
      </div>
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
            workoutPlans={workoutPlans}
            onSelectStudent={setSelectedStudent}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onViewAnalytics={handleViewAnalytics}
            onEditWorkout={handleEditWorkout}
            onSimulateAsStudent={handleSimulateAsStudent}
            onOpenInviteOnboarding={(student) => {
              setSelectedStudent(student);
              setOnboardingStudent(student);
              setIsAuthenticated(false);
            }}
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
            workoutPlans={studentPlans}
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
