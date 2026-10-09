import {
  Student,
  TuitionClass,
  PaymentRecord,
  AttendanceRecord,
  ExamResult,
  GradeRecord,
  AuditLog,
  UserAccount,
  PaymentStatus,
  Role,
} from '../types';
import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_EXAM_RESULTS,
  INITIAL_GRADES,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
} from '../data/seedData';
import { generateSecureStudentQrToken, verifyQrToken } from '../utils/cryptoSecurity';

const STORAGE_KEYS = {
  CLASSES: 'apex_classes_v2',
  STUDENTS: 'apex_students_v2',
  PAYMENTS: 'apex_payments_v2',
  ATTENDANCE: 'apex_attendance_v2',
  EXAM_RESULTS: 'apex_exam_results_v2',
  GRADES: 'apex_grades_v2',
  AUDIT_LOGS: 'apex_audit_logs_v2',
  CURRENT_USER: 'apex_current_user_v2',
  OTP_SESSIONS: 'apex_otp_sessions_v2',
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

class StorageService {
  private classes: TuitionClass[];
  private students: Student[];
  private payments: PaymentRecord[];
  private attendance: AttendanceRecord[];
  private examResults: ExamResult[];
  private grades: GradeRecord[];
  private auditLogs: AuditLog[];
  private currentUser: UserAccount;
  private otpSessions: Record<string, { otp: string; studentId: string; expiresAt: number }>;

  constructor() {
    this.classes = loadFromStorage(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    this.students = loadFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.payments = loadFromStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    this.attendance = loadFromStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    this.examResults = loadFromStorage(STORAGE_KEYS.EXAM_RESULTS, INITIAL_EXAM_RESULTS);
    this.grades = loadFromStorage(STORAGE_KEYS.GRADES, INITIAL_GRADES);
    this.auditLogs = loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.currentUser = loadFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    this.otpSessions = {};
  }

  // Auth & Roles
  getCurrentUser(): UserAccount {
    return this.currentUser;
  }

  setCurrentUser(role: Role): UserAccount {
    const user = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    this.currentUser = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit(
      'USER_SWITCH',
      `Switched active user profile to ${user.name} (${user.role.toUpperCase()})`,
      'info'
    );
    return user;
  }

  login(username: string, password?: string): { success: boolean; user?: UserAccount; message: string } {
    const clean = username.trim().toLowerCase();
    let matched = INITIAL_USERS.find(
      u => u.email.toLowerCase().includes(clean) || u.role.toLowerCase() === clean
    );
    if (!matched && clean === 'staff') {
      matched = INITIAL_USERS.find(u => u.role === 'staff');
    }
    if (!matched && clean === 'admin') {
      matched = INITIAL_USERS.find(u => u.role === 'admin');
    }
    if (!matched && (clean === 'teacher' || clean.includes('nimal'))) {
      matched = {
        id: 'usr_teacher',
        name: 'Dr. Nimal Gamage',
        email: 'teacher@apexacademy.edu.lk',
        role: 'staff',
        avatarUrl: '',
      };
    }
    if (!matched) {
      matched = INITIAL_USERS[0];
    }
    this.currentUser = matched;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, matched);
    this.logAudit('USER_LOGIN', `Authenticated user ${matched.name} (${matched.role.toUpperCase()})`, 'info');
    return { success: true, user: matched, message: 'Authentication successful' };
  }

  logout(): void {
    const guestUser: UserAccount = {
      id: 'usr_guest',
      name: 'Staff On-Duty',
      email: 'staff@apexacademy.edu.lk',
      role: 'staff',
    };
    this.currentUser = guestUser;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, guestUser);
    this.logAudit('USER_LOGOUT', 'User session terminated', 'info');
  }

  // Classes
  getClasses(): TuitionClass[] {
    return this.classes.filter(c => c.active);
  }

  getClassById(id: string): TuitionClass | undefined {
    return this.classes.find(c => c.id === id);
  }

  // Students
  getStudents(includeDeleted = false): Student[] {
    if (includeDeleted) return [...this.students];
    return this.students.filter(s => s.status !== 'deleted');
  }

  getStudentById(id: string): Student | undefined {
    return this.students.find(s => s.id === id);
  }

  getStudentByMobile(mobile: string): Student | undefined {
    const cleanMobile = mobile.replace(/\D/g, '');
    return this.students.find(s => s.status !== 'deleted' && s.mobileNo.replace(/\D/g, '') === cleanMobile);
  }

  getStudentByRegNo(regNo: string): Student | undefined {
    return this.students.find(s => s.regNo.toLowerCase() === regNo.trim().toLowerCase());
  }

  enrollStudent(data: {
    firstName: string;
    lastName: string;
    address: string;
    mobileNo: string;
    email?: string;
    nic?: string;
    school?: string;
    stream: string;
    academicYear: string;
    enrolledClassIds: string[];
  }): { student: Student; token: string } {
    const id = `std_${Date.now()}`;
    const nextSeq = this.students.length + 101;
    const yearCode = new Date().getFullYear();
    const regNo = `APT-${yearCode}-${String(nextSeq).padStart(4, '0')}`;

    const { token, signature } = generateSecureStudentQrToken(id, regNo);

    const newStudent: Student = {
      id,
      regNo,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      address: data.address.trim(),
      mobileNo: data.mobileNo.trim(),
      email: data.email?.trim() || '',
      nic: data.nic?.trim() || '',
      guardianName: `${data.lastName.trim()} Senior`,
      guardianPhone: data.mobileNo.trim(),
      school: data.school?.trim() || 'Unspecified',
      stream: data.stream,
      academicYear: data.academicYear,
      enrolledClassIds: data.enrolledClassIds,
      qrToken: token,
      qrSignature: signature,
      status: 'active',
      enrolledAt: new Date().toISOString(),
      photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.firstName + ' ' + data.lastName)}&backgroundColor=0284c7,4f46e5,0d9488`,
    };

    this.students.unshift(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    this.logAudit(
      'STUDENT_ENROLLED',
      `New student ${newStudent.firstName} ${newStudent.lastName} (${newStudent.regNo}) enrolled in ${data.enrolledClassIds.length} classes. Cryptographic QR generated.`,
      'info'
    );

    return { student: newStudent, token };
  }

  deleteStudent(studentId: string, reason = 'Administrative de-enrollment'): boolean {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return false;

    student.status = 'deleted';
    student.deletedAt = new Date().toISOString();
    student.deleteReason = reason;

    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    this.logAudit(
      'STUDENT_DELETED',
      `Student ${student.firstName} ${student.lastName} (${student.regNo}) deleted. Reason: ${reason}`,
      'warning'
    );

    return true;
  }

  reEnrollStudent(studentId: string): Student | null {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return null;

    student.status = 'active';
    delete student.deletedAt;
    delete student.deleteReason;

    // Regenerate fresh signature for safety
    const { token, signature } = generateSecureStudentQrToken(student.id, student.regNo);
    student.qrToken = token;
    student.qrSignature = signature;

    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    this.logAudit(
      'STUDENT_REENROLLED',
      `Student ${student.firstName} ${student.lastName} (${student.regNo}) re-enrolled with fresh QR certificate.`,
      'info'
    );

    return student;
  }

  updateStudentClasses(studentId: string, classIds: string[]): Student | null {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return null;

    student.enrolledClassIds = classIds;
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    this.logAudit(
      'CLASSES_UPDATED',
      `Updated class enrollments for ${student.firstName} ${student.lastName}: ${classIds.length} classes enrolled.`,
      'info'
    );

    return student;
  }

  // Payment Status Resolution
  getStudentPaymentStatus(studentId: string, classId: string, monthYear = '2026-09'): {
    status: PaymentStatus;
    payment?: PaymentRecord;
    monthlyFee: number;
  } {
    const cls = this.getClassById(classId);
    const monthlyFee = cls ? cls.monthlyFee : 4000;

    const record = this.payments.find(
      p => p.studentId === studentId && p.classId === classId && p.monthYear === monthYear
    );

    if (!record) {
      return { status: 'pending', monthlyFee };
    }

    return {
      status: record.status,
      payment: record,
      monthlyFee: record.amount,
    };
  }

  getStudentPayments(studentId: string): PaymentRecord[] {
    return this.payments
      .filter(p => p.studentId === studentId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  getAllPayments(): PaymentRecord[] {
    return [...this.payments].sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }

  recordPayment(data: {
    studentId: string;
    classId: string;
    monthYear: string;
    amount: number;
    method: 'cash' | 'bank_transfer' | 'card' | 'online';
    notes?: string;
  }): PaymentRecord {
    const student = this.getStudentById(data.studentId);
    const cls = this.getClassById(data.classId);

    const receiptNo = `REC-${data.monthYear.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      studentId: data.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
      classId: data.classId,
      className: cls ? cls.name : 'Tuition Class',
      monthYear: data.monthYear,
      amount: data.amount,
      paymentDate: new Date().toISOString(),
      method: data.method,
      status: 'paid',
      receiptNo,
      recordedBy: this.currentUser.name,
      notes: data.notes,
    };

    // Replace if there was an existing record for this month
    const existingIndex = this.payments.findIndex(
      p => p.studentId === data.studentId && p.classId === data.classId && p.monthYear === data.monthYear
    );

    if (existingIndex >= 0) {
      this.payments[existingIndex] = newPayment;
    } else {
      this.payments.unshift(newPayment);
    }

    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    this.logAudit(
      'PAYMENT_RECORDED',
      `Payment of LKR ${data.amount.toLocaleString()} received for ${newPayment.studentName} (${newPayment.className} - ${data.monthYear}) via ${data.method.toUpperCase()}. Receipt: ${receiptNo}`,
      'info'
    );

    return newPayment;
  }

  overridePayment(data: {
    studentId: string;
    classId: string;
    monthYear: string;
    reason: string;
  }): PaymentRecord {
    const student = this.getStudentById(data.studentId);
    const cls = this.getClassById(data.classId);
    const monthlyFee = cls ? cls.monthlyFee : 4000;
    const receiptNo = `OVR-${data.monthYear.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const overridePayment: PaymentRecord = {
      id: `pay_ovr_${Date.now()}`,
      studentId: data.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      classId: data.classId,
      className: cls ? cls.name : 'Tuition Class',
      monthYear: data.monthYear,
      amount: monthlyFee,
      paymentDate: new Date().toISOString(),
      method: 'cash',
      status: 'overridden',
      receiptNo,
      recordedBy: this.currentUser.name,
      isOverride: true,
      overriddenBy: `${this.currentUser.name} (${this.currentUser.role.toUpperCase()})`,
      overrideReason: data.reason,
    };

    const existingIndex = this.payments.findIndex(
      p => p.studentId === data.studentId && p.classId === data.classId && p.monthYear === data.monthYear
    );

    if (existingIndex >= 0) {
      this.payments[existingIndex] = overridePayment;
    } else {
      this.payments.unshift(overridePayment);
    }

    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    this.logAudit(
      'PAYMENT_OVERRIDE_ADMIN',
      `Manual Payment Override granted for ${overridePayment.studentName} (${overridePayment.className}). Reason: "${data.reason}" by ${this.currentUser.name}`,
      'warning'
    );

    return overridePayment;
  }

  // Attendance & Verification
  getAttendanceLogs(): AttendanceRecord[] {
    return [...this.attendance].sort(
      (a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime()
    );
  }

  processQrAttendanceScan(params: {
    rawQrToken: string;
    targetClassId?: string; // If staff selected specific class, or auto-pick student's enrolled class
    scanMethod?: 'camera' | 'usb_scanner' | 'manual';
  }): {
    success: boolean;
    student?: Student;
    classInfo?: TuitionClass;
    attendanceRecord?: AttendanceRecord;
    paymentStatus?: PaymentStatus;
    paymentDetails?: PaymentRecord;
    message: string;
    isDoubleScan?: boolean;
    isExitLogged?: boolean;
    isIntegrityFailure?: boolean;
    requiresOverride?: boolean;
  } {
    const method = params.scanMethod || 'camera';

    // 1. Verify Cryptographic Integrity
    const verification = verifyQrToken(params.rawQrToken);

    if (!verification.valid) {
      this.logAudit(
        'SECURITY_ALERT_TAMPERED_QR',
        `FAILED QR Scan: ${verification.errorReason}. Payload snippet: "${params.rawQrToken.slice(0, 45)}"`,
        'security'
      );
      return {
        success: false,
        isIntegrityFailure: true,
        message: verification.errorReason || 'Cryptographic integrity check failed! Counterfeit or altered QR code.',
      };
    }

    // 2. Find Student
    const student = this.getStudentById(verification.studentId!);
    if (!student) {
      this.logAudit(
        'SCAN_STUDENT_NOT_FOUND',
        `QR token belongs to deleted or unknown student ID "${verification.studentId}"`,
        'warning'
      );
      return {
        success: false,
        message: 'Student account not found or has been deactivated.',
      };
    }

    if (student.status === 'deleted') {
      return {
        success: false,
        message: `Student account ${student.regNo} has been deleted. Please re-enroll from Admin panel.`,
      };
    }

    // 3. Resolve Class
    let targetClass: TuitionClass | undefined;
    if (params.targetClassId) {
      targetClass = this.getClassById(params.targetClassId);
    } else if (student.enrolledClassIds.length > 0) {
      targetClass = this.getClassById(student.enrolledClassIds[0]);
    }

    if (!targetClass) {
      return {
        success: false,
        student,
        message: 'No active tuition class selected or assigned.',
      };
    }

    // Check if student is enrolled in this class
    if (!student.enrolledClassIds.includes(targetClass.id)) {
      this.logAudit(
        'SCAN_UNENROLLED_CLASS',
        `Student ${student.firstName} ${student.lastName} (${student.regNo}) attempted scan for unenrolled class "${targetClass.name}".`,
        'warning'
      );
      return {
        success: false,
        student,
        classInfo: targetClass,
        message: `Student is NOT registered for ${targetClass.name}. Registered classes: ${student.enrolledClassIds.map(cId => this.getClassById(cId)?.subject).filter(Boolean).join(', ')}`,
      };
    }

    // 4. Double-Scanning & Entry/Exit Tracking
    const todayStr = new Date().toISOString().slice(0, 10);
    const existingToday = this.attendance.find(
      a => a.studentId === student.id && a.classId === targetClass!.id && a.date === todayStr
    );

    if (existingToday) {
      // Check if exit already recorded
      if (!existingToday.exitTimestamp) {
        // Record Exit
        existingToday.exitTimestamp = new Date().toISOString();
        existingToday.status = 'exited';
        saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);

        this.logAudit(
          'ATTENDANCE_EXIT',
          `Student ${student.firstName} ${student.lastName} (${student.regNo}) checked OUT of ${targetClass.name} at ${new Date(existingToday.exitTimestamp).toLocaleTimeString()}`,
          'info'
        );

        return {
          success: true,
          student,
          classInfo: targetClass,
          attendanceRecord: existingToday,
          isDoubleScan: true,
          isExitLogged: true,
          message: `Class Exit Logged: ${student.firstName} checked out at ${new Date(existingToday.exitTimestamp).toLocaleTimeString()}`,
        };
      } else {
        // Student already entered and exited today
        return {
          success: false,
          student,
          classInfo: targetClass,
          attendanceRecord: existingToday,
          isDoubleScan: true,
          message: `Double-Scan Blocked: Student has already checked in and out for ${targetClass.name} today.`,
        };
      }
    }

    // 5. Payment Status Check
    const currentMonth = todayStr.slice(0, 7); // e.g. "2026-09"
    const paymentLookup = this.getStudentPaymentStatus(student.id, targetClass.id, currentMonth);

    const isPaid = paymentLookup.status === 'paid' || paymentLookup.status === 'overridden';

    // Record new attendance
    const attendanceRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      classId: targetClass.id,
      className: targetClass.name,
      date: todayStr,
      entryTimestamp: new Date().toISOString(),
      scanToken: params.rawQrToken,
      status: 'present',
      paymentStatusAtScan: paymentLookup.status,
      paymentOverridden: paymentLookup.status === 'overridden',
      overrideNote: paymentLookup.payment?.overrideReason,
      scannedBy: `${this.currentUser.name} (${this.currentUser.role.toUpperCase()})`,
      scanMethod: method,
    };

    this.attendance.unshift(attendanceRecord);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendance);

    this.logAudit(
      'ATTENDANCE_CHECKIN',
      `Student ${student.firstName} ${student.lastName} (${student.regNo}) checked in to ${targetClass.name}. Payment Status: ${paymentLookup.status.toUpperCase()}`,
      paymentLookup.status === 'pending' || paymentLookup.status === 'overdue' ? 'warning' : 'info'
    );

    return {
      success: true,
      student,
      classInfo: targetClass,
      attendanceRecord,
      paymentStatus: paymentLookup.status,
      paymentDetails: paymentLookup.payment,
      requiresOverride: !isPaid,
      message: isPaid
        ? `Attendance Verified & Marked. Fees Paid.`
        : `Attendance Logged with Warning: ${currentMonth} Class Fee is ${paymentLookup.status.toUpperCase()} (LKR ${paymentLookup.monthlyFee.toLocaleString()})`,
    };
  }

  // Student OTP Portal
  requestStudentOtp(mobileNo: string): { success: boolean; message: string; testOtp?: string } {
    const student = this.getStudentByMobile(mobileNo);
    if (!student) {
      return {
        success: false,
        message: 'No registered student found with this mobile number. Please register or verify the number.',
      };
    }

    // Generate 6 digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otpSessions[mobileNo.replace(/\D/g, '')] = {
      otp,
      studentId: student.id,
      expiresAt,
    };

    saveToStorage(STORAGE_KEYS.OTP_SESSIONS, this.otpSessions);

    this.logAudit(
      'OTP_REQUESTED',
      `Student OTP requested for mobile ${mobileNo} (${student.firstName} ${student.lastName})`,
      'info'
    );

    return {
      success: true,
      message: `Verification code dispatched to ${mobileNo}. (For demo testing, OTP is ${otp})`,
      testOtp: otp,
    };
  }

  verifyStudentOtp(mobileNo: string, enteredOtp: string): {
    success: boolean;
    student?: Student;
    payments?: PaymentRecord[];
    message: string;
  } {
    const cleanMobile = mobileNo.replace(/\D/g, '');
    const session = this.otpSessions[cleanMobile];

    // Allow master test code 888888 or generated OTP
    const isMasterCode = enteredOtp.trim() === '888888';
    if (!session && !isMasterCode) {
      return { success: false, message: 'OTP request expired or invalid. Please request a new code.' };
    }

    if (!isMasterCode && (session.otp !== enteredOtp.trim() || Date.now() > session.expiresAt)) {
      return { success: false, message: 'Invalid or expired OTP entered. Please try again.' };
    }

    const studentId = session ? session.studentId : this.getStudentByMobile(cleanMobile)?.id;
    if (!studentId) {
      return { success: false, message: 'Student account not found.' };
    }

    const student = this.getStudentById(studentId);
    const payments = this.getStudentPayments(studentId);

    this.logAudit(
      'OTP_VERIFIED',
      `Student portal accessed via OTP verification for ${student?.firstName} ${student?.lastName}`,
      'info'
    );

    return {
      success: true,
      student,
      payments,
      message: 'OTP verified successfully.',
    };
  }

  // Exam Results (A/L & O/L)
  getExamResults(studentId?: string): ExamResult[] {
    if (studentId) {
      return this.examResults.filter(r => r.studentId === studentId);
    }
    return [...this.examResults];
  }

  submitExamResult(data: {
    studentId: string;
    examType: 'A/L' | 'O/L';
    examYear: string;
    indexNumber: string;
    stream: string;
    districtRank?: number;
    islandRank?: number;
    zScore?: number;
    subjects: { subjectName: string; grade: 'A' | 'B' | 'C' | 'S' | 'F' }[];
  }): ExamResult {
    const student = this.getStudentById(data.studentId);
    const newResult: ExamResult = {
      id: `res_${Date.now()}`,
      studentId: data.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      examType: data.examType,
      examYear: data.examYear,
      indexNumber: data.indexNumber,
      stream: data.stream,
      districtRank: data.districtRank,
      islandRank: data.islandRank,
      zScore: data.zScore,
      subjects: data.subjects,
      submittedAt: new Date().toISOString(),
      verified: true,
      verifiedBy: this.currentUser.name,
    };

    this.examResults.unshift(newResult);
    saveToStorage(STORAGE_KEYS.EXAM_RESULTS, this.examResults);

    this.logAudit(
      'EXAM_RESULT_SUBMITTED',
      `${data.examType} Results updated for ${newResult.studentName} (Index: ${data.indexNumber}, Stream: ${data.stream})`,
      'info'
    );

    return newResult;
  }

  // Grades
  getGrades(studentId?: string): GradeRecord[] {
    if (studentId) {
      return this.grades.filter(g => g.studentId === studentId);
    }
    return [...this.grades];
  }

  addGradeRecord(data: Omit<GradeRecord, 'id'>): GradeRecord {
    const record: GradeRecord = {
      ...data,
      id: `grd_${Date.now()}`,
    };
    this.grades.unshift(record);
    saveToStorage(STORAGE_KEYS.GRADES, this.grades);

    this.logAudit(
      'GRADE_RECORDED',
      `Assessment grade logged for ${data.studentName} (${data.testTitle}): ${data.marksObtained}/${data.maxMarks} (${data.gradeLetter})`,
      'info'
    );

    return record;
  }

  // Automated Payment Reminders
  getUnpaidStudentsForCurrentMonth(monthYear = '2026-09'): {
    student: Student;
    classInfo: TuitionClass;
    amountDue: number;
  }[] {
    const activeStudents = this.getStudents(false);
    const duesList: { student: Student; classInfo: TuitionClass; amountDue: number }[] = [];

    for (const student of activeStudents) {
      for (const classId of student.enrolledClassIds) {
        const cls = this.getClassById(classId);
        if (!cls) continue;

        const payment = this.payments.find(
          p => p.studentId === student.id && p.classId === classId && p.monthYear === monthYear
        );

        if (!payment || (payment.status !== 'paid' && payment.status !== 'overridden')) {
          duesList.push({
            student,
            classInfo: cls,
            amountDue: cls.monthlyFee,
          });
        }
      }
    }

    return duesList;
  }

  triggerAutomatedReminders(monthYear = '2026-09'): {
    count: number;
    reminders: { studentName: string; mobile: string; amount: number; message: string }[];
  } {
    const dues = this.getUnpaidStudentsForCurrentMonth(monthYear);
    const dispatched = dues.map(d => {
      const msg = `Dear Parent/Student, This is an automated reminder from Apex Tuition Academy. Tuition fee for ${d.classInfo.name} for ${monthYear} (LKR ${d.amountDue.toLocaleString()}) is currently due. Please settle via the student portal or at the front desk before next class session. Thank you.`;
      return {
        studentName: `${d.student.firstName} ${d.student.lastName}`,
        mobile: d.student.mobileNo,
        amount: d.amountDue,
        message: msg,
      };
    });

    this.logAudit(
      'AUTOMATED_PAYMENT_REMINDERS_SENT',
      `Automated SMS & WhatsApp reminder campaign dispatched to ${dues.length} students with overdue fees for ${monthYear}.`,
      'info'
    );

    return {
      count: dispatched.length,
      reminders: dispatched,
    };
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  logAudit(action: string, details: string, severity: 'info' | 'warning' | 'security' = 'info'): void {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      actorId: this.currentUser.id,
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action,
      details,
      ipAddress: '192.168.1.10',
      severity,
      performedByName: this.currentUser.name,
      performedByRole: this.currentUser.role,
    };

    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 300) {
      this.auditLogs = this.auditLogs.slice(0, 300);
    }
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // Data Export for Auditing (CSV)
  exportAttendanceCsv(): string {
    const headers = ['Record ID', 'Date', 'Time In', 'Time Out', 'Student Name', 'Class Name', 'Payment Status', 'Override', 'Scanned By'];
    const rows = this.attendance.map(a => [
      a.id,
      a.date,
      a.entryTimestamp ? new Date(a.entryTimestamp).toLocaleTimeString() : '',
      a.exitTimestamp ? new Date(a.exitTimestamp).toLocaleTimeString() : '',
      `"${a.studentName}"`,
      `"${a.className}"`,
      a.paymentStatusAtScan,
      a.paymentOverridden ? 'YES' : 'NO',
      `"${a.scannedBy}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  exportPaymentsCsv(): string {
    const headers = ['Receipt No', 'Date', 'Student Name', 'Class Name', 'Month', 'Amount (LKR)', 'Method', 'Status', 'Overridden By', 'Reason'];
    const rows = this.payments.map(p => [
      p.receiptNo,
      new Date(p.paymentDate).toLocaleDateString(),
      `"${p.studentName}"`,
      `"${p.className}"`,
      p.monthYear,
      p.amount,
      p.method,
      p.status,
      p.overriddenBy ? `"${p.overriddenBy}"` : '',
      p.overrideReason ? `"${p.overrideReason}"` : '',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  exportAuditLogsCsv(): string {
    const headers = ['Timestamp', 'Severity', 'Action', 'Actor Name', 'Role', 'Details'];
    const rows = this.auditLogs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.severity.toUpperCase(),
      l.action,
      `"${l.actorName}"`,
      l.actorRole,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const storage = new StorageService();
