
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FashionAnswers, AppStatus } from './types';
import { 
  generateFashionPrompt, 
  analyzeImageForPerson, 
  suggestAllFields, 
  suggestFieldContent
} from './services/geminiService';

const INITIAL_ANSWERS: FashionAnswers = {
  type: 'video',
  scenario: '',
  modelDescription: '',
  action: '',
  cameraStyle: '',
  details: '',
  skinTone: '',
  hairStyle: '',
  ethnicity: '',
  ageRange: ''
};

const SKIN_TONES = [
  { label: 'Muito Clara', value: 'Pale ivory' },
  { label: 'Clara', value: 'Fair' },
  { label: 'Média', value: 'Medium tan' },
  { label: 'Retinta', value: 'Deep melanin-rich' },
  { label: 'Negra', value: 'Dark brown' }
];

const HAIR_STYLES = [
  { label: 'Loiro', value: 'Blonde' },
  { label: 'Castanho', value: 'Brunette' },
  { label: 'Preto', value: 'Raven black' },
  { label: 'Ruivo', value: 'Auburn red' },
  { label: 'Cacheado', value: 'Natural curly' },
  { label: 'Curto', value: 'Short pixie cut' }
];

const ETHNICITIES = [
  { label: 'Latina', value: 'Latin-American' },
  { label: 'Afro', value: 'African-descent' },
  { label: 'Asiática', value: 'East-Asian' },
  { label: 'Caucasiana', value: 'European' }
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const [answers, setAnswers] = useState<FashionAnswers>(INITIAL_ANSWERS);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetAll = () => {
    setImages([]);
    setActiveImageIndex(0);
    setAnswers(INITIAL_ANSWERS);
    setGeneratedPrompt('');
    setError(null);
    setStatus(AppStatus.IDLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages: string[] = [];
    const filesArray = Array.from(files).slice(0, 3 - images.length);
    for (const file of filesArray) {
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      newImages.push(await promise);
    }
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    setActiveImageIndex(updatedImages.length - 1);
    if (updatedImages.length > 0) {
      setStatus(AppStatus.ANALYZING_IMAGE);
      setError(null);
      try {
        const description = await analyzeImageForPerson(updatedImages);
        setAnswers(prev => ({ ...prev, modelDescription: description || '' }));
      } catch (err) {
        console.error("Auto-description failed", err);
      } finally {
        setStatus(AppStatus.IDLE);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => processFiles(e.target.files);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (activeImageIndex >= updated.length) setActiveImageIndex(Math.max(0, updated.length - 1));
    if (updated.length === 0) setGeneratedPrompt('');
  };

  const handleFillAllIA = async () => {
    if (images.length === 0) return;
    setStatus(AppStatus.FILLING_IA);
    try {
      const suggestions = await suggestAllFields(images, answers.type);
      if (suggestions) {
        setAnswers(prev => ({
          ...prev,
          ...suggestions
        }));
      }
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleFieldIA = async (field: keyof FashionAnswers) => {
    if (images.length === 0) return;
    setStatus(AppStatus.FILLING_IA);
    try {
      const suggestion = await suggestFieldContent(field, answers, images);
      setAnswers(prev => ({ ...prev, [field]: suggestion }));
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleGeneratePrompt = async () => {
    if (images.length === 0) {
      setError("Por favor, envie ao menos uma imagem.");
      return;
    }
    setStatus(AppStatus.GENERATING_PROMPT);
    setError(null);
    try {
      const prompt = await generateFashionPrompt(answers, images);
      setGeneratedPrompt(prompt);
      setStatus(AppStatus.READY);
    } catch (err: any) {
      setError(err.message || "Erro ao gerar prompt.");
      setStatus(AppStatus.IDLE);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAnswerValue = (field: keyof FashionAnswers, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [field]: prev[field as keyof FashionAnswers] === value ? '' : value
    }));
  };

  const isFormValid = 
    answers.modelDescription.trim().length > 0 &&
    answers.scenario.trim().length > 0 &&
    answers.action.trim().length > 0 &&
    answers.cameraStyle.trim().length > 0 &&
    answers.details.trim().length > 0;

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* COLUNA ESQUERDA: REFERÊNCIAS & RESULTADO FINAL */}
        <div className="space-y-6 lg:sticky lg:top-8">
          
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
            <button 
              onClick={() => { setAnswers(p => ({ ...p, type: 'video' })); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${answers.type === 'video' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🎬 Prompt p/ Vídeo
            </button>
            <button 
              onClick={() => { setAnswers(p => ({ ...p, type: 'image' })); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${answers.type === 'image' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📸 Prompt p/ Imagem
            </button>
          </div>

          {/* Área Principal - Preview ou Upload */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative group aspect-[3/4] rounded-[2.5rem] overflow-hidden border-2 transition-all duration-300 bg-slate-50 mx-auto
              ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-transparent shadow-xl'}`}
          >
            {images.length > 0 ? (
              <>
                <img 
                  src={images[activeImageIndex]} 
                  alt="Destaque" 
                  className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" 
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage(activeImageIndex); }}
                  className="absolute top-6 right-6 bg-red-500 text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-white shadow-lg">
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Foco em Alta Fidelidade Ativo</p>
                </div>
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-500 ${isDragging ? 'bg-indigo-600 text-white scale-110' : 'bg-white text-indigo-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-6 font-bold text-slate-600 text-center px-4 font-rounded">Arraste fotos da peça para iniciar o scanner</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            )}
            
            {(status === AppStatus.ANALYZING_IMAGE || status === AppStatus.GENERATING_PROMPT) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">
                  {status === AppStatus.GENERATING_PROMPT ? "Mapeando DNA da Peça..." : "Scanner de Silhueta & Logos..."}
                </span>
              </div>
            )}
          </div>

          {/* Miniaturas */}
          {images.length > 0 && (
            <div className="flex gap-4 justify-center">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all 
                    ${activeImageIndex === idx ? 'border-indigo-600 shadow-lg scale-110' : 'border-white opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Resultado do Prompt */}
          {generatedPrompt && (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in slide-in-from-left-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Prompt Mestre Finalizado</h4>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Otimizado para Veo 3 / Sora / Midjourney</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={resetAll} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl transition-all" title="Reiniciar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button 
                    onClick={copyToClipboard} 
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}
                  >
                    {copied ? "COPIADO!" : "COPIAR PROMPT"}
                  </button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                <p className="text-indigo-50 font-mono text-[14px] leading-relaxed select-all">{generatedPrompt}</p>
              </div>
              <div className="mt-8 border-t border-slate-800 pt-6 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">High Fidelity Engine v3.0</span>
                <button onClick={resetAll} className="text-indigo-400 hover:text-indigo-300 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                  Fazer Próximo Prompt
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DE DIREÇÃO */}
        <div className={`space-y-6 ${images.length === 0 ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          
          {/* SEÇÃO DE VARIAÇÕES DINÂMICAS */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 animate-in fade-in">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">Variações de Casting</h3>
            
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Tom de Pele</span>
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map(tone => (
                  <button
                    key={tone.value}
                    onClick={() => toggleAnswerValue('skinTone', tone.value)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border-2
                      ${answers.skinTone === tone.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Cabelo</span>
              <div className="flex flex-wrap gap-2">
                {HAIR_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => toggleAnswerValue('hairStyle', style.value)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border-2
                      ${answers.hairStyle === style.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Etnia</span>
              <div className="flex flex-wrap gap-2">
                {ETHNICITIES.map(et => (
                  <button
                    key={et.value}
                    onClick={() => toggleAnswerValue('ethnicity', et.value)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border-2
                      ${answers.ethnicity === et.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}
                  >
                    {et.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FORMULÁRIO TÉCNICO */}
          <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Análise de Produto</h3>
              <p className="text-xs text-slate-400">Preservando DNA e Proporções</p>
            </div>
            <button
              onClick={handleFillAllIA}
              disabled={status !== AppStatus.IDLE}
              className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {status === AppStatus.FILLING_IA ? "✨..." : "✨ IA: Detectar Marcas/Silhueta"}
            </button>
          </div>

          <div className="space-y-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="space-y-2 relative">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Casting Original (Auto)</label>
              <textarea 
                value={answers.modelDescription} 
                onChange={e => setAnswers(p => ({ ...p, modelDescription: e.target.value }))}
                placeholder="Aguardando análise da silhueta..." 
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm min-h-[90px]"
              />
              <button onClick={() => handleFieldIA('modelDescription')} className="absolute bottom-4 right-4 text-indigo-400 hover:text-indigo-600">✨</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Cenário</label>
                <input value={answers.scenario} onChange={e => setAnswers(p => ({ ...p, scenario: e.target.value }))} className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-400 outline-none text-sm" />
                <button onClick={() => handleFieldIA('scenario')} className="absolute bottom-4 right-4 text-indigo-400">✨</button>
              </div>
              <div className="space-y-2 relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Movimento da Peça</label>
                <input value={answers.action} onChange={e => setAnswers(p => ({ ...p, action: e.target.value }))} placeholder="Ex: Vento soprando" className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-400 outline-none text-sm" />
                <button onClick={() => handleFieldIA('action')} className="absolute bottom-4 right-4 text-indigo-400">✨</button>
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Câmera (Lentes & Luz)</label>
              <input value={answers.cameraStyle} onChange={e => setAnswers(p => ({ ...p, cameraStyle: e.target.value }))} className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-400 outline-none text-sm" />
              <button onClick={() => handleFieldIA('cameraStyle')} className="absolute bottom-4 right-4 text-indigo-400">✨</button>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Tipografia, Marcas & Caimento</label>
              <textarea value={answers.details} onChange={e => setAnswers(p => ({ ...p, details: e.target.value }))} placeholder="Onde estão os logos? Qual o tamanho da modelagem?" className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-400 outline-none text-sm min-h-[90px]" />
              <button onClick={() => handleFieldIA('details')} className="absolute bottom-4 right-4 text-indigo-400">✨</button>
            </div>

            <button
              onClick={handleGeneratePrompt}
              disabled={!isFormValid || status !== AppStatus.IDLE}
              className={`w-full py-5 rounded-[2rem] font-black text-base transition-all shadow-2xl flex items-center justify-center gap-3 mt-4
                ${isFormValid && status === AppStatus.IDLE ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-xl' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {status === AppStatus.GENERATING_PROMPT ? "Processando DNA da Peça..." : `COMPILAR PROMPT HIGH-FIDELITY`}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
