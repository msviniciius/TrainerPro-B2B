import React, { useState } from 'react';
import { Sparkles, Send, Brain, Bot, X, RotateCcw, Zap, HelpCircle, Check, ChevronRight } from 'lucide-react';
import { WorkoutPlan, Student } from '../../types/database';

interface AiCopilotAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: WorkoutPlan;
  student: Student;
  onQuickAction?: (actionText: string) => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AiCopilotAssistant: React.FC<AiCopilotAssistantProps> = ({
  isOpen,
  onClose,
  currentPlan,
  student,
  onQuickAction
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Olá, Treinador! Sou o Copiloto IA do TrainerPro. Estou monitorando o Treino ${currentPlan.split_day} (${currentPlan.title}) de ${student.full_name}. Como posso otimizar a biomecânica, tempo sob tensão ou volume hoje?`,
      time: 'Agora'
    }
  ]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    const userMsg: Message = {
      sender: 'user',
      text: prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: prompt,
          current_plan: currentPlan,
          student_info: {
            name: student.full_name,
            goal: student.goal,
            age: student.age,
            weight: student.weight_kg
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do Copiloto');
      }

      const data = await response.json();
      const aiMsg: Message = {
        sender: 'ai',
        text: data.reply || 'Sem resposta disponível.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: unknown) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Desculpe, ocorreu uma falha na comunicação com o servidor IA.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    'Qual a cadência excêntrica ideal para hipertrofia neste treino?',
    'Como posso aquecer a cintura escapular antes desta sessão?',
    'Indique técnicas de intensidade para o último exercício deste dia',
    'O volume de séries deste treino está dentro da faixa ótima?'
  ];

  return (
    <div className="fixed inset-0 sm:inset-auto sm:right-6 sm:bottom-6 z-50 w-full sm:w-[460px] h-full sm:h-[620px] bg-[#171f33] sm:rounded-2xl shadow-2xl border border-[#3c4a42]/60 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#1f283d] flex items-center justify-between border-b border-[#3c4a42]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3131c0] to-[#10b981] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#dae2fd] flex items-center gap-1.5">
              <span>Copiloto de Prescrição IA</span>
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-[#bbcabf] font-mono-metric">
              Treino {currentPlan.split_day} · {student.full_name.split(' ')[0]}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#171f33]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-[#0b1326]/60">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#10b981] text-[#003824] font-medium rounded-br-none'
                  : 'bg-[#1f283d] text-[#dae2fd] border border-[#3c4a42]/40 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
            <span className="font-mono-metric text-[9px] text-[#86948a] mt-0.5 px-1">
              {msg.time}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#4edea3] font-mono-metric p-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Consultando biomecânica e fisiologia...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-2.5 bg-[#171f33] border-t border-[#3c4a42]/40 overflow-x-auto whitespace-nowrap space-x-2 flex">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-[#0b1326] hover:bg-[#222a3d] border border-[#3c4a42]/50 text-[11px] text-[#bbcabf] hover:text-[#dae2fd] transition-all flex items-center gap-1 flex-shrink-0"
          >
            <Zap className="w-3 h-3 text-[#ffb95f]" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-[#1f283d] border-t border-[#3c4a42]/40 flex items-center gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Peça ajustes, dicas ou variações..."
          className="flex-1 h-9 px-3 rounded-xl bg-[#0b1326] text-xs text-[#dae2fd] placeholder:text-[#86948a] border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputPrompt.trim() || isLoading}
          className="w-9 h-9 rounded-xl bg-[#10b981] hover:bg-[#4edea3] text-[#003824] flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
