import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../services/storage';
import { TuitionClass, Student, PaymentRecord, AttendanceRecord, PaymentStatus } from '../../types';
import { playScanSound } from '../../utils/cryptoSecurity';
import jsQR from 'jsqr';
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  User,
  Clock,
  DollarSign,
  FileEdit,
  RefreshCw,
  Zap,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScanModalState {
  isOpen: boolean;
  success: boolean;
  student?: Student;
  classInfo?: TuitionClass;
  attendanceRecord?: AttendanceRecord;
  paymentStatus?: PaymentStatus;
  paymentDetails?: PaymentRecord;
  message: string;
  isDoubleScan?: boolean;
  isExitLogged?: boolean;
  isIntegrityFailure?: boolean;
  requiresOverride?: boolean;
}

export const AttendanceScanner: React.FC = () => {
  const classes = storage.getClasses();
  const students = storage.getStudents();
  const currentUser = storage.getCurrentUser();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scan Result Modal
  const [scanResult, setScanResult] = useState<ScanModalState | null>(null);

  // On-arrival Payment & Override Drawer inside result
  const [isCollectingPayment, setIsCollectingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card'>('cash');
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideReason, setOverrideReason] = useState('Parent requested 3-day grace period; verified by staff');

  // Recent scans feed
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([]);

  // Video and Canvas refs for real-time camera scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastScannedTokenRef = useRef<string>('');
  const scanCooldownRef = useRef<number>(0);

  useEffect(() => {
    setRecentScans(storage.getAttendanceLogs().slice(0, 8));
  }, []);

  // Handle camera stream
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestAnimationFrame(tickCamera);
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to access camera device.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const tickCamera = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(tickCamera);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      animationFrameRef.current = requestAnimationFrame(tickCamera);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(tickCamera);
      return;
    }

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const now = Date.now();
      // Enforce 2.5 second cooldown per unique scan
      if (code.data !== lastScannedTokenRef.current || now - scanCooldownRef.current > 2500) {
        lastScannedTokenRef.current = code.data;
        scanCooldownRef.current = now;
        executeScanProcess(code.data, 'camera');
      }
    }

    animationFrameRef.current = requestAnimationFrame(tickCamera);
  };

  const executeScanProcess = (rawToken: string, method: 'camera' | 'usb_scanner' | 'manual') => {
    const res = storage.processQrAttendanceScan({
      rawQrToken: rawToken,
      targetClassId: selectedClassId,
      scanMethod: method,
    });

    // Sound chime based on verification outcome
    if (!res.success && res.isIntegrityFailure) {
      playScanSound('error');
    } else if (!res.success || res.requiresOverride) {
      playScanSound('warning');
    } else {
      playScanSound('success');
      confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
    }

    setScanResult({
      isOpen: true,
      success: res.success,
      student: res.student,
      classInfo: res.classInfo,
      attendanceRecord: res.attendanceRecord,
      paymentStatus: res.paymentStatus,
      paymentDetails: res.paymentDetails,
      message: res.message,
      isDoubleScan: res.isDoubleScan,
      isExitLogged: res.isExitLogged,
      isIntegrityFailure: res.isIntegrityFailure,
      requiresOverride: res.requiresOverride,
    });

    setIsCollectingPayment(false);
    setIsOverriding(false);
    setRecentScans(storage.getAttendanceLogs().slice(0, 8));
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    executeScanProcess(manualTokenInput.trim(), 'usb_scanner');
    setManualTokenInput('');
  };

  // Immediate On-Arrival Fee Collection
  const handleCollectArrivalPayment = () => {
    if (!scanResult || !scanResult.student || !scanResult.classInfo) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    storage.recordPayment({
      studentId: scanResult.student.id,
      classId: scanResult.classInfo.id,
      monthYear: currentMonth,
      amount: scanResult.classInfo.monthlyFee,
      method: paymentMethod,
      notes: `Collected on-arrival at entrance by ${currentUser.name}`,
    });

    // Update attendance record status
    if (scanResult.attendanceRecord) {
      scanResult.attendanceRecord.paymentStatusAtScan = 'paid';
    }

    playScanSound('success');
    confetti({ particleCount: 60, spread: 60 });

    setScanResult(prev =>
      prev
        ? {
            ...prev,
            paymentStatus: 'paid',
            requiresOverride: false,
            message: `Payment Received (LKR ${scanResult.classInfo?.monthlyFee.toLocaleString()}) via ${paymentMethod.toUpperCase()}. Attendance confirmed!`,
          }
        : null
    );

    setIsCollectingPayment(false);
    setRecentScans(storage.getAttendanceLogs().slice(0, 8));
  };

  // Immediate Manual Payment Override
  const handleManualOverride = () => {
    if (!scanResult || !scanResult.student || !scanResult.classInfo) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    storage.overridePayment({
      studentId: scanResult.student.id,
      classId: scanResult.classInfo.id,
      monthYear: currentMonth,
      reason: overrideReason,
    });

    if (scanResult.attendanceRecord) {
      scanResult.attendanceRecord.paymentStatusAtScan = 'overridden';
      scanResult.attendanceRecord.paymentOverridden = true;
      scanResult.attendanceRecord.overrideNote = overrideReason;
    }

    playScanSound('success');

    setScanResult(prev =>
      prev
        ? {
            ...prev,
            paymentStatus: 'overridden',
            requiresOverride: false,
            message: `Attendance Granted with Payment Override: "${overrideReason}"`,
          }
        : null
    );

    setIsOverriding(false);
    setRecentScans(storage.getAttendanceLogs().slice(0, 8));
  };

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Staff Portal</span>
            <span aria-hidden="true">·</span>
            <span>Gate 01 Main Entrance Scanner</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-600 font-bold">LIVE SYNC ACTIVE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Real-Time Attendance & Payment Verification
          </h1>
        </div>

        {/* Active Class Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Active Session:
          </label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="text-xs font-semibold text-indigo-700 bg-indigo-50/50 border border-indigo-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.scheduleDay}) · LKR {c.monthlyFee.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real-Time Optical / Barcode Scanner */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                Optical Camera & Barcode QR Scanner
              </h2>
              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isCameraActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                {isCameraActive ? 'Turn Off Camera' : 'Activate Live Camera'}
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewport Reticle / HUD */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl relative shadow-2xl">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1"></div>
                    <div className="w-full h-0.5 bg-red-500/80 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                  </div>
                  <span className="absolute bottom-3 text-[11px] text-white/80 bg-black/60 px-3 py-1 rounded-full font-mono">
                    Align student QR pass inside box
                  </span>
                </div>
              )}

              {!isCameraActive && (
                <div className="text-center p-6">
                  <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-300 font-medium">Camera is currently standby</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Click "Activate Live Camera" to scan passes directly using webcam, or use high-speed barcode reader below.
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-4 text-center">
                  <div className="text-xs text-rose-400">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-semibold">Camera Access Restricted</p>
                    <p className="text-[11px] text-slate-400 mt-1">{cameraError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* USB Barcode Scanner & Token Input */}
            <form onSubmit={handleManualScanSubmit} className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                USB Barcode / Optical Hardware Scanner Input
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Focus here for physical USB scanner or paste raw QR token..."
                  value={manualTokenInput}
                  onChange={e => setManualTokenInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  Verify Token
                </button>
              </div>
            </form>

            {/* One-Click Quick Test Scenarios (Demonstrates full capability) */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Instant Simulation Scenarios (One-Click)
                </span>
                <span className="text-[11px] text-slate-400">Test real business rules</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const s = students.find(item => item.id === 'std_101');
                    if (s) executeScanProcess(s.qrToken, 'manual');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all text-xs"
                >
                  <span className="font-semibold text-slate-900 block truncate">Kasun Perera</span>
                  <span className="text-[10px] text-emerald-600 font-medium">PAID (Maths)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const s = students.find(item => item.id === 'std_103');
                    if (s) executeScanProcess(s.qrToken, 'manual');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-lg transition-all text-xs"
                >
                  <span className="font-semibold text-slate-900 block truncate">Tharindu J.</span>
                  <span className="text-[10px] text-amber-600 font-medium">OVERDUE (Maths)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const s = students.find(item => item.id === 'std_102');
                    if (s) executeScanProcess(s.qrToken, 'manual');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all text-xs"
                >
                  <span className="font-semibold text-slate-900 block truncate">Dilani Silva</span>
                  <span className="text-[10px] text-indigo-600 font-medium">SCHOLARSHIP OVERRIDE</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Send tampered token with altered payload
                    const tamperedToken =
                      'APEX_SECURE:v1:std_101:APT-2026-0101:1726000000000:FORGED_COUNTERFEIT_SIGNATURE_000';
                    executeScanProcess(tamperedToken, 'manual');
                  }}
                  className="p-2 text-left bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200 rounded-lg transition-all text-xs"
                >
                  <span className="font-semibold text-rose-900 block truncate">Tampered QR</span>
                  <span className="text-[10px] text-rose-600 font-bold">SECURITY ALERT FAIL</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Gate Status & Recent Entries */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Class Info Box */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
              Active Entrance Gate
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">{selectedClass.name}</h3>
            <p className="text-xs text-slate-300 mt-1">{selectedClass.teacher}</p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Monthly Fee</span>
                <span className="font-mono font-bold text-white text-sm">
                  LKR {selectedClass.monthlyFee.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Hall / Room</span>
                <span className="text-white font-medium">{selectedClass.room}</span>
              </div>
            </div>
          </div>

          {/* Real-Time Scan Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Attendance Stream
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {recentScans.length} Entries Today
              </span>
            </div>

            <div className="space-y-2.5">
              {recentScans.map(att => (
                <div
                  key={att.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {att.studentName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">
                        {att.studentName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(att.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize inline-block ${
                        att.paymentStatusAtScan === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.paymentStatusAtScan === 'overridden'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {att.paymentStatusAtScan}
                    </span>
                    {att.exitTimestamp && (
                      <span className="block text-[9px] text-slate-400 mt-0.5">Exited</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Scan Result Dialog */}
      {scanResult && scanResult.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
            {/* Status Header Banner */}
            <div
              className={`p-4 rounded-xl mb-5 flex items-start gap-3 ${
                scanResult.isIntegrityFailure
                  ? 'bg-rose-50 border border-rose-200 text-rose-900'
                  : scanResult.requiresOverride
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : scanResult.isDoubleScan && !scanResult.isExitLogged
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              }`}
            >
              {scanResult.isIntegrityFailure ? (
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              ) : scanResult.requiresOverride ? (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              ) : scanResult.isExitLogged ? (
                <Clock className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  {scanResult.isIntegrityFailure
                    ? 'SECURITY VIOLATION: QR Integrity Check Failed'
                    : scanResult.isExitLogged
                    ? 'Student Departure Logged'
                    : scanResult.requiresOverride
                    ? 'Payment Due / Action Required'
                    : 'Attendance Confirmed & Validated'}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{scanResult.message}</p>
              </div>
            </div>

            {/* Student & Class Details */}
            {scanResult.student && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-sm text-indigo-700">
                      {scanResult.student.firstName[0]}
                      {scanResult.student.lastName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {scanResult.student.firstName} {scanResult.student.lastName}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        {scanResult.student.regNo} · {scanResult.student.stream}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Mobile</span>
                    <span className="font-mono font-medium text-slate-800">
                      {scanResult.student.mobileNo}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Subject Session:</span>
                    <span className="font-semibold text-slate-900">
                      {scanResult.classInfo?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Month Fee:</span>
                    <span
                      className={`font-bold font-mono ${
                        scanResult.paymentStatus === 'paid'
                          ? 'text-emerald-700'
                          : scanResult.paymentStatus === 'overridden'
                          ? 'text-indigo-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {scanResult.paymentStatus?.toUpperCase()} (LKR{' '}
                      {scanResult.classInfo?.monthlyFee.toLocaleString()})
                    </span>
                  </div>
                </div>

                {/* All Enrolled Classes Badge Strip */}
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Multi-Class Registrations on this QR:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {scanResult.student.enrolledClassIds.map(cId => {
                      const c = storage.getClassById(cId);
                      const isCurrent = cId === scanResult.classInfo?.id;
                      return (
                        <span
                          key={cId}
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-700 font-semibold'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {c ? c.subject : cId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* In-Modal On-Arrival Payment Collection Box */}
            {isCollectingPayment && scanResult.student && scanResult.classInfo && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl mb-5 text-xs animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    Collect Tuition Fee on Arrival
                  </h4>
                  <button
                    onClick={() => setIsCollectingPayment(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-600 block mb-1 font-medium">Select Payment Method:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cash', 'card', 'bank_transfer'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-1.5 px-2 text-center rounded border capitalize font-medium transition-colors ${
                            paymentMethod === m
                              ? 'bg-indigo-600 text-white border-indigo-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                    <div>
                      <span className="text-[11px] text-slate-500">Amount Due:</span>
                      <span className="text-sm font-bold font-mono text-indigo-950 block">
                        LKR {scanResult.classInfo.monthlyFee.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCollectArrivalPayment}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                    >
                      Confirm Payment & Mark Paid
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* In-Modal Manual Payment Override Box */}
            {isOverriding && scanResult.student && scanResult.classInfo && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-xs animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <FileEdit className="w-4 h-4 text-amber-600" />
                    Manual Payment Status Override
                  </h4>
                  <button
                    onClick={() => setIsOverriding(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Override Reason (Required for Audit Trail):
                    </label>
                    <textarea
                      rows={2}
                      value={overrideReason}
                      onChange={e => setOverrideReason(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. Bank transfer slip pending clearance; approved by manager"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsOverriding(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleManualOverride}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Apply Override & Admit Student
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {scanResult.requiresOverride && !isCollectingPayment && !isOverriding && (
                  <>
                    <button
                      onClick={() => setIsCollectingPayment(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Collect Fee Now
                    </button>
                    <button
                      onClick={() => setIsOverriding(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      Manual Override
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setScanResult(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors ml-auto"
              >
                Done & Next Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
