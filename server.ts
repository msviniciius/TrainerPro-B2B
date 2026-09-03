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

// 2. Gemini AI - Draft intelligent workout from anamnesis
app.post("/api/ai/draft-workout", async (req, res) => {
  try {
    const { student_name, age, goal, experience_level, days_per_week, available_equipment, injuries_or_limitations, focus_muscles } = req.body;

    const prompt = `Você é um treinador de elite especialista em biomecânica, periodização de hipertrofia e prevenção de lesões.
Crie uma ficha de treino completa e personalizada em JSON estruturado com base na seguinte anamnese:
- Nome do Aluno: ${student_name || 'Aluno'}
- Idade: ${age || 28} anos
- Objetivo Principal: ${goal || 'Hipertrofia com Definição'}
- Nível de Experiência: ${experience_level || 'Intermediário'}
- Frequência Semanal: ${days_per_week || 4} dias por semana
- Equipamentos Disponíveis: ${Array.isArray(available_equipment) ? available_equipment.join(', ') : 'Academia Completa (Halteres, Polia, Máquinas)'}
- Lesões ou Limitações (ATENÇÃO ESPECIAL): ${injuries_or_limitations || 'Nenhuma lesão relatada'}
- Grupos Musculares de Foco: ${focus_muscles || 'Peitoral e Braços'}

Regras biomecânicas rigorosas:
1. Se houver lesão no manguito rotador ou ombro, NUNCA prescreva desenvolvimento 90° livre ou supino com amplitude exagerada; prefira banco a 30°-75° no plano escapular e polias.
2. Forneça instruções de séries, repetições (ex: "8 - 10"), carga sugerida em kg, tempo de descanso em segundos e notas técnicas do coach com dicas de cadência e ângulo.
3. Crie as divisões de dias necessárias (Ex: A, B, C, D).`;

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
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        exercise_id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        target_muscle: { type: Type.STRING },
                        equipment: { type: Type.STRING },
                        sets: { type: Type.INTEGER },
                        reps: { type: Type.STRING },
                        weight_kg: { type: Type.NUMBER },
                        rest_seconds: { type: Type.INTEGER },
                        coach_notes: { type: Type.STRING },
                        intensity_tag: { type: Type.STRING },
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
