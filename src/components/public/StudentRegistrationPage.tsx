import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { TuitionClass, Student } from '../../types';
import { generateQrDataUrl } from '../../utils/qrRenderer';
import { CheckCircle2, Download, Printer, ArrowRight, ShieldCheck, UserCheck, Calendar, BookOpen, School } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onNavigateToOtp?: () => void;
  onViewPaymentPortal?: () => void;
  onNavigateToMobileApp?: (studentId: string) => void;
}

export const StudentRegistrationPage: React.FC<Props> = ({
  onNavigateToOtp,
  onViewPaymentPortal,
  onNavigateToMobileApp,
}) => {
  const handleGoToPayments = () => {
    if (onViewPaymentPortal) onViewPaymentPortal();
    else if (onNavigateToOtp) onNavigateToOtp();
  };
  const classes = storage.getClasses();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    mobileNo: '',
    email: '',
    nic: '',
    school: '',
    stream: 'Physical Science (Maths)',
    academicYear: '2026 A/L',
    selectedClasses: ['cls_maths_al', 'cls_chem_al'] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enrolledStudent, setEnrolledStudent] = useState<Student | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const streams = [
    'Physical Science (Maths)',
    'Biological Science',
    'Commerce & Accounting',
    'Technology (Engineering/Bio)',
    'Arts & Humanities',
    'Ordinary Level (O/L)',
  ];

  const academicYears = ['2025 A/L', '2026 A/L', '2027 A/L', '2025 O/L', '2026 O/L'];

  const handleClassToggle = (classId: string) => {
    setFormData(prev => {
      const exists = prev.selectedClasses.includes(classId);
      if (exists) {
        if (prev.selectedClasses.length === 1) return prev; // At least one class
        return { ...prev, selectedClasses: prev.selectedClasses.filter(id => id !== classId) };
      } else {
        return { ...prev, selectedClasses: [...prev.selectedClasses, classId] };
      }
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is mandatory';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is mandatory';
    if (!formData.address.trim()) errs.address = 'Residential address is mandatory';
    if (!formData.mobileNo.trim()) {
      errs.mobileNo = 'Mobile number is mandatory';
    } else if (formData.mobileNo.replace(/\D/g, '').length < 9) {
      errs.mobileNo = 'Enter a valid mobile phone number';
    }
    if (formData.selectedClasses.length === 0) {
      errs.classes = 'Select at least one tuition class';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { student, token } = storage.enrollStudent({
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        mobileNo: formData.mobileNo,
        email: formData.email,
        nic: formData.nic,
        school: formData.school,
        stream: formData.stream,
        academicYear: formData.academicYear,
        enrolledClassIds: formData.selectedClasses,
      });

      const qrUrl = await generateQrDataUrl(token);
      setEnrolledStudent(student);
      setQrDataUrl(qrUrl);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !enrolledStudent) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Apex_QR_Pass_${enrolledStudent.regNo}.png`;
    a.click();
  };

  const calculateTotalFee = () => {
    return formData.selectedClasses.reduce((acc, cId) => {
      const c = classes.find(item => item.id === cId);
      return acc + (c ? c.monthlyFee : 0);
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-indigo-600 mb-2">
          <span>Official Admissions Portal</span>
          <span aria-hidden="true">·</span>
          <span>Academic Year 2026/2027</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Tuition Student Registration
        </h1>
        <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
          Complete the official enrollment form to generate your encrypted tamper-proof QR attendance pass. Use this single QR code for all enrolled classes.
        </p>
      </div>

      {!enrolledStudent ? (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Student Identification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.firstName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.firstName && <p className="text-xs text-rose-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Perera"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.lastName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.lastName && <p className="text-xs text-rose-500 mt-1">{errors.lastName}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Permanent Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. No. 42/B, Flower Road, Colombo 07"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number (SMS / WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0771234567"
                  value={formData.mobileNo}
                  onChange={e => setFormData({ ...formData, mobileNo: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.mobileNo ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1">Used for payment reminder alerts and OTP verification</p>
                {errors.mobileNo && <p className="text-xs text-rose-500 mt-1">{errors.mobileNo}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  National ID (NIC) / Guardian NIC <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 200612345678"
                  value={formData.nic}
                  onChange={e => setFormData({ ...formData, nic: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current School <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal College / Visakha Vidyalaya"
                  value={formData.school}
                  onChange={e => setFormData({ ...formData, school: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Academic Profile */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              Academic Stream & Batch
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Examination</label>
                <select
                  value={formData.academicYear}
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {academicYears.map(yr => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Educational Stream</label>
                <select
                  value={formData.stream}
                  onChange={e => setFormData({ ...formData, stream: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {streams.map(str => (
                    <option key={str} value={str}>
                      {str}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Multi-Class Enrollment Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Select Tuition Classes to Enroll
              </h2>
              <span className="text-xs text-slate-500">
                Single QR is valid for all chosen subjects
              </span>
            </div>

            {errors.classes && <p className="text-xs text-rose-500 mb-3">{errors.classes}</p>}

            <div className="space-y-3">
              {classes.map(cls => {
                const isSelected = formData.selectedClasses.includes(cls.id);
                return (
                  <div
                    key={cls.id}
                    onClick={() => handleClassToggle(cls.id)}
                    className={`flex items-start justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{cls.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{cls.teacher}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span>{cls.scheduleDay}</span>
                          <span aria-hidden="true">·</span>
                          <span>{cls.scheduleTime}</span>
                          <span aria-hidden="true">·</span>
                          <span>{cls.room}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
                        LKR {cls.monthlyFee.toLocaleString()}
                      </span>
                      <p className="text-[11px] text-slate-400">per month</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Fee Calculation */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Total Monthly Academic Fee</span>
                <span className="text-xs text-slate-400 font-normal">
                  {formData.selectedClasses.length} {formData.selectedClasses.length === 1 ? 'subject' : 'subjects'} enrolled
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  LKR {calculateTotalFee().toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 block">/ Month</span>
              </div>
            </div>
          </div>

          {/* Submission and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onNavigateToOtp}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              Already enrolled? Check your payment history via OTP
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Complete Enrollment & Generate QR Pass'}
            </button>
          </div>
        </form>
      ) : (
        /* Enrollment Success & Digital QR Pass Card */
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">
                Registration Successful! Digital Student Pass Issued
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your unique cryptographic QR pass has been generated. Save or download this pass to present at class entrances.
              </p>
            </div>
          </div>

          {/* Printable Physical ID Badge Card */}
          <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] tracking-widest text-indigo-400 font-bold uppercase">APEX TUITION ACADEMY</span>
                <h3 className="text-base font-bold text-white leading-tight">Student Attendance Pass</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-amber-400">{enrolledStudent.regNo}</span>
                <p className="text-[10px] text-slate-400">{enrolledStudent.academicYear}</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center my-4">
              {/* QR Image Container */}
              <div className="p-3 bg-white rounded-xl shadow-inner mb-3">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Encrypted Student QR Pass"
                    className="w-48 h-48 object-contain"
                  />
                )}
              </div>

              <span className="text-lg font-bold text-white tracking-wide">
                {enrolledStudent.firstName} {enrolledStudent.lastName}
              </span>
              <p className="text-xs text-indigo-300 mt-0.5">{enrolledStudent.stream}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{enrolledStudent.school || 'Enrolled Student'}</span>
                <span aria-hidden="true">·</span>
                <span>{enrolledStudent.mobileNo}</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Registered Subjects:</span>
              <div className="flex flex-wrap gap-1.5">
                {enrolledStudent.enrolledClassIds.map(cId => {
                  const c = storage.getClassById(cId);
                  return (
                    <span key={cId} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {c ? c.subject : cId}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                HMAC-256 Tamper Protected
              </span>
              <span>Issued: {new Date(enrolledStudent.enrolledAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Pass Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={handleDownloadQr}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR Image
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Student Pass
            </button>

            <button
              onClick={handleGoToPayments}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors"
            >
              View Payment Records (OTP Portal)
            </button>

            {onNavigateToMobileApp && (
              <button
                onClick={() => onNavigateToMobileApp(enrolledStudent.id)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Open Mobile Student App & Exam Results
              </button>
            )}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setEnrolledStudent(null);
                setFormData({
                  firstName: '',
                  lastName: '',
                  address: '',
                  mobileNo: '',
                  email: '',
                  nic: '',
                  school: '',
                  stream: 'Physical Science (Maths)',
                  academicYear: '2026 A/L',
                  selectedClasses: ['cls_maths_al'],
                });
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Enroll another student
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
