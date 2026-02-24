import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Languages, 
  Plus, 
  Trash2, 
  FileText, 
  Copy, 
  Check,
  Download,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeData, Experience } from './types';
import { 
  formatPhone, 
  formatName, 
  buildObjective, 
  buildSummary, 
  buildSkills, 
  generateChatGPTPrompt,
  parseResumeFromText
} from './utils/resumeLogic';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function App() {
  const [data, setData] = useState<ResumeData>({
    nome_completo: '',
    cidade: '',
    estado_uf: '',
    telefone: '',
    email: '',
    cargo_desejado: '',
    tipo_jornada: 'Integral',
    resumo_base: '',
    experiencias: [],
    cursos: [],
    idiomas: [],
    habilidades_extra: []
  });

  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'prompt'>('form');
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`curriculo-${data.nome_completo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente usar a opção de imprimir.');
    } finally {
      setIsDownloading(false);
    }
  };

  const printResume = () => {
    window.print();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({ ...data, foto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const parsedData = await parseResumeFromText(importText);
      setData(prev => ({
        ...prev,
        ...parsedData,
        experiencias: parsedData.experiencias || prev.experiencias,
        cursos: parsedData.cursos || prev.cursos,
        idiomas: parsedData.idiomas || prev.idiomas,
        habilidades_extra: parsedData.habilidades_extra || prev.habilidades_extra,
      }));
      setImportText('');
      alert('Currículo importado com sucesso!');
    } catch (error) {
      alert('Erro ao importar currículo. Verifique o texto e tente novamente.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddExperience = () => {
    setData({
      ...data,
      experiencias: [...data.experiencias, { empresa: '', cargo: '', periodo: '', atividades: [''] }]
    });
  };

  const handleRemoveExperience = (index: number) => {
    const newExps = [...data.experiencias];
    newExps.splice(index, 1);
    setData({ ...data, experiencias: newExps });
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: any) => {
    const newExps = [...data.experiencias];
    newExps[index] = { ...newExps[index], [field]: value };
    setData({ ...data, experiencias: newExps });
  };

  const handleAddActivity = (expIndex: number) => {
    const newExps = [...data.experiencias];
    newExps[expIndex].atividades.push('');
    setData({ ...data, experiencias: newExps });
  };

  const handleActivityChange = (expIndex: number, actIndex: number, value: string) => {
    const newExps = [...data.experiencias];
    newExps[expIndex].atividades[actIndex] = value;
    setData({ ...data, experiencias: newExps });
  };

  const handleAddItem = (field: 'cursos' | 'idiomas' | 'habilidades_extra') => {
    setData({ ...data, [field]: [...data[field], ''] });
  };

  const handleItemChange = (field: 'cursos' | 'idiomas' | 'habilidades_extra', index: number, value: string) => {
    const newList = [...data[field]];
    newList[index] = value;
    setData({ ...data, [field]: newList });
  };

  const handleRemoveItem = (field: 'cursos' | 'idiomas' | 'habilidades_extra', index: number) => {
    const newList = [...data[field]];
    newList.splice(index, 1);
    setData({ ...data, [field]: newList });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-[#141414]/10 sticky top-0 z-50 px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Curriculo<span className="text-[#5A5A40]">ATS</span></h1>
        </div>
        <nav className="flex bg-[#F5F5F0] p-1 rounded-full border border-[#141414]/5">
          <button 
            onClick={() => setActiveTab('form')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'form' ? 'bg-white shadow-sm text-[#5A5A40]' : 'text-[#141414]/60 hover:text-[#141414]'}`}
          >
            Editar
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-[#5A5A40]' : 'text-[#141414]/60 hover:text-[#141414]'}`}
          >
            Visualizar
          </button>
          <button 
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'prompt' ? 'bg-white shadow-sm text-[#5A5A40]' : 'text-[#141414]/60 hover:text-[#141414]'}`}
          >
            Prompt AI
          </button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-20 print:hidden"
            >
              {/* AI Import Section */}
              <section className="bg-[#5A5A40]/5 p-8 rounded-3xl border-2 border-dashed border-[#5A5A40]/20">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="text-[#5A5A40]" size={24} />
                  <h2 className="text-xl font-semibold">Importar com IA</h2>
                </div>
                <p className="text-sm text-[#141414]/60 mb-4">Cole seu currículo antigo ou um texto sobre você e a IA preencherá o formulário automaticamente.</p>
                <div className="flex flex-col gap-4">
                  <textarea 
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Cole aqui seu texto..."
                    className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] outline-none bg-white min-h-[100px]"
                  />
                  <button 
                    onClick={handleAIImport}
                    disabled={isImporting}
                    className="bg-[#5A5A40] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isImporting ? 'Processando...' : 'Preencher Formulário'}
                    <Sparkles size={18} />
                  </button>
                </div>
              </section>

              {/* Personal Info */}
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#141414]/5">
                <div className="flex items-center gap-3 mb-6">
                  <User className="text-[#5A5A40]" size={24} />
                  <h2 className="text-xl font-semibold">Dados Pessoais</h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-2xl bg-[#F5F5F0] border-2 border-dashed border-[#141414]/10 flex items-center justify-center overflow-hidden relative group">
                      {data.foto ? (
                        <>
                          <img src={data.foto} alt="Foto de perfil" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setData({...data, foto: undefined})}
                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      ) : (
                        <User size={40} className="text-[#141414]/20" />
                      )}
                    </div>
                    <label className="cursor-pointer bg-[#F5F5F0] hover:bg-[#E4E4E0] px-4 py-2 rounded-full text-xs font-bold transition-all">
                      {data.foto ? 'Trocar Foto' : 'Adicionar Foto'}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">Nome Completo</label>
                      <input 
                        type="text" 
                        value={data.nome_completo}
                        onChange={(e) => setData({...data, nome_completo: e.target.value})}
                        placeholder="Ex: Lara Mairla Moura dos Santos"
                        className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
                        <input 
                          type="email" 
                          value={data.email}
                          onChange={(e) => setData({...data, email: e.target.value})}
                          placeholder="email@exemplo.com"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
                        <input 
                          type="tel" 
                          value={data.telefone}
                          onChange={(e) => setData({...data, telefone: e.target.value})}
                          placeholder="(71) 99999-9999"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">Cidade</label>
                        <input 
                          type="text" 
                          value={data.cidade}
                          onChange={(e) => setData({...data, cidade: e.target.value})}
                          placeholder="Mata de São João"
                          className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">UF</label>
                        <input 
                          type="text" 
                          maxLength={2}
                          value={data.estado_uf}
                          onChange={(e) => setData({...data, estado_uf: e.target.value.toUpperCase()})}
                          placeholder="BA"
                          className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Objective */}
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#141414]/5">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="text-[#5A5A40]" size={24} />
                  <h2 className="text-xl font-semibold">Objetivo Profissional</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">Cargo Desejado</label>
                    <input 
                      type="text" 
                      value={data.cargo_desejado}
                      onChange={(e) => setData({...data, cargo_desejado: e.target.value})}
                      placeholder="Ex: Atendimento ao Cliente"
                      className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">Disponibilidade</label>
                    <select 
                      value={data.tipo_jornada}
                      onChange={(e) => setData({...data, tipo_jornada: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all bg-white appearance-none"
                    >
                      <option>Integral</option>
                      <option>Meio turno</option>
                      <option>Meio turno ou integral</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#141414]/50">Resumo Profissional (Opcional)</label>
                  <textarea 
                    value={data.resumo_base}
                    onChange={(e) => setData({...data, resumo_base: e.target.value})}
                    placeholder="Conte um pouco sobre sua trajetória e principais competências..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#141414]/10 focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all resize-none"
                  />
                </div>
              </section>

              {/* Experience */}
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#141414]/5">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-[#5A5A40]" size={24} />
                    <h2 className="text-xl font-semibold">Experiência Profissional</h2>
                  </div>
                  <button 
                    onClick={handleAddExperience}
                    className="flex items-center gap-2 text-sm font-semibold text-[#5A5A40] hover:bg-[#5A5A40]/10 px-4 py-2 rounded-full transition-all"
                  >
                    <Plus size={18} /> Adicionar
                  </button>
                </div>
                
                <div className="space-y-8">
                  {data.experiencias.map((exp, expIndex) => (
                    <div key={expIndex} className="p-6 rounded-2xl border border-[#141414]/5 bg-[#F5F5F0]/30 relative group">
                      <button 
                        onClick={() => handleRemoveExperience(expIndex)}
                        className="absolute top-4 right-4 text-[#141414]/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Empresa</label>
                          <input 
                            type="text" 
                            value={exp.empresa}
                            onChange={(e) => handleExperienceChange(expIndex, 'empresa', e.target.value)}
                            placeholder="Nome da Empresa"
                            className="w-full px-3 py-2 rounded-lg border border-[#141414]/10 bg-white outline-none focus:border-[#5A5A40]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Cargo</label>
                          <input 
                            type="text" 
                            value={exp.cargo}
                            onChange={(e) => handleExperienceChange(expIndex, 'cargo', e.target.value)}
                            placeholder="Seu Cargo"
                            className="w-full px-3 py-2 rounded-lg border border-[#141414]/10 bg-white outline-none focus:border-[#5A5A40]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Período</label>
                          <input 
                            type="text" 
                            value={exp.periodo}
                            onChange={(e) => handleExperienceChange(expIndex, 'periodo', e.target.value)}
                            placeholder="Ex: Jan/2022 - Atualmente"
                            className="w-full px-3 py-2 rounded-lg border border-[#141414]/10 bg-white outline-none focus:border-[#5A5A40]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Principais Atividades</label>
                        {exp.atividades.map((act, actIndex) => (
                          <div key={actIndex} className="flex gap-2">
                            <input 
                              type="text" 
                              value={act}
                              onChange={(e) => handleActivityChange(expIndex, actIndex, e.target.value)}
                              placeholder="Descreva uma tarefa ou conquista..."
                              className="flex-1 px-3 py-2 rounded-lg border border-[#141414]/10 bg-white outline-none focus:border-[#5A5A40]"
                            />
                            {exp.atividades.length > 1 && (
                              <button 
                                onClick={() => {
                                  const newExps = [...data.experiencias];
                                  newExps[expIndex].atividades.splice(actIndex, 1);
                                  setData({...data, experiencias: newExps});
                                }}
                                className="text-[#141414]/20 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddActivity(expIndex)}
                          className="text-xs font-bold text-[#5A5A40] flex items-center gap-1 mt-2"
                        >
                          <Plus size={14} /> Adicionar atividade
                        </button>
                      </div>
                    </div>
                  ))}
                  {data.experiencias.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-[#141414]/10 rounded-2xl">
                      <p className="text-[#141414]/40 text-sm">Nenhuma experiência adicionada. Se não tiver experiência formal, descreva projetos ou trabalhos voluntários.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Education, Languages, Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Courses */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#141414]/5">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="text-[#5A5A40]" size={24} />
                      <h2 className="text-xl font-semibold">Cursos</h2>
                    </div>
                    <button 
                      onClick={() => handleAddItem('cursos')}
                      className="text-[#5A5A40] hover:bg-[#5A5A40]/10 p-2 rounded-full transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {data.cursos.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={item}
                          onChange={(e) => handleItemChange('cursos', idx, e.target.value)}
                          placeholder="Ex: Marketing Digital"
                          className="flex-1 px-4 py-2 rounded-xl border border-[#141414]/10 outline-none focus:border-[#5A5A40]"
                        />
                        <button onClick={() => handleRemoveItem('cursos', idx)} className="text-[#141414]/20 hover:text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Languages */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#141414]/5">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <Languages className="text-[#5A5A40]" size={24} />
                      <h2 className="text-xl font-semibold">Idiomas</h2>
                    </div>
                    <button 
                      onClick={() => handleAddItem('idiomas')}
                      className="text-[#5A5A40] hover:bg-[#5A5A40]/10 p-2 rounded-full transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {data.idiomas.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={item}
                          onChange={(e) => handleItemChange('idiomas', idx, e.target.value)}
                          placeholder="Ex: Inglês (Básico)"
                          className="flex-1 px-4 py-2 rounded-xl border border-[#141414]/10 outline-none focus:border-[#5A5A40]"
                        />
                        <button onClick={() => handleRemoveItem('idiomas', idx)} className="text-[#141414]/20 hover:text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Skills Extra */}
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#141414]/5">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-[#5A5A40]" size={24} />
                    <h2 className="text-xl font-semibold">Habilidades Adicionais</h2>
                  </div>
                  <button 
                    onClick={() => handleAddItem('habilidades_extra')}
                    className="text-[#5A5A40] hover:bg-[#5A5A40]/10 p-2 rounded-full transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.habilidades_extra.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        value={item}
                        onChange={(e) => handleItemChange('habilidades_extra', idx, e.target.value)}
                        placeholder="Ex: Pacote Office"
                        className="flex-1 px-4 py-2 rounded-xl border border-[#141414]/10 outline-none focus:border-[#5A5A40]"
                      />
                      <button onClick={() => handleRemoveItem('habilidades_extra', idx)} className="text-[#141414]/20 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-center pt-10">
                <button 
                  onClick={() => setActiveTab('preview')}
                  className="bg-[#5A5A40] text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-[#5A5A40]/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  Gerar Currículo <FileText size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'preview' && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center print:hidden">
                <h2 className="text-2xl font-bold">Visualização</h2>
                  <div className="flex gap-3">
                    <button 
                      onClick={downloadPDF}
                      disabled={isDownloading}
                      className="bg-[#5A5A40] text-white px-6 py-2 rounded-full font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#5A5A40]/20 disabled:opacity-50"
                    >
                      <Download size={18} /> {isDownloading ? 'Gerando...' : 'Baixar PDF'}
                    </button>
                    <button 
                      onClick={printResume}
                      className="bg-white border border-[#141414]/10 px-6 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#F5F5F0] transition-all"
                    >
                      <FileText size={18} /> Imprimir
                    </button>
                  </div>
              </div>

              {/* Resume Document */}
              <div 
                ref={resumeRef}
                className="bg-white p-12 shadow-2xl border border-[#141414]/5 min-h-[1120px] w-full max-w-[800px] mx-auto text-[#141414] leading-relaxed print:shadow-none print:border-none print:p-0"
              >
                {/* Header */}
                <header className="flex items-center gap-8 border-b-2 border-[#141414] pb-6 mb-8">
                  {data.foto && (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#141414] flex-shrink-0">
                      <img src={data.foto} alt="Foto" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={data.foto ? 'text-left' : 'text-center w-full'}>
                    <h1 className="text-3xl font-bold uppercase tracking-tight mb-2">{formatName(data.nome_completo) || 'SEU NOME COMPLETO'}</h1>
                    <div className={`flex flex-wrap ${data.foto ? 'justify-start' : 'justify-center'} gap-x-4 gap-y-1 text-sm text-[#141414]/80`}>
                      {data.cidade && <span>{data.cidade} – {data.estado_uf}</span>}
                      {data.telefone && <span>{formatPhone(data.telefone)}</span>}
                      {data.email && <span>{data.email}</span>}
                    </div>
                  </div>
                </header>

                {/* Objective */}
                <section className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b border-[#141414]/20 mb-3">Objetivo</h2>
                  <p className="text-sm">{buildObjective(data)}</p>
                </section>

                {/* Summary */}
                <section className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b border-[#141414]/20 mb-3">Resumo Profissional</h2>
                  <p className="text-sm whitespace-pre-wrap">{buildSummary(data)}</p>
                </section>

                {/* Experience */}
                {data.experiencias.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase border-b border-[#141414]/20 mb-4">Experiência Profissional</h2>
                    <div className="space-y-6">
                      {data.experiencias.map((exp, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-sm">{exp.cargo} | {exp.empresa}</h3>
                            <span className="text-xs text-[#141414]/60">{exp.periodo}</span>
                          </div>
                          <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                            {exp.atividades.map((act, j) => act && <li key={j}>{act}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Skills */}
                <section className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b border-[#141414]/20 mb-3">Habilidades e Competências</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {buildSkills(data).map((skill, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <span className="w-1 h-1 bg-[#141414] rounded-full"></span>
                        {skill}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Education & Courses */}
                {(data.cursos.length > 0 || data.idiomas.length > 0) && (
                  <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase border-b border-[#141414]/20 mb-3">Formação e Cursos</h2>
                    <div className="space-y-3">
                      {data.cursos.map((curso, i) => curso && (
                        <div key={i} className="text-sm flex items-center gap-2">
                          <span className="w-1 h-1 bg-[#141414] rounded-full"></span>
                          {curso}
                        </div>
                      ))}
                      {data.idiomas.map((idioma, i) => idioma && (
                        <div key={i} className="text-sm flex items-center gap-2">
                          <span className="w-1 h-1 bg-[#141414] rounded-full"></span>
                          Idioma: {idioma}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'prompt' && (
            <motion.div 
              key="prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-[#141414]/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#5A5A40]/10 rounded-2xl flex items-center justify-center text-[#5A5A40]">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Gerador de Prompt AI</h2>
                    <p className="text-[#141414]/60">Copie o prompt abaixo e cole no ChatGPT para obter uma versão ainda mais polida.</p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(generateChatGPTPrompt(data))}
                      className="bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-[#5A5A40]/20"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copiado!' : 'Copiar Prompt'}
                    </button>
                  </div>
                  <pre className="bg-[#F5F5F0] p-8 pt-16 rounded-3xl text-sm text-[#141414]/80 whitespace-pre-wrap font-mono border border-[#141414]/5 overflow-x-auto">
                    {generateChatGPTPrompt(data)}
                  </pre>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-[#F5F5F0]/50 border border-[#141414]/5">
                    <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-[#5A5A40]">Passo 1</h3>
                    <p className="text-sm text-[#141414]/70">Copie o texto gerado acima clicando no botão de cópia.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#F5F5F0]/50 border border-[#141414]/5">
                    <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-[#5A5A40]">Passo 2</h3>
                    <p className="text-sm text-[#141414]/70">Acesse o ChatGPT ou Claude e cole o prompt na conversa.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#F5F5F0]/50 border border-[#141414]/5">
                    <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-[#5A5A40]">Passo 3</h3>
                    <p className="text-sm text-[#141414]/70">Aguarde a revisão e copie o resultado final para o seu documento.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto p-10 text-center text-[#141414]/30 text-xs font-medium uppercase tracking-[0.2em] print:hidden">
        Gerador de Currículo Otimizado • {new Date().getFullYear()}
      </footer>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          main { padding: 0 !important; max-width: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
