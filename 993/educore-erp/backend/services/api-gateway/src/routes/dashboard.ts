import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../db/demo-users';
import {
  queryStudents,
  queryStaff,
  queryAttendance,
  queryFeeTransactions,
  queryLibraryTransactions,
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
        const fees = await queryFeeTransactions(tenantId);
        const totalRevPaise = fees.filter((t: any) => t.payment_status === 'CAPTURED').reduce((sum: number, t: any) => sum + t.amount_paise, 0);
        data = {
          totalTenants: 48,
          activeTenants: 46,
          monthlyRevenue: `₹${(totalRevPaise / 100).toLocaleString('en-IN')}`,
          systemHealth: 'HEALTHY',
          incidents: 0,
          apiRequests: '2.1M',
        };
      } else if (userRole === 'INSTITUTION_ADMIN') {
        const tenantStudents = await queryStudents(tenantId);
        const tenantStaff = await queryStaff(tenantId);
        const fees = await queryFeeTransactions(tenantId);
        const totalCapturedPaise = fees.filter((t: any) => t.payment_status === 'CAPTURED').reduce((sum: number, t: any) => sum + t.amount_paise, 0);
        const totalPendingPaise = fees.filter((t: any) => t.payment_status === 'PENDING').reduce((sum: number, t: any) => sum + t.amount_paise, 0);

        // Attendance rate
        const tenantAttendance = await queryAttendance(tenantId);
        const totalAttendance = tenantAttendance.length;
        const presentAttendance = tenantAttendance.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const attendanceRate = totalAttendance > 0 ? `${((presentAttendance / totalAttendance) * 100).toFixed(1)}%` : '94.2%';

        data = {
          totalStudents: tenantStudents.length,
          totalStaff: tenantStaff.length,
          collectionsThisMonth: `₹${(totalCapturedPaise / 100).toLocaleString('en-IN')}`,
          pendingDues: `₹${(totalPendingPaise / 100).toLocaleString('en-IN')}`,
          attendanceRate,
        };
      } else if (userRole === 'PRINCIPAL') {
        const tenantAttendance = await queryAttendance(tenantId);
        const totalAttendance = tenantAttendance.length;
        const presentAttendance = tenantAttendance.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const avgAttendance = totalAttendance > 0 ? `${((presentAttendance / totalAttendance) * 100).toFixed(1)}%` : '93.8%';

        data = {
          classesRunning: 42,
          avgAttendance,
          pendingApprovals: 3,
          upcomingExams: 2,
        };
      } else if (userRole === 'HOD') {
        const tenantStaff = await queryStaff(tenantId);
        const deptStaff = tenantStaff.filter((s: any) => s.department === 'Mathematics').length;
        data = {
          departmentStaff: deptStaff || 18,
          subjectsThisSemester: 12,
          avgClassAttendance: '91.5%',
          upcomingExamDays: 5,
        };
      } else if (userRole === 'TEACHER') {
        // Find how many attendance records have been marked today for Class 10-A
        const allAttendance = await queryAttendance(tenantId, undefined, today);
        const markedToday = allAttendance.filter((r: any) => r.class_id === 'cls-10a');
        const presentCount = markedToday.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length;
        
        const tenantStudents = await queryStudents(tenantId);
        const totalInClass = tenantStudents.filter((s: any) => s.grade === '10' && s.section === 'A').length;

        data = {
          classesToday: 4,
          studentsPresent: markedToday.length > 0 ? `${presentCount} / ${totalInClass}` : '0 / 42',
          attendanceMarked: markedToday.length > 0,
          assignmentsDue: 2,
          pendingGrading: 14,
        };
      } else if (userRole === 'ACCOUNTANT') {
        // Collect today's captured payments
        const fees = await queryFeeTransactions(tenantId);
        const todayCollectionPaise = fees.filter(
          (t: any) => t.payment_status === 'CAPTURED' && t.created_at.startsWith(today)
        ).reduce((sum: number, t: any) => sum + t.amount_paise, 0);

        const pendingCount = fees.filter((t: any) => t.payment_status === 'PENDING').length;
        const overdueCount = Array.from(new Set(fees.filter((t: any) => t.payment_status === 'PENDING').map((t: any) => t.student_id))).length;

        data = {
          todayCollection: `₹${(todayCollectionPaise / 100).toLocaleString('en-IN')}`,
          pendingReceipts: pendingCount,
          overdueCount,
          payrollStatus: 'PROCESSED',
        };
      } else if (userRole === 'HR_MANAGER') {
        const tenantStaff = await queryStaff(tenantId);
        const pendingDPDP = tenantStaff.filter((s: any) => !s.dpdp_consent_given).length;

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
        const txs = await queryLibraryTransactions(tenantId);
        const issued = txs.filter((t: any) => t.status === 'ISSUED').length;
        const overdue = txs.filter((t: any) => t.status === 'OVERDUE').length;

        data = {
          booksIssued: issued,
          overdueBooks: overdue,
          reservationsPending: 7,
          newArrivals: 12,
        };
      } else if (userRole === 'STUDENT') {
        // Assume student maps to student records
        const stuAttendance = await queryAttendance(tenantId, 'stu-001');
        const presentCount = stuAttendance.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const attendancePercent = stuAttendance.length > 0 ? `${((presentCount / stuAttendance.length) * 105).toFixed(1)}%` : '88.5%'; // mock adjustment

        const fees = await queryFeeTransactions(tenantId, 'stu-001');
        const studentPendingFees = fees.filter((t: any) => t.payment_status === 'PENDING').reduce((sum: number, t: any) => sum + t.amount_paise, 0);

        data = {
          attendancePercent,
          assignmentsPending: 2,
          nextExam: 'Mathematics — 12 Jul',
          feeDueAmount: `₹${(studentPendingFees / 100).toLocaleString('en-IN')}`,
          feeDueDate: '2026-07-15',
        };
      } else if (userRole === 'PARENT') {
        const wardAttendance = '88.5%';
        const fees = await queryFeeTransactions(tenantId, 'stu-001');
        const studentPendingFees = fees.filter((t: any) => t.payment_status === 'PENDING').reduce((sum: number, t: any) => sum + t.amount_paise, 0);

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
