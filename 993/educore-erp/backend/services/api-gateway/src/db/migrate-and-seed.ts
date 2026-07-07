import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';


const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

// ─── UUID Mapper Helpers ──────────────────────────────────────────────────────
export function mapShortIdToUuid(shortId: string | null): string | null {
  if (!shortId) return null;
  if (shortId.length === 36) return shortId; // already a UUID

  const [type, numStr] = shortId.split('-');
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return shortId;

  const typeMap: Record<string, string> = {
    usr: '0000',
    stu: '0100',
    stf: '0200',
    bk:  '0300',
    rm:  '0400',
    bus: '0500',
    ftx: '0600',
    att: '0700',
    cls: '0800',
  };

  const block = typeMap[type] || '9999';
  const paddedNum = String(num).padStart(12, '0');
  return `00000000-0000-0000-${block}-${paddedNum}`;
}

async function runMigrateAndSeed() {
  console.log('⏳ Running database migration and seeding...');
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    // 1. Read and execute all schema files
    const schemaFiles = [
      '001_core_schema.sql',
      '002_app_role.sql',
      '003_auth_function.sql',
      '004_fix_rls_permissive.sql',
      '005_refresh_tokens.sql',
      '006_hr_extensions.sql',
      '007_admissions.sql'
    ];

    await client.query('BEGIN');
    console.log('🧹 Dropping existing public schema to start fresh...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;');
    console.log('🛠️ Creating database tables, rules and RLS policies...');

    for (const file of schemaFiles) {
      const schemaPath = path.resolve(process.cwd(), '../../../database/schemas/', file);
      console.log(`📖 Executing DDL from: ${file}`);
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
    }
    
    await client.query('COMMIT');
    console.log('✅ Core relational DDL initialized successfully.');

    // 3. Seed Demo Tenant
    const tenantId = '00000000-0000-0000-0000-000000000001';
    console.log('🌱 Seeding demo tenant...');
    const res = await client.query(`
      INSERT INTO tenants (tenant_id, domain_name, display_name, kms_dek_arn)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (domain_name) DO NOTHING
      RETURNING *
    `, [tenantId, 'demo', 'Greenfield Academy (Demo)', 'arn:aws:kms:ap-south-1:123456789012:key/demo-dek']);
    console.log('Tenant insert result:', res.rowCount, res.rows);

    // 4. Seed 13 Demo Users
    console.log('🌱 Seeding demo users (encrypting passwords)...');
    const demoUsers = [
      { id: 'usr-001', email: 'superadmin@educore.dev', pass: 'super@123', name: 'Alok Mishra', role: 'SUPER_ADMIN', tier: 0, subdomain: 'platform' },
      { id: 'usr-002', email: 'admin@demo.educore.dev', pass: 'admin@123', name: 'Rajesh Patel', role: 'INSTITUTION_ADMIN', tier: 1, subdomain: 'demo' },
      { id: 'usr-003', email: 'principal@demo.educore.dev', pass: 'principal@123', name: 'Dr. Sandeep Shastri', role: 'PRINCIPAL', tier: 2, subdomain: 'demo' },
      { id: 'usr-004', email: 'teacher@demo.educore.dev', pass: 'teacher@123', name: 'Anitha Menon', role: 'TEACHER', tier: 3, subdomain: 'demo' },
      { id: 'usr-005', email: 'accountant@demo.educore.dev', pass: 'accountant@123', name: 'Suresh Iyer', role: 'ACCOUNTANT', tier: 3, subdomain: 'demo' },
      { id: 'usr-006', email: 'hr@demo.educore.dev', pass: 'hr@123', name: 'Divya Krishnan', role: 'HR_MANAGER', tier: 3, subdomain: 'demo' },
      { id: 'usr-007', email: 'transport@demo.educore.dev', pass: 'transport@123', name: 'Ramesh Kumar', role: 'TRANSPORT_OFFICER', tier: 3, subdomain: 'demo' },
      { id: 'usr-008', email: 'hostel@demo.educore.dev', pass: 'hostel@123', name: 'Sister Beatrice', role: 'HOSTEL_WARDEN', tier: 3, subdomain: 'demo' },
      { id: 'usr-009', email: 'librarian@demo.educore.dev', pass: 'library@123', name: 'Gopal Chawla', role: 'LIBRARIAN', tier: 3, subdomain: 'demo' },
      { id: 'usr-010', email: 'student@demo.educore.dev', pass: 'student@123', name: 'Arjun Patel', role: 'STUDENT', tier: 4, subdomain: 'demo' },
      { id: 'usr-011', email: 'parent@demo.educore.dev', pass: 'parent@123', name: 'Devendra Patel', role: 'PARENT', tier: 5, subdomain: 'demo' },
      { id: 'usr-012', email: 'auditor@demo.educore.dev', pass: 'auditor@123', name: 'KMPG Auditor', role: 'AUDITOR', tier: 6, subdomain: 'demo' },
      { id: 'usr-013', email: 'hod@demo.educore.dev', pass: 'hod@123', name: 'Dr. Kamala Rao', role: 'HOD', tier: 2, subdomain: 'demo' }
    ];

    for (const u of demoUsers) {
      const hash = await bcrypt.hash(u.pass, 10);
      const names = u.name.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'User';
      const mappedUserId = mapShortIdToUuid(u.id);

      await client.query(`
        INSERT INTO users (user_id, tenant_id, email, password_hash, first_name, last_name, role, tier, subdomain)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (tenant_id, email) DO NOTHING
      `, [mappedUserId, tenantId, u.email, hash, firstName, lastName, u.role, u.tier, u.subdomain]);
    }

    // 4.5 Seed Classes
    console.log('🌱 Seeding classes...');
    const class10AId = mapShortIdToUuid('cls-001');
    const class10BId = mapShortIdToUuid('cls-002');
    const class9AId = mapShortIdToUuid('cls-003');
    
    await client.query(`
      INSERT INTO classes (class_id, tenant_id, grade, section)
      VALUES 
        ($1, $2, '10', 'A'),
        ($3, $2, '10', 'B'),
        ($4, $2, '9', 'A')
      ON CONFLICT (tenant_id, grade, section) DO NOTHING
    `, [class10AId, tenantId, class10BId, class9AId]);

    // 5. Seed Students
    console.log('🌱 Seeding student roster...');
    const students = [
      { id: 'stu-001', userId: 'usr-010', fn: 'Arjun', ln: 'Patel', dob: '2010-03-15', gen: 'MALE', classId: 'cls-001', roll: '10A001', pem: 'parent@demo.educore.dev' },
      { id: 'stu-002', userId: null, fn: 'Priya', ln: 'Singh', dob: '2010-07-22', gen: 'FEMALE', classId: 'cls-001', roll: '10A002', pem: 'parent2@demo.educore.dev' },
      { id: 'stu-003', userId: null, fn: 'Rohan', ln: 'Mehta', dob: '2010-11-08', gen: 'MALE', classId: 'cls-002', roll: '10B001', pem: 'parent3@demo.educore.dev' },
      { id: 'stu-004', userId: null, fn: 'Asha', ln: 'Rao', dob: '2011-02-14', gen: 'FEMALE', classId: 'cls-003', roll: '9A001', pem: 'parent4@demo.educore.dev' },
      { id: 'stu-005', userId: null, fn: 'Kiran', ln: 'Kumar', dob: '2011-09-30', gen: 'MALE', classId: 'cls-003', roll: '9A002', pem: 'parent5@demo.educore.dev' }
    ];

    for (const s of students) {
      const mappedStuId = mapShortIdToUuid(s.id);
      const mappedUserId = mapShortIdToUuid(s.userId);

      await client.query(`
        INSERT INTO students (student_id, tenant_id, user_id, first_name, last_name, date_of_birth, gender, class_id, roll_number, parent_email, academic_year)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '2026-27')
        ON CONFLICT (tenant_id, class_id, roll_number) DO NOTHING
      `, [mappedStuId, tenantId, mappedUserId, s.fn, s.ln, s.dob, s.gen, mapShortIdToUuid(s.classId), s.roll, s.pem]);
    }

    // 6. Seed Staff
    console.log('🌱 Seeding staff roster...');
    const staff = [
      { id: 'stf-001', userId: 'usr-004', empId: 'EMP-001', fn: 'Anitha', ln: 'Menon', email: 'teacher@demo.educore.dev', role: 'TEACHER', dept: 'Mathematics', doj: '2020-06-01', consent: true },
      { id: 'stf-002', userId: 'usr-005', empId: 'EMP-002', fn: 'Suresh', ln: 'Iyer', email: 'accountant@demo.educore.dev', role: 'ACCOUNTANT', dept: 'Finance', doj: '2019-04-15', consent: true },
      { id: 'stf-003', userId: 'usr-006', empId: 'EMP-003', fn: 'Divya', ln: 'Krishnan', email: 'hr@demo.educore.dev', role: 'HR_MANAGER', dept: 'HR', doj: '2021-08-01', consent: true },
      { id: 'stf-004', userId: 'usr-007', empId: 'EMP-004', fn: 'Ramesh', ln: 'Kumar', email: 'transport@demo.educore.dev', role: 'TRANSPORT_OFFICER', dept: 'Operations', doj: '2022-01-15', consent: false }
    ];

    for (const st of staff) {
      const mappedStaffId = mapShortIdToUuid(st.id);
      const mappedUserId = mapShortIdToUuid(st.userId);

      await client.query(`
        INSERT INTO staff (staff_id, tenant_id, user_id, employee_id, first_name, last_name, email, role, department, date_of_joining, dpdp_consent_given)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (tenant_id, employee_id) DO NOTHING
      `, [mappedStaffId, tenantId, mappedUserId, st.empId, st.fn, st.ln, st.email, st.role, st.dept, st.doj, st.consent]);
    }

    // 7. Seed Library Books
    console.log('🌱 Seeding library books...');
    const books = [
      { id: 'bk-001', isbn: '9780070700734', title: 'Introduction to Algorithms', author: 'Cormen et al.', copies: 5, category: 'Computer Science' },
      { id: 'bk-002', isbn: '9780071000741', title: 'Physics for Class XI', author: 'H.C. Verma', copies: 20, category: 'Science' },
      { id: 'bk-003', isbn: '9789386424860', title: 'NCERT Mathematics Class X', author: 'NCERT', copies: 30, category: 'Mathematics' }
    ];

    for (const b of books) {
      const mappedBookId = mapShortIdToUuid(b.id);
      await client.query(`
        INSERT INTO library_books (book_id, tenant_id, isbn, title, author, total_copies, available_copies, category)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
        ON CONFLICT (tenant_id, isbn) DO NOTHING
      `, [mappedBookId, tenantId, b.isbn, b.title, b.author, b.copies, b.category]);
    }

    // 8. Seed Hostel Rooms
    console.log('🌱 Seeding hostel rooms...');
    const rooms = [
      { id: 'rm-001', num: 'A-101', block: 'Block A', cap: 2, occ: 2, type: 'DOUBLE' },
      { id: 'rm-002', num: 'A-102', block: 'Block A', cap: 1, occ: 0, type: 'SINGLE' },
      { id: 'rm-003', num: 'B-201', block: 'Block B', cap: 3, occ: 2, type: 'TRIPLE' }
    ];

    for (const r of rooms) {
      const mappedRoomId = mapShortIdToUuid(r.id);
      await client.query(`
        INSERT INTO hostel_rooms (room_id, tenant_id, room_number, block, capacity, occupied, room_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tenant_id, room_number) DO NOTHING
      `, [mappedRoomId, tenantId, r.num, r.block, r.cap, r.occ, r.type]);
    }

    // 9. Seed Transport Buses
    console.log('🌱 Seeding transport buses...');
    const buses = [
      { id: 'bus-001', num: 'KA-01-AB-1234', route: 'Route 1 — MG Road', driver: 'Ravi Kumar', cap: 52 },
      { id: 'bus-002', num: 'KA-02-CD-5678', route: 'Route 2 — Indiranagar', driver: 'Suresh Babu', cap: 52 }
    ];

    for (const bus of buses) {
      const mappedBusId = mapShortIdToUuid(bus.id);
      await client.query(`
        INSERT INTO transport_buses (bus_id, tenant_id, bus_number, route_name, driver_name, capacity, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
        ON CONFLICT (tenant_id, bus_number) DO NOTHING
      `, [mappedBusId, tenantId, bus.num, bus.route, bus.driver, bus.cap]);
    }

    // 10. Seed Fee Transactions
    console.log('🌱 Seeding fee transactions...');
    const txs = [
      { id: 'ftx-001', stuId: 'stu-001', head: 'Annual Tuition Fee', amount: 1250000, status: 'CAPTURED', mode: 'UPI' },
      { id: 'ftx-002', stuId: 'stu-002', head: 'Term Fee Q1', amount: 820000, status: 'CAPTURED', mode: 'RAZORPAY' },
      { id: 'ftx-003', stuId: 'stu-003', head: 'Annual Tuition Fee', amount: 1250000, status: 'PENDING', mode: 'NEFT' }
    ];

    for (const tx of txs) {
      const mappedTxId = mapShortIdToUuid(tx.id);
      const mappedStuId = mapShortIdToUuid(tx.stuId);
      await client.query(`
        INSERT INTO fee_transactions (transaction_id, tenant_id, student_id, fee_head, amount_paise, payment_status, payment_mode)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [mappedTxId, tenantId, mappedStuId, tx.head, tx.amount, tx.status, tx.mode]);
    }

    console.log('🎉 Database migration and seeding completed successfully!');
  } catch (err) {
    console.error('❌ Database migration/seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow direct execution
if (process.argv[1] && (process.argv[1].endsWith('migrate-and-seed.ts') || process.argv[1].endsWith('migrate-and-seed.js'))) {
  runMigrateAndSeed().catch((err) => {
    console.error('Migration execution failed with error:', err);
    process.exit(1);
  });
}

export { runMigrateAndSeed };
