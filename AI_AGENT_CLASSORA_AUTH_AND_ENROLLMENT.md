# ClassOra Auth, Classes, and Enrollment

## Purpose

Implement role-aware access before users enter the existing dashboards:

- Professors must log in before entering the Professor Cabin.
- Students must log in before entering the Student Wallet.
- A professor must see every class they teach and be able to add subjects.
- Every subject must have a unique enrollment code.
- A student must see every class they are enrolled in and be able to enroll using a professor's code.
- Existing demo data and the current attendance, marks, leave, dispute, export, and offline-sync behavior must remain intact.

This document is implementation guidance for an AI coding agent. It is not a request to replace the current demo experience with a new product or to remove seeded data.

## Repository context

The application is a Next.js App Router application using React, TypeScript, Tailwind CSS, Dexie, and optional Supabase synchronization.

Important existing files:

- `src/app/page.tsx` — current landing page and dashboard entry links.
- `src/app/professor/page.tsx` — existing professor dashboard.
- `src/app/student/page.tsx` — existing student dashboard.
- `src/lib/mockData.ts` — seeded demo course, roster, attendance, assessments, and scores.
- `src/lib/db/dexie.ts` — offline IndexedDB schema.
- `src/lib/sync/syncEngine.ts` — queued Supabase synchronization.
- `src/lib/supabase/client.ts` — optional browser Supabase client.
- `src/types/database.ts` — shared application data types.
- `supabase/schema.sql` — profiles, courses, enrollments, attendance, marks, disputes, audit logs, and RLS.

Read the relevant Next.js guidance in `node_modules/next/dist/docs/` before making framework changes. Use client components only where state, forms, browser storage, or IndexedDB are needed.

## Required user experience

### Landing page

Replace direct unauthenticated dashboard access with clear login entry points:

1. Professor login.
2. Student login.

The landing page may continue showing the existing product explanation and feature cards, but links must lead to the appropriate authenticated flow rather than exposing a dashboard immediately.

### Authentication

Use the existing Supabase Auth setup when the public Supabase URL and publishable/anon key are configured.

The login flow must:

- Accept email and password.
- Determine the requested role: `professor` or `student`.
- Load the user's role from `profiles`.
- Reject an account whose stored role does not match the selected portal.
- Show an explicit error for invalid credentials, missing profiles, role mismatch, or unavailable configuration.
- Persist and restore the session safely.
- Provide sign out.
- Prevent manually navigating to `/professor` as a student or `/student` as a professor.

The local demo must remain usable when Supabase environment variables are absent. Keep a clearly labelled demo-login path for the existing seeded experience. Do not treat editable `user_metadata` as an authorization source; role authorization must come from the trusted profile/database path.

### Professor portal

After login, show a class-management section before or alongside the existing dashboard:

- List all non-archived courses where `professor_id` belongs to the logged-in professor.
- Display subject code, subject name, semester/section, and enrollment code.
- Allow creating a subject with:
  - Subject/course name.
  - Subject/course code.
  - Semester or section.
  - Optional custom enrollment code.
- Generate an enrollment code when the professor does not supply one.
- Normalize codes consistently, preferably uppercase and trimmed.
- Enforce uniqueness at both the UI and database levels.
- Allow copying a code to the clipboard.
- Keep the existing professor course selector and dashboard data behavior working.

Creating a class must not delete, overwrite, or reseed the existing demo course.

### Student portal

After login, show a class-management section before or alongside the existing Student Wallet:

- List all courses in which the logged-in student has an enrollment.
- Display subject code, subject name, semester/section, and the professor-provided enrollment code.
- Provide an enrollment form using the unique code.
- Collect or preserve the student's roll number and enrollment number.
- Prevent duplicate enrollment in the same course.
- Show a clear error for an invalid, archived, or already-used code.
- Refresh the visible class list and the existing attendance/marks view after successful enrollment.

The existing demo student and demo course must continue to work exactly as before. The seeded Rahul Sharma enrollment should remain linked to the demo student identity.

## Data and persistence rules

Prefer the existing offline-first architecture:

1. Read and write the local Dexie database first.
2. Queue mutations through `syncEngine.queueMutation`.
3. Let the sync engine push changes to Supabase when online and configured.
4. Do not silently swallow errors; show actionable UI feedback.

Use the existing `Course` and `Enrollment` shapes unless a narrowly-scoped type update is required:

- `Course.professor_id` identifies the owner.
- `Course.join_code` is the student-facing unique code.
- `Course.is_archived` excludes old classes from new enrollment.
- `Enrollment.student_user_id` identifies the student.
- `Enrollment.course_id` identifies the class.

If Dexie indexes need to change, add a versioned Dexie migration rather than recreating the database or clearing existing records.

The database schema already contains the core fields. If the schema is changed:

- Keep all exposed tables protected by RLS.
- Add a unique constraint/index for `courses.join_code`.
- Keep course ownership restricted to the logged-in professor.
- Permit students to create only their own enrollment rows after validating the course code.
- Permit students to read only their own enrollments and enrolled-course data.
- Ensure professor reads and writes are restricted to courses they own.
- Do not use `auth.role()` for authorization.
- Do not use `raw_user_meta_data`/editable user metadata for role checks.
- Use `TO authenticated` together with ownership predicates.
- For update policies, include both `USING` and `WITH CHECK`.
- Add indexes for foreign keys and common ownership lookups where appropriate.

Before changing SQL, consult the current Supabase documentation and the repository's Supabase/Postgres best-practice guidance. Verify schema behavior with a test query or targeted integration test.

## Demo-data compatibility checklist

- `seedDemoDataIfEmpty()` must remain idempotent.
- Never change the existing `INITIAL_COURSE_ID`.
- Never remove the seeded ECE-301 course.
- Never remove the 20 seeded students.
- Never remove historical attendance sessions or attendance records.
- Never remove assessments, scores, correction requests, or leave data.
- Existing professor and student dashboard components must continue receiving the same data shapes.
- New user-created classes must coexist with seeded data.
- New enrollments must not change historical attendance calculations unexpectedly; use the existing effective-from-date behavior.

## UI and code-quality expectations

- Match the existing Swiss ledger visual language: strong borders, compact monospace labels, navy/blue accents, and sharp cards.
- Use accessible labels, keyboard-submit forms, disabled submit states, and explicit success/error messages.
- Keep authentication and class-management logic in reusable components/helpers rather than duplicating it in both dashboards.
- Preserve TypeScript type safety.
- Avoid broad `catch` blocks, silent fallbacks, and `as any`.
- Keep comments limited to non-obvious decisions.
- Do not add a new dependency unless the existing stack cannot support the requirement.

## Acceptance criteria

1. An unauthenticated visitor cannot enter either dashboard.
2. A professor can log in and see the seeded ECE-301 class plus any classes they create.
3. A professor can create a second subject and receive a unique code.
4. A duplicate enrollment code is rejected without corrupting existing data.
5. A student can log in and see the seeded Rahul/ECE-301 enrollment.
6. A student can enroll in a newly-created class with its code.
7. Invalid, archived, duplicate, and empty-code enrollment attempts show clear errors.
8. A student cannot access the professor portal, and a professor cannot access the student portal.
9. Signing out removes access until the user signs in again.
10. Existing attendance, marks, leave, dispute, export, and sync features still work.
11. The demo remains functional without Supabase environment variables.
12. `npm run lint` and `npm run build` pass.

## Validation plan

Run the smallest relevant checks first, then the full project checks:

1. Type-check/build the application.
2. Run the configured linter.
3. Manually verify demo professor login, class creation, demo student login, and enrollment.
4. Verify that seeded Dexie records are still present after each flow.
5. If Supabase schema or policies changed, run targeted policy/data-access verification before considering the task complete.

