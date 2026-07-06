import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../db/demo-users';
import {
  STUDENTS,
  STAFF_MEMBERS,
  ATTENDANCE_RECORDS,
  FEE_TRANSACTIONS,
  LIBRARY_TRANSACTIONS,
} from '../db/mock-db';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      const user = request.user;
      const userRole: Role = user.role;
      const tenantId = user.tenantId;

      const today = new Date().toISOString().split('T')[0];

      // Calculate stats dynamically from stateful mock-db arrays
      let data: Record<string, any> = {};

      if (userRole === 'SUPER_ADMIN') {
        const totalRevPaise = FEE_TRANSACTIONS.filter((t) => t.payment_status === 'CAPTURED').reduce((sum, t) => sum + t.amount_paise, 0);
        data = {
          totalTenants: 48,
          activeTenants: 46,
          monthlyRevenue: `₹${(totalRevPaise / 100).toLocaleString('en-IN')}`,
          systemHealth: 'HEALTHY',
          incidents: 0,
          apiRequests: '2.1M',
        };
      } else if (userRole === 'INSTITUTION_ADMIN') {
        const tenantStudents = STUDENTS.filter((s) => s.tenant_id === tenantId);
        const tenantStaff = STAFF_MEMBERS.filter((s) => s.tenant_id === tenantId);
        const totalCapturedPaise = FEE_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.payment_status === 'CAPTURED').reduce((sum, t) => sum + t.amount_paise, 0);
        const totalPendingPaise = FEE_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.payment_status === 'PENDING').reduce((sum, t) => sum + t.amount_paise, 0);

        // Attendance rate
        const tenantAttendance = ATTENDANCE_RECORDS.filter((r) => r.tenant_id === tenantId);
        const totalAttendance = tenantAttendance.length;
        const presentAttendance = tenantAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const attendanceRate = totalAttendance > 0 ? `${((presentAttendance / totalAttendance) * 100).toFixed(1)}%` : '94.2%';

        data = {
          totalStudents: tenantStudents.length,
          totalStaff: tenantStaff.length,
          collectionsThisMonth: `₹${(totalCapturedPaise / 100).toLocaleString('en-IN')}`,
          pendingDues: `₹${(totalPendingPaise / 100).toLocaleString('en-IN')}`,
          attendanceRate,
        };
      } else if (userRole === 'PRINCIPAL') {
        const tenantAttendance = ATTENDANCE_RECORDS.filter((r) => r.tenant_id === tenantId);
        const totalAttendance = tenantAttendance.length;
        const presentAttendance = tenantAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const avgAttendance = totalAttendance > 0 ? `${((presentAttendance / totalAttendance) * 100).toFixed(1)}%` : '93.8%';

        data = {
          classesRunning: 42,
          avgAttendance,
          pendingApprovals: 3,
          upcomingExams: 2,
        };
      } else if (userRole === 'HOD') {
        const deptStaff = STAFF_MEMBERS.filter((s) => s.tenant_id === tenantId && s.department === 'Mathematics').length;
        data = {
          departmentStaff: deptStaff || 18,
          subjectsThisSemester: 12,
          avgClassAttendance: '91.5%',
          upcomingExamDays: 5,
        };
      } else if (userRole === 'TEACHER') {
        // Find how many attendance records have been marked today for Class 10-A
        const markedToday = ATTENDANCE_RECORDS.filter((r) => r.tenant_id === tenantId && r.date === today && r.class_id === 'cls-10a');
        const presentCount = markedToday.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const totalInClass = STUDENTS.filter((s) => s.tenant_id === tenantId && s.grade === '10' && s.section === 'A').length;

        data = {
          classesToday: 4,
          studentsPresent: markedToday.length > 0 ? `${presentCount} / ${totalInClass}` : '0 / 42',
          attendanceMarked: markedToday.length > 0,
          assignmentsDue: 2,
          pendingGrading: 14,
        };
      } else if (userRole === 'ACCOUNTANT') {
        // Collect today's captured payments
        const todayCollectionPaise = FEE_TRANSACTIONS.filter(
          (t) => t.tenant_id === tenantId && t.payment_status === 'CAPTURED' && t.created_at.startsWith(today)
        ).reduce((sum, t) => sum + t.amount_paise, 0);

        const pendingCount = FEE_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.payment_status === 'PENDING').length;
        const overdueCount = Array.from(new Set(FEE_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.payment_status === 'PENDING').map((t) => t.student_id))).length;

        data = {
          todayCollection: `₹${(todayCollectionPaise / 100).toLocaleString('en-IN')}`,
          pendingReceipts: pendingCount,
          overdueCount,
          payrollStatus: 'PROCESSED',
        };
      } else if (userRole === 'HR_MANAGER') {
        const tenantStaff = STAFF_MEMBERS.filter((s) => s.tenant_id === tenantId);
        const pendingDPDP = tenantStaff.filter((s) => !s.dpdp_consent_given).length;

        data = {
          totalStaff: tenantStaff.length,
          onLeaveToday: 4,
          pendingOnboardings: 2,
          pendingDPDPConsents: pendingDPDP,
        };
      } else if (userRole === 'TRANSPORT_OFFICER') {
        data = {
          busesActive: 12,
          studentsInTransit: 320,
          incidentsToday: 0,
          routeDeviations: 1,
        };
      } else if (userRole === 'HOSTEL_WARDEN') {
        data = {
          totalRooms: 80,
          occupiedRooms: 74,
          studentsPresent: 210,
          maintenanceRequests: 3,
        };
      } else if (userRole === 'LIBRARIAN') {
        const issued = LIBRARY_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.status === 'ISSUED').length;
        const overdue = LIBRARY_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.status === 'OVERDUE').length;

        data = {
          booksIssued: issued,
          overdueBooks: overdue,
          reservationsPending: 7,
          newArrivals: 12,
        };
      } else if (userRole === 'STUDENT') {
        // Assume student usr-004 maps to student records
        const stuAttendance = ATTENDANCE_RECORDS.filter((r) => r.tenant_id === tenantId && r.student_id === 'stu-001');
        const presentCount = stuAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const attendancePercent = stuAttendance.length > 0 ? `${((presentCount / stuAttendance.length) * 105).toFixed(1)}%` : '88.5%'; // mock adjustment

        const studentPendingFees = FEE_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.student_id === 'stu-001' && t.payment_status === 'PENDING').reduce((sum, t) => sum + t.amount_paise, 0);

        data = {
          attendancePercent,
          assignmentsPending: 2,
          nextExam: 'Mathematics — 12 Jul',
          feeDueAmount: `₹${(studentPendingFees / 100).toLocaleString('en-IN')}`,
          feeDueDate: '2026-07-15',
        };
      } else if (userRole === 'PARENT') {
        const wardAttendance = '88.5%';
        const studentPendingFees = FEE_TRANSACTIONS.filter((t) => t.tenant_id === tenantId && t.student_id === 'stu-001' && t.payment_status === 'PENDING').reduce((sum, t) => sum + t.amount_paise, 0);

        data = {
          wardName: 'Arjun Patel',
          wardAttendance,
          busLocation: 'Near MG Road',
          feeDue: `₹${(studentPendingFees / 100).toLocaleString('en-IN')}`,
          feeDueDate: '2026-07-15',
          lastResult: 'Class X — 82.4%',
        };
      } else if (userRole === 'AUDITOR') {
        data = {
          lastAuditDate: '2026-06-30',
          openFindings: 2,
          complianceScore: '96.2%',
          accessLevel: 'READ_ONLY_RESTRICTED',
        };
      }

      return reply.send({ success: true, role: userRole, data });
    }
  );
}
