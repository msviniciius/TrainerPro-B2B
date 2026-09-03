import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Gemini AI - Draft intelligent workout from anamnesis & presets
app.post("/api/ai/draft-workout", async (req, res) => {
  try {
    const { 
      student_name, 
      age, 
      goal, 
      experience_level, 
      days_per_week, 
      available_equipment, 
      injuries_or_limitations, 
      focus_muscles,
      split_template,
      intensity_preference
    } = req.body;

    const prompt = `Você é um treinador de elite especialista em biomecânica aplicada, fisiologia do exercício, periodização contemporânea e prevenção de lesões.
Crie uma periodização completa e moderna em JSON com base na anamnese detalhada:
- Aluno: ${student_name || 'Aluno'} (${age || 28} anos)
- Objetivo Primário: ${goal || 'Hipertrofia com Densidade Muscular'}
- Nível de Treinabilidade: ${experience_level || 'Intermediário'}
- Frequência Semanal: ${days_per_week || 4} dias por semana
- Estrutura de Divisão Solicitada: ${split_template || 'Personalizada adaptada aos dias'}
- Equipamentos Disponíveis: ${Array.isArray(available_equipment) ? available_equipment.join(', ') : 'Academia Completa (Halteres, Polias, Barras, Máquinas)'}
- Limitações Articulares / Lesões: ${injuries_or_limitations || 'Sem restrições relatadas'}
- Músculos com Prioridade / Ênfase: ${focus_muscles || 'Geral e Equilibrado'}
- Estilo de Intensidade / Técnicas: ${intensity_preference || 'Misto (Progressão de Carga + Técnicas de Densidade nas últimas séries)'}

DIRETRIZES TÉCNICAS E BIOMECÂNICAS:
1. Distribua de 4 a 6 exercícios por dia de treino, respeitando o teto de 14 a 22 séries diretas por sessão para evitar fadiga excessiva e catabolismo.
2. Especifique cadência (tempo) como "3-0-1-0", "4-1-1-0" ou "2-0-1-0" para ditar o tempo sob tensão.
3. Se houver menção a dores no manguito rotador ou lombar, substitua movimentos de alta compressão axial por vetores em plano escapular e apoios torácicos estáveis.
4. Inclua notas do treinador detalhando o vetor de força, alinhamento de fibras e ponto de estiramento sob carga.
5. Adicione tags de intensidade quando apropriado (ex: "Drop-Set 3x", "Rest-Pause 20s", "Pico de Isometria 2s", "Back-off Set -20%").`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            cycle_description: { type: Type.STRING },
            coach_insights: { type: Type.STRING },
            periodization_phase: { type: Type.STRING },
            weekly_volume_summary: { type: Type.STRING },
            splits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  split_day: { type: Type.STRING },
                  title: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  estimated_duration_min: { type: Type.INTEGER },
                  target_rpe: { type: Type.NUMBER },
                  rotator_cuff_safe: { type: Type.BOOLEAN },
                  warmup_activation: { type: Type.STRING },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        target_muscle: { type: Type.STRING },
                        equipment: { type: Type.STRING },
                        sets: { type: Type.INTEGER },
                        reps: { type: Type.STRING },
                        weight_kg: { type: Type.NUMBER },
                        rest_seconds: { type: Type.INTEGER },
                        coach_notes: { type: Type.STRING },
                        intensity_tag: { type: Type.STRING },
                        tempo: { type: Type.STRING }
                      },
                      required: ["name", "target_muscle", "sets", "reps", "weight_kg", "rest_seconds", "coach_notes"]
                    }
                  }
                },
                required: ["split_day", "title", "focus", "estimated_duration_min", "target_rpe", "exercises"]
              }
            }
          },
          required: ["title", "cycle_description", "splits", "coach_insights"]
        }
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);
  } catch (error: unknown) {
    console.error("AI Workout Draft Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha ao gerar treino com IA";
    res.status(500).json({ error: errorMessage });
  }
});

// 3. Gemini AI - Biomechanical Exercise Substitution
app.post("/api/ai/substitute-exercise", async (req, res) => {
  try {
    const { exercise_name, target_muscle, current_equipment, injury_or_reason } = req.body;

    const prompt = `Como treinador biomecanista de alto rendimento, sugira 3 substituições biomecanicamente equivalentes ou mais seguras para o exercício:
- Exercício Atual: ${exercise_name}
- Músculo Alvo: ${target_muscle}
- Equipamento Atual: ${current_equipment || 'Não especificado'}
- Motivo da Troca / Restrição: ${injury_or_reason || 'Máquina ocupada ou adaptação anatômica'}

Retorne 3 opções com o mesmo vetor de tensão mecânica, detalhando o porquê da equivalência.`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            substitutes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  target_muscle: { type: Type.STRING },
                  equipment: { type: Type.STRING },
                  biomechanical_advantage: { type: Type.STRING },
                  recommended_tempo: { type: Type.STRING },
                  sets: { type: Type.INTEGER },
                  reps: { type: Type.STRING }
                },
                required: ["name", "target_muscle", "equipment", "biomechanical_advantage"]
              }
            }
          },
          required: ["substitutes"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: unknown) {
    console.error("AI Substitute Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha ao sugerir substitutos";
    res.status(500).json({ error: errorMessage });
  }
});

// 4. Gemini AI - Workout Optimizer & Biomechanical Audit
app.post("/api/ai/optimize-workout", async (req, res) => {
  try {
    const { split_day, workout_title, exercises, student_goal, limitations } = req.body;

    const prompt = `Analise biomecanicamente a seguinte sessão de treino prescrita:
- Divisão: ${split_day} - ${workout_title}
- Objetivo: ${student_goal || 'Hipertrofia'}
- Limitações: ${limitations || 'Nenhuma'}
- Exercícios (${exercises?.length || 0}):
${exercises?.map((e: any, i: number) => `${i + 1}. ${e.name} (${e.exercise?.name || ''}) - ${e.target_sets} séries de ${e.target_reps}, descanso ${e.rest_seconds}s. Notas: ${e.coach_notes}`).join('\n')}

Avalie:
1. Curva de resistência e sobreposição de vetores;
2. Volume total por grupo muscular (adequado, excessivo ou insuficiente);
3. Segurança articular e posicionamento espinhal/escapular;
4. Dê 3 recomendações acionáveis de melhoria imediata.`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overall_score: { type: Type.INTEGER }, // 0 to 100
            volume_assessment: { type: Type.STRING },
            biomechanical_risk_level: { type: Type.STRING }, // 'Baixo' | 'Moderado' | 'Alto'
            joint_health_notes: { type: Type.STRING },
            actionable_tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["overall_score", "volume_assessment", "biomechanical_risk_level", "joint_health_notes", "actionable_tips"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: unknown) {
    console.error("AI Optimize Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha na análise biomecânica";
    res.status(500).json({ error: errorMessage });
  }
});

// 5. Gemini AI - Free-form Trainer Copilot / Assistant
app.post("/api/ai/chat-copilot", async (req, res) => {
  try {
    const { user_prompt, current_plan, student_info } = req.body;

    const prompt = `Você é o Copiloto IA de Treinamento Avançado do TrainerPro.
Contexto do Aluno: ${JSON.stringify(student_info || {})}
Treino Atual em Edição: ${JSON.stringify(current_plan || {})}

Solicitação do Treinador: "${user_prompt}"

Responda como um especialista de alto nível em musculação, biomecânica e periodização. Seja direto, assertivo e forneça recomendações práticas com séries, repetições e justificativa científica.`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({ reply: response.text });
  } catch (error: unknown) {
    console.error("AI Copilot Chat Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha no chat copiloto";
    res.status(500).json({ error: errorMessage });
  }
});

// 3. Gemini AI - Coach Biomechanical Analytics Insight
app.post("/api/ai/coach-insight", async (req, res) => {
  try {
    const { student_name, exercise_name, initial_weight, current_weight, weeks_count, rpe_history } = req.body;

    const prompt = `Analise a progressão do aluno ${student_name} no exercício ${exercise_name}:
- Carga inicial: ${initial_weight} kg
- Carga atual (Semana ${weeks_count || 8}): ${current_weight} kg
- Histórico de RPE recente: ${rpe_history || '8.5 / 10'}

Gere um parecer conciso em português (máx 3 frases) sobre a adaptação neuromuscular e uma recomendação prática de periodização para o próximo microciclo.`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor sênior de biomecânica e fisiologia do exercício para Personal Trainers.",
      }
    });

    res.json({ insight: response.text });
  } catch (error: unknown) {
    console.error("AI Coach Insight Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha ao gerar insights";
    res.status(500).json({ error: errorMessage });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TrainerPro Server running on port ${PORT}`);
  });
}

startServer();
