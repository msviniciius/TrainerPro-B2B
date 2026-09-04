import { Student } from '../types/database';

export function safeBase64Encode(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (err) {
    console.warn('Failed to base64 encode:', err);
    return encodeURIComponent(str);
  }
}

export function safeBase64Decode(str: string): string {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (err) {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }
}

export interface StudentInvitePayload {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  plan?: string;
  tier?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  goal?: string;
  exp?: string;
  age?: number;
  weight?: number;
}

/**
 * Generates a bulletproof web app invite URL that works on any device,
 * standalone browser, or incognito session.
 */
export function generateStudentInviteUrl(student: Partial<Student>): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.href.split('?')[0].split('#')[0]
    : 'https://trainerpro.app';

  const payload: StudentInvitePayload = {
    id: student.id || `student-${Date.now()}`,
    name: student.full_name || 'Aluno',
    email: student.email,
    phone: student.phone,
    plan: student.plan_name,
    tier: student.plan_tier,
    goal: student.goal,
    exp: student.access_expiration_date,
    age: student.age,
    weight: student.weight_kg,
  };

  const encodedData = safeBase64Encode(JSON.stringify(payload));
  return `${baseUrl}?convite=${encodeURIComponent(payload.id)}&d=${encodeURIComponent(encodedData)}`;
}

/**
 * Inspects the current URL (search or hash) for invite tokens or encoded student payloads.
 */
export function parseStudentInviteFromUrl(existingStudents: Student[]): {
  student: Student;
  isNew: boolean;
} | null {
  if (typeof window === 'undefined') return null;

  try {
    // Check search params and hash params (some routers put queries in hash)
    const searchParams = new URLSearchParams(window.location.search);
    let hashQuery = '';
    if (window.location.hash.includes('?')) {
      hashQuery = window.location.hash.split('?')[1];
    }
    const hashParams = new URLSearchParams(hashQuery);

    const conviteParam =
      searchParams.get('convite') ||
      searchParams.get('invite') ||
      searchParams.get('token') ||
      searchParams.get('aluno') ||
      hashParams.get('convite') ||
      hashParams.get('invite') ||
      hashParams.get('token') ||
      hashParams.get('aluno');

    const dataParam = searchParams.get('d') || hashParams.get('d');

    if (!conviteParam && !dataParam) {
      return null;
    }

    const cleanToken = conviteParam ? decodeURIComponent(conviteParam).trim().toLowerCase() : '';
    const cleanDigits = cleanToken.replace(/\D/g, '');

    // 1. First, search if the student already exists in existingStudents list
    if (cleanToken) {
      const found = existingStudents.find((s) => {
        if (s.id.toLowerCase() === cleanToken) return true;
        if (s.invite_token && s.invite_token.toLowerCase() === cleanToken) return true;
        if (s.email && s.email.toLowerCase() === cleanToken) return true;
        if (s.full_name && s.full_name.toLowerCase() === cleanToken) return true;
        if (cleanDigits.length >= 8 && s.phone && s.phone.replace(/\D/g, '').includes(cleanDigits))
          return true;
        return false;
      });

      if (found) {
        return { student: found, isNew: false };
      }
    }

    // 2. If not found in local list but dataParam `d` is available, unpack the student!
    if (dataParam) {
      try {
        const decodedJson = safeBase64Decode(dataParam);
        const payload: StudentInvitePayload = JSON.parse(decodedJson);

        if (payload && (payload.name || payload.id)) {
          // Check again with payload id or email in existingStudents
          const foundByPayload = existingStudents.find(
            (s) =>
              s.id === payload.id ||
              (payload.email && s.email.toLowerCase() === payload.email.toLowerCase())
          );
          if (foundByPayload) {
            return { student: foundByPayload, isNew: false };
          }

          // Reconstruct student
          const reconstructedStudent: Student = {
            id: payload.id || `student-${Date.now()}`,
            trainer_id: 'trainer-001',
            full_name: payload.name || 'Aluno Convidado',
            email:
              payload.email ||
              `${(payload.name || 'aluno').toLowerCase().replace(/\s+/g, '.')}@aluno.com`,
            phone: payload.phone || '+55 (11) 98765-4321',
            plan_tier: payload.tier || 'trimestral',
            plan_name: payload.plan || 'Plano Personalizado',
            goal: payload.goal || 'Hipertrofia',
            cycle_info: 'Ciclo 1 • Início de Prescrição',
            age: payload.age || 28,
            weight_kg: payload.weight || 75,
            weight_diff_kg: 0,
            access_expiration_date:
              payload.exp ||
              new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            is_active: true,
            auto_lock: true,
            last_workout_date: 'Aguardando 1º Treino',
            last_workout_name: 'Ficha Prescrita',
            created_at: new Date().toISOString(),
            invite_token: payload.id,
            password_set: false,
          };

          return { student: reconstructedStudent, isNew: true };
        }
      } catch (err) {
        console.warn('Failed to parse student data from URL payload:', err);
      }
    }

    // 3. Fallback: if conviteParam exists and looks like a name or student ID, build a minimal placeholder
    if (conviteParam) {
      const fallbackName = decodeURIComponent(conviteParam).replace(/^student-[\d]+$/, 'Aluno');
      const fallbackStudent: Student = {
        id: conviteParam.startsWith('student-') ? conviteParam : `student-${Date.now()}`,
        trainer_id: 'trainer-001',
        full_name: fallbackName !== 'Aluno' ? fallbackName : 'Aluno Convidado',
        email: 'aluno@email.com',
        phone: '+55 (11) 98765-4321',
        plan_tier: 'trimestral',
        plan_name: 'Trimestral VIP',
        goal: 'Hipertrofia e Condicionamento',
        cycle_info: 'Ciclo 1 • Início de Prescrição',
        age: 28,
        weight_kg: 75,
        weight_diff_kg: 0,
        access_expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        is_active: true,
        auto_lock: true,
        last_workout_date: 'Aguardando 1º Treino',
        last_workout_name: 'Ficha Prescrita',
        created_at: new Date().toISOString(),
        invite_token: conviteParam,
        password_set: false,
      };
      return { student: fallbackStudent, isNew: true };
    }
  } catch (err) {
    console.error('Error parsing student invite from URL:', err);
  }

  return null;
}
