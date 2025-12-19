
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import QuickLinks from './components/QuickLinks';
import ChatBubble from './components/ChatBubble';
import IncidentForm from './components/IncidentForm';
import AdminAnalysisModal from './components/AdminAnalysisModal';
import { Message, Attachment, ConversationAnalysis } from './types';
import { sendMessageToGemini, analyzeConversationHistory } from './services/gemini';
import { Send, Loader2, Paperclip, X, FileText, Globe } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'model',
      text: "Ayubowan! I'm now connected to the SLT-MOBITEL live knowledge base. \n\nYou can ask me questions about our services, or **upload a PDF/Bill** using the clip icon for me to analyze.",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<ConversationAnalysis | null>(null);
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedFile({
        name: file.name,
        mimeType: file.type,
        data: base64
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (text: string) => {
    if ((!text.trim() && !selectedFile) || isLoading) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text: text || (selectedFile ? `Analyze this document: ${selectedFile.name}` : ""),
      timestamp: new Date(),
      attachment: selectedFile || undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentFile = selectedFile;
    setSelectedFile(null);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(messages, userMsg.text, currentFile || undefined);
      
      const botMsg: Message = {
        id: generateId(),
        role: 'model',
        text: response.text,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: generateId(),
        role: 'model',
        text: `**Knowledge Base Error**: ${error?.message || "Could not retrieve info."}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (id: string, type: 'positive' | 'negative') => {
    setMessages((prev) => 
      prev.map((msg) => 
        msg.id === id ? { ...msg, feedback: type } : msg
      )
    );
    console.log(`Feedback for ${id}: ${type}`);
  };

  const handleAdminAnalysis = async () => {
    setIsAdminModalOpen(true);
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeConversationHistory(messages);
      setAnalysisData(analysis);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header 
        onReportClick={() => setIsReportModalOpen(true)} 
        onAdminClick={handleAdminAnalysis}
      />

      {/* Main message area - No longer has massive pb-64 since the footer is not fixed */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-full flex flex-col justify-end">
            {messages.map((msg) => (
                <ChatBubble 
                  key={msg.id} 
                  message={msg} 
                  onFeedback={handleFeedback} 
                />
            ))}
            
            {isLoading && (
              <div className="flex w-full mb-6 justify-start">
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                     <Loader2 size={16} className="animate-spin text-slate-500" />
                   </div>
                   <div className="px-5 py-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-slt-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slt-blue rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slt-blue rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Bottom panel - Now part of the flex flow, not fixed */}
      <div className="bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto space-y-3">
          
          <div className="flex items-center justify-between px-2">
            <QuickLinks onActionClick={handleSendMessage} disabled={isLoading} />
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <Globe size={12} /> LIVE GROUNDING ACTIVE
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-slt-blue/5 border border-slt-blue/20 rounded-xl animate-in slide-in-from-bottom-2">
              <div className="bg-slt-blue text-white p-2 rounded-lg">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Ready to analyze</p>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
              title="Upload Knowledge Source (PDF/Image)"
            >
              <Paperclip size={20} />
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="application/pdf,image/*" 
              onChange={handleFileChange}
            />
            
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder={selectedFile ? "Ask a question about this file..." : "Ask the knowledge base..."}
              disabled={isLoading}
              className="flex-1 bg-slate-100 border border-slate-200 focus:border-slt-blue focus:bg-white focus:ring-4 focus:ring-slt-blue/10 rounded-2xl px-5 py-4 outline-none shadow-inner transition-all"
            />
            
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={(!inputText.trim() && !selectedFile) || isLoading}
              className={`p-3.5 rounded-2xl transition-all ${(!inputText.trim() && !selectedFile) || isLoading ? 'bg-slate-100 text-slate-400' : 'bg-slt-blue text-white hover:bg-blue-700 shadow-md active:scale-95'}`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <IncidentForm isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      <AdminAnalysisModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
        analysis={analysisData}
        isLoading={isAnalyzing}
      />
    </div>
  );
}

export default App;
