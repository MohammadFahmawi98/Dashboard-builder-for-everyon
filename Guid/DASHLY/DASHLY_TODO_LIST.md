# DASHLY - COMPLETE TODO LIST
## 16-Week Build to Product Hunt Launch

---

## TODAY (Next 2 hours) - BUILD DASHLY FOUNDATION
**Timeline:** Next 2 hours  
**Priority:** 🔴 URGENT - Do TODAY  
**Status:** Not Started

### Reading & Planning (30 min)
- [ ] Read DASHLY_STARTUP_CHECKLIST.txt (20 min)
- [ ] Understand 2-hour action plan (10 min)

### Action Items (1.5 hours)
- [ ] Register domain (dashly.io or dashly.com) - 15 min
- [ ] Create Twitter account (@dashly) - 15 min
- [ ] Create GitHub organization (github.com/dashly) - 10 min
- [ ] Create DASHLY logo using Canva - 60 min
- [ ] Subscribe to Claude Code ($20/month) - 5 min

**Expected Outcome:** Domain registered, Twitter created, GitHub org live, logo designed, Claude Code active

---

## THIS WEEK (5-6 hours reading) - UNDERSTAND DASHLY COMPLETELY
**Timeline:** This Week (Mon-Fri)  
**Priority:** 🟡 HIGH  
**Status:** Not Started

### Reading Tasks
- [ ] Read DASHLY_BRAND_PACKAGE.md completely (1 hour)
- [ ] Read DASHLY_DETAILED_BUILD_GUIDE.md - Week 1 section (2 hours)
- [ ] Read DASHLY_DETAILED_MARKETING_GUIDE.md - Week 1 section (1.5 hours)
- [ ] Skim SOLO_CODER_PLAN.md for methodology (30 min)
- [ ] Skim EXECUTIVE_SUMMARY.md for big picture (30 min)

### Setup Tasks
- [ ] Setup development environment:
  - [ ] Install Node.js + npm
  - [ ] Install Git
  - [ ] Setup code editor (VS Code)
  - [ ] Create project folder structure (dashly/backend, dashly/frontend)
- [ ] Create Cowork board for DASHLY
- [ ] Set up GitHub repos:
  - [ ] dashly/backend repo
  - [ ] dashly/frontend repo
  - [ ] dashly/docs repo
- [ ] Create Trello/todo board for tracking
- [ ] Tell someone you're starting (accountability partner)

**Expected Outcome:** Fully prepared to start building, environment ready, all docs understood

---

## NEXT WEEK (Start Building) - WEEK 1 FOUNDATION
**Timeline:** Week 1 (Monday-Friday)  
**Priority:** 🔴 CRITICAL - Hardest week setup  
**Status:** Ready to Start

### MONDAY: DASHLY Database & Express Setup
- [ ] Task 1.1: Design DASHLY Database Schema (2 hours)
  - [ ] Generate schema with Claude Code
  - [ ] Create dashly-schema.sql file
  - [ ] Copy schema to backend/migrations/

- [ ] Task 1.2: Deploy DASHLY Database to Railway (1 hour)
  - [ ] Sign up to Railway.app
  - [ ] Create PostgreSQL database
  - [ ] Run migrations
  - [ ] Verify all tables created

- [ ] Task 1.3: Create DASHLY Express Project (1 hour)
  - [ ] Generate project structure with Claude Code
  - [ ] npm install dependencies
  - [ ] Setup TypeScript
  - [ ] Verify build works

- [ ] Task 1.4: Create DASHLY JWT Auth (1.5 hours)
  - [ ] Generate auth service with Claude Code
  - [ ] Copy to src/services/auth.service.ts
  - [ ] Implement password hashing
  - [ ] Implement JWT generation using environment variables

**Daily Goal:** DASHLY Database live, Express server running, JWT auth working
**Update Cowork:** Week 1 Monday - ✅ Complete

### TUESDAY: DASHLY Express Server & Auth Middleware
- [ ] Task 1.5: Create DASHLY Auth Middleware (30 min)
  - [ ] Generate middleware with Claude Code
  - [ ] Create src/middleware/auth.ts
  - [ ] Test authentication flow

- [ ] Task 1.6: Create DASHLY Auth Routes (1 hour)
  - [ ] Generate endpoints with Claude Code
  - [ ] Implement /auth/signup endpoint
  - [ ] Implement /auth/login endpoint
  - [ ] Implement /auth/me endpoint
  - [ ] Implement /auth/profile endpoint
  - [ ] Implement /auth/change-password endpoint

- [ ] Task 1.7: Create DASHLY Express Main Server (1 hour)
  - [ ] Generate main server file with Claude Code
  - [ ] Configure middleware
  - [ ] Register routes
  - [ ] Setup error handling
  - [ ] Test: npm run dev

- [ ] Task 1.8: Test DASHLY Auth System (1 hour)
  - [ ] Test signup endpoint with curl
  - [ ] Test login endpoint with curl
  - [ ] Test /me endpoint with token
  - [ ] Verify tokens working

**Daily Goal:** DASHLY Express server running, all auth endpoints working, tested
**Update Cowork:** Week 1 Tuesday - ✅ Complete

### WEDNESDAY: DASHLY React Project Setup
- [ ] Task 1.9: Create DASHLY Vite + React Project (1 hour)
  - [ ] npm create vite dashly-frontend
  - [ ] npm install
  - [ ] Verify npm run dev works
  - [ ] Test in browser

- [ ] Task 1.10: Setup DASHLY TailwindCSS (1 hour)
  - [ ] npm install tailwindcss postcss autoprefixer
  - [ ] Configure tailwind.config.js with DASHLY colors
  - [ ] Setup src/index.css with Tailwind directives
  - [ ] Verify Tailwind loads in browser

- [ ] Task 1.11: Setup DASHLY React Router (1 hour)
  - [ ] npm install react-router-dom
  - [ ] Create src/App.tsx with BrowserRouter
  - [ ] Setup routes: /login, /signup, /dashboard, /settings
  - [ ] Create ProtectedRoute component
  - [ ] Create Layout component with header

- [ ] Task 1.12: Setup DASHLY Zustand Store (1 hour)
  - [ ] npm install zustand
  - [ ] Create src/store/auth.ts
  - [ ] Implement user state
  - [ ] Implement token state
  - [ ] Setup localStorage persistence
  - [ ] Create useAuth hook

**Daily Goal:** DASHLY React project ready, TailwindCSS working, routing configured
**Update Cowork:** Week 1 Wednesday - ✅ Complete

### THURSDAY: DASHLY Frontend Integration
- [ ] Task 1.13: Create DASHLY API Client (1.5 hours)
  - [ ] npm install axios
  - [ ] Create src/api/client.ts
  - [ ] Setup Axios instance with token interceptor
  - [ ] Implement auth API methods
  - [ ] Implement dashboard API stubs

- [ ] Task 1.14: Create DASHLY Signup Page (1.5 hours)
  - [ ] Create src/pages/Signup.tsx with Claude Code
  - [ ] Form validation
  - [ ] Call signup() API
  - [ ] Save token to store
  - [ ] Redirect to /dashboard on success
  - [ ] Test: Try signing up

- [ ] Task 1.15: Create DASHLY Login Page (1.5 hours)
  - [ ] Create src/pages/Login.tsx with Claude Code
  - [ ] Form with email + password
  - [ ] Call login() API
  - [ ] Save token to store
  - [ ] Redirect to /dashboard on success
  - [ ] Test: Try logging in

- [ ] Task 1.16: Create DASHLY Protected Routes & Layout (1 hour)
  - [ ] Update ProtectedRoute component
  - [ ] Create MainLayout component with header
  - [ ] Create Dashboard placeholder page
  - [ ] Test: Navigate between pages

**Daily Goal:** DASHLY frontend-backend integration complete, auth flow end-to-end
**Update Cowork:** Week 1 Thursday - ✅ Complete

### FRIDAY: DASHLY Deployment & Polish
- [ ] Task 1.17: Deploy DASHLY Backend to Railway (1.5 hours)
  - [ ] Connect GitHub repo to Railway
  - [ ] Set environment variables securely
  - [ ] Deploy backend
  - [ ] Test: curl backend endpoint

- [ ] Task 1.18: Deploy DASHLY Frontend to Vercel (1 hour)
  - [ ] Connect GitHub repo to Vercel
  - [ ] Set build settings
  - [ ] Deploy frontend
  - [ ] Test: Visit frontend URL

- [ ] Task 1.19: Update DASHLY Frontend API URL (30 min)
  - [ ] Update src/api/client.ts baseURL to production
  - [ ] Test: Signup/login on production
  - [ ] Verify: Works with production backend

- [ ] Task 1.20: Create DASHLY Week 1 Documentation (1 hour)