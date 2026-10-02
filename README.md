# CyberGuard Ghana (COP Edition)

Youth cybersecurity education, mentorship, and an anonymous Child Online
Protection incident-reporting portal — built for the Ghanaian context under
the Cybersecurity Act, 2020 (Act 1038) and the CSA National COP Framework.

This repo is a working scaffold for the three modules described in the
project specification:

1. **Gamified LMS** — age-banded courses (12–18 / 19–23), quizzes, progress
   tracking, certificates.
2. **Tutor Marketplace** — vetted mentor profiles, availability slots,
   booking with auto-generated Jitsi video rooms.
3. **COP Incident & Evidence Hash Portal** — zero-knowledge anonymous
   reporting, client-side EXIF stripping, SHA-256 evidence fingerprinting,
   duplicate-hash matching, and a CSA officer review dashboard with PDF
   case-brief export.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| ORM / DB | Prisma + PostgreSQL (Supabase free tier) |
| Object storage | Cloudflare R2 (S3-compatible, zero egress fees) |
| Crypto | Native browser Web Crypto API (client-side only) |
| Video | Jitsi Meet embedded iframe |

## Project structure

```
cyberguard-ghana/
├── backend/
│   ├── prisma/schema.prisma      # full data model for all 3 modules
│   ├── prisma/seed.js            # demo admin/CSA/tutor accounts + course
│   └── src/
│       ├── index.js              # Express app entry point
│       ├── routes/               # auth, courses, incidents, tutors
│       ├── controllers/          # PDF case-brief generator
│       ├── middleware/           # JWT auth, role guards, error handler
│       └── config/                # Prisma client, R2/S3 client
└── frontend/
    └── src/
        ├── utils/evidenceCrypto.js  # EXIF stripping + SHA-256 hashing
        ├── pages/                    # one file per route
        ├── layouts/, components/, context/
```

## 1. Local setup

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project (PostgreSQL)
- A free [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket

### Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, R2_* keys
npx prisma generate
npx prisma migrate dev --name init
npm run seed               # optional: creates demo admin/CSA/tutor accounts
npm run dev                 # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:4000/api
npm run dev                 # starts on http://localhost:5173
```

Demo logins after seeding (password `ChangeMe123!`):
- `admin@cyberguard.gh` — course publishing, tutor vetting
- `csa-officer@cyberguard.gh` — incident review portal at `/admin`
- `tutor@cyberguard.gh` — has one open booking slot

## 2. How the Zero-Knowledge evidence flow works

1. In the browser, `evidenceCrypto.js` re-encodes any uploaded image
   through an off-screen `<canvas>`. Canvas only ever outputs raw pixel
   data, so EXIF/IPTC/XMP blocks (camera model, GPS coordinates, device
   serial numbers, timestamps) are dropped in the process — the server
   never sees them.
2. The scrubbed file is hashed with `window.crypto.subtle.digest("SHA-256", …)`
   entirely client-side.
3. The frontend asks the backend for a **pre-signed R2 upload URL** (the
   backend never touches the raw file bytes), uploads directly to
   Cloudflare R2, then submits the report with only the hash + storage key.
4. The backend checks the new hash against every previously stored
   `EvidenceHash.sha256Hash` to flag duplicate/viral abusive media.
5. `IncidentReport` has no `userId`, no IP field, and no device
   fingerprint — the model itself makes re-identifying a reporter
   impossible from the data alone. The reporter's only way to check
   status later is the reference code shown once at submission.

> **Note on scope:** metadata stripping currently covers image types
> (JPEG/PNG/WebP) via canvas re-encoding. Video evidence is currently
> passed through unscrubbed — stripping video container metadata needs a
> different approach (e.g. `mp4box.js` in-browser) and is a good "future
> work" item to mention in your defense if a marker asks about it.

## 3. Deployment (100% free tier)

1. **Database — Supabase**: create a project, copy the connection string
   into `DATABASE_URL`, run `npx prisma migrate deploy` against it.
2. **Object storage — Cloudflare R2**: create a bucket, create an API
   token scoped to that bucket, fill `R2_*` vars in the backend `.env`.
3. **Backend — Render**: new Web Service pointing at `backend/`, build
   command `npm install && npx prisma generate`, start command
   `npm start`. Add all `.env` vars in Render's dashboard.
4. **Frontend — Vercel or Render Static Site**: new project pointing at
   `frontend/`, build command `npm run build`, output directory `dist`.
   Set `VITE_API_URL` to your deployed backend's `/api` URL.
5. **Video** — no deployment needed; Jitsi rooms are generated as plain
   URLs (`meet.jit.si/CyberGuard-Session-<uuid>`) pointing at Jitsi's
   free public infrastructure.

## 4. What's left for you to build out before submission

This scaffold gives you a working, coherent skeleton across all three
modules with real security logic in the most novel part (the evidence
hashing pipeline) — but a final year submission will look stronger if you
extend it in these places:

- **Admin Course Studio UI** — the API (`POST /api/courses`) exists;
  build a form so non-technical admins don't need Prisma Studio.
- **Progress tracking** — `Enrollment.progressPct` exists in the schema
  but nothing currently increments it as lessons are completed; wire
  that up in `CourseDetail.jsx`.
- **Certificate rendering** — `POST /courses/:id/certificate` issues a
  DB record; add an HTML-to-canvas certificate image as the spec
  describes.
- **Automated tests** for the hashing determinism claim in the spec's
  "Next Steps" section — a Jest test that hashes the same file twice and
  asserts equal output is an easy, defensible addition.
- **Video EXIF stripping**, noted above.

## 5. Legal / safety note

The incident portal is designed for a genuine child-protection use case
and intentionally avoids collecting anything that could identify a
reporter. If you deploy this beyond a coursework demo, have it reviewed
by CSA Ghana or a legal advisor before handling real reports — a live
domain must never be positioned as an accredited CSA reporting channel
unless it actually is one.
