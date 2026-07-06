# UX Flow & Persona Interaction Matrix

## Design Principle
Every persona spec documents goals, frustrations, interaction frequency, devices, screen
flow, decision points, drop-off points, AI assistance, automation, required approvals, and
KPIs — not just wireframes.

## Parent Persona (representative example)
| Component | Spec |
|---|---|
| Goals | Ward safety, academic progress monitoring, seamless financial obligations |
| Frustrations | Delayed bus arrivals, lack of official comms, physical bank visits |
| Interaction frequency | Daily (attendance/GPS), monthly (fees), terminal (report cards) |
| Devices | Mobile-first (PWA / React Native) |
| Screen flow | Dashboard → Attendance → Homework → Fee Due → Payment → Receipt → Transport GPS → Teacher Chat |
| Decision points | EMI vs UPI; elective subject approval |
| Drop-off points | Complex scholarship forms; payment gateway timeouts |
| AI assistance | Predictive nudges for assignments; conversational policy Q&A |
| Automation | Auto fee-receipt generation on Razorpay webhook validation |
| Required approvals | Field-trip consent; disciplinary acknowledgment |
| KPIs | Fee payment < 2 min; bus location lookup < 10 sec |

## Teacher Persona (highest-frequency interaction)
- Daily attendance marking is the single most frequent interaction in the system.
- **Hard constraint:** max 3 interactions to submit class attendance.
- Must support offline mode for rural network instability — writes queue locally and sync
  on reconnect.

## Other Personas
Full specs for Student, Principal/HOD, Accountant, HR Manager, and Transport/Hostel/Library
operators follow the same table format and are maintained here as the matrix grows.
