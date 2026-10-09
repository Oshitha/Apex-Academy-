import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { Student, TuitionClass } from '../../types';
import { generateQrDataUrl } from '../../utils/qrRenderer';
import {
  UserPlus,
  Printer,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldCheck,
  CreditCard,
  School,
  Phone,
  BookOpen,
  X,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StudentManagement: React.FC = () => {
  const classes = storage.getClasses();
  const currentUser = storage.getCurrentUser();

  const [students, setStudents] = useState<Student[]>(storage.getStudents(true));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('active');

  // Modal States
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [printCardStudent, setPrintCardStudent] = useState<Student | null>(null);
  const [printQrUrl, setPrintQrUrl] = useState<string>('');
  const [deleteModalStudent, setDeleteModalStudent] = useState<Student | null>(null);
  const [deleteReason, setDeleteReason] = useState('Withdrawn upon parent request');

  // Enroll Form State
  const [enrollData, setEnrollData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    mobileNo: '',
    email: '',
    nic: '',
    school: '',
    stream: 'Physical Science (Maths)',
    academicYear: '2026 A/L',
    selectedClasses: [classes[0]?.id || 'cls_maths_al'],
  });

  const refreshList = () => {
    setStudents(storage.getStudents(true));
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData.firstName.trim() || !enrollData.lastName.trim() || !enrollData.mobileNo.trim()) {
      return;
    }

    const { student, token } = storage.enrollStudent({
      firstName: enrollData.firstName,
      lastName: enrollData.lastName,
      address: enrollData.address,
      mobileNo: enrollData.mobileNo,
      email: enrollData.email,
      nic: enrollData.nic,
      school: enrollData.school,
      stream: enrollData.stream,
      academicYear: enrollData.academicYear,
      enrolledClassIds: enrollData.selectedClasses,
    });

    confetti({ particleCount: 50, spread: 50 });
    setIsEnrollModalOpen(false);
    refreshList();

    // Automatically prompt printable physical card for this new student!
    const qrUrl = await generateQrDataUrl(token);
    setPrintCardStudent(student);
    setPrintQrUrl(qrUrl);
  };

  const handleDeleteConfirm = () => {
    if (!deleteModalStudent) return;
    storage.deleteStudent(deleteModalStudent.id, deleteReason);
    setDeleteModalStudent(null);
    refreshList();
  };

  const handleReEnroll = (studentId: string) => {
    storage.reEnrollStudent(studentId);
    refreshList();
  };

  const handleOpenPrintModal = async (student: Student) => {
    const qrUrl = await generateQrDataUrl(student.qrToken);
    setPrintCardStudent(student);
    setPrintQrUrl(qrUrl);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    if (statusFilter === 'active' && s.status !== 'active') return false;
    if (statusFilter === 'deleted' && s.status !== 'deleted') return false;

    if (selectedClassFilter !== 'all' && !s.enrolledClassIds.includes(selectedClassFilter)) {
      return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
      const matchReg = s.regNo.toLowerCase().includes(q);
      const matchPhone = s.mobileNo.includes(q);
      const matchSchool = s.school?.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchPhone && !matchSchool) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Administration</span>
            <span aria-hidden="true">·</span>
            <span>Student Registry & Multi-Class Lifecycle</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Student Management & Card Issuance
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Enroll New Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, Reg No (APT-2026-XXXX), mobile, school..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Tuition Subjects</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({students.filter(s => s.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('deleted')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'deleted' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Archived / Deleted ({students.filter(s => s.status === 'deleted').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                <th className="py-3 px-4 font-semibold">Student & ID</th>
                <th className="py-3 px-4 font-semibold">Contact & School</th>
                <th className="py-3 px-4 font-semibold">Stream & Batch</th>
                <th className="py-3 px-4 font-semibold">Enrolled Classes (Single QR)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {student.regNo}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-800 block">{student.mobileNo}</span>
                      <span className="text-slate-400 text-[11px] block">{student.school || 'Private'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-medium block">{student.stream}</span>
                      <span className="text-slate-400 text-[11px]">{student.academicYear}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {student.enrolledClassIds.map(cId => {
                          const cls = storage.getClassById(cId);
                          return (
                            <span
                              key={cId}
                              className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                            >
                              {cls ? cls.subject : cId}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-semibold capitalize inline-flex items-center gap-1 ${
                          student.status === 'active'
                            ? 'text-emerald-700'
                            : 'text-rose-600 line-through'
                        }`}
                      >
                        {student.status === 'active' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        {student.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {student.status === 'active' ? (
                          <>
                            <button
                              onClick={() => handleOpenPrintModal(student)}
                              title="Issue Printed Physical QR Card"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              Print QR Card
                            </button>
                            <button
                              onClick={() => setDeleteModalStudent(student)}
                              title="De-enroll / Delete Student"
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReEnroll(student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Re-enroll Student
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENROLL NEW STUDENT MODAL */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Direct Student Enrollment</h3>
                <p className="text-xs text-slate-500">
                  Register student and generate tamper-proof QR badge for immediate printout
                </p>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollData.firstName}
                    onChange={e => setEnrollData({ ...enrollData, firstName: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                    placeholder="Kasun"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollData.lastName}
                    onChange={e => setEnrollData({ ...enrollData, lastName: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                    placeholder="Perera"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Residential Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={enrollData.address}
                  onChange={e => setEnrollData({ ...enrollData, address: e.target.value })}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  placeholder="Street address, City"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={enrollData.mobileNo}
                    onChange={e => setEnrollData({ ...enrollData, mobileNo: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="0771234567"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">NIC Number</label>
                  <input
                    type="text"
                    value={enrollData.nic}
                    onChange={e => setEnrollData({ ...enrollData, nic: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="200612345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Current School</label>
                  <input
                    type="text"
                    value={enrollData.school}
                    onChange={e => setEnrollData({ ...enrollData, school: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                    placeholder="School Name"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Stream</label>
                  <select
                    value={enrollData.stream}
                    onChange={e => setEnrollData({ ...enrollData, stream: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Physical Science (Maths)">Physical Science (Maths)</option>
                    <option value="Biological Science">Biological Science</option>
                    <option value="Commerce & Accounting">Commerce & Accounting</option>
                    <option value="Technology">Technology</option>
                    <option value="Ordinary Level">Ordinary Level</option>
                  </select>
                </div>
              </div>

              {/* Multi-Class Registration Selection */}
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Select Enrolled Classes:
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {classes.map(cls => {
                    const checked = enrollData.selectedClasses.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setEnrollData({
                                  ...enrollData,
                                  selectedClasses: enrollData.selectedClasses.filter(
                                    id => id !== cls.id
                                  ),
                                });
                              } else {
                                setEnrollData({
                                  ...enrollData,
                                  selectedClasses: [...enrollData.selectedClasses, cls.id],
                                });
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-slate-800 font-medium">{cls.name}</span>
                        </div>
                        <span className="font-mono text-slate-500">
                          LKR {cls.monthlyFee.toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Enroll Student & Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PHYSICAL ID PASS CARD MODAL (For students without phones or desk issuance) */}
      {printCardStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Official Physical QR Card Issuance
                </h3>
                <p className="text-xs text-slate-500">
                  Ready for thermal badge or laminated ID card printing
                </p>
              </div>
              <button
                onClick={() => setPrintCardStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Physical Card Mockup */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold">
                    APEX TUITION ACADEMY
                  </span>
                  <h4 className="text-xs font-bold text-white leading-tight">Student Identity Card</h4>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  {printCardStudent.regNo}
                </span>
              </div>

              <div className="flex items-center gap-4 my-3">
                <div className="p-2 bg-white rounded-lg shrink-0">
                  {printQrUrl && (
                    <img
                      src={printQrUrl}
                      alt="Student QR Code"
                      className="w-28 h-28 object-contain"
                    />
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-sm font-bold text-white block">
                    {printCardStudent.firstName} {printCardStudent.lastName}
                  </span>
                  <span className="text-indigo-300 block">{printCardStudent.stream}</span>
                  <span className="text-[11px] text-slate-400 block">{printCardStudent.school}</span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Emergency: {printCardStudent.mobileNo}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                <span>Unique Cryptographic Token Valid Across All Classes</span>
                <span className="font-mono">{printCardStudent.academicYear}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = printQrUrl;
                  a.download = `QR_${printCardStudent.regNo}.png`;
                  a.click();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Physical Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STUDENT CONFIRMATION MODAL */}
      {deleteModalStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-rose-900 mb-2">Confirm Student De-enrollment</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to deactivate{' '}
              <strong>
                {deleteModalStudent.firstName} {deleteModalStudent.lastName}
              </strong>{' '}
              ({deleteModalStudent.regNo})? Their QR pass will immediately fail at attendance gates. You can re-enroll them at any time from the archives tab.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                De-enrollment Reason:
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModalStudent(null)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                De-enroll Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
