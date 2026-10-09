import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { Student, PaymentRecord } from '../../types';
import { ShieldCheck, Phone, KeyRound, ArrowRight, Receipt, CheckCircle, Clock, AlertCircle, Printer, X, Download } from 'lucide-react';

interface Props {
  onBackToRegistration: () => void;
  onNavigateToMobileApp?: (studentId: string) => void;
}

export const StudentPaymentPortal: React.FC<Props> = ({ onBackToRegistration, onNavigateToMobileApp }) => {
  const [step, setStep] = useState<'enter_mobile' | 'enter_otp' | 'view_payments'>('enter_mobile');
  const [mobileNo, setMobileNo] = useState('');
  const [otp, setOtp] = useState('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Authenticated student data
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mobileNo.trim()) {
      setError('Please enter your registered mobile number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = storage.requestStudentOtp(mobileNo);
    setIsLoading(false);

    if (res.success) {
      setDispatchedOtp(res.testOtp || '888888');
      setOtp(res.testOtp || '');
      setStep('enter_otp');
    } else {
      setError(res.message);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = storage.verifyStudentOtp(mobileNo, otp);
    setIsLoading(false);

    if (res.success && res.student) {
      setStudent(res.student);
      setPayments(res.payments || []);
      setStep('view_payments');
    } else {
      setError(res.message);
    }
  };

  const fillDemoNumber = (num: string) => {
    setMobileNo(num);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-indigo-600 mb-2">
          <span>Student Self-Service Portal</span>
          <span aria-hidden="true">·</span>
          <span>Payment & Receipt Verification</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Student Fee & Payment History
        </h1>
        <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
          Verify your identity via mobile OTP to view monthly tuition payments, outstanding fees, and official digital receipts.
        </p>
      </div>

      {step === 'enter_mobile' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto mb-4">
            <Phone className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 text-center mb-1">Enter Registered Mobile</h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            We will send a one-time verification passcode (OTP) to your phone.
          </p>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0771234567"
                value={mobileNo}
                onChange={e => {
                  setMobileNo(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Numbers */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-500 font-medium block mb-1.5">Quick Test Accounts:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoNumber('0771234567')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:border-indigo-400 rounded text-slate-700 font-mono text-[11px] transition-colors"
                >
                  Kasun (0771234567)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoNumber('0719876543')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:border-indigo-400 rounded text-slate-700 font-mono text-[11px] transition-colors"
                >
                  Dilani (0719876543)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoNumber('0765551234')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:border-indigo-400 rounded text-slate-700 font-mono text-[11px] transition-colors"
                >
                  Tharindu (0765551234)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? 'Sending Passcode...' : 'Send Verification OTP'}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={onBackToRegistration}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to New Student Enrollment
            </button>
          </div>
        </div>
      )}

      {step === 'enter_otp' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 text-center mb-1">Enter 6-Digit OTP</h2>
          <p className="text-xs text-slate-500 text-center mb-4">
            Sent to <span className="font-semibold text-slate-700 font-mono">{mobileNo}</span>
          </p>

          {dispatchedOtp && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 mb-5 flex items-center justify-between">
              <div>
                <span className="font-semibold block">SMS Simulation Dispatch:</span>
                <span>Your code is <strong className="font-mono text-indigo-700 font-bold tracking-wider">{dispatchedOtp}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(dispatchedOtp)}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
              >
                Auto-fill
              </button>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                className="w-full px-3 py-2.5 text-center text-lg tracking-widest font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP & View Payments'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('enter_mobile')}
                className="text-slate-500 hover:text-slate-800"
              >
                Change Number
              </button>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Resend OTP
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'view_payments' && student && (
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.firstName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-indigo-600">
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {student.firstName} {student.lastName}
                  </h2>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {student.regNo}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{student.stream}</span>
                  <span aria-hidden="true">·</span>
                  <span>{student.academicYear}</span>
                  <span aria-hidden="true">·</span>
                  <span>{student.mobileNo}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              {onNavigateToMobileApp && (
                <button
                  onClick={() => onNavigateToMobileApp(student.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Open Mobile Student App
                </button>
              )}
              <button
                onClick={() => {
                  setStep('enter_mobile');
                  setStudent(null);
                  setPayments([]);
                }}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Enrolled Classes Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Enrolled Academic Subjects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {student.enrolledClassIds.map(cId => {
                const cls = storage.getClassById(cId);
                const currentMonthStatus = storage.getStudentPaymentStatus(student.id, cId, '2026-09');
                return (
                  <div key={cId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs font-bold text-slate-900 block">{cls ? cls.name : cId}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{cls ? cls.teacher : ''}</span>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Sep 2026 Status:</span>
                      <span
                        className={`font-semibold ${
                          currentMonthStatus.status === 'paid'
                            ? 'text-emerald-600'
                            : currentMonthStatus.status === 'overridden'
                            ? 'text-indigo-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {currentMonthStatus.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment History Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Official Payment History</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified payment transactions and official payment vouchers
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {payments.length} {payments.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">No payment records found yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tuition fees can be paid at the front desk counter upon class arrival.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                      <th className="py-2.5 px-3 font-semibold">Month</th>
                      <th className="py-2.5 px-3 font-semibold">Tuition Class / Subject</th>
                      <th className="py-2.5 px-3 font-semibold">Amount (LKR)</th>
                      <th className="py-2.5 px-3 font-semibold">Payment Date</th>
                      <th className="py-2.5 px-3 font-semibold">Method</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-900">{pay.monthYear}</td>
                        <td className="py-3 px-3 text-slate-700">{pay.className}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 tabular-nums">
                          LKR {pay.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {new Date(pay.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-slate-600 capitalize">
                          {pay.method.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              pay.status === 'paid'
                                ? 'text-emerald-700'
                                : pay.status === 'overridden'
                                ? 'text-indigo-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {pay.status === 'paid' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                            {pay.status === 'overridden' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                            {pay.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {pay.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedReceipt(pay)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            {pay.receiptNo}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-200 pb-4 mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">APEX TUITION ACADEMY</span>
              <h3 className="text-base font-bold text-slate-900">Official Fee Receipt</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Voucher: {selectedReceipt.receiptNo}</p>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Subject / Class:</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.className}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Academic Month:</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.monthYear}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(selectedReceipt.paymentDate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {selectedReceipt.method.replace('_', ' ')}
                </span>
              </div>
              {selectedReceipt.isOverride && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-900">
                  <span className="font-semibold block">Administrative Concession / Override:</span>
                  <span className="text-[11px]">{selectedReceipt.overrideReason}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-900">Total Amount Paid:</span>
                <span className="text-base font-bold text-indigo-600 font-mono tabular-nums">
                  LKR {selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Voucher
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
