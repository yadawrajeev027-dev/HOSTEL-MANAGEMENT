import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

export function MicrophoneButton({ onTranscript, className = '' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone icon in browser tab
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Call our backend Deepgram proxy route
      const token = localStorage.getItem('token');
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Transcription failed');
      }

      const data = await response.json();
      console.log('Deepgram Response:', data);
      
      if (data.success) {
        if (data.transcript && data.transcript.trim().length > 0) {
          onTranscript(data.transcript);
        } else {
          alert("Deepgram received your audio, but couldn't detect any words. Your microphone might be too quiet or picking up silence.");
        }
      } else {
        alert('Server returned an unknown error: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('Transcription processing error:', error);
      alert('Speech-to-text failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = (e) => {
    e.preventDefault(); // Prevent form submission if inside a form
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (isProcessing) {
    return (
      <button 
        type="button"
        disabled
        className={`p-2 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center cursor-not-allowed ${className}`}
        title="Processing audio..."
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin"></div>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleRecording}
      className={`p-2 flex items-center justify-center transition-all ${
        isRecording 
          ? 'bg-red-50 text-red-500 hover:bg-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse rounded-full' 
          : 'bg-slate-50 text-slate-500 hover:bg-brand-50 hover:text-brand-600 rounded-xl'
      } ${className}`}
      title={isRecording ? 'Click to stop recording' : 'Click to speak using Deepgram AI'}
    >
      {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}
