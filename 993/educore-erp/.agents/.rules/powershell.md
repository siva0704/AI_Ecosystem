---
name: PowerShell Execution
description: Strict constraints for agentic terminal execution within Windows PowerShell environments.
---

# PowerShell Execution Rules

When executing commands via the terminal (`run_command`) in this workspace, you MUST adhere to these Windows PowerShell 5.1 constraints:

1. **No `&&` Chaining**: Never use `&&` to chain commands. PowerShell 5.1 does not support it. Use `;` instead (e.g., `cd backend ; npm run dev`).
2. **Executable Paths with Spaces**: If an executable path contains spaces, it MUST be wrapped in quotes and preceded by the Call Operator `&` (e.g., `& "C:\Program Files\..." -arg`).
3. **Database Queries**: Never instruct the user to run raw SQL (like `UPDATE` or `SELECT`) directly in the PowerShell prompt. Always wrap it in a complete `psql` command.
   - *Example*: `& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d educore -c "UPDATE users SET first_name = 'Hacked' WHERE role = 'PRINCIPAL';"`
