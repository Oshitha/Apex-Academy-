import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { AuditLog } from '../../types';
import { downloadFile } from '../../utils/qrRenderer';
import {
  Shield,
  Download,
  Search,
  Filter,
  UserCheck,
  Clock,
  AlertTriangle,
  FileText,
  Key,
} from 'lucide-react';

export const AuditLogsViewer: React.FC = () => {
  const [logs] = useState<AuditLog[]>(storage.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = (log.performedByName || log.actorName || '').toLowerCase();
      return (
        name.includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportAuditCsv = () => {
    const header = 'ID,Timestamp,Action,User,Role,Details,IPAddress\n';
    const rows = logs
      .map(
        l =>
          `"${l.id}","${l.timestamp}","${l.action}","${l.performedByName || l.actorName}","${l.performedByRole || l.actorRole}","${l.details.replace(/"/g, '""')}","${l.ipAddress || '192.168.1.10'}"`
      )
      .join('\n');
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(header + rows, `Apex_Security_Audit_Logs_${today}.csv`);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('OVERRIDE')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (action.includes('SECURITY_ALERT') || action.includes('DELETE'))
      return 'bg-rose-100 text-rose-800 border-rose-200';
    if (action.includes('PAYMENT')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Governance & Security</span>
            <span aria-hidden="true">·</span>
            <span>Immutable Regulatory Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            System Security & Activity Audit Logs
          </h1>
        </div>

        <button
          onClick={handleExportAuditCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by staff name, action keyword, student ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Event Types</option>
            <option value="ATTENDANCE_SCAN">Attendance Scans</option>
            <option value="PAYMENT_RECORDED">Fee Payments Recorded</option>
            <option value="PAYMENT_OVERRIDE">Payment Overrides</option>
            <option value="STUDENT_ENROLL">Student Enrollments</option>
            <option value="STUDENT_DELETED">Student De-enrollments</option>
            <option value="SECURITY_ALERT">Security Alerts</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Operator / Role</th>
                <th className="py-3 px-4 font-semibold">Action Type</th>
                <th className="py-3 px-4 font-semibold">Event Description & Parameters</th>
                <th className="py-3 px-4 font-semibold text-right">IP Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {log.performedByName || log.actorName}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {log.performedByRole || log.actorRole}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <p className="leading-relaxed">{log.details}</p>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-right whitespace-nowrap">
                      {log.ipAddress || '192.168.1.10'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
