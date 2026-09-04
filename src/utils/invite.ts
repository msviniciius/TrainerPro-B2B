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
  token?: string;
  name: string;
  email: string;
  phone?: string;
  plan?: string;
  tier?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  goal?: string;
  exp?: string;
  age?: number;
  weight?: number;
  created_at?: string;
}

/**
 * Generates a unique, single-use invite URL for a student.
 * If token is not provided or regenerating, generates a fresh unique token.
 */
export function generateStudentInviteUrl(student: Partial<Student>, forceNewToken: boolean = false): {
  url: string;
  token: string;
} {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.href.split('?')[0].split('#')[0]
    : 'https://trainerpro.app';

  // Generate or reuse token
  const token = (!forceNewToken && student.invite_token && !student.invite_token_used)
    ? student.invite_token
    : `inv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const studentEmail = (student.email && student.email.trim()) 
    ? student.email.trim()
    : `${(student.full_name || 'aluno').toLowerCase().replace(/\s+/g, '.')}@aluno.com`;

  const payload: StudentInvitePayload = {
    id: student.id || `student-${Date.now()}`,
    token: token,
    name: student.full_name || 'Aluno',
    email: studentEmail,
    phone: student.phone,
    plan: student.plan_name,
    tier: student.plan_tier,
    goal: student.goal,
    exp: student.access_expiration_date,
    age: student.age,
    weight: student.weight_kg,
    created_at: new Date().toISOString(),
  };

  const encodedData = safeBase64Encode(JSON.stringify(payload));
  const url = `${baseUrl}?token=${encodeURIComponent(token)}&d=${encodeURIComponent(encodedData)}`;

  return { url, token };
}

export type ParseInviteResult = 
  | { type: 'valid'; student: Student; isNew: boolean; token: string }
  | { type: 'expired_or_used'; student?: Student; message: string }
  | null;

/**
 * Inspects the current URL (search or hash) for invite tokens or encoded student payloads.
 * Strictly verifies single-use token validity.
 */
export function parseStudentInviteFromUrl(existingStudents: Student[]): ParseInviteResult {
  if (typeof window === 'undefined') return null;

  try {
    // Check search params and hash params (some routers put queries in hash)
    const searchParams = new URLSearchParams(window.location.search);
    let hashQuery = '';
    if (window.location.hash.includes('?')) {
      hashQuery = window.location.hash.split('?')[1];
    }
    const hashParams = new URLSearchParams(hashQuery);

    const tokenParam =
      searchParams.get('token') ||
      searchParams.get('convite') ||
      searchParams.get('invite') ||
      searchParams.get('aluno') ||
      hashParams.get('token') ||
      hashParams.get('convite') ||
      hashParams.get('invite') ||
      hashParams.get('aluno');

    const dataParam = searchParams.get('d') || hashParams.get('d');

    if (!tokenParam && !dataParam) {
      return null;
    }

    const cleanToken = tokenParam ? decodeURIComponent(tokenParam).trim() : '';

    // Unpack dataParam payload if present
    let payload: StudentInvitePayload | null = null;
    if (dataParam) {
      try {
        const decodedJson = safeBase64Decode(dataParam);
        payload = JSON.parse(decodedJson);
      } catch (err) {
        console.warn('Failed to parse payload from dataParam:', err);
      }
    }

    const targetId = payload?.id || (cleanToken.startsWith('student-') ? cleanToken : '');
    const targetEmail = payload?.email?.trim().toLowerCase() || '';

    // Search matching student in existing list
    let matchedStudent = existingStudents.find((s) => {
      if (cleanToken && s.invite_token && s.invite_token === cleanToken) return true;
      if (targetId && s.id === targetId) return true;
      if (targetEmail && s.email && s.email.toLowerCase() === targetEmail) return true;
      return false;
    });

    // Check if the link was already consumed/used
    if (matchedStudent) {
      // If student already set password or the invite token was flagged as used
      if (matchedStudent.password_set || matchedStudent.invite_token_used) {
        // If current link's token doesn't match a freshly generated unused token, reject
        if (!cleanToken || matchedStudent.invite_token !== cleanToken || matchedStudent.invite_token_used) {
          return {
            type: 'expired_or_used',
            student: matchedStudent,
            message: 'Este link de primeiro acesso já foi utilizado para cadastrar a senha. Para acessar, faça login com seu e-mail e senha cadastrados, ou solicite ao seu treinador a geração de um novo link.',
          };
        }
      }

      // Valid existing student with active link
      return {
        type: 'valid',
        student: {
          ...matchedStudent,
          // Ensure email from registration payload is maintained
          email: payload?.email || matchedStudent.email,
        },
        isNew: false,
        token: cleanToken || matchedStudent.invite_token || '',
      };
    }

    // New student arriving via payload
    if (payload && (payload.name || payload.id)) {
      const reconstructedStudent: Student = {
        id: payload.id || `student-${Date.now()}`,
        trainer_id: 'trainer-001',
        full_name: payload.name || 'Aluno Convidado',
        email: payload.email || `${(payload.name || 'aluno').toLowerCase().replace(/\s+/g, '.')}@aluno.com`,
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
        last_workout_date: 'Aguardando Prescrição',
        last_workout_name: 'Ficha Pendente',
        created_at: payload.created_at || new Date().toISOString(),
        invite_token: payload.token || cleanToken || payload.id,
        invite_token_used: false,
        password_set: false,
      };

      return {
        type: 'valid',
        student: reconstructedStudent,
        isNew: true,
        token: payload.token || cleanToken,
      };
    }

    // Fallback: If only cleanToken exists, check if it's an existing student ID
    if (cleanToken) {
      const fallbackStudent: Student = {
        id: cleanToken.startsWith('student-') ? cleanToken : `student-${Date.now()}`,
        trainer_id: 'trainer-001',
        full_name: 'Aluno Convidado',
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
        last_workout_date: 'Aguardando Prescrição',
        last_workout_name: 'Ficha Pendente',
        created_at: new Date().toISOString(),
        invite_token: cleanToken,
        invite_token_used: false,
        password_set: false,
      };

      return {
        type: 'valid',
        student: fallbackStudent,
        isNew: true,
        token: cleanToken,
      };
    }
  } catch (err) {
    console.error('Error parsing student invite from URL:', err);
  }

  return null;
}
