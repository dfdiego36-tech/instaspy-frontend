/**
 * Pair.jsx — página do dispositivo filho
 * Renderizada quando a URL contém ?pair=TOKEN
 *
 * Fluxo:
 *  1. Filho escaneia QR → abre esta página
 *  2. Tela de consentimento clara (lista o que será compartilhado)
 *  3. Ao aceitar → conecta WebSocket, inicia GPS, oferece tela
 *  4. Botão "Parar" encerra tudo
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, MapPin, Monitor, Smartphone, Check, X,
  Loader2, WifiOff, Activity, StopCircle,
} from 'lucide-react';

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3001`;
const STUN   = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function PairPage({ token }) {
  const [status, setStatus]         = useState('consent');  // consent|connecting|connected|stopped|error
  const [sharing, setSharing]       = useState({ location: false, screen: false });
  const [screenRequest, setScreenRequest] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  const wsRef      = useRef(null);
  const peerRef    = useRef(null);
  const streamRef  = useRef(null);
  const watchRef   = useRef(null);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopAll(), []);

  // ── Handle incoming WS messages from parent ───────────────────────────────
  function onMessage(event) {
    const msg = JSON.parse(event.data);

    if (msg.type === 'parent:request:screen')  setScreenRequest(true);
    if (msg.type === 'parent:disconnected')    setStatus('parent_gone');

    // WebRTC signaling (answer + ICE from parent)
    if (msg.type === 'webrtc:answer') {
      peerRef.current?.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
    if (msg.type === 'webrtc:ice' && msg.candidate) {
      peerRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
    }
  }

  // ── Accept consent → connect ──────────────────────────────────────────────
  function accept() {
    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'child:join', token }));
      setStatus('connected');
      sendDeviceInfo(ws);
      startLocation(ws);
    };
    ws.onmessage = onMessage;
    ws.onerror   = () => { setStatus('error'); setErrorMsg('No se pudo conectar al servidor.'); };
    ws.onclose   = () => { if (status === 'connected') setStatus('stopped'); };
  }

  // ── Device info + battery ─────────────────────────────────────────────────
  function sendDeviceInfo(ws) {
    const info = {
      type: 'child:device_info',
      data: {
        userAgent:  navigator.userAgent,
        platform:   navigator.platform,
        language:   navigator.language,
        online:     navigator.onLine,
        connection: navigator.connection?.effectiveType || 'desconocida',
      },
    };
    ws.send(JSON.stringify(info));

    if ('getBattery' in navigator) {
      navigator.getBattery().then(bat => {
        ws.send(JSON.stringify({
          type: 'child:battery',
          data: { level: Math.round(bat.level * 100), charging: bat.charging },
        }));
        bat.onlevelchange  = () => ws.send(JSON.stringify({ type: 'child:battery', data: { level: Math.round(bat.level * 100), charging: bat.charging } }));
        bat.onchargingchange = () => ws.send(JSON.stringify({ type: 'child:battery', data: { level: Math.round(bat.level * 100), charging: bat.charging } }));
      });
    }
  }

  // ── GPS location ──────────────────────────────────────────────────────────
  function startLocation(ws) {
    if (!navigator.geolocation) return;
    setSharing(s => ({ ...s, location: true }));

    const send = pos => ws.send(JSON.stringify({
      type: 'child:location',
      data: {
        lat:       pos.coords.latitude,
        lon:       pos.coords.longitude,
        accuracy:  pos.coords.accuracy,
        timestamp: pos.timestamp,
      },
    }));

    navigator.geolocation.getCurrentPosition(send, null, { enableHighAccuracy: true });
    watchRef.current = navigator.geolocation.watchPosition(send, null, {
      enableHighAccuracy: true,
      maximumAge: 15000,
    });
  }

  // ── Screen share (WebRTC) ─────────────────────────────────────────────────
  async function startScreen() {
    setScreenRequest(false);
    const ws = wsRef.current;
    if (!ws) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
      streamRef.current = stream;
      setSharing(s => ({ ...s, screen: true }));

      const peer = new RTCPeerConnection(STUN);
      peerRef.current = peer;
      stream.getTracks().forEach(t => peer.addTrack(t, stream));

      peer.onicecandidate = e => {
        if (e.candidate) ws.send(JSON.stringify({ type: 'webrtc:ice', candidate: e.candidate }));
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: 'webrtc:offer', sdp: offer }));

      stream.getVideoTracks()[0].onended = () => {
        setSharing(s => ({ ...s, screen: false }));
        ws.send(JSON.stringify({ type: 'child:screen:stopped' }));
      };
    } catch {
      ws.send(JSON.stringify({ type: 'child:screen:denied' }));
      setSharing(s => ({ ...s, screen: false }));
    }
  }

  // ── Stop everything ───────────────────────────────────────────────────────
  function stopAll() {
    if (watchRef.current)  navigator.geolocation.clearWatch(watchRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (peerRef.current)   peerRef.current.close();
    if (wsRef.current)     wsRef.current.close();
    setStatus('stopped');
    setSharing({ location: false, screen: false });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const bg = 'min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white font-sans';

  // ── Consent ──
  if (status === 'consent') return (
    <div className={bg}>
      <div className="max-w-sm w-full bg-[#111113] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#8b5cf6]/10 rounded-2xl border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
            <Smartphone size={32} />
          </div>
        </div>

        <h1 className="text-xl font-black text-white text-center uppercase tracking-tight mb-2">
          Solicitud de Monitoreo
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
          Un padre/tutor quiere conectarse a este dispositivo para supervisión parental.
        </p>

        <div className="bg-[#0a0a0c] rounded-2xl p-4 mb-6 border border-white/5 space-y-3">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Se compartirá:</p>
          {[
            { icon: <MapPin size={16} />, text: 'Ubicación GPS en tiempo real', color: '#22c55e' },
            { icon: <Monitor size={16} />, text: 'Pantalla (solo si tú lo aceptas)', color: '#8b5cf6' },
            { icon: <Smartphone size={16} />, text: 'Info del dispositivo y batería', color: '#f59e0b' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: item.color + '15', color: item.color }}>
                {item.icon}
              </div>
              <span className="text-[13px] text-gray-300 font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
          <p className="text-[11px] text-amber-300 leading-relaxed font-medium text-center">
            Al aceptar, el padre podrá ver tu ubicación. Puedes detener el monitoreo en cualquier momento.
          </p>
        </div>

        <button
          onClick={accept}
          className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm transition-all active:scale-95 cursor-pointer mb-3 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
        >
          <Check size={18} /> Aceitar y Conectar
        </button>
        <button
          onClick={() => setStatus('stopped')}
          className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer border border-white/10"
        >
          <X size={16} /> Rechazar
        </button>
      </div>
    </div>
  );

  // ── Connecting ──
  if (status === 'connecting') return (
    <div className={bg}>
      <Loader2 size={48} className="text-[#8b5cf6] animate-spin mb-6" />
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Conectando...</h2>
      <p className="text-gray-500 text-sm">Estableciendo conexión segura.</p>
    </div>
  );

  // ── Stopped / Declined ──
  if (status === 'stopped' || status === 'parent_gone') return (
    <div className={bg}>
      <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500 mb-6">
        <StopCircle size={32} />
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Monitoreo detenido</h2>
      <p className="text-gray-500 text-sm mb-6">
        {status === 'parent_gone' ? 'El padre se desconectó.' : 'Conexión finalizada por ti.'}
      </p>
      <button
        onClick={() => setStatus('consent')}
        className="bg-[#8b5cf6] hover:bg-[#7c4deb] text-white font-black px-6 py-3 rounded-xl text-sm uppercase tracking-widest cursor-pointer transition-all active:scale-95"
      >
        Reconectar
      </button>
    </div>
  );

  // ── Error ──
  if (status === 'error') return (
    <div className={bg}>
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center text-red-400 mb-6">
        <WifiOff size={32} />
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2 text-red-400">Error de conexión</h2>
      <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
      <button onClick={accept} className="bg-[#8b5cf6] text-white font-black px-6 py-3 rounded-xl text-sm uppercase cursor-pointer transition-all active:scale-95">
        Reintentar
      </button>
    </div>
  );

  // ── Connected ──
  return (
    <div className={bg}>
      <div className="max-w-sm w-full bg-[#111113] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
            <span className="relative inline-flex rounded-full w-3 h-3 bg-[#22c55e]" />
          </div>
          <h2 className="font-black text-white text-lg uppercase tracking-tight">Monitoreando</h2>
        </div>

        {/* Status cards */}
        <div className="space-y-3 mb-6">
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${sharing.location ? 'bg-[#22c55e]/10 border-[#22c55e]/20' : 'bg-white/5 border-white/5'}`}>
            <MapPin size={18} className={sharing.location ? 'text-[#22c55e]' : 'text-gray-600'} />
            <div className="flex-1">
              <div className="text-[12px] font-bold text-white">Ubicación GPS</div>
              <div className="text-[10px] font-medium" style={{ color: sharing.location ? '#22c55e' : '#6b7280' }}>
                {sharing.location ? 'Compartiendo en tiempo real' : 'No disponible'}
              </div>
            </div>
            {sharing.location && <Activity size={14} className="text-[#22c55e] animate-pulse" />}
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${sharing.screen ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/20' : 'bg-white/5 border-white/5'}`}>
            <Monitor size={18} className={sharing.screen ? 'text-[#8b5cf6]' : 'text-gray-600'} />
            <div className="flex-1">
              <div className="text-[12px] font-bold text-white">Pantalla</div>
              <div className="text-[10px] font-medium" style={{ color: sharing.screen ? '#8b5cf6' : '#6b7280' }}>
                {sharing.screen ? 'Transmitiendo' : 'No compartida'}
              </div>
            </div>
          </div>
        </div>

        {/* Screen share request */}
        {screenRequest && (
          <div className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-2xl p-4 mb-4 animate-in fade-in">
            <p className="text-[12px] text-white font-bold mb-3 text-center">
              Tu padre quiere ver tu pantalla
            </p>
            <div className="flex gap-2">
              <button
                onClick={startScreen}
                className="flex-1 bg-[#8b5cf6] text-white font-black py-2.5 rounded-xl text-[11px] uppercase tracking-widest cursor-pointer active:scale-95 transition-all"
              >
                Compartir
              </button>
              <button
                onClick={() => { setScreenRequest(false); wsRef.current?.send(JSON.stringify({ type: 'child:screen:denied' })); }}
                className="flex-1 bg-white/5 text-gray-400 font-bold py-2.5 rounded-xl text-[11px] border border-white/10 cursor-pointer transition-colors hover:bg-white/10"
              >
                Rechazar
              </button>
            </div>
          </div>
        )}

        <button
          onClick={stopAll}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-widest transition-colors cursor-pointer border border-red-500/20 active:scale-95"
        >
          <StopCircle size={16} /> Detener Monitoreo
        </button>
      </div>
    </div>
  );
}
