import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#10b981]/15 text-[#4edea3] text-xs font-mono-metric font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>PWA Instalado</span>
      </div>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          className={`flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#10b981] to-[#4edea3] text-[#003824] font-semibold transition-all hover:brightness-110 active:scale-95 shadow-md ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'
          }`}
          title="Instalar TrainerPro no seu dispositivo"
        >
          <Download className="w-4 h-4" />
          <span>{compact ? 'Instalar' : 'Instalar App PWA'}</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg bg-[#222a3d] border border-[#3c4a42]/50 text-[#dae2fd] hover:bg-[#31394d] transition-all text-xs font-medium whitespace-nowrap shrink-0 ${
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
          title="Instalar no iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#4edea3]" />
          <span>{compact ? 'Instalar' : 'Instalar iOS'}</span>
        </button>
      ) : (
        <button
          onClick={() => {
            alert('Para instalar o aplicativo no computador ou celular, abra o menu do seu navegador e clique em "Instalar aplicativo" ou "Adicionar à tela inicial".');
          }}
          className={`flex items-center gap-2 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#bbcabf] hover:text-[#dae2fd] transition-all text-xs font-medium border border-[#3c4a42]/40 ${
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
          title="Instalar App no celular"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#4edea3]" />
          <span>{compact ? 'App' : 'Instalar App'}</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#171f33] border border-[#3c4a42]/60 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#3c4a42]/40">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#4edea3]" />
                <h3 className="text-base font-semibold text-[#dae2fd]">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-[#86948a] hover:text-[#dae2fd] hover:bg-[#222a3d]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm text-[#bbcabf]">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0b1326] border border-[#3c4a42]/30">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center font-bold text-xs">1</span>
                <p>Abra esta página no <strong>Safari</strong> e toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com seta).</p>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0b1326] border border-[#3c4a42]/30">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center font-bold text-xs">2</span>
                <p>Role a tela para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</p>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0b1326] border border-[#3c4a42]/30">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#10b981]/20 text-[#4edea3] flex items-center justify-center font-bold text-xs">3</span>
                <p>Toque em <strong>Adicionar</strong> no canto superior direito para acessar offline.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-2 w-full rounded-xl bg-[#10b981] hover:bg-[#4edea3] py-2.5 text-sm font-semibold text-[#003824] transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
