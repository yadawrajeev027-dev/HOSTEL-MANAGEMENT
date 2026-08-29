import React, { useState, useRef, useEffect } from 'react';
import { Mic, PhoneCall, AlertTriangle, Loader2 } from 'lucide-react';
import { twilioApi } from '../api';

export function EmergencyMicrophone({ onCallConnected }) {
  const [status, setStatus] = useState('idle'); // idle, speaking_prompt, listening, processing, unidentified, identified, connecting, connected, failed
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [detectedService, setDetectedService] = useState(null);
  
  const [failMessage, setFailMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const msgRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
      }
    };
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setStatus('listening');
      setTranscript('');
      setPartialTranscript('');
      setDetectedService(null);
      setFailMessage('');
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'emergency' + (mimeType.includes('mp4') ? '.mp4' : '.webm'));

        try {
          const res = await fetch('/api/deepgram/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          
          if (data.success && data.transcript) {
            setTranscript(data.transcript);
            analyzeTranscript(data.transcript);
          } else {
            if (audioBlob.size < 1000) {
              alert("Warning: Your browser only recorded " + audioBlob.size + " bytes (basically empty). Your microphone might be muted in Windows, or it's recording the wrong audio device (like Stereo Mix instead of your headset).");
            } else {
               alert("Deepgram successfully processed " + Math.round(audioBlob.size / 1024) + " KB of audio, but found ZERO words. Make sure you are speaking clearly!");
            }
            setStatus('unidentified');
          }
        } catch (err) {
          console.error(err);
          setFailMessage('Speech recognition failed.');
          setStatus('failed');
        }
        
        // Clean up stream tracks
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
    } catch (e) {
      console.error('Mic access error:', e);
      alert('Microphone Error: ' + e.name + ' - ' + e.message + '\n\nIf you gave permission, Windows might be blocking it or no mic is plugged in.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const analyzeTranscript = (text) => {
    if (!text || text.trim().length === 0) {
      alert("Deepgram received your audio, but couldn't detect any words.");
      setStatus('unidentified');
      return;
    }

    const t = text.toLowerCase();
    let identified = null;
    let serviceId = null;

    if (/(health|medic|doctor|hospital|ambulance|sick|fever|injur|clinic|hurt|pain)/i.test(t)) {
      identified = 'Health Issue';
      serviceId = 'HEALTH_CENTER';
    } else if (/(fire.*extinguisher|extinguisher|fire safety|cylinder)/i.test(t)) {
      identified = 'Fire Extinguisher / Safety';
      serviceId = 'FIRE_SAFETY';
    } else if (/(fire|burn|smoke|flame|blaze)/i.test(t)) {
      identified = 'Fire Emergency Service';
      serviceId = 'FIRE_EMERGENCY';
    } else if (/(bus|transport|vehicle|van|travel|ride|cab)/i.test(t)) {
      identified = 'Bus Service';
      serviceId = 'BUS_SERVICE';
    } else if (/(water|plumb|leak|tap|bathroom|washroom|toilet|drink|pipe)/i.test(t)) {
      identified = 'Water Issue';
      serviceId = 'WATER_ISSUE';
    } else if (/(electric|light|fan|switch|power|plug|wire|ac|short circuit)/i.test(t)) {
      identified = 'Electrical Issue';
      serviceId = 'ELECTRICAL_ISSUE';
    } else if (/(room|bed|door|window|lock|furniture)/i.test(t)) {
      identified = 'Room Issue';
      serviceId = 'ROOM_ISSUE';
    } else if (/(food|mess|eat|meal|breakfast|lunch|dinner|cook)/i.test(t)) {
      identified = 'Food/Mess Issue';
      serviceId = 'FOOD_ISSUE';
    } else if (/(secur|guard|fight|strang|thief|stole|rob)/i.test(t)) {
      identified = 'Security Issue';
      serviceId = 'SECURITY_ISSUE';
    } else if (/(hostel|warden|building|noise|corridor|clean)/i.test(t)) {
      identified = 'Hostel Issue';
      serviceId = 'HOSTEL_ISSUE';
    }

    if (identified) {
      setDetectedService({ name: identified, id: serviceId, originalText: text });
      // Skip the confirmation UI and immediately dispatch the call
      initiateCall(identified, serviceId, text);
    } else {
      setStatus('unidentified');
    }
  };

  const initiateCall = async (serviceName, serviceId, text) => {
    setStatus('connecting');
    try {
      const res = await twilioApi.initiateEmergencyCall({
        serviceId,
        serviceName,
        text
      });
      if (res.success) {
        setStatus('connected');
        if (onCallConnected) onCallConnected(res);
      } else {
        setFailMessage(res.message || 'Call failed');
        setStatus('failed');
      }
    } catch (e) {
      console.error(e);
      setFailMessage(e.response?.data?.error || e.message || 'Service Unavailable / Call Failed');
      setStatus('failed');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 bg-red-500/5" />
      
      <div className="relative z-10 w-full">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Voice Emergency Route</h3>
        <p className="text-xs text-slate-500 mb-6">Speak naturally to request emergency services.</p>

        {status === 'idle' && (
          <button 
            type="button"
            onClick={startListening}
            className="mx-auto w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105"
          >
            <Mic className="w-8 h-8" />
          </button>
        )}

        {status === 'speaking_prompt' && (
          <div className="space-y-4">
            <button 
              type="button"
              disabled
              className="mx-auto w-20 h-20 rounded-full bg-slate-900/50 text-white flex items-center justify-center cursor-wait"
            >
              <Mic className="w-8 h-8" />
            </button>
            <p className="text-sm font-bold text-slate-500 animate-pulse">Wait, I am speaking...</p>
          </div>
        )}

        {status === 'listening' && (
          <div className="space-y-4">
            <button 
              type="button"
              onClick={stopListening}
              className="mx-auto w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg animate-pulse hover:bg-slate-800 transition-all"
            >
              <Mic className="w-8 h-8" />
            </button>
            <p className="text-sm font-bold text-brand-600 animate-pulse">Listening... (Click to Stop)</p>
            {(transcript || partialTranscript) && (
              <p className="text-sm font-medium text-slate-700 bg-slate-100 p-3 rounded-xl mx-auto max-w-md">
                {transcript} {partialTranscript && <span className="opacity-50">{partialTranscript}</span>}
              </p>
            )}
          </div>
        )}

        {status === 'processing' && (
          <div className="space-y-4">
            <button 
              type="button"
              disabled
              className="mx-auto w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center cursor-not-allowed"
            >
              <Loader2 className="w-8 h-8 animate-spin" />
            </button>
            <p className="text-sm font-bold text-slate-500 animate-pulse">Analyzing...</p>
          </div>
        )}

        {status === 'unidentified' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              I couldn't identify the specific service. Please say something like "health issue", "water leak", "electrical problem", or "room issue".
            </div>
            <p className="text-xs text-slate-500 font-medium">You said: "{transcript}"</p>
            <button 
              type="button"
              onClick={() => setStatus('idle')}
              className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'connecting' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm font-bold text-slate-900">Connecting you to {detectedService?.name}...</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <PhoneCall className="w-8 h-8 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-emerald-600">Call Connected to {detectedService?.name}</p>
            <button 
              type="button"
              onClick={() => setStatus('idle')}
              className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl mt-2"
            >
              End Call
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-red-600">{failMessage || 'Service Unavailable / Call Failed'}</p>
            <button 
              type="button"
              onClick={() => setStatus('idle')}
              className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl mt-2"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
