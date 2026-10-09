import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { ExamResult, GradeRecord, TuitionClass, Student } from '../../types';
import {
  GraduationCap,
  Award,
  BookOpen,
  Search,
  PlusCircle,
  Filter,
  CheckCircle,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AcademicsManager: React.FC = () => {
  const classes = storage.getClasses();
  const students = storage.getStudents();
  const [examResults, setExamResults] = useState<ExamResult[]>(storage.getExamResults());
  const [grades, setGrades] = useState<GradeRecord[]>(storage.getGrades());

  const [activeTab, setActiveTab] = useState<'exam_results' | 'unit_tests'>('exam_results');
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'A/L' | 'O/L'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Grade Modal State
  const [isAddGradeModalOpen, setIsAddGradeModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [testTitle, setTestTitle] = useState('Monthly Evaluation Paper 04');
  const [maxMarks, setMaxMarks] = useState(100);
  const [marksObtained, setMarksObtained] = useState(85);
  const [gradeLetter, setGradeLetter] = useState('A');
  const [remarks, setRemarks] = useState('Excellent problem solving presentation');

  const refreshData = () => {
    setExamResults(storage.getExamResults());
    setGrades(storage.getGrades());
  };

  const handleAddGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = storage.getStudentById(selectedStudentId);
    const cls = storage.getClassById(selectedClassId);
    if (!student || !cls) return;

    storage.addGradeRecord({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      classId: cls.id,
      className: cls.name,
      testTitle,
      testDate: new Date().toISOString().slice(0, 10),
      maxMarks,
      marksObtained,
      gradeLetter,
      remarks,
    });

    confetti({ particleCount: 40, spread: 50 });
    setIsAddGradeModalOpen(false);
    refreshData();
  };

  const filteredExamResults = examResults.filter(r => {
    if (examTypeFilter !== 'all' && r.examType !== examTypeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.indexNumber.toLowerCase().includes(q) ||
        r.stream.toLowerCase().includes(q)
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
            <span>Academic Performance</span>
            <span aria-hidden="true">·</span>
            <span>A/L & O/L Exam Submissions & Continuous Assessments</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Grading & National Examination Results
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddGradeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Enter Unit Test Marks
          </button>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 text-xs w-fit">
        <button
          onClick={() => setActiveTab('exam_results')}
          className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'exam_results' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          A/L & O/L Official Results ({examResults.length})
        </button>
        <button
          onClick={() => setActiveTab('unit_tests')}
          className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'unit_tests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Assessment Gradebook ({grades.length})
        </button>
      </div>

      {/* TAB 1: EXAM RESULTS DIRECTORY */}
      {activeTab === 'exam_results' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name, exam index number, stream..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={examTypeFilter}
                onChange={e => setExamTypeFilter(e.target.value as 'all' | 'A/L' | 'O/L')}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700"
              >
                <option value="all">All Examinations</option>
                <option value="A/L">G.C.E. Advanced Level (A/L)</option>
                <option value="O/L">G.C.E. Ordinary Level (O/L)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExamResults.map(res => (
              <div
                key={res.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                      {res.examType} Examination ({res.examYear})
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{res.studentName}</h3>
                    <span className="text-xs text-slate-500 font-mono">Index No: {res.indexNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Submitted from Mobile
                    </span>
                  </div>
                </div>

                <div className="py-3">
                  <span className="text-[11px] font-medium text-slate-500 block mb-2">
                    Subject Grades Breakdown:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {res.subjects.map((subj, i) => (
                      <div
                        key={i}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-700 truncate pr-2">{subj.subjectName}</span>
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${
                            subj.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : subj.grade === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : subj.grade === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {subj.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {res.zScore !== undefined && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Z-Score</span>
                      <span className="text-sm font-bold text-indigo-700">{res.zScore.toFixed(4)}</span>
                    </div>
                    {res.districtRank && (
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block">District Rank</span>
                        <span className="text-sm font-bold text-slate-900">#{res.districtRank}</span>
                      </div>
                    )}
                    {res.islandRank && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Island Rank</span>
                        <span className="text-sm font-bold text-amber-600">#{res.islandRank}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CONTINUOUS ASSESSMENT GRADEBOOK */}
      {activeTab === 'unit_tests' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                  <th className="py-3 px-4 font-semibold">Test Title & Date</th>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Tuition Class</th>
                  <th className="py-3 px-4 font-semibold">Marks</th>
                  <th className="py-3 px-4 font-semibold">Grade</th>
                  <th className="py-3 px-4 font-semibold">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{g.testTitle}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{g.testDate}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{g.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{g.className}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {g.marksObtained} / {g.maxMarks}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">
                        {g.gradeLetter}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic">{g.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD UNIT TEST MARKS MODAL */}
      {isAddGradeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Enter Student Test Grade</h3>
              <button
                onClick={() => setIsAddGradeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGradeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Student:</label>
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
                <label className="block font-medium text-slate-700 mb-1">Tuition Subject:</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Test Title / Paper:</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Obtained Marks:</label>
                  <input
                    type="number"
                    value={marksObtained}
                    onChange={e => setMarksObtained(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Marks:</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={e => setMaxMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Grade Letter:</label>
                  <select
                    value={gradeLetter}
                    onChange={e => setGradeLetter(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="S">S</option>
                    <option value="F">F</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Teacher Remarks:</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Outstanding speed and presentation"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddGradeModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Grade Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
