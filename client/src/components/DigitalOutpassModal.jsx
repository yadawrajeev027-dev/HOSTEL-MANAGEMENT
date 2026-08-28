import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Award,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';

export function DigitalOutpassModal({ isOpen, onClose, outpass }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && outpass && canvasRef.current) {
      const qrData = JSON.stringify({
        id: outpass.outpassNumber,
        reg: outpass.registrationNumber,
        name: outpass.studentName,
        status: outpass.finalStatus,
        out: outpass.outTime,
        in: outpass.inTime,
        chiefApproval: outpass.chiefWardenName
      });

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 140,
        margin: 1,
        color: {
          dark: '#03589e',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('Error generating QR code:', error);
      });
    }
  }, [isOpen, outpass]);

  if (!isOpen || !outpass) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Control Header */}
        <div className="px-6 py-3 bg-[#F5F7FB]/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Verified Campus Digital Pass
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Pass Content */}
        <div className="p-6 overflow-y-auto" id="printable-outpass">
          <div className="bg-gradient-to-b from-slate-800/90 to-white/90 border-2 border-emerald-500/40 rounded-2xl p-6 relative overflow-hidden shadow-xl text-slate-900 dark:text-white print:text-black print:bg-white print:border-black">
            
            {/* Watermark / Badge Stamp */}
            <div className="absolute right-6 top-6 opacity-10 pointer-events-none print:opacity-15">
              <Award className="w-48 h-48 text-emerald-600" />
            </div>

            {/* University & Hostel Header */}
            <div className="border-b border-slate-300/80 print:border-black/30 pb-4 mb-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-brand-600 print:text-blue-700" />
                <h1 className="text-base font-extrabold tracking-wider uppercase font-['Outfit']">UNIVERSITY HOSTEL MANAGEMENT</h1>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 print:text-slate-700">Official Student Gate Pass & Outstation Authorization</p>
              
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-900 border border-emerald-500/40 text-xs font-black tracking-widest uppercase">
                <CheckCircle2 className="w-4 h-4" />
                STATUS: APPROVED
              </div>
            </div>

            {/* Outpass Metadata Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 print:bg-slate-100 rounded-xl p-3.5 mb-5 border border-slate-200 dark:border-slate-800 print:border-slate-300 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-semibold block">Pass Number</span>
                <span className="font-mono font-bold text-brand-600 print:text-blue-700 text-sm">{outpass.outpassNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-semibold block">Issued Date</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 print:text-black">{formatDate(outpass.chiefWardenActionDate || outpass.createdAt)}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-semibold block">Hostel / Room</span>
                <span className="font-bold text-slate-900 dark:text-white print:text-black">{outpass.hostel}, #{outpass.roomNumber}</span>
              </div>
            </div>

            {/* Student Details & QR Code Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              
              {/* Details Column (2 cols) */}
              <div className="sm:col-span-2 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-semibold block">Student Name & Reg No</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white print:text-black">{outpass.studentName}</span>
                    <span className="font-mono text-xs text-brand-600 print:text-blue-700 ml-2">({outpass.registrationNumber})</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 print:text-slate-600 mt-0.5">{outpass.department} • {outpass.year} • Sec {outpass.section}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-semibold block">Out & Expected In Time</span>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 print:text-black">
                      <span>Out: <strong className="text-amber-600 print:text-amber-700">{formatDate(outpass.outTime)}</strong></span>
                      <br />
                      <span>In: <strong className="text-emerald-600 print:text-emerald-700">{formatDate(outpass.inTime)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-semibold block">Guardian Phone</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200 print:text-black">{outpass.guardianPhone}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#F5F7FB]/40 print:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-300">
                  <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-semibold block mb-0.5">Purpose of Visit</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 print:text-black italic leading-relaxed">"{outpass.purpose}"</p>
                </div>
              </div>

              {/* QR Verification Code Column (1 col) */}
              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
                <canvas ref={canvasRef} className="max-w-[130px] max-h-[130px]" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 tracking-wider mt-1 uppercase text-center">Scan at Security Gate</span>
              </div>

            </div>

            {/* Approvals Sign-off Block */}
            <div className="border-t border-slate-300/80 print:border-black/30 pt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F5F7FB]/30 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-300">
                <span className="text-[9px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-bold block">1. Warden Recommendation</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 print:text-black">{outpass.wardenName || 'Floor Warden'}</span>
                <p className="text-[10px] text-emerald-600 print:text-emerald-700 font-semibold mt-0.5">✓ Accepted & Forwarded</p>
                {outpass.wardenRemarks && <p className="text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-600 truncate mt-0.5">"{outpass.wardenRemarks}"</p>}
              </div>

              <div className="p-2.5 rounded-lg bg-[#F5F7FB]/30 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-300">
                <span className="text-[9px] uppercase text-slate-400 dark:text-slate-500 print:text-slate-600 font-bold block">2. Chief Warden Approval</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 print:text-black">{outpass.chiefWardenName || 'Chief Warden'}</span>
                <p className="text-[10px] text-emerald-600 print:text-emerald-700 font-semibold mt-0.5">✓ Final Permission Granted</p>
                {outpass.chiefWardenRemarks && <p className="text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-600 truncate mt-0.5">"{outpass.chiefWardenRemarks}"</p>}
              </div>
            </div>

            {/* Gate Security Notice */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-600 flex items-center justify-between">
              <span>Security Instruction: Verify QR Code at Main Gate before exit & entry.</span>
              <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">DIGITAL-SIGN-HASH: {outpass.id.slice(0, 12)}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
