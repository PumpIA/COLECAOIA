
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-6 lg:p-12 bg-[#F8FAFC]">
      <header className="w-full max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold font-rounded text-slate-900 tracking-tight">
            Coleção<span className="text-indigo-600">.IA</span>
          </h1>
          <p className="text-slate-400 font-medium text-[10px] uppercase tracking-[0.3em] mt-1">Alta Fidelidade & Casting Real</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600">Gemini 3 Pro Engine</span>
        </div>
      </header>
      
      <main className="w-full max-w-6xl transition-all">
        {children}
      </main>

      <footer className="mt-16 mb-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <span>Privacidade</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>Termos</span>
        </div>
        <p className="opacity-40">© 2024 Coleção.IA • Digital Fashion Lab</p>
      </footer>
    </div>
  );
};
