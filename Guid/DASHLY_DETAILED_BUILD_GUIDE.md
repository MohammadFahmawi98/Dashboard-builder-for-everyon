# 🚀 DASHLY - COMPLETE BUILD GUIDE
## Week-by-Week, Day-by-Day Implementation with Claude Code Prompts

**Project:** DASHLY - "Dashboards for Everyone"  
**Duration:** 16 Weeks  
**Daily Tasks:** All 80+ tasks broken down by day  
**Claude Code Prompts:** Every single prompt included  
**Total Hours:** ~750 hours (~60/week)  
**Start:** Week 1 Monday  
**Launch:** Week 13 (Product Hunt)  

---

## ⚡ QUICK START (DO THIS FIRST - 2 HOURS)

### **TODAY (Before Starting Week 1)**

**Task 1: Register DASHLY Domain (15 min)**
```
ACTION STEPS:
1. Go to GoDaddy.com
2. Search: "dashly.com"
3. If available → BUY IT NOW ($15/year)
4. If not → Search "dashly.io" or "dashly.app"
5. Add to cart, checkout
6. Check email for confirmation
7. Save domain credentials

COST: ~$15
TIME: 15 min
RESULT: ✅ dashly.io (or .com) registered
```

**Task 2: Create DASHLY Twitter Account (15 min)**
```
ACTION STEPS:
1. Go to Twitter.com
2. Click "Sign Up"
3. Email: your-email@gmail.com
4. Name: DASHLY
5. Username: @dashly
6. Password: [Create strong password]
7. Bio: "Dashboards for Everyone | Building DASHLY"
8. Website: dashly.io (add later when live)
9. Confirm email
10. Save credentials

RESULT: ✅ @dashly Twitter account created
```

**Task 3: Create DASHLY GitHub Organization (10 min)**
```
ACTION STEPS:
1. Go to GitHub.com
2. Sign in (or create account)
3. Click "+" icon → New Organization
4. Organization name: dashly
5. Billing email: your-email
6. Organization type: Open source
7. Add description: "Dashboards for Everyone"
8. Create organization
9. Add your logo (later)

RESULT: ✅ github.com/dashly org created
```

**Task 4: Create DASHLY Logo (60 min)**
```
OPTION A: CANVA (EASIEST - 30 min)
1. Go to Canva.com (sign up free)
2. Search "Logo" template
3. Select simple modern template
4. Change background to #2563EB (Dashly Blue)
5. Add large "D" letter (bold, white)
6. Add small dashboard grid inside D
7. Add "DASHLY" text below in white
8. Font: Inter Bold if available
9. Download as PNG (1200x1200px)
10. Download as SVG
11. Save to folder: dashly-branding/

FILES TO CREATE:
- dashly-logo.svg
- dashly-logo.png (1200x1200)
- dashly-logo-white.svg (white version)
- dashly-favicon.ico (32x32 - use favicon generator)

OPTION B: FIGMA (If you prefer)
1. Go to Figma.com (free account)
2. Create new file: "DASHLY Logo"
3. Create "D" shape (Dashly Blue #2563EB)
4. Add grid pattern inside
5. Add text "DASHLY"
6. Export as SVG + PNG

OPTION C: LOGOMAKER (If you want professional)
1. Go to Looka.com
2. Input: "DASHLY Dashboards"
3. Generate logos
4. Pick favorite
5. Download ($50-200)

RESULT: ✅ DASHLY logo created (SVG + PNG)
TIME: 30-60 min depending on option
```

**Task 5: Subscribe to Claude Code (5 min)**
```
ACTION STEPS:
1. Go to Claude.ai
2. Sign in (or create account)
3. Look for "Claude Code" option
4. Click "Enable Claude Code"
5. Subscribe: $20/month
6. Enter payment info
7. Activate subscription
8. Test with simple prompt

RESULT: ✅ Claude Code activated
COST: $20/month
```

**TOTAL STARTUP TIME: 2 hours**
**TOTAL COST: ~$35 (domain + Claude Code first month)**

---

# 📅 WEEK 1: DASHLY FOUNDATION (60 HOURS)

## **WEEK 1 OVERVIEW**
- **Goal:** Database live, Express server running, React project ready
- **Hours:** 60 hours
- **Days:** Monday-Friday (full week, ~12 hrs/day)
- **Deliverable:** DASHLY backend + frontend foundation

---

## **MONDAY: DASHLY DATABASE & EXPRESS SETUP**

### **Morning Session (8 AM - 12 PM): DASHLY Database Schema**

**Task 1.1.1: Design DASHLY Database Schema**
```
TIME: 2 hours
CLAUDE PROMPT:
"Generate production-ready PostgreSQL schema for DASHLY dashboard builder.

Include these tables:
1. users table:
   - id (primary key)
   - email (unique)
   - password_hash
   - name
   - plan (free/pro/enterprise)
   - created_at
   - updated_at

2. workspaces table:
   - id
   - owner_id (foreign key to users)
   - name
   - plan
   - created_at
   - updated_at

3. workspace_members table:
   - id
   - workspace_id
   - user_id
   - role (owner/editor/viewer)
   - created_at

4. dashboards table:
   - id
   - workspace_id
   - name
   - description
   - template
   - created_by (user_id)
   - created_at
   - updated_at

5. queries table:
   - id
   - workspace_id
   - connector_id
   - query_text
   - type (simple/sql)
   - cache_ttl
   - created_at
   - updated_at

6. tiles table:
   - id
   - dashboard_id
   - query_id
   - viz_type (bar/line/pie/table/etc)
   - config (JSON)
   - position_x
   - position_y
   - width
   - height
   - created_at
   - updated_at

7. connectors table:
   - id
   - workspace_id
   - name
   - type (stripe/postgres/mysql/etc)
   - config (JSON - encrypted)
   - status (active/inactive)
   - created_at
   - updated_at

8. usage_tracking table:
   - id
   - workspace_id
   - month
   - dashboards_created
   - queries_executed
   - tiles_created
   - api_calls

9. share_tokens table:
   - id
   - dashboard_id
   - token (unique)
   - created_at
   - expires_at

10. alerts table:
    - id
    - dashboard_id
    - condition
    - threshold
    - created_at

Add proper indexes:
- Index on users.email
- Index on workspaces.owner_id
- Index on dashboards.workspace_id
- Index on queries.workspace_id
- Index on tiles.dashboard_id
- Index on connectors.workspace_id

Add foreign keys with cascade deletes where appropriate.

Output: PostgreSQL CREATE TABLE statements"

CLAUDE OUTPUT: [Schema SQL - copy this]

ACTION:
1. Copy CLAUDE output
2. Create file: dashly-schema.sql
3. Save to dashly/backend/migrations/
```

**Task 1.1.2: Deploy DASHLY Database to Railway**
```
TIME: 1 hour
STEPS:
1. Go to Railway.app
2. Sign up (free tier)
3. Create new project: DASHLY
4. Add PostgreSQL service
5. Copy connection string
6. Save to .env file:
   DATABASE_URL=postgres://[connection-string]
7. Connect to database:
   - Use psql or pgAdmin
   - Run dashly-schema.sql
   - Verify all tables created

RESULT: ✅ DASHLY Database live on Railway
```

**Task 1.1.3: Create DASHLY Express Project Structure**
```
TIME: 1 hour
CLAUDE PROMPT:
"Generate Node.js/Express TypeScript project structure for DASHLY.

Include:
- package.json with dependencies:
  * express
  * typescript
  * pg (PostgreSQL)
  * redis
  * jsonwebtoken
  * bcryptjs
  * cors
  * dotenv
  
- tsconfig.json (strict mode)

- .env.example with:
  DATABASE_URL=
  JWT_SECRET=[Generate a strong and random secret]
  NODE_ENV=development
  PORT=3001

- Project structure:
  src/
    ├── config/
    │   ├── database.ts
    │   └── redis.ts
    ├── middleware/
    │   ├── auth.ts
    │   └── errorHandler.ts
    ├── routes/
    │   ├── auth.ts
    │   ├── dashboards.ts
    │   ├── queries.ts
    │   └── connectors.ts
    ├── services/
    │   ├── auth.service.ts
    │   ├── dashboard.service.ts
    │   └── query.service.ts
    └── index.ts

- .gitignore (node_modules, .env, etc)

- README.md with setup instructions

Output: Complete project structure with all files"

ACTION:
1. Copy CLAUDE output
2. Create project: mkdir dashly/backend
3. Copy all files from CLAUDE
4. Run: npm install
5. Verify: npm run build (should compile)
```

### **Afternoon Session (1 PM - 5 PM): DASHLY JWT Auth System**

**Task 1.2.1: Generate DASHLY JWT Authentication System**
```
TIME: 2 hours
CLAUDE PROMPT:
"Generate Express.js JWT authentication system for DASHLY.

Create src/services/auth.service.ts with:

1. hashPassword(password: string): Promise<string>
   - Use bcryptjs
   - Salt rounds: 10
   - Return hashed password

2. comparePassword(password: string, hash: string): Promise<boolean>
   - Compare password with hash
   - Return true if match

3. generateToken(userId: string): string
   - Create JWT token
   - Payload: {userId, iat: Date.now()}
   - Secret: process.env.JWT_SECRET
   - Expires in: 24 hours
   - Return token

4. verifyToken(token: string): {userId: string}
   - Verify JWT token
   - Return decoded payload
   - Throw error if invalid

5. signup(email: string, password: string, name: string): Promise<{user, token}>
   - Validate email format
   - Validate password strength (8+ chars)
   - Hash password
   - Create DASHLY user record
   - Create DASHLY workspace automatically
   - Create DASHLY usage_tracking record
   - Generate JWT token
   - Return user + token

6. login(email: string, password: string): Promise<{user, token}>
   - Find user by email
   - Compare password
   - Generate JWT token
   - Return user + token

Export all functions"

ACTION:
1. Copy CLAUDE output to src/services/auth.service.ts
2. Install dependencies: npm install bcryptjs jsonwebtoken
3. Create src/middleware/auth.ts:
```

**Task 1.2.2: Create DASHLY Auth Middleware**
```
TIME: 30 min
CLAUDE PROMPT:
"Generate Express middleware for DASHLY JWT verification.

Create src/middleware/auth.ts with:

1. authMiddleware: Verify JWT token in request
   - Extract token from Authorization header
   - Verify token
   - Attach userId to req.user
   - Call next() if valid
   - Return 401 if invalid

2. optionalAuth: Optional JWT verification
   - Try to extract + verify token
   - If valid: attach to req.user
   - If invalid: continue without user
   - Always call next()

Export both middleware functions"

ACTION:
1. Copy to src/middleware/auth.ts
2. Test: Create simple test file
```

**Task 1.2.3: Create DASHLY Auth Routes**
```
TIME: 1 hour
CLAUDE PROMPT:
"Generate Express routes for DASHLY authentication.

Create src/routes/auth.ts with endpoints:

1. POST /auth/signup
   - Body: {email, password, name}
   - Call signup() from auth.service
   - Return: {user: {id, email, name, plan}, token}
   - Status: 201

2. POST /auth/login
   - Body: {email, password}
   - Call login() from auth.service
   - Return: {user, token}
   - Status: 200

3. GET /auth/me
   - Require authMiddleware
   - Fetch user from database
   - Return: {user: {id, email, name, plan, workspace}}
   - Status: 200

4. PUT /auth/profile
   - Require authMiddleware
   - Body: {name, email}
   - Update user record
   - Return: {user}
   - Status: 200

5. POST /auth/change-password
   - Require authMiddleware
   - Body: {oldPassword, newPassword}
   - Verify old password
   - Hash new password
   - Update user
   - Return: {success: true}
   - Status: 200

All endpoints include error handling and validation"

ACTION:
1. Copy to src/routes/auth.ts
2. Register route in src/index.ts: app.use('/auth', authRoutes)
```

**MONDAY RESULT:**
✅ DASHLY Database Schema created + deployed to Railway  
✅ DASHLY JWT Auth System implemented  
✅ DASHLY Auth Routes ready to test  
**HOURS USED: 7/60**  
**REMAINING: 53 hours**

---

## **TUESDAY: DASHLY EXPRESS SERVER SETUP**

### **Morning Session (8 AM - 12 PM): DASHLY Express Server**

**Task 1.3.1: Create DASHLY Express Main Server**
```
TIME: 2 hours
CLAUDE PROMPT:
"Generate Express.js main server file for DASHLY.

Create src/index.ts with:

1. Import required libraries:
   - express
   - cors
   - dotenv
   - auth routes
   - auth middleware

2. Initialize Express app

3. Configure middleware:
   - CORS (allow dashly.io + localhost:3000)
   - JSON parser (body-parser)
   - URL encoder
   - Custom logger middleware

4. Register routes:
   - POST /auth/signup
   - POST /auth/login
   - GET /auth/me
   - PUT /auth/profile
   - POST /auth/change-password

5. Error handling middleware:
   - Catch-all 404 handler
   - Global error handler
   - Log errors to console

6. Server startup:
   - const PORT = process.env.PORT || 3001
   - app.listen(PORT, () => console.log('DASHLY server running'))

Export app for testing"

ACTION:
1. Copy to src/index.ts
2. Create .env file:
   DATABASE_URL=postgres://[railway-connection]
   JWT_SECRET=[Strong random secret here]
   NODE_ENV=development
   PORT=3001
3. Run: npm run dev
4. Test in terminal: curl http://localhost:3001/health
```

**Task 1.3.2: Create DASHLY Database Connection Pool**
```
TIME: 1 hour
CLAUDE PROMPT:
"Generate PostgreSQL connection pool for DASHLY.

Create src/config/database.ts with:

1. Create pg.Pool instance:
   - Connection string from DATABASE_URL
   - Max connections: 20
   - Idle timeout: 30 seconds
   - Connection timeout: 2 seconds

2. Helper functions:
   - query(sql, params): Execute query
   - getOne(sql, params): Get single row
   - getMany(sql, params): Get multiple rows
   - insert(table, data): Insert and return id
   - update(table, data, id): Update record
   - delete(table, id): Delete record

3. Transaction support:
   - beginTransaction()
   - commit()
   - rollback()

4. Error handling:
   - Retry logic for failed connections
   - Log connection errors
   - Graceful shutdown

Export pool + all functions"

ACTION:
1. Copy to src/config/database.ts
2. Test connection: Run npm run dev and check console
3. Verify tables exist: SELECT * FROM users;
```

**Task 1.3.3: Create DASHLY Redis Cache Connection**
```
TIME: 1 hour
CLAUDE PROMPT:
"Generate Redis connection for DASHLY caching.

Create src/config/redis.ts with:

1. Create Redis client:
   - Use 'redis' npm package
   - Connect to localhost:6379 (or Redis URL)
   - Handle connection errors
   - Reconnect on error

2. Helper functions:
   - get(key): Get cached value
   - set(key, value, ttl): Cache with TTL
   - delete(key): Delete cache key
   - clear(): Clear all cache
   - exists(key): Check if key exists

3. Error handling:
   - Graceful fallback if Redis unavailable
   - Log cache operations (optional)

Export client + all functions"

ACTION:
1. Run: npm install redis
2. Copy to src/config/redis.ts
3. For local dev: Install Redis locally or use Docker
4. Docker: docker run -d -p 6379:6379 redis
```

### **Afternoon Session (1 PM - 5 PM): DASHLY Test + Verify**

**Task 1.3.4: Test DASHLY Auth System**
```
TIME: 2 hours
STEPS:
1. Start server: npm run dev
2. Test signup with curl:
   curl -X POST http://localhost:3001/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@dashly.com","password":"Password123","name":"Test User"}'
3. Get returned token
4. Test login:
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@dashly.com","password":"Password123"}'
5. Test /me endpoint:
   curl -H "Authorization: Bearer