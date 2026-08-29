import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, Square, X, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

export function GlobalVoiceAgent() {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('I am your AI Agent. Click the mic and tell me what to do!');
  const [status, setStatus] = useState('idle'); // idle, connecting, listening
  const [agentContext, setAgentContext] = useState('idle'); // idle, outpass_dest, outpass_purpose, complaint_writing
  const [contextDraft, setContextDraft] = useState({});
  
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const audioStreamRef = useRef(null);

  const speak = (text) => {
    setAssistantMessage(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onstart = () => {
        // Pause microphone while agent is speaking to prevent echo loops
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
        }
      };

      utterance.onend = () => {
        // Add a slight delay before resuming to let room echo dissipate
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
          }
        }, 300);
      };

      utterance.onerror = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume();
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const [chatHistory, setChatHistory] = useState([]);

  const processCommand = async (text) => {
    const lower = text.toLowerCase();
    
    // TURN OFF COMMAND / CANCEL
    if (lower.match(/(stop listening|close agent|turn off|stop agent|shut down|go away|goodbye|exit|quit|cancel|nevermind|stop it)/i)) {
      speak("Okay, stopping AI Agent.");
      setAgentContext('idle');
      setContextDraft({});
      setChatHistory([]); // Clear memory
      stopListening();
      return;
    }

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: chatHistory
        })
      });
      
      const data = await response.json();
      if (data.reply) {
        speak(data.reply);
        
        // Update history
        setChatHistory(prev => [
          ...prev, 
          { role: 'user', text },
          { role: 'ai', text: data.reply }
        ]);
      }

      // Execute AI Command Action if provided
      if (data.action) {
        const { action, ...payload } = data.action;
        
        if (action === 'navigate') {
          window.dispatchEvent(new CustomEvent('ai-navigate', { detail: payload.page }));
        } 
        else if (action === 'create_complaint') {
          window.dispatchEvent(new CustomEvent('ai-auto-complaint', { detail: payload.description }));
        }
        else if (action === 'create_outpass') {
          window.dispatchEvent(new CustomEvent('ai-auto-outpass', { detail: { destination: payload.destination, purpose: payload.purpose } }));
        }
        else if (action === 'update_profile') {
          window.dispatchEvent(new CustomEvent('ai-update-profile', { detail: payload }));
        }
        else if (action === 'emergency_call') {
          window.dispatchEvent(new CustomEvent('ai-open-callbooth', { detail: { category: payload.category, description: "AI Voice Request: " + text } }));
        }
      }
    } catch (err) {
      console.error('Agent API failed:', err);
      speak("I am having trouble connecting to my AI brain.");
    }
  };

  const startListening = async () => {
    try {
      setStatus('listening');
      setIsActive(true);
      setTranscript('');
      setAssistantMessage('Listening... Click square to stop and analyze.');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        setAssistantMessage('Analyzing your voice...');
        
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice' + (mimeType.includes('mp4') ? '.mp4' : '.webm'));

        try {
          const res = await fetch('/api/deepgram/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          
          if (!res.ok || data.error) {
            setAssistantMessage('Backend Error: ' + (data.error || 'Server returned ' + res.status));
            setStatus('idle');
            setIsActive(false);
            return;
          }

          if (data.success && data.transcript) {
            setTranscript(data.transcript);
            processCommand(data.transcript);
          } else {
             if (audioBlob.size < 1000) {
               setAssistantMessage('Error: No audio recorded. Mic is muted or silent.');
             } else {
               setAssistantMessage("I couldn't hear any words. Please try again.");
             }
             setTimeout(() => setIsActive(false), 3000);
          }
        } catch (err) {
          console.error(err);
          setAssistantMessage('Transcription API failed.');
          setTimeout(() => setIsActive(false), 3000);
        }
        
        // Clean up stream tracks
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      speak("I am listening. Click the stop button when you are done.");

    } catch (err) {
      console.error('Mic access error:', err);
      alert('Could not start microphone.');
      setStatus('idle');
      setIsActive(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleAgent = () => {
    if (isActive) {
      stopListening();
      setIsActive(false);
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      
      {/* Assistant Bubble */}
      {isActive && (
        <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 shadow-2xl rounded-2xl p-4 w-72 md:w-80 pointer-events-auto animate-fadeIn flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${status === 'listening' ? 'bg-brand-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse' : 'bg-slate-200 dark:bg-slate-800'}`}>
              <Bot className={`w-6 h-6 ${status === 'listening' ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">AI Assistant</h3>
              <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">
                {status === 'listening' ? 'Listening...' : status === 'connecting' ? 'Connecting...' : 'Active'}
              </span>
            </div>
          </div>
          
          <div className="bg-brand-50 dark:bg-slate-800/50 rounded-xl p-3 border border-brand-100 dark:border-slate-800">
            <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
              "{assistantMessage}"
            </p>
          </div>

          {transcript && (
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">You said:</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{transcript}"</p>
            </div>
          )}
          
          <button 
            onClick={toggleAgent}
            className="mt-1 py-2 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Square className="w-3 h-3 fill-current" /> Stop AI Agent
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleAgent}
        className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 ${
          isActive 
            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 text-white' 
            : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/40 text-white ring-4 ring-white dark:ring-slate-950'
        }`}
        title={isActive ? 'Stop AI Agent' : 'Start AI Agent'}
      >
        {isActive ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-7 h-7" />}
      </button>

    </div>
  );
}
