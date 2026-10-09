import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { Student, ExamResult, TuitionClass, AttendanceRecord } from '../../types';
import { generateQrDataUrl } from '../../utils/qrRenderer';
import {
  QrCode,
  Calendar,
  CreditCard,
  GraduationCap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  initialStudentId?: string;
  onBackToAdmin?: () => void;
}

export const StudentMobileApp: React.FC<Props> = ({ initialStudentId, onBackToAdmin }) => {
  const students = storage.getStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0] ? students[0].id : '')
  );

  const [activeTab, setActiveTab] = useState<'pass' | 'attendance' | 'payments' | 'results'>('pass');
  const [isPhoneFramed, setIsPhoneFramed] = useState(true);
  const [qrUrl, setQrUrl] = useState<string>('');

  const currentStudent = storage.getStudentById(selectedStudentId) || students[0];

  // Exam Result Submission Form State
  const [examType, setExamType] = useState<'A/L' | 'O/L'>('A/L');
  const [examYear, setExamYear] = useState('2025');
  const [indexNumber, setIndexNumber] = useState('');
  const [stream, setStream] = useState(currentStudent?.stream || 'Physical Science (Maths)');
  const [zScore, setZScore] = useState('');
  const [districtRank, setDistrictRank] = useState('');
  const [islandRank, setIslandRank] = useState('');

  // Default subject grade inputs
  const [subjects, setSubjects] = useState<
    { subjectName: string; grade: 'A' | 'B' | 'C' | 'S' | 'F' }[]
  >([
    { subjectName: 'Combined Mathematics', grade: 'A' },
    { subjectName: 'Physics', grade: 'B' },
    { subjectName: 'Chemistry', grade: 'A' },
    { subjectName: 'General English', grade: 'A' },
  ]);

  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Load QR code
  useEffect(() => {
    if (currentStudent) {
      generateQrDataUrl(currentStudent.qrToken).then(setQrUrl);
      setStream(currentStudent.stream);
    }
  }, [currentStudent]);

  // Adjust default subjects when exam type toggles
  const handleExamTypeChange = (type: 'A/L' | 'O/L') => {
    setExamType(type);
    if (type === 'O/L') {
      setSubjects([
        { subjectName: 'Mathematics', grade: 'A' },
        { subjectName: 'Science', grade: 'A' },
        { subjectName: 'English', grade: 'A' },
        { subjectName: 'Sinhala / Tamil', grade: 'A' },
        { subjectName: 'History', grade: 'A' },
        { subjectName: 'Religion', grade: 'A' },
        { subjectName: 'ICT / Commerce', grade: 'A' },
      ]);
    } else {
      setSubjects([
        { subjectName: 'Combined Mathematics', grade: 'A' },
        { subjectName: 'Physics', grade: 'B' },
        { subjectName: 'Chemistry', grade: 'A' },
        { subjectName: 'General English', grade: 'A' },
      ]);
    }
  };

  const handleSubjectGradeChange = (index: number, grade: 'A' | 'B' | 'C' | 'S' | 'F') => {
    const updated = [...subjects];
    updated[index].grade = grade;
    setSubjects(updated);
  };

  const handleSubjectNameChange = (index: number, name: string) => {
    const updated = [...subjects];
    updated[index].subjectName = name;
    setSubjects(updated);
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { subjectName: '', grade: 'A' }]);
  };

  const handleRemoveSubject = (idx: number) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !indexNumber.trim()) return;

    storage.submitExamResult({
      studentId: currentStudent.id,
      examType,
      examYear,
      indexNumber: indexNumber.trim(),
      stream,
      zScore: zScore ? parseFloat(zScore) : undefined,
      districtRank: districtRank ? parseInt(districtRank, 10) : undefined,
      islandRank: islandRank ? parseInt(islandRank, 10) : undefined,
      subjects: subjects.filter(s => s.subjectName.trim() !== ''),
    });

    setSubmissionSuccess(true);
    confetti({ particleCount: 70, spread: 55, origin: { y: 0.7 } });
    setTimeout(() => setSubmissionSuccess(false), 5000);
  };

  if (!currentStudent) {
    return <div className="p-8 text-center text-slate-500">No active students registered yet.</div>;
  }

  // Student metrics
  const attendanceLogs = storage
    .getAttendanceLogs()
    .filter(a => a.studentId === currentStudent.id);
  const paymentRecords = storage.getStudentPayments(currentStudent.id);
  const submittedResults = storage.getExamResults(currentStudent.id);

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Switch Student Profile:
          </label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.regNo}) - {s.stream}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsPhoneFramed(!isPhoneFramed)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 transition-colors"
          >
            {isPhoneFramed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                Expand View
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                Phone Simulator
              </>
            )}
          </button>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
            >
              Return to Admin Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className={`mx-auto transition-all ${isPhoneFramed ? 'max-w-[420px]' : 'max-w-3xl'}`}>
        <div
          className={`bg-slate-900 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border ${
            isPhoneFramed ? 'border-slate-700 min-h-[760px] ring-8 ring-slate-800/60' : 'border-slate-800'
          } flex flex-col`}
        >
          {/* Mobile Top App Bar */}
          <div className="bg-slate-950/90 border-b border-slate-800 px-5 py-4 pt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                {currentStudent.firstName[0]}
                {currentStudent.lastName[0]}
              </div>
              <div>
                <h2 className="text-xs font-bold text-white leading-tight">
                  {currentStudent.firstName} {currentStudent.lastName}
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">{currentStudent.regNo}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Pass
              </span>
              <span className="text-[9px] text-slate-500 block">{currentStudent.academicYear}</span>
            </div>
          </div>

          {/* App Navigation Tabs */}
          <div className="flex items-center justify-around bg-slate-900/90 border-b border-slate-800 px-2 py-1 text-xs">
            <button
              onClick={() => setActiveTab('pass')}
              className={`flex-1 py-2 text-center flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'pass' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="text-[10px]">Digital Pass</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-2 text-center flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'attendance' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[10px]">Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 text-center flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'payments' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px]">Fees</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 py-2 text-center flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'results' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="text-[10px]">Update Results</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-5 flex-1 overflow-y-auto max-h-[620px]">
            {/* TAB 1: PASS */}
            {activeTab === 'pass' && (
              <div className="flex flex-col items-center text-center">
                <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg relative">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-left">
                    <div>
                      <span className="text-[9px] tracking-widest text-indigo-400 font-bold uppercase block">
                        APEX ACADEMY PASS
                      </span>
                      <span className="text-xs font-semibold text-white">Daily Check-In Pass</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      {currentStudent.regNo}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl mx-auto inline-block shadow-inner">
                    {qrUrl ? (
                      <img src={qrUrl} alt="Secure QR Code" className="w-52 h-52 object-contain" />
                    ) : (
                      <div className="w-52 h-52 bg-slate-200 animate-pulse rounded-lg" />
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white">
                      {currentStudent.firstName} {currentStudent.lastName}
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5">{currentStudent.stream}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{currentStudent.school}</p>
                  </div>

                  {/* Registered Classes Badges */}
                  <div className="mt-4 pt-3 border-t border-slate-800 text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-medium">
                      Enrolled Subjects
                    </span>
                    <div className="space-y-1.5">
                      {currentStudent.enrolledClassIds.map(cId => {
                        const cls = storage.getClassById(cId);
                        return (
                          <div
                            key={cId}
                            className="flex items-center justify-between text-xs bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800"
                          >
                            <span className="text-slate-200 font-medium truncate">
                              {cls ? cls.subject : cId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {cls?.scheduleDay.slice(0, 3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Tamper-Proof HMAC-256
                    </span>
                    <span>Single QR Multi-Class</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-4 max-w-xs">
                  Hold this screen up to the staff optical scanner at class entrance. Tokens are verified cryptographically in real-time.
                </p>
              </div>
            )}

            {/* TAB 2: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Attendance Rate</span>
                    <span className="text-2xl font-bold text-white font-mono">94%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Sessions Recorded</span>
                    <span className="text-sm font-semibold text-indigo-400 font-mono">
                      {attendanceLogs.length} Total
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Recent Attendance Logs
                </h3>

                {attendanceLogs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border border-slate-800 border-dashed rounded-xl">
                    No attendance records for today yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendanceLogs.map(att => (
                      <div
                        key={att.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-white block">{att.className}</span>
                          <span className="text-[11px] text-slate-400">{att.date}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span>In: {new Date(att.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {att.exitTimestamp && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>Out: {new Date(att.exitTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                              att.status === 'present'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {att.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FEES */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-400 block mb-1">September 2026 Academic Fee</span>
                  <div className="space-y-2 mt-2">
                    {currentStudent.enrolledClassIds.map(cId => {
                      const cls = storage.getClassById(cId);
                      const payStatus = storage.getStudentPaymentStatus(currentStudent.id, cId, '2026-09');
                      return (
                        <div
                          key={cId}
                          className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800 last:border-0"
                        >
                          <div>
                            <span className="text-slate-200 font-medium block">{cls?.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              LKR {cls?.monthlyFee.toLocaleString()}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase ${
                              payStatus.status === 'paid'
                                ? 'text-emerald-400'
                                : payStatus.status === 'overridden'
                                ? 'text-indigo-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {payStatus.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Payment History
                </h3>

                <div className="space-y-2">
                  {paymentRecords.map(pay => (
                    <div
                      key={pay.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white block">{pay.className}</span>
                        <span className="text-[11px] text-slate-400">
                          {pay.monthYear} · {new Date(pay.paymentDate).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {pay.receiptNo}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-emerald-400 block">
                          LKR {pay.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">{pay.method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: UPDATE EXAM RESULTS (A/L & O/L) */}
            {activeTab === 'results' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Submit A/L & O/L Exam Results
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Once the Department of Examinations releases your official results, enter your grades here to update your academy records.
                  </p>
                </div>

                {submissionSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Your Exam Results have been successfully recorded and synced with the Academy Database!</span>
                  </div>
                )}

                <form onSubmit={handleResultSubmit} className="space-y-4">
                  {/* Exam Type Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleExamTypeChange('A/L')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        examType === 'A/L' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      G.C.E. A/L (Advanced Level)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExamTypeChange('O/L')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        examType === 'O/L' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      G.C.E. O/L (Ordinary Level)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Exam Year
                      </label>
                      <input
                        type="text"
                        value={examYear}
                        onChange={e => setExamYear(e.target.value)}
                        placeholder="2025"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Index Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={indexNumber}
                        onChange={e => setIndexNumber(e.target.value)}
                        placeholder="e.g. 6421908"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Stream / Category
                    </label>
                    <input
                      type="text"
                      value={stream}
                      onChange={e => setStream(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Subject Grades Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-medium text-slate-400">
                        Subject Grades Breakdown
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        + Add Subject
                      </button>
                    </div>

                    <div className="space-y-2">
                      {subjects.map((subj, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={subj.subjectName}
                            onChange={e => handleSubjectNameChange(idx, e.target.value)}
                            placeholder="Subject Name"
                            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
                          />
                          <select
                            value={subj.grade}
                            onChange={e =>
                              handleSubjectGradeChange(idx, e.target.value as 'A' | 'B' | 'C' | 'S' | 'F')
                            }
                            className="w-16 px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-amber-400 font-bold font-mono"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="S">S</option>
                            <option value="F">F</option>
                          </select>
                          {subjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(idx)}
                              className="text-slate-500 hover:text-rose-400 text-xs px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Z-score and ranks (for A/L) */}
                  {examType === 'A/L' && (
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">
                          Z-Score
                        </label>
                        <input
                          type="text"
                          value={zScore}
                          onChange={e => setZScore(e.target.value)}
                          placeholder="2.4510"
                          className="w-full px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">
                          District Rank
                        </label>
                        <input
                          type="number"
                          value={districtRank}
                          onChange={e => setDistrictRank(e.target.value)}
                          placeholder="12"
                          className="w-full px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">
                          Island Rank
                        </label>
                        <input
                          type="number"
                          value={islandRank}
                          onChange={e => setIslandRank(e.target.value)}
                          placeholder="84"
                          className="w-full px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Results to Academy
                  </button>
                </form>

                {/* Previously submitted results */}
                {submittedResults.length > 0 && (
                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-300 block mb-2">
                      Recorded Official Results
                    </span>
                    <div className="space-y-2">
                      {submittedResults.map(r => (
                        <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">
                              {r.examType} Exam ({r.examYear})
                            </span>
                            <span className="text-[10px] font-mono text-indigo-400">
                              Index: {r.indexNumber}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 my-2">
                            {r.subjects.map((s, i) => (
                              <span
                                key={i}
                                className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300"
                              >
                                {s.subjectName}: <strong className="text-amber-400">{s.grade}</strong>
                              </span>
                            ))}
                          </div>
                          {r.zScore && (
                            <div className="text-[10px] text-slate-400 flex gap-3 pt-1 border-t border-slate-900">
                              <span>Z-Score: <strong className="text-white font-mono">{r.zScore}</strong></span>
                              {r.districtRank && <span>District: <strong className="text-white font-mono">{r.districtRank}</strong></span>}
                              {r.islandRank && <span>Island: <strong className="text-white font-mono">{r.islandRank}</strong></span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
