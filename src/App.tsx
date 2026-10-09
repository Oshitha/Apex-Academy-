/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { storage } from './services/storage';
import { StaffUser } from './types';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentRegistrationPage } from './components/public/StudentRegistrationPage';
import { StudentPaymentPortal } from './components/public/StudentPaymentPortal';
import { StudentMobileApp } from './components/student/StudentMobileApp';
import { LoginModal } from './components/auth/LoginModal';
import {
  ShieldCheck,
  UserPlus,
  Receipt,
  Smartphone,
  Lock,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export type AppView = 'admin' | 'public_register' | 'public_payments' | 'student_mobile';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('admin');
  const [currentUser, setCurrentUser] = useState<StaffUser>(storage.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetStudentIdForMobile, setTargetStudentIdForMobile] = useState<string | undefined>();

  const handleLoginSuccess = (user: StaffUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(storage.getCurrentUser());
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Universal Mode / Link Switcher Banner */}
      <div className="bg-slate-950 text-slate-300 border-b border-slate-800 text-xs py-2 px-4 shadow-sm z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Apex Tuition Academy OS</span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">
              Interactive System Views & Direct Public Portals
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin & Staff Dashboard
            </button>

            <button
              onClick={() => setCurrentView('public_register')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'public_register'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Student Registration Link
            </button>

            <button
              onClick={() => setCurrentView('public_payments')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'public_payments'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Student Payment Portal (OTP)
            </button>

            <button
              onClick={() => setCurrentView('student_mobile')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'student_mobile'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Student Mobile App
            </button>
          </div>
        </div>
      </div>

      {/* Main View Portals */}
      <div className="flex-1">
        {currentView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenMobileApp={() => setCurrentView('student_mobile')}
            onOpenPublicEnrollment={() => setCurrentView('public_register')}
            onOpenPaymentPortal={() => setCurrentView('public_payments')}
          />
        )}

        {currentView === 'public_register' && (
          <div className="py-8 bg-slate-50 min-h-full">
            <StudentRegistrationPage
              onViewPaymentPortal={() => setCurrentView('public_payments')}
            />
          </div>
        )}

        {currentView === 'public_payments' && (
          <div className="py-8 bg-slate-50 min-h-full">
            <StudentPaymentPortal
              onBackToRegistration={() => setCurrentView('public_register')}
              onNavigateToMobileApp={id => {
                setTargetStudentIdForMobile(id);
                setCurrentView('student_mobile');
              }}
            />
          </div>
        )}

        {currentView === 'student_mobile' && (
          <div className="py-6 bg-slate-950/90 min-h-screen">
            <StudentMobileApp
              initialStudentId={targetStudentIdForMobile}
              onBackToAdmin={() => setCurrentView('admin')}
            />
          </div>
        )}
      </div>

      {/* Login Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
