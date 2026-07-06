import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { canAccess } from '../middleware/rbac';
import { Role } from '../db/demo-users';

/** Mock dashboard data scoped per role tier — mirrors prod RLS row-scoping */
const MOCK_DASHBOARD_DATA: Record<string, object> = {
  SUPER_ADMIN: {
    totalTenants: 48,
    activeTenants: 46,
    monthlyRevenue: '₹24,80,000',
    systemHealth: 'HEALTHY',
    incidents: 0,
  },
  INSTITUTION_ADMIN: {
    totalStudents: 1840,
    totalStaff: 142,
    collectionsThisMonth: '₹18,40,000',
    pendingDues: '₹3,20,000',
    attendanceRate: '94.2%',
  },
  PRINCIPAL: {
    classesRunning: 42,
    avgAttendance: '93.8%',
    pendingApprovals: 3,
    upcomingExams: 2,
    teacherLeaveToday: 1,
  },
  HOD: {
    departmentStaff: 18,
    subjectsThisSemester: 12,
    avgClassAttendance: '91.5%',
    upcomingExamDays: 5,
  },
  TEACHER: {
    classesToday: 4,
    studentsPresent: 38,
    assignmentsDue: 2,
    pendingGrading: 14,
    attendanceMarked: false,
  },
  ACCOUNTANT: {
    todayCollection: '₹84,000',
    pendingReceipts: 12,
    overdueCount: 38,
    payrollStatus: 'PROCESSED',
  },
  HR_MANAGER: {
    totalStaff: 142,
    onLeaveToday: 4,
    pendingOnboardings: 2,
    pendingDPDPConsents: 8,
  },
  TRANSPORT_OFFICER: {
    busesActive: 12,
    studentsInTransit: 320,
    incidentsToday: 0,
    routeDeviations: 1,
  },
  HOSTEL_WARDEN: {
    totalRooms: 80,
    occupiedRooms: 74,
    studentsPresent: 210,
    maintenanceRequests: 3,
  },
  LIBRARIAN: {
    booksIssued: 48,
    overdueBooks: 5,
    reservationsPending: 7,
    newArrivals: 12,
  },
  STUDENT: {
    attendancePercent: '88.5%',
    assignmentsPending: 2,
    nextExam: 'Mathematics — 12 Jul',
    feeDueAmount: '₹12,500',
    feeDueDate: '2026-07-15',
  },
  PARENT: {
    wardName: 'Arjun Patel',
    wardAttendance: '88.5%',
    busLocation: 'Near MG Road',
    feeDue: '₹12,500',
    feeDueDate: '2026-07-15',
    lastResult: 'Class X — 82.4%',
  },
  AUDITOR: {
    lastAuditDate: '2026-06-30',
    openFindings: 2,
    complianceScore: '96.2%',
    accessLevel: 'READ_ONLY_RESTRICTED',
  },
};

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      const userRole: Role = request.user.role;
      if (!canAccess(userRole, '/api/dashboard')) {
        // All roles can read their own dashboard
      }
      const data = MOCK_DASHBOARD_DATA[userRole] ?? {};
      return reply.send({ success: true, role: userRole, data });
    }
  );
}
