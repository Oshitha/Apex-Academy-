import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { StaffUser } from '../../types';
import { AttendanceScanner } from '../attendance/AttendanceScanner';
import { StudentManagement } from './StudentManagement';
import { AttendanceHistory } from './AttendanceHistory';
import { PaymentsManager } from './PaymentsManager';
import { AcademicsManager } from './AcademicsManager';
import { AuditLogsViewer } from './AuditLogsViewer';
import {
  QrCode,
  Users,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  ShieldAlert,
  LogOut,
  Smartphone,
  ExternalLink,
  Receipt,
  UserCheck,
  Key,
} from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onLogout: () => void;
  onOpenMobileApp: () => void;
  onOpenPublicEnrollment: () => void;
  onOpenPaymentPortal: () => void;
}

export type AdminTab = 'scanner' | 'students' | 'attendance' | 'payments' | 'academics' | 'audit';

export const AdminDashboard: React.FC<Props> = ({
  currentUser,
  onLogout,
  onOpenMobileApp,
  onOpenPublicEnrollment,
  onOpenPaymentPortal,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('scanner');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Academy Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-white">APEX TUITION ACADEMY</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    Admin OS
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  Registration, Real-Time QR Gate Attendance & Fee Compliance
                </span>
              </div>
            </div>

            {/* Quick External Views & User Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
                <button
                  onClick={onOpenPublicEnrollment}
                  className="px-2.5 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  Public Enrollment Form
                </button>
                <button
                  onClick={onOpenPaymentPortal}
                  className="px-2.5 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  Student Payment Verification (OTP)
                </button>
                <button
                  onClick={onOpenMobileApp}
                  className="px-2.5 py-1 text-indigo-300 hover:text-white rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile Student App
                </button>
              </div>

              {/* Logged in user chip */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-white block">{currentUser.name}</span>
                  <span className="text-[10px] uppercase font-mono text-emerald-400">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none text-xs">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === 'scanner'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Arrival Gate Scanner
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Students & QR Badges
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              Attendance & Trajectory
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === 'payments'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Fees & Reminders
            </button>

            <button
              onClick={() => setActiveTab('academics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === 'academics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Grading & AL/OL Results
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Audit Trail
            </button>
          </nav>
        </div>
      </header>

      {/* Main Tab Content View */}
      <main className="flex-1 pb-16">
        {activeTab === 'scanner' && <AttendanceScanner />}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'attendance' && <AttendanceHistory />}
        {activeTab === 'payments' && <PaymentsManager />}
        {activeTab === 'academics' && <AcademicsManager />}
        {activeTab === 'audit' && <AuditLogsViewer />}
      </main>
    </div>
  );
};
