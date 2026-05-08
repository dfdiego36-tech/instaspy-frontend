import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode, Smartphone, ShieldCheck, MonitorSmartphone,
  MessageSquare, MapPin, Wifi, Activity, Lock,
  RefreshCw, Power, Loader2, ChevronRight, Video, Phone, ArrowLeft,
  Send, PhoneIncoming, PhoneOutgoing, PhoneMissed, StopCircle, PlayCircle,
  DownloadCloud, Download, Terminal, Search, X, Navigation, Camera,
  Image as ImageIcon, Film, FileText, Play, ZoomIn, Monitor,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import PairPage from './Pair.jsx';

const PAIR_TOKEN = new URLSearchParams(window.location.search).get('pair');
const WS_BASE    = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3001`;
const STUN       = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ── Mock data ──────────────────────────────────────────────────────────────────

const DEVICE = {
  name: 'iPhone 14 Pro Max',
  battery: 78,
  network: 'Vodafone 5G',
  ip: '188.82.xxx.xx',
  os: 'iOS 17.4.1',
};

const ALL_CHATS = [
  {
    id: 1,
    contact: 'Mateo Silva',
    lastMsg: 'Mañana el reporte tiene que estar listo.',
    time: '14:22',
    unread: 3,
    messages: [
      { text: '¿Viste el informe de ventas?', isSender: false, time: '13:45' },
      { text: 'Sí, lo estoy revisando ahora mismo.', isSender: true, time: '13:50' },
      { text: 'Tiene varios errores en la sección 3.', isSender: false, time: '14:00' },
      { text: 'Ok, ya lo corrijo.', isSender: true, time: '14:10' },
      { text: 'Mañana el reporte tiene que estar listo.', isSender: false, time: '14:22' },
    ],
  },
  {
    id: 2,
    contact: 'Ana Clara',
    lastMsg: 'Ya envié el comprobante.',
    time: '13:05',
    unread: 0,
    messages: [
      { text: 'Hola! ¿Puedes enviarme el comprobante de pago?', isSender: true, time: '12:30' },
      { text: 'Claro, un momento.', isSender: false, time: '12:45' },
      { text: 'Ya envié el comprobante.', isSender: false, time: '13:05' },
    ],
  },
  {
    id: 3,
    contact: 'Mamá',
    lastMsg: '¿Ya comiste? Te espero para la cena.',
    time: 'Ayer',
    unread: 1,
    messages: [
      { text: '¿Cómo estás hijo?', isSender: false, time: 'Ayer 18:00' },
      { text: 'Bien mamá, trabajando.', isSender: true, time: 'Ayer 18:15' },
      { text: '¿Ya comiste? Te espero para la cena.', isSender: false, time: 'Ayer 19:30' },
    ],
  },
  {
    id: 4,
    contact: 'Carlos Dev',
    lastMsg: 'El deploy ya está en producción',
    time: '10:00',
    unread: 0,
    messages: [
      { text: '¿Pudiste resolver el bug del CORS?', isSender: true, time: '09:30' },
      { text: 'Sí! Era un problema de headers.', isSender: false, time: '09:45' },
      { text: 'El deploy ya está en producción', isSender: false, time: '10:00' },
    ],
  },
  {
    id: 5,
    contact: 'Número Desconocido',
    lastMsg: 'Tu paquete ha sido entregado.',
    time: 'Ayer',
    unread: 0,
    messages: [
      { text: 'Tu paquete #MX-98234 ha sido entregado en la dirección registrada.', isSender: false, time: 'Ayer 15:30' },
    ],
  },
];

const ALL_CALLS = [
  { id: 1, name: 'Ana Clara',        type: 'incoming', duration: '5m 23s',  time: 'Hoy, 11:30',  number: '+52 55 9876 5432' },
  { id: 2, name: 'Mateo Silva',      type: 'outgoing', duration: '12m 05s', time: 'Hoy, 09:15',  number: '+52 55 1111 2222' },
  { id: 3, name: '+52 55 1234 5678', type: 'missed',   duration: '--',      time: 'Ayer, 18:45', number: '+52 55 1234 5678' },
  { id: 4, name: 'Mamá',             type: 'incoming', duration: '2m 10s',  time: 'Ayer, 14:20', number: '+52 55 8888 9999' },
  { id: 5, name: 'Carlos Dev',       type: 'outgoing', duration: '8m 45s',  time: 'Ayer, 11:00', number: '+52 55 7777 6666' },
  { id: 6, name: '+52 55 3333 4444', type: 'missed',   duration: '--',      time: 'Ayer, 09:30', number: '+52 55 3333 4444' },
  { id: 7, name: 'Ana Clara',        type: 'outgoing', duration: '3m 12s',  time: 'Lun, 16:00',  number: '+52 55 9876 5432' },
  { id: 8, name: 'Número Privado',   type: 'missed',   duration: '--',      time: 'Lun, 08:15',  number: 'Privado' },
];

const LOCATIONS = [
  { address: 'Av. Paseo de la Reforma 222', city: 'CDMX',           lat: 19.4284, lon: -99.1676, time: 'Ahora' },
  { address: 'Centro Comercial Antara',     city: 'Polanco, CDMX',  lat: 19.4360, lon: -99.1919, time: 'Hace 2h' },
  { address: 'Universidad UNAM',            city: 'Coyoacán, CDMX', lat: 19.3320, lon: -99.1877, time: 'Hace 5h' },
];

const ALL_MEDIA = [
  { id: 1,  type: 'photo', name: 'IMG_4821.JPG',         size: '3.2 MB',   date: 'Hoy, 14:10',  seed: 237 },
  { id: 2,  type: 'photo', name: 'IMG_4820.JPG',         size: '2.8 MB',   date: 'Hoy, 13:45',  seed: 433 },
  { id: 3,  type: 'photo', name: 'IMG_4819.JPG',         size: '4.1 MB',   date: 'Hoy, 11:20',  seed: 119 },
  { id: 4,  type: 'photo', name: 'IMG_4815.JPG',         size: '3.7 MB',   date: 'Ayer, 19:30', seed: 674 },
  { id: 5,  type: 'photo', name: 'IMG_4810.JPG',         size: '2.5 MB',   date: 'Ayer, 18:15', seed: 321 },
  { id: 6,  type: 'photo', name: 'IMG_4808.JPG',         size: '3.9 MB',   date: 'Ayer, 16:00', seed: 892 },
  { id: 7,  type: 'photo', name: 'IMG_4801.JPG',         size: '2.1 MB',   date: 'Ayer, 14:30', seed: 555 },
  { id: 8,  type: 'photo', name: 'IMG_4799.JPG',         size: '3.4 MB',   date: 'Lun, 20:00',  seed: 743 },
  { id: 9,  type: 'photo', name: 'IMG_4795.JPG',         size: '2.9 MB',   date: 'Lun, 17:45',  seed: 188 },
  { id: 10, type: 'photo', name: 'IMG_4790.JPG',         size: '4.3 MB',   date: 'Lun, 12:10',  seed: 412 },
  { id: 11, type: 'video', name: 'VID_4821.MP4',         size: '48.3 MB',  date: 'Hoy, 12:00',  seed: 601, duration: '0:45' },
  { id: 12, type: 'video', name: 'VID_4815.MP4',         size: '124.7 MB', date: 'Ayer, 20:15', seed: 347, duration: '2:13' },
  { id: 13, type: 'video', name: 'VID_4800.MP4',         size: '67.2 MB',  date: 'Lun, 15:30',  seed: 799, duration: '1:08' },
  { id: 14, type: 'doc',   name: 'Contrato_2025.pdf',    size: '1.2 MB',   date: 'Ayer, 10:00', ext: 'PDF',  color: '#ef4444' },
  { id: 15, type: 'doc',   name: 'Informe_Ventas.xlsx',  size: '845 KB',   date: 'Lun, 09:30',  ext: 'XLS',  color: '#22c55e' },
  { id: 16, type: 'doc',   name: 'Presentación.pptx',    size: '5.4 MB',   date: 'Dom, 18:00',  ext: 'PPT',  color: '#f97316' },
  { id: 17, type: 'doc',   name: 'Notas_reunión.docx',   size: '320 KB',   date: 'Dom, 14:30',  ext: 'DOC',  color: '#3b82f6' },
  { id: 18, type: 'doc',   name: 'Recibo_pago.pdf',      size: '220 KB',   date: 'Sáb, 11:00',  ext: 'PDF',  color: '#ef4444' },
];

const AUTO_REPLIES = ['Ok, entendido.', 'De acuerdo', 'Ahora te respondo.', 'Un momento...', 'Claro!', 'Ok'];

const WAPP_BG = { backgroundColor: '#0b141a' };

// ── TabWhatsApp ────────────────────────────────────────────────────────────────

function TabWhatsApp({ onBadgeChange }) {
  const [step, setStep]             = useState(0);
  const [phone, setPhone]           = useState('+52 ');
  const [logs, setLogs]             = useState([]);
  const [chats, setChats]           = useState(ALL_CHATS);
  const [activeChat, setActiveChat] = useState(null);
  const [query, setQuery]           = useState('');
  const [reply, setReply]           = useState('');
  const [localMsgs, setLocalMsgs]   = useState([]);
  const [isTyping, setIsTyping]     = useState(false);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);

  useEffect(() => { onBadgeChange?.('whatsapp', totalUnread); }, [totalUnread]);

  const filtered = chats.filter(c =>
    c.contact.toLowerCase().includes(query.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (step !== 1) return;
    const seq = [
      'Iniciando módulo de intercepción SS7...',
      `Objetivo localizado: ${phone}`,
      'Haciendo bypass a encriptación E2EE...',
      'Extrayendo archivos de backup de la nube...',
      'Descifrando base de datos (msgstore.db)...',
      'Sincronización completada con éxito.',
    ];
    let i = 0;
    setLogs([]);
    const id = setInterval(() => {
      setLogs(prev => [...prev, seq[i]]);
      i++;
      if (i >= seq.length) { clearInterval(id); setTimeout(() => setStep(2), 1000); }
    }, 700);
    return () => clearInterval(id);
  }, [step]);

  const openChat = (chat) => {
    setActiveChat(chat);
    setLocalMsgs([]);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [localMsgs, isTyping]);

  const handleSend = () => {
    if (!reply.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLocalMsgs(prev => [...prev, { text: reply.trim(), isSender: true, time: now }]);
    setReply('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const auto = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLocalMsgs(prev => [...prev, { text: auto, isSender: false, time: t }]);
    }, 2200);
  };

  if (step === 0) return (
    <div className="animate-in fade-in max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-black text-white mb-2 text-center uppercase tracking-tight">Intercepción de WhatsApp</h2>
      <p className="text-gray-400 text-sm text-center mb-8 font-medium">Ingresa el número del dispositivo objetivo para forzar la sincronización.</p>
      <div className="bg-[#111113] p-6 rounded-[2rem] border border-[#8b5cf6]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><MessageSquare size={60} /></div>
        <label className="block text-[10px] font-black text-[#8b5cf6] uppercase tracking-[0.2em] mb-3">Número del Objetivo</label>
        <div className="relative mb-6">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && phone.length > 5 && setStep(1)}
            className="w-full bg-[#050505] border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#8b5cf6] transition-all font-bold text-white"
            placeholder="+52 55 0000 0000"
          />
        </div>
        <button
          onClick={() => phone.length > 5 && setStep(1)}
          className="w-full bg-[#8b5cf6] hover:bg-[#7c4deb] text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer"
        >
          <RefreshCw size={16} /> Iniciar Extracción
        </button>
      </div>
    </div>
  );

  if (step === 1) return (
    <div className="animate-in fade-in max-w-md mx-auto mt-10">
      <h2 className="text-xl font-black text-[#8b5cf6] mb-6 text-center uppercase tracking-widest">Procesando datos...</h2>
      <div className="bg-[#0a0a0c] rounded-2xl p-6 shadow-2xl border border-[#22c55e]/30 font-mono flex flex-col h-80 overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
          <Terminal size={16} className="text-[#22c55e]" />
          <span className="text-gray-400 text-[10px] uppercase tracking-widest">WPP_Protocol_v4.0</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {logs.map((log, i) => (
            <div key={i} className="text-[#22c55e] text-[11px] flex gap-2 animate-in fade-in">
              <span className="opacity-50">&gt;</span>
              <span className="leading-tight">{log}</span>
            </div>
          ))}
          {logs.length < 6 && (
            <div className="text-[#22c55e] text-[11px] animate-pulse flex gap-2">
              <span className="opacity-50">&gt;</span> _
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (activeChat) return (
    <div className="bg-[#0a0a0c] border border-white/10 rounded-[2rem] flex flex-col h-[600px] shadow-2xl overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-white/5 bg-[#1f2c33] flex items-center gap-4 shrink-0">
        <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold shrink-0">
          {activeChat.contact.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm truncate">{activeChat.contact}</h3>
          <p className="text-[10px] font-medium" style={{ color: isTyping ? '#fbbf24' : '#22c55e' }}>
            {isTyping ? 'escribiendo...' : `Sincronizado vía ${phone}`}
          </p>
        </div>
        <div className="flex gap-3 text-gray-400">
          <Video size={18} className="cursor-pointer hover:text-white transition-colors" />
          <Phone size={18} className="cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto no-scrollbar flex flex-col gap-3" style={WAPP_BG}>
        <div className="text-center text-[10px] text-gray-400 font-bold bg-[#1f2c33] w-max mx-auto px-3 py-1 rounded-lg uppercase tracking-widest mb-2">
          Hoy
        </div>
        {activeChat.messages.map((msg, i) => (
          <div key={i} className={`max-w-[80%] ${msg.isSender ? 'self-end' : 'self-start'}`}>
            <div className={`p-3 rounded-2xl shadow-md text-white text-[13px] ${msg.isSender ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#1f2c33] rounded-tl-none'}`}>
              {msg.text}
            </div>
            <span className={`text-[9px] text-gray-500 mt-1 block ${msg.isSender ? 'text-right mr-1' : 'ml-1'}`}>
              {msg.time}{msg.isSender && <span className="text-[#53bdeb]"> ✓✓</span>}
            </span>
          </div>
        ))}
        {localMsgs.map((msg, i) => (
          <div key={`lm-${i}`} className={`max-w-[80%] animate-in fade-in slide-in-from-bottom-4 ${msg.isSender ? 'self-end' : 'self-start'}`}>
            <div className={`p-3 rounded-2xl shadow-md text-white text-[13px] ${msg.isSender ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#1f2c33] rounded-tl-none'}`}>
              {msg.text}
            </div>
            <span className={`text-[9px] text-gray-500 mt-1 block ${msg.isSender ? 'text-right mr-1' : 'ml-1'}`}>
              {msg.time}{msg.isSender && <span className="text-[#53bdeb]"> ✓✓</span>}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="self-start animate-in fade-in">
            <div className="bg-[#1f2c33] p-3 rounded-2xl rounded-tl-none shadow-md flex gap-1 items-center w-14 h-10">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 bg-[#1f2c33] border-t border-white/5 flex items-center gap-3 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-[#2a3942] border border-white/5 rounded-full py-3 px-5 outline-none text-white text-sm placeholder-gray-500 focus:border-[#8b5cf6]/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!reply.trim()}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${reply.trim() ? 'bg-[#00a884] text-white shadow-lg' : 'bg-[#2a3942] text-gray-500'}`}
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          Backup de Mensajes
          {totalUnread > 0 && (
            <span className="bg-[#25d366] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full">{totalUnread}</span>
          )}
        </h2>
        <button
          onClick={() => { setStep(0); setActiveChat(null); }}
          className="flex items-center gap-2 text-[#8b5cf6] text-[10px] uppercase tracking-widest font-black bg-[#8b5cf6]/10 px-4 py-2 rounded-xl hover:bg-[#8b5cf6]/20 cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Nueva Sync
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar conversación..."
          className="w-full bg-[#111113] border border-white/5 rounded-xl py-3 pl-11 pr-10 text-sm text-white outline-none focus:border-[#8b5cf6]/50 transition-colors placeholder-gray-600"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-[2rem] shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-[#0a0a0c] flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-400">
            Sincronizado con: <b className="text-white">{phone}</b>
          </span>
          <span className="text-[10px] text-[#22c55e] font-black flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" /> Activo
          </span>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No se encontraron conversaciones.</div>
          ) : filtered.map(chat => (
            <div key={chat.id} onClick={() => openChat(chat)} className="p-5 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors group">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-[#8b5cf6]/20 group-hover:text-[#8b5cf6] transition-colors shrink-0 font-bold text-sm">
                {chat.contact.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between mb-1">
                  <h4 className={`text-[13px] ${chat.unread ? 'font-black text-white' : 'font-bold text-gray-300'}`}>{chat.contact}</h4>
                  <span className="text-[10px] text-gray-500 font-medium shrink-0 ml-2">{chat.time}</span>
                </div>
                <p className={`text-[12px] truncate ${chat.unread ? 'font-bold text-white' : 'text-gray-500'}`}>{chat.lastMsg}</p>
              </div>
              <div className="flex flex-col items-center gap-2 ml-1">
                {chat.unread > 0 && (
                  <span className="bg-[#25d366] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">{chat.unread}</span>
                )}
                <ChevronRight size={16} className="text-gray-600 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TabCalls ───────────────────────────────────────────────────────────────────

function TabCalls({ onBadgeChange }) {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [filter, setFilter]         = useState('all');
  const [toast, setToast]           = useState(null);

  const missedCount = ALL_CALLS.filter(c => c.type === 'missed').length;

  useEffect(() => { onBadgeChange?.('calls', missedCount); }, []);

  const filtered = filter === 'all' ? ALL_CALLS : ALL_CALLS.filter(c => c.type === filter);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const FILTERS = [
    { id: 'all',      label: 'Todos',     count: ALL_CALLS.length },
    { id: 'incoming', label: 'Entrantes', count: ALL_CALLS.filter(c => c.type === 'incoming').length },
    { id: 'outgoing', label: 'Salientes', count: ALL_CALLS.filter(c => c.type === 'outgoing').length },
    { id: 'missed',   label: 'Perdidas',  count: missedCount },
  ];

  if (syncStatus === 'idle') return (
    <div className="animate-in fade-in flex flex-col items-center justify-center text-center p-8 bg-[#111113] border border-white/5 rounded-[2.5rem] shadow-2xl mt-8">
      <div className="w-20 h-20 bg-[#8b5cf6]/10 rounded-[1.5rem] flex items-center justify-center text-[#8b5cf6] mb-6 border border-[#8b5cf6]/20 shadow-inner">
        <Phone size={36} />
      </div>
      <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Historial de Llamadas</h3>
      <p className="text-gray-400 text-sm max-w-md mb-8">Obtén los registros completos de llamadas recibidas, realizadas y perdidas directamente del terminal objetivo.</p>
      <button
        onClick={() => { setSyncStatus('loading'); setTimeout(() => setSyncStatus('done'), 2200); }}
        className="bg-[#8b5cf6] hover:bg-[#7c4deb] text-white font-black px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 flex items-center gap-2 uppercase text-xs tracking-widest cursor-pointer"
      >
        <RefreshCw size={16} /> Sincronizar Ahora
      </button>
    </div>
  );

  if (syncStatus === 'loading') return (
    <div className="animate-in fade-in flex flex-col items-center justify-center text-center p-8 mt-10">
      <Loader2 size={48} className="text-[#8b5cf6] animate-spin mb-6" />
      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Extrayendo registros...</h3>
      <p className="text-gray-400 text-sm">Accediendo a la operadora y a los registros locales del dispositivo.</p>
    </div>
  );

  return (
    <div className="animate-in fade-in relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#22c55e] text-black font-bold px-5 py-3 rounded-xl shadow-xl text-sm animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          Registro de Llamadas
          {missedCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">{missedCount} perdidas</span>
          )}
        </h2>
        <button
          onClick={() => { setSyncStatus('loading'); setTimeout(() => setSyncStatus('done'), 2200); }}
          className="text-[#8b5cf6] bg-[#8b5cf6]/10 p-2.5 rounded-xl hover:bg-[#8b5cf6]/20 transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              filter === f.id
                ? 'bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                : `bg-[#111113] border border-white/5 hover:bg-white/5 ${f.id === 'missed' && f.count > 0 ? 'text-red-400 border-red-500/20' : 'text-gray-400'}`
            }`}
          >
            {f.label}
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${filter === f.id ? 'bg-white/20 text-white' : 'bg-white/10'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-[2rem] shadow-xl overflow-hidden">
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No hay registros para este filtro.</div>
          ) : filtered.map(call => (
            <div key={call.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  call.type === 'incoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : call.type === 'outgoing' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {call.type === 'incoming' && <PhoneIncoming size={20} />}
                  {call.type === 'outgoing' && <PhoneOutgoing size={20} />}
                  {call.type === 'missed'   && <PhoneMissed   size={20} />}
                </div>
                <div>
                  <h4 className={`text-[14px] font-bold ${call.type === 'missed' ? 'text-[#ff3040]' : 'text-white'}`}>{call.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{call.time} · {call.duration}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 font-mono">{call.number}</p>
                </div>
              </div>
              <button
                onClick={() => showToast(`Llamando a ${call.name}...`)}
                className="text-gray-600 group-hover:text-[#8b5cf6] transition-colors p-2 cursor-pointer hover:bg-[#8b5cf6]/10 rounded-xl"
              >
                <Phone size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TabLocation ────────────────────────────────────────────────────────────────

function TabLocation({ realLocation }) {
  const [locIdx, setLocIdx]           = useState(0);
  const [isUpdating, setIsUpdating]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loc = realLocation
    ? {
        lat:     realLocation.lat,
        lon:     realLocation.lon,
        address: `${realLocation.lat.toFixed(5)}, ${realLocation.lon.toFixed(5)}`,
        city:    `Precisión GPS: ~${Math.round(realLocation.accuracy)} m`,
        time:    'Ahora (real)',
      }
    : LOCATIONS[locIdx];

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${(loc.lon - 0.045).toFixed(4)}%2C${(loc.lat - 0.025).toFixed(4)}%2C${(loc.lon + 0.045).toFixed(4)}%2C${(loc.lat + 0.025).toFixed(4)}&layer=mapnik&marker=${loc.lat}%2C${loc.lon}`;

  const refresh = () => {
    setIsUpdating(true);
    setTimeout(() => { setLocIdx(0); setIsUpdating(false); }, 2800);
  };

  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Rastreo GPS</h2>
        <button
          onClick={refresh}
          disabled={isUpdating}
          className="flex items-center gap-2 bg-[#8b5cf6] text-white px-5 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-black hover:bg-[#7c4deb] transition-colors disabled:opacity-70 cursor-pointer shadow-lg active:scale-95"
        >
          {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {isUpdating ? 'Rastreando...' : 'Actualizar'}
        </button>
      </div>

      <div className="bg-[#111113] border border-white/5 rounded-[2rem] shadow-xl overflow-hidden">
        <div className="h-[360px] w-full relative overflow-hidden bg-[#0a0a0c]">
          {isUpdating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-20">
              <RefreshCw size={40} className="text-[#8b5cf6] animate-spin mb-4" />
              <span className="text-[#8b5cf6] font-black text-xs uppercase tracking-widest bg-black/80 px-4 py-2 rounded-full border border-[#8b5cf6]/30">
                Triangulando satélites...
              </span>
            </div>
          ) : (
            <>
              <iframe
                key={locIdx}
                src={mapSrc}
                title="GPS Location"
                loading="lazy"
                className="w-full h-full border-none"
                style={{ filter: 'invert(1) hue-rotate(195deg) brightness(0.72) contrast(0.88) saturate(0.6)' }}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1c1c1e]/95 px-5 py-3 rounded-2xl shadow-xl border border-white/10 backdrop-blur-sm text-center min-w-[200px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_6px_#22c55e]" />
                  <span className="font-bold text-white text-[13px]">{loc.address}</span>
                </div>
                <div className="text-[10px] text-[#22c55e] font-black uppercase tracking-widest">{loc.time}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{loc.city}</div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 p-5 border-t border-white/5">
          {[
            { label: 'Latitud',   value: `${loc.lat.toFixed(5)}°` },
            { label: 'Longitud',  value: `${loc.lon.toFixed(5)}°` },
            { label: 'Precisión', value: realLocation ? `~${Math.round(realLocation.accuracy)} m` : '~5 m', color: '#22c55e' },
          ].map(item => (
            <div key={item.label} className="bg-[#0a0a0c] p-3 rounded-xl border border-white/5 text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{item.label}</div>
              <div className="text-[12px] font-mono font-bold" style={{ color: item.color || 'white' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          {!realLocation && (
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between p-3 bg-[#0a0a0c] rounded-xl border border-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer mb-3"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest">Historial de Ubicaciones</span>
            <ChevronRight size={16} className={`transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`} />
          </button>
          )}

          {!realLocation && showHistory && (
            <div className="space-y-2 mb-3 animate-in fade-in">
              {LOCATIONS.map((l, i) => (
                <div
                  key={i}
                  onClick={() => setLocIdx(i)}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center gap-3 ${
                    locIdx === i
                      ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-white'
                      : 'bg-[#0a0a0c] border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <MapPin size={14} className={locIdx === i ? 'text-[#8b5cf6] shrink-0' : 'shrink-0'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold truncate">{l.address}</div>
                    <div className="text-[10px] text-gray-500">{l.city}</div>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">{l.time}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 bg-[#0a0a0c] px-4 py-3 rounded-xl border border-[#22c55e]/20">
            <Activity size={18} className="text-[#22c55e] shrink-0" />
            <span className="text-[11px] text-gray-400 leading-relaxed font-medium">
              {realLocation
                ? <>GPS en tiempo real <b className="text-[#22c55e]">activo</b> · Dispositivo enlazado.</>
                : <>Rastreo GPS em segundo plano <b className="text-[#22c55e]">activo</b> · Actualización cada 30 s.</>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TabMedias ─────────────────────────────────────────────────────────────────

function TabMedias() {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [filter, setFilter]         = useState('all');
  const [preview, setPreview]       = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const counts = {
    all:   ALL_MEDIA.length,
    photo: ALL_MEDIA.filter(m => m.type === 'photo').length,
    video: ALL_MEDIA.filter(m => m.type === 'video').length,
    doc:   ALL_MEDIA.filter(m => m.type === 'doc').length,
  };

  const FILTERS = [
    { id: 'all',   label: 'Todos',      count: counts.all },
    { id: 'photo', label: 'Fotos',      count: counts.photo },
    { id: 'video', label: 'Videos',     count: counts.video },
    { id: 'doc',   label: 'Documentos', count: counts.doc },
  ];

  const filtered = filter === 'all' ? ALL_MEDIA : ALL_MEDIA.filter(m => m.type === filter);

  const DOC_ICONS = { PDF: FileText, XLS: FileText, PPT: FileText, DOC: FileText };

  // ── idle ──
  if (syncStatus === 'idle') return (
    <div className="animate-in fade-in flex flex-col items-center justify-center text-center p-8 bg-[#111113] border border-white/5 rounded-[2.5rem] shadow-2xl mt-8">
      <div className="w-20 h-20 bg-[#8b5cf6]/10 rounded-[1.5rem] flex items-center justify-center text-[#8b5cf6] mb-6 border border-[#8b5cf6]/20 shadow-inner">
        <ImageIcon size={36} />
      </div>
      <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Galería de Mídias</h3>
      <p className="text-gray-400 text-sm max-w-md mb-8">
        Extrae fotos, videos y documentos almacenados en el dispositivo objetivo, incluyendo los eliminados recientemente.
      </p>
      <button
        onClick={() => { setSyncStatus('loading'); setTimeout(() => setSyncStatus('done'), 2500); }}
        className="bg-[#8b5cf6] hover:bg-[#7c4deb] text-white font-black px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 flex items-center gap-2 uppercase text-xs tracking-widest cursor-pointer"
      >
        <RefreshCw size={16} /> Extraer Mídias
      </button>
    </div>
  );

  // ── loading ──
  if (syncStatus === 'loading') return (
    <div className="animate-in fade-in flex flex-col items-center justify-center text-center p-8 mt-10">
      <Loader2 size={48} className="text-[#8b5cf6] animate-spin mb-6" />
      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Extrayendo archivos...</h3>
      <p className="text-gray-400 text-sm">Accediendo al almacenamiento interno y respaldo en la nube.</p>
    </div>
  );

  // ── lightbox ──
  if (preview) return (
    <div className="fixed inset-0 z-[9999] bg-black/97 backdrop-blur-md flex flex-col animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div>
          <h4 className="font-bold text-white text-sm">{preview.name}</h4>
          <p className="text-[11px] text-gray-500 mt-0.5">{preview.size} · {preview.date}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast(`Descargando ${preview.name}...`)}
            className="flex items-center gap-2 bg-[#8b5cf6] text-white text-[11px] font-black px-4 py-2 rounded-xl hover:bg-[#7c4deb] transition-colors cursor-pointer uppercase tracking-widest"
          >
            <Download size={14} /> Descargar
          </button>
          <button
            onClick={() => setPreview(null)}
            className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        {preview.type === 'photo' && (
          <img
            src={`https://picsum.photos/seed/${preview.seed}/900/600`}
            alt={preview.name}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95"
          />
        )}
        {preview.type === 'video' && (
          <div className="relative animate-in zoom-in-95">
            <img
              src={`https://picsum.photos/seed/${preview.seed}/900/500`}
              alt={preview.name}
              className="max-w-full max-h-[70vh] object-cover rounded-2xl shadow-2xl border border-white/10 brightness-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 bg-white/10 border-2 border-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play size={32} className="text-white ml-1" fill="white" />
              </div>
              <span className="text-white font-bold text-sm bg-black/60 px-4 py-1.5 rounded-full">{preview.duration}</span>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#22c55e] text-black font-bold px-5 py-3 rounded-xl shadow-xl text-sm animate-in fade-in">
          {toast}
        </div>
      )}
    </div>
  );

  // ── main view ──
  const usedGB = 12.4;
  const totalGB = 64;
  const pct = (usedGB / totalGB) * 100;

  return (
    <div className="animate-in fade-in relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#22c55e] text-black font-bold px-5 py-3 rounded-xl shadow-xl text-sm animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Galería de Mídias</h2>
        <button
          onClick={() => { setSyncStatus('loading'); setTimeout(() => setSyncStatus('done'), 2500); }}
          className="text-[#8b5cf6] bg-[#8b5cf6]/10 p-2.5 rounded-xl hover:bg-[#8b5cf6]/20 transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Storage bar */}
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 mb-5 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Almacenamiento Interno</span>
          <span className="text-[11px] font-bold text-white">{usedGB} GB <span className="text-gray-500">/ {totalGB} GB</span></span>
        </div>
        <div className="h-2 bg-[#1c1c1e] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#22c55e] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-4">
          {[
            { label: 'Fotos',      val: counts.photo, color: '#8b5cf6' },
            { label: 'Videos',     val: counts.video, color: '#22c55e' },
            { label: 'Documentos', val: counts.doc,   color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-gray-500 font-bold">{s.val} {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              filter === f.id
                ? 'bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                : 'bg-[#111113] border border-white/5 text-gray-400 hover:bg-white/5'
            }`}
          >
            {f.label}
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${filter === f.id ? 'bg-white/20 text-white' : 'bg-white/10'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Photos & Videos — grid */}
      {(filter === 'all' || filter === 'photo' || filter === 'video') && (
        <div className="mb-6">
          {filter === 'all' && (
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
              Fotos & Videos ({counts.photo + counts.video})
            </h3>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {filtered.filter(m => m.type === 'photo' || m.type === 'video').map(item => (
              <div
                key={item.id}
                onClick={() => setPreview(item)}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-white/5 hover:border-[#8b5cf6]/50 transition-all hover:scale-[1.03] active:scale-95"
              >
                <img
                  src={`https://picsum.photos/seed/${item.seed}/200/200`}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                  loading="lazy"
                />
                {/* Video badge */}
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
                      <Play size={14} className="text-white ml-0.5" fill="white" />
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {item.duration}
                    </span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#8b5cf6]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={18} className="text-white drop-shadow" />
                </div>
                {/* Download btn */}
                <button
                  onClick={e => { e.stopPropagation(); showToast(`Descargando ${item.name}...`); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#8b5cf6] cursor-pointer"
                >
                  <Download size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents — list */}
      {(filter === 'all' || filter === 'doc') && counts.doc > 0 && (
        <div>
          {filter === 'all' && (
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
              Documentos ({counts.doc})
            </h3>
          )}
          <div className="bg-[#111113] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
            <div className="divide-y divide-white/5">
              {filtered.filter(m => m.type === 'doc').map(doc => (
                <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px] text-white border border-white/10"
                    style={{ backgroundColor: doc.color + '22', borderColor: doc.color + '44', color: doc.color }}
                  >
                    {doc.ext}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-white truncate">{doc.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{doc.size} · {doc.date}</div>
                  </div>
                  <button
                    onClick={() => showToast(`Descargando ${doc.name}...`)}
                    className="text-gray-600 group-hover:text-[#8b5cf6] transition-colors p-2 cursor-pointer hover:bg-[#8b5cf6]/10 rounded-xl shrink-0"
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-16">No hay archivos para este filtro.</div>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  if (PAIR_TOKEN) return <PairPage token={PAIR_TOKEN} />;

  const [step, setStep]             = useState(0);
  const [loadingProgress, setProgress] = useState(0);
  const [activeTab, setActiveTab]   = useState('live');
  const [deferredPrompt, setDeferred] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isStandalone, setStandalone] = useState(false);
  const [badges, setBadges]         = useState({ whatsapp: 4, calls: 3 });
  const [clock, setClock]           = useState('');
  const [battery, setBattery]       = useState(DEVICE.battery);

  // ── Real pairing state ───────────────────────────────────────────────────────
  const [sessionToken, setSessionToken] = useState('');
  const [qrDataUrl, setQrDataUrl]       = useState('');
  const [childConnected, setChildConnected] = useState(false);
  const [childData, setChildData]       = useState({ location: null, device: null, battery: null });
  const [screenStream, setScreenStream] = useState(null);
  const wsRef   = useRef(null);
  const peerRef = useRef(null);

  const handleBadge = (tab, n) => setBadges(prev => ({ ...prev, [tab]: n }));

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBattery(b => Math.max(10, b - 1)), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setStandalone(true);
    } else {
      const t = setTimeout(() => setShowInstall(true), 2000);
      return () => clearTimeout(t);
    }
    const h = (e) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  // ── Generate session token + QR on mount ─────────────────────────────────────
  useEffect(() => {
    const token = crypto.randomUUID();
    setSessionToken(token);
    const pairUrl = `${window.location.origin}${window.location.pathname}?pair=${token}`;
    QRCodeLib.toDataURL(pairUrl, {
      width: 240, margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {});
  }, []);

  // ── WebSocket: connect as parent once token is ready ─────────────────────────
  useEffect(() => {
    if (!sessionToken) return;
    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: 'parent:join', token: sessionToken }));

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'child:connected') {
        setChildConnected(true);
        setStep(1);
      }
      if (msg.type === 'child:disconnected') {
        setChildConnected(false);
        setScreenStream(null);
      }
      if (msg.type === 'child:location')    setChildData(d => ({ ...d, location: msg.data }));
      if (msg.type === 'child:device_info') setChildData(d => ({ ...d, device: msg.data }));
      if (msg.type === 'child:battery') {
        setChildData(d => ({ ...d, battery: msg.data }));
        setBattery(msg.data.level);
      }
      if (msg.type === 'child:screen:stopped') setScreenStream(null);
      if (msg.type === 'webrtc:offer')  handleWebRTCOffer(msg.sdp, ws);
      if (msg.type === 'webrtc:ice' && msg.candidate) {
        peerRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
      }
    };

    ws.onerror = () => {};
    return () => ws.close();
  }, [sessionToken]);

  // ── WebRTC: receive screen stream from child ──────────────────────────────────
  async function handleWebRTCOffer(sdp, ws) {
    const peer = new RTCPeerConnection(STUN);
    peerRef.current = peer;

    peer.ontrack = (e) => setScreenStream(e.streams[0]);
    peer.onicecandidate = (e) => {
      if (e.candidate) ws.send(JSON.stringify({ type: 'webrtc:ice', candidate: e.candidate }));
    };

    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: 'webrtc:answer', sdp: answer }));
  }

  function requestChildScreen() {
    wsRef.current?.send(JSON.stringify({ type: 'parent:request:screen' }));
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setShowInstall(false); setStandalone(true); }
      setDeferred(null);
    } else {
      alert('Para instalar en iPhone (iOS):\n\n1. Toca el ícono de Compartir.\n2. Selecciona "Agregar a Inicio".');
    }
  };

  useEffect(() => {
    if (step !== 1) return;
    const id = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(100, prev + Math.floor(Math.random() * 15) + 5);
        if (next >= 100) { clearInterval(id); setTimeout(() => setStep(2), 500); }
        return next;
      });
    }, 400);
    return () => clearInterval(id);
  }, [step]);

  // ── LiveScreenTab ────────────────────────────────────────────────────────────
  const LiveScreenTab = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recTime, setRecTime]         = useState(0);
    const [recordings, setRecordings]   = useState([]);
    const [flash, setFlash]             = useState(false);
    const [appIdx, setAppIdx]           = useState(0);
    const videoRef = useRef(null);

    const APPS = [
      { name: 'WhatsApp',    icon: '💬', accent: '#25d366' },
      { name: 'Instagram',   icon: '📸', accent: '#e1306c' },
      { name: 'YouTube',     icon: '▶️',  accent: '#ff0000' },
      { name: 'Google Maps', icon: '🗺️', accent: '#4285f4' },
    ];
    const app = APPS[appIdx % APPS.length];

    useEffect(() => {
      const id = setInterval(() => setAppIdx(i => i + 1), 12_000);
      return () => clearInterval(id);
    }, []);

    useEffect(() => {
      if (videoRef.current && screenStream) {
        videoRef.current.srcObject = screenStream;
      }
    }, [screenStream]);

    useEffect(() => {
      if (!isRecording) { setRecTime(0); return; }
      const id = setInterval(() => setRecTime(t => t + 1), 1000);
      return () => clearInterval(id);
    }, [isRecording]);

    const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const stopRec = () => {
      setIsRecording(false);
      if (recTime > 0) {
        const t = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        setRecordings(prev => [{ id: Date.now(), duration: fmt(recTime), size: `${(recTime * 2.4).toFixed(1)} MB`, time: t }, ...prev]);
      }
    };

    return (
      <div className="flex flex-col md:flex-row gap-8 h-full animate-in fade-in slide-in-from-bottom-4">
        {/* Phone frame / real screen */}
        <div className="flex-1 flex justify-center items-start py-4">
          <div className="w-[300px] h-[620px] bg-black rounded-[3rem] p-3 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative border-[4px] border-[#1c1c1e]">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-20" />
            {flash && <div className="absolute inset-3 rounded-[2.2rem] bg-white/60 z-50 pointer-events-none transition-opacity" />}

            {screenStream ? (
              <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative border border-white/5 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-4 bg-[#ff3040] text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,48,64,0.6)] animate-pulse z-30 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" /> En Vivo
                </div>
              </div>
            ) : childConnected ? (
              <div className="w-full h-full bg-[#0b141a] rounded-[2.2rem] overflow-hidden relative border border-white/5 flex flex-col items-center justify-center gap-4">
                <Monitor size={48} className="text-gray-600" />
                <p className="text-gray-500 text-[12px] font-bold uppercase tracking-widest text-center px-6">Pantalla no compartida</p>
                <button
                  onClick={requestChildScreen}
                  className="bg-[#8b5cf6] hover:bg-[#7c4deb] text-white font-black px-5 py-3 rounded-xl text-[11px] uppercase tracking-widest cursor-pointer active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  Solicitar pantalla
                </button>
              </div>
            ) : (
            <div className="w-full h-full bg-[#0b141a] rounded-[2.2rem] overflow-hidden relative border border-white/5 flex flex-col">
              {/* Status bar */}
              <div className="h-12 bg-[#1f2c33] flex justify-between items-center px-5 pt-3 text-white shrink-0">
                <span className="text-[10px] font-bold">{clock || '14:23'}</span>
                <div className="flex items-center gap-2 opacity-80">
                  <Wifi size={12} />
                  <span className="text-[9px] font-bold">{battery}%</span>
                </div>
              </div>

              {/* App header */}
              <div className="bg-[#1f2c33] px-4 pb-3 flex items-center gap-3 border-b border-white/5 shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: app.accent + '30' }}>
                  {app.icon}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{app.name}</div>
                  <div className="text-[10px] text-[#22c55e]">en línea</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden" style={WAPP_BG}>
                <div className="bg-[#1f2c33] p-2.5 rounded-xl rounded-tl-none max-w-[80%] text-xs self-start text-white shadow-md">
                  ¿Ya saliste del trabajo?
                  <span className="text-[9px] text-gray-500 block text-right mt-1">14:15</span>
                </div>
                <div className="bg-[#005c4b] p-2.5 rounded-xl rounded-tr-none max-w-[80%] text-xs self-end text-white shadow-md">
                  Estoy saliendo ahora.
                  <span className="text-[9px] text-gray-400 block text-right mt-1">14:20 <span className="text-[#53bdeb]">✓✓</span></span>
                </div>
                <div className="bg-[#1f2c33] p-2.5 rounded-xl rounded-tl-none max-w-[80%] text-xs self-start text-white shadow-md animate-in fade-in delay-500 fill-mode-both">
                  No te demores, necesito hablar contigo.
                  <span className="text-[9px] text-gray-500 block text-right mt-1">14:23</span>
                </div>
              </div>

              {/* CSS Keyboard */}
              <div className="bg-[#1c1c1e] border-t border-white/5 py-2 px-1 flex flex-col gap-1 items-center shrink-0">
                {[
                  ['q','w','e','r','t','y','u','i','o','p'],
                  ['a','s','d','f','g','h','j','k','l'],
                  ['z','x','c','v','b','n','m'],
                ].map((row, ri) => (
                  <div key={ri} className="flex gap-[3px]">
                    {row.map(k => (
                      <div key={k} className="w-[24px] h-[30px] bg-[#2c2c2e] rounded-md flex items-center justify-center text-white text-[9px] font-medium border border-white/5 select-none">
                        {k}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex gap-[3px] mt-0.5">
                  <div className="w-[55px] h-[30px] bg-[#3a3a3c] rounded-md flex items-center justify-center text-gray-400 text-[9px] border border-white/5">⇪</div>
                  <div className="w-[110px] h-[30px] bg-[#2c2c2e] rounded-md border border-white/5" />
                  <div className="w-[55px] h-[30px] rounded-md flex items-center justify-center text-white text-[9px] font-bold border border-white/5" style={{ backgroundColor: app.accent + 'cc' }}>↵</div>
                </div>
              </div>

              <div className="absolute top-14 left-4 bg-[#ff3040] text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,48,64,0.6)] animate-pulse z-30 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-white rounded-full" /> Demo
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-[#111113] p-6 rounded-[2rem] border border-white/5 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-white uppercase text-sm tracking-tight">Status del Espejo</h3>
              <span className="relative flex w-3 h-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex rounded-full w-3 h-3 bg-[#22c55e]" />
              </span>
            </div>
            <p className="text-[12px] text-gray-400 leading-relaxed mb-5 font-medium">
              {childConnected
                ? <>Dispositivo <span className="font-bold text-white">{childData.device?.userAgent?.match(/\(([^)]+)\)/)?.[1]?.split(';')[0] || 'Enlazado'}</span> conectado.</>
                : <>Visualizando <span className="font-bold text-white">{DEVICE.name}</span> en tiempo real.</>}
              {!childConnected && <> App activa: <span className="font-bold" style={{ color: app.accent }}>{app.name}</span></>}
            </p>
            <div className="bg-[#1c1c1e] rounded-xl p-4 border border-white/5 space-y-2.5">
              {[
                { label: 'Estado',    value: childConnected ? 'Enlazado' : 'Demo', color: childConnected ? '#22c55e' : '#f59e0b' },
                { label: 'Batería',   value: `${battery}%`, color: battery > 30 ? '#22c55e' : '#ff3040' },
                { label: 'Red',       value: childData.device?.connection || DEVICE.network },
                { label: 'Pantalla',  value: screenStream ? 'Activa' : childConnected ? 'Sin compartir' : 'Demo', color: screenStream ? '#22c55e' : '#6b7280' },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">{item.label}:</span>
                  <span className="font-bold" style={{ color: item.color || 'white' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setFlash(true); setTimeout(() => setFlash(false), 350); }}
            className="bg-[#111113] border border-white/5 p-4 rounded-[1.5rem] flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer active:scale-95 group"
          >
            <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center text-[#8b5cf6] group-hover:bg-[#8b5cf6]/20 transition-colors shrink-0">
              <Camera size={20} />
            </div>
            <div className="text-left">
              <div className="font-black text-sm text-white uppercase tracking-tight">Captura de Pantalla</div>
              <div className="text-[10px] text-gray-500 font-medium">Guarda el estado actual del dispositivo</div>
            </div>
          </button>

          <div className={`p-6 rounded-[2rem] border transition-colors shadow-lg ${isRecording ? 'bg-[#3a1216]/40 border-[#ff3040]/30' : 'bg-[#1c1c1e] border-[#8b5cf6]/20'}`}>
            <div className={`flex justify-between items-center mb-3 ${isRecording ? 'text-[#ff3040]' : 'text-[#8b5cf6]'}`}>
              <div className="flex items-center gap-2">
                <Video size={20} />
                <h4 className="font-black text-sm uppercase tracking-tight">Grabar Pantalla</h4>
              </div>
              {isRecording && <span className="text-xs font-mono font-bold animate-pulse text-white">{fmt(recTime)}</span>}
            </div>
            <p className={`text-[11px] mb-5 leading-relaxed font-medium ${isRecording ? 'text-red-200/70' : 'text-gray-400'}`}>
              {isRecording ? 'Grabando silenciosamente. El usuario no es notificado.' : 'Inicia la grabación silenciosa para guardar evidencias en la nube.'}
            </p>
            <button
              onClick={() => isRecording ? stopRec() : setIsRecording(true)}
              className={`w-full font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                isRecording
                  ? 'bg-[#ff3040] hover:bg-[#e02636] text-white shadow-[0_0_20px_rgba(255,48,64,0.4)]'
                  : 'bg-[#8b5cf6] hover:bg-[#7c4deb] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
              }`}
            >
              {isRecording
                ? <><StopCircle size={18} /> Detener Grabación</>
                : <><PlayCircle size={18} /> Iniciar Grabación (REC)</>
              }
            </button>
          </div>

          {recordings.length > 0 && (
            <div className="bg-[#111113] border border-white/5 rounded-[2rem] p-5 shadow-xl animate-in fade-in">
              <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-4">
                Grabaciones Guardadas ({recordings.length})
              </h4>
              <div className="space-y-2">
                {recordings.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between bg-[#0a0a0c] p-3 rounded-xl border border-white/5">
                    <div>
                      <div className="text-[12px] font-bold text-white">REC_{rec.time.replace(':', '')}.mp4</div>
                      <div className="text-[10px] text-gray-500">{rec.duration} · {rec.size}</div>
                    </div>
                    <button
                      onClick={() => alert(`Descargando REC_${rec.time.replace(':', '')}.mp4 (${rec.size})`)}
                      className="text-[#8b5cf6] hover:text-white transition-colors cursor-pointer p-1.5 hover:bg-[#8b5cf6]/10 rounded-lg"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── QR screen ────────────────────────────────────────────────────────────────
  const renderQR = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 bg-[#050505] animate-in fade-in relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex flex-wrap content-start text-[#8b5cf6] text-[10px] font-mono break-all z-0">
        {'01110011 01111001 01101110 01100011 '.repeat(150)}
      </div>

      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-[#0a0a0c] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 z-10">
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 bg-[#111113]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#8b5cf6]/20 rounded-xl flex items-center justify-center text-[#8b5cf6] border border-[#8b5cf6]/30">
              <MonitorSmartphone size={24} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Insta<span className="text-[#8b5cf6]">Spy</span>
            </h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight tracking-tight">
            Conecta el dispositivo hijo de forma segura y en tiempo real.
          </h2>
          <ul className="space-y-6 mb-10">
            {[
              'Asegúrate de que el servidor relay esté corriendo (npm run server).',
              'El dispositivo hijo abre la cámara y escanea el código QR de la derecha.',
              'El hijo acepta la pantalla de consentimiento y el emparejamiento comienza.',
            ].map((text, i) => (
              <li key={i} className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-[#8b5cf6] text-black font-black flex items-center justify-center shrink-0 text-xs mt-0.5">{i + 1}</div>
                <p className="text-gray-400 font-medium text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 text-[#22c55e] bg-[#22c55e]/10 px-5 py-3.5 rounded-2xl border border-[#22c55e]/20 w-max">
            <ShieldCheck size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Conexión 100% Encriptada</span>
          </div>
        </div>

        <div className="flex-1 p-10 flex flex-col items-center justify-center bg-[#050505]">
          <div className="text-center mb-8">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Código QR de Emparejamiento</h3>
            <p className="text-xs text-gray-500 font-bold tracking-widest mt-1 uppercase">
              {childConnected ? '✓ Dispositivo conectado' : 'Esperando escaneo...'}
            </p>
          </div>

          <div className="w-64 h-64 border-4 border-[#111113] bg-white p-3 rounded-3xl flex items-center justify-center relative shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR de emparejamiento" className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-full h-full text-black opacity-90" />
            )}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,1)] z-20 animate-[scan_2.5s_ease-in-out_infinite]" />
            <style>{`@keyframes scan { 0%,100%{transform:translateY(0)} 50%{transform:translateY(240px)} }`}</style>
          </div>

          <button
            onClick={() => setStep(1)}
            className="mt-8 text-[#8b5cf6] font-bold text-xs uppercase tracking-widest hover:text-white transition-colors border border-[#8b5cf6]/30 px-6 py-3 rounded-xl bg-[#8b5cf6]/10 cursor-pointer"
          >
            Modo Demo (sin dispositivo)
          </button>
        </div>
      </div>
    </div>
  );

  // ── Connecting screen ────────────────────────────────────────────────────────
  const renderConnecting = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050505] animate-in zoom-in-95 text-white">
      <div className="w-32 h-32 rounded-full border-4 border-[#8b5cf6]/20 border-t-[#8b5cf6] animate-spin mb-10 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
          <Wifi className="text-[#8b5cf6] animate-pulse" size={32} />
        </div>
      </div>
      <h2 className="text-3xl font-black mb-3 tracking-tight uppercase">Bypassing Protocolos...</h2>
      <p className="text-gray-400 mb-10 font-medium text-sm">Extrayendo logs de seguridad en segundo plano.</p>

      <div className="w-full max-w-md bg-[#111113] rounded-full h-2 mb-4 overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#22c55e] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(loadingProgress, 100)}%` }}
        />
      </div>
      <div className="flex justify-between w-full max-w-md text-[10px] font-black uppercase tracking-widest text-gray-500 mb-12">
        <span>Handshake P2P</span>
        <span className="text-[#8b5cf6]">{Math.min(loadingProgress, 100)}%</span>
      </div>

      <div className="w-full max-w-md bg-[#0a0a0c] rounded-2xl p-5 border border-[#22c55e]/20 font-mono text-[10px] text-[#22c55e] flex flex-col gap-2 h-40 overflow-hidden justify-end shadow-inner">
        {loadingProgress > 10  && <p className="animate-in fade-in opacity-70">&gt; Dispositivo {DEVICE.name} localizado.</p>}
        {loadingProgress > 30  && <p className="animate-in fade-in opacity-70">&gt; Rompiendo cifrado E2EE local...</p>}
        {loadingProgress > 60  && <p className="animate-in fade-in opacity-70">&gt; Espejo de pantalla autorizado en el host.</p>}
        {loadingProgress > 85  && <p className="animate-in fade-in opacity-70">&gt; Transfiriendo paquetes multimedia y GPS...</p>}
        {loadingProgress >= 100 && <p className="animate-in fade-in text-white font-bold">&gt; Sincronización 100% completada. Iniciando panel.</p>}
      </div>
    </div>
  );

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'live',     label: 'Pantalla en Vivo',  icon: <Activity   size={20} /> },
    { id: 'whatsapp', label: 'WPP-Pro',            icon: <MessageSquare size={20} /> },
    { id: 'location', label: 'Rastreo GPS',        icon: <MapPin     size={20} /> },
    { id: 'calls',    label: 'Registro Llamadas',  icon: <Phone      size={20} /> },
    { id: 'media',    label: 'Mídias',             icon: <ImageIcon  size={20} /> },
  ];

  const renderDashboard = () => (
    <div className="flex-1 flex flex-col bg-[#050505] h-screen overflow-hidden text-white">
      <header className="bg-[#0a0a0c] border-b border-white/5 px-6 py-4 flex justify-between items-center z-10 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-xl flex items-center justify-center text-[#8b5cf6]">
            <MonitorSmartphone size={20} strokeWidth={2.5} />
          </div>
          <span className="font-black text-xl text-white tracking-tight uppercase hidden sm:block">
            Insta<span className="text-[#8b5cf6]">Spy</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[13px] font-bold text-white">
              {childData.device ? childData.device.userAgent?.match(/\(([^)]+)\)/)?.[1]?.split(';')[0] || 'Dispositivo Hijo' : DEVICE.name}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 justify-end mt-0.5 ${childConnected ? 'text-[#22c55e]' : 'text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${childConnected ? 'bg-[#22c55e] animate-pulse shadow-[0_0_5px_#22c55e]' : 'bg-gray-600'}`} />
              {childConnected ? `Enlazado · ${childData.device?.connection || DEVICE.network}` : 'Sin dispositivo · Demo'}
            </span>
          </div>
          <button
            onClick={() => { setStep(0); setProgress(0); }}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff3040]/10 flex items-center justify-center text-gray-400 hover:text-[#ff3040] transition-colors border border-white/10 cursor-pointer"
            title="Desconectar"
          >
            <Power size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-20 md:w-64 bg-[#0a0a0c] border-r border-white/5 flex flex-col py-6 z-10 shrink-0 shadow-xl">
          <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-6 mb-5 hidden md:block">
            Módulos OSINT
          </div>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-4 px-4 md:px-6 py-4 transition-colors border-l-4 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-[#8b5cf6]/10 border-[#8b5cf6] text-[#8b5cf6]'
                  : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span className={`font-bold text-sm hidden md:block uppercase tracking-tight ${activeTab === item.id ? 'text-white' : ''}`}>
                {item.label}
              </span>
              {badges[item.id] > 0 && (
                <span className={`absolute right-3 top-3 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                  item.id === 'calls' ? 'bg-red-500 text-white' : 'bg-[#25d366] text-black'
                }`}>
                  {badges[item.id]}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto px-6">
            <div className="bg-[#22c55e]/10 rounded-2xl p-4 border border-[#22c55e]/20 hidden md:block shadow-inner">
              <div className="flex items-center gap-2 text-[#22c55e] mb-2">
                <Lock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Modo Fantasma</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                Auditoría activa e invisible en el dispositivo objetivo.
              </p>
            </div>
          </div>
        </nav>

        <main className="flex-1 bg-[#050505] p-4 md:p-8 overflow-y-auto relative">
          <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.02] flex flex-wrap content-start text-[#8b5cf6] text-[10px] font-mono break-all z-0">
            {'01110011 01111001 01101110 01100011 '.repeat(150)}
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            {activeTab === 'live'     && <LiveScreenTab />}
            {activeTab === 'whatsapp' && <TabWhatsApp onBadgeChange={handleBadge} />}
            {activeTab === 'location' && <TabLocation realLocation={childData.location} />}
            {activeTab === 'calls'    && <TabCalls onBadgeChange={handleBadge} />}
            {activeTab === 'media'    && <TabMedias />}
          </div>
        </main>
      </div>

      {showInstall && !isStandalone && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-[#111113] border border-[#8b5cf6]/40 p-8 rounded-[2.5rem] shadow-[0_0_80px_rgba(139,92,246,0.15)] max-w-sm w-full text-center relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ShieldCheck size={100} /></div>
            <div className="w-20 h-20 bg-[#8b5cf6]/10 rounded-[1.5rem] flex items-center justify-center text-[#8b5cf6] mx-auto mb-6 border border-[#8b5cf6]/30 shadow-inner">
              <DownloadCloud size={36} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Instalar App Pro</h3>
            <p className="text-gray-400 text-[12px] font-medium mb-8 leading-relaxed">
              Instala el sistema directamente en tu celular para garantizar el cifrado E2EE y evitar rastreos de conexión.
            </p>
            <button
              onClick={handleInstall}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c4deb] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm uppercase shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              Instalar InstaSpy <Download size={18} />
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="mt-6 text-[10px] text-gray-500 uppercase tracking-widest font-bold hover:text-white transition-colors cursor-pointer"
            >
              Continuar en el navegador
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="font-sans min-h-screen bg-[#050505] flex flex-col overflow-hidden text-left selection:bg-[#8b5cf6] selection:text-white">
      {step === 0 && renderQR()}
      {step === 1 && renderConnecting()}
      {step === 2 && renderDashboard()}
    </div>
  );
}
