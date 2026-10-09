import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { PaymentRecord, Student, TuitionClass } from '../../types';
import { downloadFile } from '../../utils/qrRenderer';
import {
  CreditCard,
  BellRing,
  Download,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Receipt,
  PlusCircle,
  FileEdit,
  Send,
  MessageSquare,
  DollarSign,
  ShieldCheck,
  Clock,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentsManager: React.FC = () => {
  const classes = storage.getClasses();
  const students = storage.getStudents();
  const currentUser = storage.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'ledger' | 'reminders' | 'overrides'>('ledger');
  const [payments, setPayments] = useState<PaymentRecord[]>(storage.getAllPayments());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  // Manual Payment Entry Modal
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [amount, setAmount] = useState(classes[0]?.monthlyFee || 4500);
  const [method, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'online'>('cash');
  const [notes, setNotes] = useState('');

  // Automated Reminders
  const unpaidDues = storage.getUnpaidStudentsForCurrentMonth(selectedMonth);
  const [reminderDispatchedList, setReminderDispatchedList] = useState<
    { studentName: string; mobile: string; amount: number; message: string }[] | null
  >(null);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  const refreshPayments = () => {
    setPayments(storage.getAllPayments());
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedClassId) return;

    storage.recordPayment({
      studentId: selectedStudentId,
      classId: selectedClassId,
      monthYear: selectedMonth,
      amount,
      method,
      notes,
    });

    confetti({ particleCount: 40, spread: 50 });
    setIsNewPaymentModalOpen(false);
    refreshPayments();
  };

  const handleTriggerBatchReminders = () => {
    setIsSendingReminders(true);
    setTimeout(() => {
      const res = storage.triggerAutomatedReminders(selectedMonth);
      setReminderDispatchedList(res.reminders);
      setIsSendingReminders(false);
      confetti({ particleCount: 50, spread: 60 });
    }, 800);
  };

  const handleExportPaymentsCsv = () => {
    const csv = storage.exportPaymentsCsv();
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `Apex_Payments_Ledger_${today}.csv`);
  };

  // KPIs
  const totalCollected = payments
    .filter(p => p.monthYear === selectedMonth && (p.status === 'paid' || p.status === 'overridden'))
    .reduce((acc, p) => acc + p.amount, 0);

  const totalOutstanding = unpaidDues.reduce((acc, d) => acc + d.amountDue, 0);
  const totalOverrides = payments.filter(p => p.monthYear === selectedMonth && p.isOverride).length;

  const filteredPayments = payments.filter(p => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.className.toLowerCase().includes(q) ||
        p.receiptNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Treasury & Collections</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Financial Ledger & Dues Reminders</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Tuition Fees & Automated Reminders
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Record Fee Payment
          </button>
          <button
            onClick={handleExportPaymentsCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Ledger (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Fees Collected (Sep 2026)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              LKR {totalCollected.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Synced automatically with main database
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Outstanding Dues</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
              LKR {totalOutstanding.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {unpaidDues.length} {unpaidDues.length === 1 ? 'student' : 'students'} pending payment
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Manual Overrides Active</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-600 font-mono tabular-nums">
              {totalOverrides}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Merit scholarships & staff concession waivers
          </span>
        </div>
      </div>

      {/* Segmented Control Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 text-xs w-fit">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Transactions Ledger
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reminders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          Automated Reminders ({unpaidDues.length})
        </button>
        <button
          onClick={() => setActiveTab('overrides')}
          className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'overrides' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Manual Overrides ({payments.filter(p => p.isOverride).length})
        </button>
      </div>

      {/* TAB 1: TRANSACTIONS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search receipts, student name, class..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs font-mono text-slate-500">{filteredPayments.length} records</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                    <th className="py-3 px-4 font-semibold">Receipt No</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Tuition Class</th>
                    <th className="py-3 px-4 font-semibold">Month</th>
                    <th className="py-3 px-4 font-semibold">Amount (LKR)</th>
                    <th className="py-3 px-4 font-semibold">Method</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Collected By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600">{p.receiptNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.studentName}</td>
                      <td className="py-3 px-4 text-slate-700">{p.className}</td>
                      <td className="py-3 px-4 text-slate-600">{p.monthYear}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        LKR {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {p.method.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                            p.status === 'paid'
                              ? 'text-emerald-700'
                              : p.status === 'overridden'
                              ? 'text-indigo-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {p.status === 'paid' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                          {p.status === 'overridden' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                          {p.status.toUpperCase()}
                        </span>
                        {p.overrideReason && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                            {p.overrideReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{p.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Automated Payment Reminders Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detects students with outstanding tuition dues for {selectedMonth} and queues personalized SMS / WhatsApp alerts.
                </p>
              </div>

              <button
                onClick={handleTriggerBatchReminders}
                disabled={isSendingReminders || unpaidDues.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSendingReminders
                  ? 'Dispatching Alerts...'
                  : `Dispatch Automated Reminders (${unpaidDues.length} Pending)`}
              </button>
            </div>

            {/* Simulated Live Dispatch Confirmation */}
            {reminderDispatchedList && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    Successfully Dispatched {reminderDispatchedList.length} Automated Reminders via SMS & WhatsApp!
                  </span>
                </div>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2">
                  {reminderDispatchedList.map((r, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-emerald-100 text-[11px]">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{r.studentName} ({r.mobile})</span>
                        <span className="text-emerald-700 font-mono">DELIVERED</span>
                      </div>
                      <p className="text-slate-500 text-[10px] mt-0.5 italic">{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of Pending Due Students */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Students with Pending Fees ({unpaidDues.length})
              </h4>

              {unpaidDues.length === 0 ? (
                <div className="text-center py-8 text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100">
                  🎉 All enrolled students have settled tuition fees for {selectedMonth}!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {unpaidDues.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {item.student.firstName} {item.student.lastName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.classInfo.name} · Mobile: <strong className="font-mono text-slate-700">{item.student.mobileNo}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600 block">
                          LKR {item.amountDue.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold uppercase">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL OVERRIDES */}
      {activeTab === 'overrides' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Authorized Payment Overrides & Fee Concessions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and audit all cases where student attendance was authorized without standard payment processing.
            </p>
          </div>

          <div className="space-y-3">
            {payments
              .filter(p => p.isOverride)
              .map(ovr => (
                <div
                  key={ovr.id}
                  className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{ovr.studentName}</span>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        {ovr.receiptNo}
                      </span>
                    </div>
                    <span className="text-slate-600 block mt-0.5">{ovr.className} ({ovr.monthYear})</span>
                    <p className="text-slate-800 text-[11px] mt-2 italic bg-white p-2 rounded border border-indigo-100">
                      Reason: "{ovr.overrideReason}"
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-800 block text-xs">
                      Authorized by:
                    </span>
                    <span className="text-indigo-700 text-[11px] font-medium">{ovr.overriddenBy || ovr.recordedBy}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(ovr.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* RECORD NEW FEE PAYMENT MODAL */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Tuition Fee Payment</h3>
              <button
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Student:</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.regNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Subject / Tuition Class:</label>
                <select
                  value={selectedClassId}
                  onChange={e => {
                    setSelectedClassId(e.target.value);
                    const c = classes.find(item => item.id === e.target.value);
                    if (c) setAmount(c.monthlyFee);
                  }}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - LKR {c.monthlyFee.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Fee Amount (LKR):</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Month:</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Payment Method:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'card', 'bank_transfer', 'online'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 px-1 text-center rounded border capitalize font-medium ${
                        method === m
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
