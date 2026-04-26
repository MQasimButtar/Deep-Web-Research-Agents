import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart as ReLineChart, Line, 
  PieChart as RePieChart, Pie, Cell,
  Legend
} from 'recharts';
import { 
  Search, 
  Loader2, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  History, 
  Globe,
  ArrowRight,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981'];

// Enhanced Chart Renderer with Error Boundaries and Print Support
const ChartRenderer = ({ value, isPrint = false }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      let cleanValue = value.trim();
      const jsonMatch = cleanValue.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanValue = jsonMatch[0];

      const parsed = JSON.parse(cleanValue);
      if (parsed.type && parsed.data) {
        setData(parsed);
      } else {
        throw new Error("Missing type or data fields");
      }
    } catch (e) {
      setError(e.message);
    }
  }, [value]);

  if (error || !data) return null;

  const { type, title, data: chartData } = data;

  const renderChart = (isPrintMode = false, w, h) => {
    const isPie = type === 'pie';
    const ChartComponent = type === 'bar' ? ReBarChart : type === 'line' ? ReLineChart : RePieChart;
    
    // Safety check for dimensions if provided
    if (w !== undefined && w <= 0) return null;
    if (h !== undefined && h <= 0) return null;

    // Use provided dimensions (from ResponsiveContainer) or fixed ones (for print)
    const props = {};
    if (w) props.width = w;
    if (h) props.height = h;
    if (isPrintMode) {
      props.width = 650;
      props.height = 350;
    }

    // Don't render if we have no width/height yet and not in print
    if (!isPrintMode && !w) return null;

    return (
      <ChartComponent data={chartData} {...props} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8}/>
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        {!isPie && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />}
        {!isPie && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={10} />}
        {!isPie && <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />}
        <Tooltip 
          contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }}
          cursor={{ fill: '#f1f5f9', radius: 8 }}
        />
        {type === 'bar' && <Bar dataKey="value" fill="url(#barGradient)" radius={[10, 10, 0, 0]} animationDuration={2000} />}
        {type === 'line' && <Line type="monotone" dataKey="value" stroke="url(#lineGradient)" strokeWidth={5} dot={{ r: 8, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} animationDuration={2000} />}
        {isPie && (
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" animationDuration={1500} stroke="none">
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />)}
          </Pie>
        )}
        {isPie && <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }} />}
      </ChartComponent>
    );
  };

  if (isPrint) {
    return (
      <div className="my-10 p-8 border-2 border-slate-100 rounded-3xl page-break-inside-avoid bg-white">
        <h4 className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{title || 'Data Visualization'}</h4>
        <div className="flex justify-center overflow-hidden">
          {renderChart(true)}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-12 p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-50/50 overflow-hidden relative group"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><BarChart3 className="w-4 h-4" /></div>
        <h4 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{title || 'Data Analysis'}</h4>
      </div>
      <div className="w-full h-[350px] min-h-[350px] relative">
        <ResponsiveContainer width="100%" height="100%">
          {/* Recharts expects direct children or a functional child in some versions, but 3.x works best with this: */}
          <ChartComponentWrapper type={type} chartData={chartData} isPrint={isPrint} title={title} />
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

// Recharts ResponsiveContainer works by cloning its children and passing width/height.
// We must ensure the component correctly receives these injected props.
const ChartComponentWrapper = ({ width, height, type, chartData, isPrint, title }) => {
  const isPie = type === 'pie';
  const ChartComponent = type === 'bar' ? ReBarChart : type === 'line' ? ReLineChart : RePieChart;
  
  // ResponsiveContainer sometimes passes 0 or -1 initially
  if (!width || width <= 0 || !height || height <= 0) return <div style={{width: '100%', height: '100%'}} />;

  return (
    <ChartComponent data={chartData} width={width} height={height} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
          <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8}/>
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {!isPie && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />}
      {!isPie && <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={10} />}
      {!isPie && <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />}
      <Tooltip 
        contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }}
        cursor={{ fill: '#f1f5f9', radius: 8 }}
      />
      {type === 'bar' && <Bar dataKey="value" fill="url(#barGradient)" radius={[10, 10, 0, 0]} animationDuration={2000} />}
      {type === 'line' && <Line type="monotone" dataKey="value" stroke="url(#lineGradient)" strokeWidth={5} dot={{ r: 8, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} animationDuration={2000} />}
      {isPie && (
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" animationDuration={1500} stroke="none">
          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />)}
        </Pie>
      )}
      {isPie && <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }} />}
    </ChartComponent>
  );
};

function App() {
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState('Medium');
  const [includeCharts, setIncludeCharts] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(() => {
    const saved = localStorage.getItem('last_research_report');
    return saved ? JSON.parse(saved) : null;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('research_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); 

  useEffect(() => {
    if (report) localStorage.setItem('last_research_report', JSON.stringify(report));
  }, [report]);

  useEffect(() => {
    localStorage.setItem('research_history', JSON.stringify(history));
  }, [history]);

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setCurrentStep(1);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 5000);

    try {
      const res = await axios.post(`${API_BASE}/research`, { topic, length, includeCharts });
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      const newReport = { ...res.data, timestamp: new Date().toISOString() };
      setReport(newReport);
      setHistory(prev => {
        const filtered = prev.filter(item => item.topic !== newReport.topic);
        return [newReport, ...filtered].slice(0, 10);
      });
      setCurrentStep(5);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'An unexpected error occurred during intelligence synthesis.';
      setError(msg);
      setCurrentStep(0);
    } finally {
      setLoading(false);
      clearInterval(stepInterval);
    }
  };

  const loadFromHistory = (item) => {
    setReport(item);
    setTopic(item.topic);
    setLength(item.length || 'Medium');
    setIncludeCharts(item.charts_enabled || false);
    setIsHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    if (window.confirm('Wipe research history?')) {
      setHistory([]);
      localStorage.removeItem('research_history');
    }
  };

  const handlePrint = () => window.print();

  const clearReport = () => {
    setReport(null);
    localStorage.removeItem('last_research_report');
    setTopic('');
  };

  const markdownComponents = {
    a: ({node, ...props}) => (
      <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-bold underline decoration-indigo-200 underline-offset-4 cursor-pointer relative z-10" onClick={(e) => e.stopPropagation()} />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const content = String(children).trim();
      const isChartJson = content.startsWith('{') && content.includes('"type"') && content.includes('"data"');
      
      if (!inline && (className?.includes('language-chart') || isChartJson)) {
        return <ChartRenderer value={content} />;
      }
      return <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-indigo-600" {...props}>{children}</code>;
    },
    li: ({node, ...props}) => (
      <li className="text-lg text-slate-600 mb-2 list-disc ml-6">
        <span>{props.children}</span>
      </li>
    ),
    h1: ({node, ...props}) => <h1 className="text-4xl font-black text-slate-900 mt-16 mb-8 leading-tight border-b-4 border-indigo-50 pb-4" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-2xl font-black text-slate-800 mt-16 mb-6 border-l-4 border-indigo-500 pl-4 py-1" {...props} />,
    p: ({node, children, ...props}) => {
      // Check if children contain a chart to avoid <p><div> nesting errors
      const isChart = React.Children.toArray(children).some(child => {
        return child && child.props && child.props.value && child.props.value.includes('"type"');
      });

      if (isChart) return <div className="mb-8">{children}</div>;
      return <p className="text-slate-600 leading-relaxed mb-8 text-lg font-medium">{children}</p>;
    },
  };

  // Dedicated Print Components
  const printMarkdownComponents = {
    ...markdownComponents,
    li: ({node, ...props}) => (
      <li className="text-lg text-slate-600 mb-2 list-disc ml-6">
        <span>{props.children}</span>
      </li>
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const content = String(children).trim();
      const isChartJson = content.startsWith('{') && content.includes('"type"') && content.includes('"data"');
      if (!inline && (className?.includes('language-chart') || isChartJson)) {
        return <ChartRenderer value={content} isPrint={true} />;
      }
      return <code className="bg-slate-50 border border-slate-100 px-1 rounded font-mono text-xs" {...props}>{children}</code>;
    },
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      <AnimatePresence>
        {report && !loading && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handlePrint}
            className="fixed bottom-10 right-10 z-[100] w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors group print:hidden"
          >
            <Download className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Screen View */}
      <div className="print:hidden relative overflow-x-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-200 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-purple-200 blur-[120px]" />
        </div>

        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="max-w-[95%] mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
              <motion.div whileHover={{ rotate: 180 }} className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"><Sparkles className="text-white w-6 h-6" /></motion.div>
              <span className="text-xl font-black tracking-tight text-slate-900 uppercase whitespace-nowrap">INSIGHT<span className="text-indigo-600">AGENT</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 hidden sm:block">Unlimited Access</span>
              {report && <button onClick={clearReport} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>}
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-[95%] mx-auto px-4 pt-8 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12">
            <div className="lg:col-span-8 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {!report && !loading && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 text-center lg:text-left">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-2 leading-tight">Deep Web Research <br className="hidden lg:block"/> <span className="text-indigo-600 font-black">Automated.</span></h2>
                    <p className="text-lg text-slate-500 font-medium tracking-tight">Intelligence gathering with real-time charts.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div layout className={`bg-white p-2 rounded-3xl shadow-xl border border-slate-200 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <form onSubmit={handleResearch} className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter research topic..." className="w-full pl-16 pr-6 py-5 text-xl font-bold bg-transparent focus:outline-none placeholder:text-slate-200" disabled={loading} />
                  </div>
                  <div className="flex items-center gap-2 p-1">
                    <div className="flex bg-slate-100 rounded-2xl p-1 shrink-0">
                      {['Short', 'Medium', 'Long'].map((l) => (
                        <button key={l} type="button" onClick={() => setLength(l)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${length === l ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
                      ))}
                    </div>
                    
                    <div className="relative group shrink-0">
                      <button 
                        type="button" 
                        onClick={() => setIncludeCharts(!includeCharts)} 
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${includeCharts ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{includeCharts ? 'Charts On' : 'Charts'}</span>
                        {includeCharts ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl">
                        Must enable BEFORE generate
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all whitespace-nowrap ${loading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                      <span>{loading ? 'Researching' : 'Generate'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>

              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-6 mt-6 justify-center lg:justify-start">
                    {[{ label: 'PLANNER', step: 1 }, { label: 'GATHERER', step: 2 }, { label: 'SYNTHESIZER', step: 3 }].map((phase, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${currentStep === phase.step ? 'bg-indigo-600 animate-ping' : currentStep > phase.step ? 'bg-green-500' : 'bg-slate-200'}`} />
                        <span className={`text-[10px] font-black tracking-widest ${currentStep >= phase.step ? 'text-indigo-600' : 'text-slate-300'}`}>{phase.label}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RESEARCH VAULT */}
            <div className="lg:col-span-4 flex flex-col relative">
              <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`flex items-center justify-between w-full h-full p-6 bg-white rounded-3xl shadow-sm border border-slate-200 transition-all group ${isHistoryOpen ? 'ring-4 ring-indigo-50 border-indigo-200' : 'hover:border-slate-300'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isHistoryOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}><History className="w-6 h-6" /></div>
                  <div className="text-left"><h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Research Vault</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{history.length} Saved Reports</p></div>
                </div>
                {isHistoryOpen ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
              </button>

              <AnimatePresence>
                {isHistoryOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 right-0 z-[60] mt-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[400px]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Insights</span>{history.length > 0 && <button onClick={clearHistory} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}</div>
                    <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar overflow-x-hidden">
                      {history.length === 0 ? <div className="py-12 flex items-center justify-center text-slate-300 italic text-[10px]">Vault is empty</div> : history.map((item, i) => (
                        <button key={i} onClick={() => loadFromHistory(item)} className={`w-full text-left p-4 rounded-2xl transition-all border ${report?.topic === item.topic ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 group'}`}>
                          <p className={`text-sm font-bold truncate ${report?.topic === item.topic ? 'text-indigo-600' : 'text-slate-600'}`}>{item.topic}</p>
                          <div className="flex justify-between mt-1 items-center"><span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.length} • {new Date(item.timestamp).toLocaleDateString()}</span>{report?.topic === item.topic && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {error && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 mb-12"><AlertCircle className="text-red-500 w-6 h-6 flex-shrink-0" /><p className="text-red-800 font-bold">{error}</p></motion.div>}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm animate-pulse space-y-8">
                  <div className="h-16 bg-slate-100 rounded-2xl w-1/2" /><div className="h-4 bg-slate-100 rounded w-full" /><div className="h-96 bg-slate-50 rounded-[2rem]" />
                </div>
              </motion.div>
            ) : report ? (
              <motion.article key="report" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }} className="w-full">
                <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden">
                  <div className="px-8 py-12 md:px-20 md:py-24 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="px-5 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">{report.length} Report</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Analysis concluded {new Date(report.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight break-words hyphens-auto">{report.topic}</h1>
                    <div className="mt-8 flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                      <Clock className="w-4 h-4" />
                      <span>{Math.round(report.markdown_content.length / 5)} words approximated</span>
                    </div>
                  </div>
                  <div className="px-8 py-12 md:px-24 md:py-24 markdown-content max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkBreaks]} 
                      components={markdownComponents}
                    >
                      {report.markdown_content}
                    </ReactMarkdown>
                  </div>
                  <div className="bg-slate-50 p-12 md:px-24 flex justify-center border-t border-slate-100"><div className="flex items-center gap-6"><div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200"><Sparkles className="text-white w-8 h-8" /></div><div className="text-left"><p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px]">InsightAgent Intelligence</p><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Multi-Agent Verification Engine</p></div></div></div>
                </div>
              </motion.article>
            ) : null}
          </AnimatePresence>
        </main>
        <footer className="py-20 text-center opacity-40"><p className="text-[10px] font-black uppercase tracking-[0.5em]">© 2026 Distributed Autonomous Pipeline • V2.2.0</p></footer>
      </div>

      <div className="hidden print:block p-12 bg-white">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"><Sparkles className="text-white w-6 h-6" /></div>
          <span className="text-lg font-black tracking-tight text-slate-900 uppercase">INSIGHT<span className="text-indigo-600">AGENT</span></span>
        </div>
        <h1 className="text-5xl font-black border-b-8 border-indigo-600 pb-8 mb-8">{report?.topic}</h1>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={printMarkdownComponents}>{report?.markdown_content}</ReactMarkdown>
        </div>
        <div className="mt-20 pt-10 border-t border-slate-100 text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
          Generated by InsightAgent Autonomous Pipeline
        </div>
      </div>
    </div>
  );
}

export default App;
