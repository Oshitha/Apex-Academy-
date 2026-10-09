import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { AttendanceRecord, TuitionClass } from '../../types';
import { downloadFile } from '../../utils/qrRenderer';
import {
  Calendar,
  Search,
  Download,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  User,
  ShieldCheck,
  X,
} from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const classes = storage.getClasses();
  const [attendanceLogs] = useState<AttendanceRecord[]>(storage.getAttendanceLogs());

  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<AttendanceRecord[] | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');

  const filteredLogs = attendanceLogs.filter(log => {
    if (classFilter !== 'all' && log.classId !== classFilter) return false;
    if (dateFilter && log.date !== dateFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = log.studentName.toLowerCase().includes(q);
      const matchClass = log.className.toLowerCase().includes(q);
      const matchStaff = log.scannedBy.toLowerCase().includes(q);
      if (!matchName && !matchClass && !matchStaff) return false;
    }

    return true;
  });

  const handleExportCsv = () => {
    const csvContent = storage.exportAttendanceCsv();
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `Apex_Attendance_Audit_${today}.csv`);
  };

  const handleOpenStudentTrajectory = (studentId: string, studentName: string) => {
    const studentLogs = attendanceLogs.filter(a => a.studentId === studentId);
    setSelectedStudentHistory(studentLogs);
    setSelectedStudentName(studentName);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Audit & Verification</span>
            <span aria-hidden="true">·</span>
            <span>Gate Access Logs & Punctuality</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Daily Attendance & Entry/Exit Tracking
          </h1>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Attendance Audit (CSV)
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search individual student name or class session..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Tuition Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          />

          {(searchTerm || classFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setClassFilter('all');
                setDateFilter('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 whitespace-nowrap font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                <th className="py-3 px-4 font-semibold">Date & Time In</th>
                <th className="py-3 px-4 font-semibold">Time Out</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Class / Subject</th>
                <th className="py-3 px-4 font-semibold">Payment Status</th>
                <th className="py-3 px-4 font-semibold">Scanned By Staff</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-900 block">{record.date}</span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(record.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {record.exitTimestamp ? (
                        <span className="text-emerald-700 font-semibold">
                          {new Date(record.exitTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">In Session</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{record.studentName}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {record.className}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold capitalize ${
                          record.paymentStatusAtScan === 'paid'
                            ? 'text-emerald-700'
                            : record.paymentStatusAtScan === 'overridden'
                            ? 'text-indigo-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {record.paymentStatusAtScan === 'paid' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        {record.paymentStatusAtScan === 'overridden' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                        {record.paymentStatusAtScan === 'overdue' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {record.paymentStatusAtScan}
                      </span>
                      {record.paymentOverridden && (
                        <span className="block text-[10px] text-indigo-500 truncate max-w-xs">
                          {record.overrideNote}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {record.scannedBy}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudentTrajectory(record.studentId, record.studentName)}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold hover:underline"
                      >
                        Entry/Exit History →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIVIDUAL STUDENT ENTRY & EXIT TRAJECTORY MODAL */}
      {selectedStudentHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Individual Entry & Exit Trajectory
                </h3>
                <p className="text-xs text-slate-500">
                  Historical attendance timeline for <strong>{selectedStudentName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
              {selectedStudentHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{item.className}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{item.date}</span>
                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                      <span className="text-slate-700">
                        Arrival:{' '}
                        <strong className="font-mono text-slate-900">
                          {new Date(item.entryTimestamp).toLocaleTimeString()}
                        </strong>
                      </span>
                      {item.exitTimestamp ? (
                        <span className="text-slate-700">
                          Departure:{' '}
                          <strong className="font-mono text-emerald-700">
                            {new Date(item.exitTimestamp).toLocaleTimeString()}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">No exit scan logged</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        item.paymentStatusAtScan === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {item.paymentStatusAtScan}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Scanned by: {item.scannedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right mt-3">
              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
