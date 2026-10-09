export type Role = 'admin' | 'staff';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export type StaffUser = UserAccount;

export interface TuitionClass {
  id: string;
  code: string;
  name: string;
  subject: string;
  gradeYear: string;
  teacher: string;
  monthlyFee: number;
  scheduleDay: string;
  scheduleTime: string;
  room: string;
  active: boolean;
}

export interface Student {
  id: string;
  regNo: string;
  firstName: string;
  lastName: string;
  address: string;
  mobileNo: string;
  email?: string;
  nic?: string;
  guardianName?: string;
  guardianPhone?: string;
  school?: string;
  stream: string;
  academicYear: string;
  enrolledClassIds: string[];
  qrToken: string;
  qrSignature: string;
  status: 'active' | 'deleted' | 'suspended';
  enrolledAt: string;
  deletedAt?: string;
  deleteReason?: string;
  photoUrl?: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'overridden';

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  monthYear: string; // e.g. "2026-09"
  amount: number;
  paymentDate: string; // ISO string
  method: 'cash' | 'bank_transfer' | 'card' | 'online';
  status: PaymentStatus;
  receiptNo: string;
  recordedBy: string;
  isOverride?: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  entryTimestamp: string; // ISO string
  exitTimestamp?: string; // ISO string
  scanToken: string;
  status: 'present' | 'late' | 'exited';
  paymentStatusAtScan: PaymentStatus;
  paymentOverridden: boolean;
  overrideNote?: string;
  scannedBy: string;
  scanMethod: 'camera' | 'usb_scanner' | 'manual';
}

export interface ExamSubjectGrade {
  subjectName: string;
  grade: 'A' | 'B' | 'C' | 'S' | 'F';
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  examType: 'A/L' | 'O/L';
  examYear: string;
  indexNumber: string;
  stream: string;
  districtRank?: number;
  islandRank?: number;
  zScore?: number;
  subjects: ExamSubjectGrade[];
  submittedAt: string;
  verified: boolean;
  verifiedBy?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  testTitle: string;
  testDate: string;
  maxMarks: number;
  marksObtained: number;
  gradeLetter: string;
  remarks?: string;
}

export interface PaymentReminder {
  id: string;
  studentId: string;
  studentName: string;
  mobileNo: string;
  classId: string;
  className: string;
  monthYear: string;
  amountDue: number;
  sentAt: string;
  status: 'delivered' | 'pending' | 'failed';
  channel: 'sms' | 'whatsapp';
  messageBody: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role | string;
  action: string;
  details: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'security';
  performedByName?: string;
  performedByRole?: string;
}
