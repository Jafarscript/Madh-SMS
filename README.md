# School Management System (SMS)

A comprehensive, full-stack school management and academic tracking system designed for bilingual (English and Arabic) institutions. It provides end-to-end management of branches, classes, subjects, student records, continuous assessments, broadsheets with cumulative cascades, result publication workflows, and printable bilingual report cards.

---

## Key Capabilities & Features

### 1. Multi-Branch & Role-Based Access Control
* **Super Admin**: Full administrative control across all campuses, users, terms, grading scales, and report card branding.
* **Branch Admin**: Scoped administration for specific school campuses or branches.
* **Class Teacher**: Class management, attendance recording, student remarks, and broadsheet verification.
* **Subject Teacher**: Focused score entry for assigned subjects and classes.
* **Parent Portal**: Secure verification and viewing of published report cards for enrolled children.

### 2. Student Enrollment & Mid-Year Admissions
* **Individual & Bulk Enrollment**: Add students individually or import entire classes using Excel (`.xlsx`, `.xls`) or CSV files.
* **Automatic Numbering**: Sequential ordering of students alphabetically or by class number.
* **Mid-Session Admission Handling**:
  * Set when each student joined (**Term 1**, **Term 2**, or **Term 3**).
  * Interactive **`[T1] [T2] [T3]`** presence badges on the Students page to toggle term enrollment with a single click.
  * **Auto-Detect Terms**: One-click scanner that inspects score records and sets attendance terms automatically.
  * Ensures students joining in later terms are **not penalized with 0 scores** for earlier terms in cumulative calculations.

### 3. Continuous Assessment & Score Entry
* Configurable score breakdowns (Continuous Assessment / CA + Examination).
* Real-time validation against class and subject maximum marks.
* Progress tracking that dynamically reflects active enrolled students per term.

### 4. Advanced Broadsheets & Cumulative Cascades
* **Three View Modes**:
  * **Current Term Broadsheet**: Total scores, percentages, grades, remarks, and class positions for the active term.
  * **Show Previous Terms Comparison**: Side-by-side progression of student performance across Term 1, Term 2, and Term 3.
  * **Subject Multi-Term Breakdown**: Granular view of individual subject trajectories across the entire academic year.
* **Cascading Aggregation (`foldCascade`)**: Accurate cumulative averages folded across chronological terms.
* **"Only Aggregate Terms Present" Toggle**: Switch between calculating across all terms or strictly terms where the student was enrolled.
* **Export & Print**: One-click print-optimized view and Excel export.

### 5. Result Publishing & Verification Workflow
* **Multi-Stage Workflow**: `Draft` → `Submitted` → `Approved` → `Published` → `Locked`.
* **Audit & Readiness Checks**: Pre-publication verification checks for missing scores or unentered teacher remarks before publishing results.
* **Locking**: Protect finalized results from unauthorized edits after publication.

### 6. Bilingual Report Cards (English & Arabic)
* Fully customized bilingual layout with Arabic (`RTL`) and English (`LTR`) support.
* **Dual Report Card Engines**:
  * **Secondary Classes (Cumulative Engine)**: Displays multi-term cumulative cascading progression, term averages, previous period comparison, and cumulative rankings.
  * **Elementary Classes (Per-Term Engine)**: Specifically designed for lower classes (e.g. Stage 1–4 / Kindergarten / Primary) with:
    * Clean single-term evaluation without historical cascade confusion.
    * Standardized columns: `التقدير (GRADE)`, `المحصلة (TOTAL)`, `الامتحان (EXAM 60%)`, `المراقبة المستمرة (CA 40%)`, and `المواد (SUBJECTS)`.
    * **Attendance Table**: Preserves the complete bilingual attendance statistics (school days opened, present, absent, resumption dates).
    * **Psychomotor & Affective Skills Matrix**: 5-point rating grid for punctuality, neatness, attitude to school work, attentiveness, speaking habit/writing, verbal fluency, and sports.
    * **Grading Scale Legend & Official Seal**: Dedicated scale (85-100 Excellent, 75-84 V. Good, 65-74 Good, 50-64 Fair, 1-49 Poor) and official seal/stamp.
    * Class Teacher & Principal comment blocks with signature lines and stamps.
* Attendance statistics (school days, present days, absent days, resumption dates).
* Bilingual teacher and principal remarks.
* School branding settings: custom logos, Arabic/English school names, header colors, watermarks, principal signatures, and official school stamps.
* Single-student print and bulk class report card printing.

### 7. Predefined Remarks Bank (Class Teachers & Principal)
* Super Admins can view, edit, add, and organize standard bilingual remarks for report cards.
* Filter and assign remarks specifically to **Class Teachers**, **Principal**, or **Both**.
* Categorized by performance level: *Excellence*, *Commendable*, *Noticeable Progress*, *Needs More Effort*, *Conduct & Character*, and *Academic Support Required*.
* Gender-specific Arabic conjugations (Male, Female, or Neutral).
* One-click "Reset to Factory Defaults" to restore the 36 standard accredited remarks.

---

## User Guide & Workflows

### Setting Up a New Academic Session
1. **Branches & Classes**:
   * Navigate to **Admin → Branches** to define your campus locations.
   * Go to **Admin → Classes** to create class levels (e.g., *الأول الإعدادي*, *JSS 1*) and arms.
2. **Subjects & Teachers**:
   * Add subjects under **Admin → Subjects** with English and Arabic names and display ordering.
   * Go to **Admin → Teacher Assignments** to assign class teachers and subject specialists.
3. **Terms & Grading Scales**:
   * Define sessions (e.g., `2025/2026`) and terms (Term 1, 2, 3) under **Admin → Terms**.
   * Configure score bands, letter grades, and bilingual remarks under **Admin → Grading Scales**.

### Managing Students & Term Attendance
1. Go to **Admin → Students** and select a class.
2. **Adding Students**:
   * Single Student: Fill out name, gender, and select the **Joined Term** (Term 1, Term 2, or Term 3).
   * Bulk Upload: Use **Bulk Excel / CSV Enrollment** to import a class spreadsheet.
3. **Managing Mid-Year Joiners**:
   * Each student has `[T1] [T2] [T3]` badges showing which terms they attended.
   * Click any badge to toggle whether the student is enrolled in that term.
   * Click **"Auto-Detect Terms"** to scan existing score records and automatically flag present terms for all students in the class.

### Entering Scores & Monitoring Progress
1. Teachers log in and visit the **Dashboard** or **Scores** section.
2. Select the class, subject, and term.
3. Enter CA and Exam scores. The progress bar reflects the percentage of students in that term who have entered scores.
4. Save scores; calculations for totals and grades update automatically.

### Reviewing the Broadsheet
1. Navigate to **Admin → Broadsheet**.
2. Select the **Class** and **Term**.
3. Toggle the view modes:
   * *Current Term Broadsheet*
   * *Show Previous Terms Comparison*
   * *Subject Multi-Term Breakdown*
4. Ensure the checkbox **"Only aggregate terms present"** is active to prevent un-enrolled terms from pulling down cumulative averages for late-joining students.
5. Use **Export to Excel** or **Print Broadsheet** to generate official records.

### Publishing Results
1. Navigate to **Admin → Result Publishing**.
2. Select the target academic session and term.
3. Review the overview table:
   * Check total students, subjects, score entry percentages, and audit status.
4. Click **Publish** to make report cards accessible to parents and students, or **Lock** to seal the term against future modifications.

### Generating & Customizing Report Cards
1. Navigate to **Admin → Report Cards**.
2. Customize template settings (School Name Arabic/English, Logo, Stamp, Signature, Primary Colors).
3. Select a student to preview their bilingual report card.
4. Print individually or use the batch print feature to print reports for the entire class.

---

## Technical Architecture & Deployment

### Tech Stack
* **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Motion.
* **Backend**: Node.js, Express, TypeScript, Mongoose.
* **Database**: MongoDB (MongoDB Atlas or MongoDB Memory Server for local dev/preview).
* **Export & Document Processing**: XLSX for spreadsheet processing, Print CSS for report card styling.

---

### Environment Variables

Configure your environment variables in `.env` (refer to `.env.example`):

| Variable | Description | Required / Default |
| :--- | :--- | :--- |
| `MONGO_URI` | MongoDB Atlas Connection String (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`) | Recommended for production |
| `MONGODB_DB_NAME` | Targeted database name on MongoDB Atlas | `test` |
| `MONGODB_MAX_POOL_SIZE`| Maximum MongoDB connection pool size per instance | `5` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | Required for authentication |
| `VITE_API_URL` | Public URL of deployed backend (when separating frontend & backend) | Optional (defaults to relative `/api`) |
| `GEMINI_API_KEY` | Google Gemini API key for server-side AI features | Optional |
| `APP_URL` | Public application URL | Injected automatically in AI Studio |

---

### Deployment Options

#### Option A: Full-Stack Container / VPS / Cloud Run / Render
Runs both the frontend build and backend server on a single service:
```bash
# Install dependencies
npm install

# Build client and server bundles
npm run build

# Start production server
npm start
```
* Binds to port `3000` (or `PORT` environment variable) and serves both the API endpoints under `/api/*` and static SPA assets.

#### Option B: Standalone Dedicated Backend (e.g. Render, Railway, VPS)
Builds and starts only the standalone backend server:
```bash
# Build standalone backend bundle
npm run build:backend

# Start backend
npm run start:backend
```
Set the following environment variables on your backend host:
* `MONGO_URI`
* `MONGODB_DB_NAME`
* `JWT_SECRET`
* `PORT` (defaults to 3000 or 5000)

#### Option C: Vercel Frontend + External Deployed Backend
1. Deploy the backend to your host (Render, VPS, etc.) and obtain its public URL (e.g., `https://api.myschool.com`).
2. Deploy the frontend to Vercel and set the environment variable:
   ```env
   VITE_API_URL=https://api.myschool.com
   ```
3. The frontend will route all API requests directly to your deployed backend, completely bypassing serverless timeouts and database connection limits.

---

## Local Development & Testing

```bash
# Run local dev server with hot reload
npm run dev

# Run TypeScript lint check
npm run lint

# Clean build artifacts
npm run clean
```

---

## License & Support
This project is proprietary software for school administrative and academic operations. For questions, configuration assistance, or issues, contact the system administrator.
