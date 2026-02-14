# 📚 Postmen - Complete Architecture & Logic Guide

This document explains how Postmen works internally, from authentication to request proxying.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Authentication Flow](#authentication-flow)
3. [Request Proxying](#request-proxying)
4. [Data Storage](#data-storage)
5. [Component Communication](#component-communication)
6. [API Endpoints](#api-endpoints)

---

## 🏗️ System Architecture

Postmen is a **full-stack Next.js application** running on a single server. This means:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Browser (React Components)                                │
│  ├─ Landing.tsx (Home Page)                               │
│  ├─ Login.tsx (Auth Form)                                 │
│  ├─ Signup.tsx (Auth Form)                                │
│  └─ Dashboard.tsx (Main App)                              │
│       ├─ Form.tsx (Request Builder)                       │
│       ├─ ResponseDisplay.tsx (Show Results)               │
│       ├─ RequestHistory.tsx (List Requests)               │
│       └─ Statics.tsx (Statistics)                         │
│                                                             │
│  Context (React Context API)                              │
│  └─ ContextProvider.tsx (Global Auth & API State)         │
│                                                             │
└────────────────┬──────────────────────────────────────────┘
                 │ fetch() with JWT Bearer Token
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Next.js API Routes (Backend)                             │
│  ├─ /api/auth/signup  → Create User                       │
│  ├─ /api/auth/login   → Verify & Return JWT               │
│  ├─ /api/auth/logout  → Invalidate Session                │
│  ├─ /api/request      → Proxy External API                │
│  ├─ /api/history      → CRUD Request History              │
│  └─ /api/stats        → Calculate Statistics              │
│                                                             │
│  Middleware                                                │
│  └─ getAuthFromRequest() → Verify JWT Token               │
│                                                             │
└────────────────┬──────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  MongoDB Atlas Database                                   │
│  ├─ users (Email, Hashed Password, CreatedAt)            │
│  └─ requesthistories (URL, Method, Headers, Response)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

External APIs (Proxied)
├─ GitHub API
├─ JSONPlaceholder
├─ Any REST API endpoint
└─ etc.
```

**Key principle**: User's browser never directly calls external APIs. All requests go through our server, which:
1. Validates the user's JWT token
2. Makes the proxied request
3. Returns the response
4. Saves to database if authenticated

---

## 🔐 Authentication Flow

### **Sign Up Flow**

```
User enters email/password
        ↓
Clicks "Sign Up"
        ↓
POST /api/auth/signup
        ↓
Server validates:
├─ Email format valid?
├─ Password length ≥ 6?
├─ User doesn't exist?
        ↓
Server creates user:
├─ Hash password with bcrypt
├─ Save to MongoDB
        ↓
Server returns JWT token
        ↓
Client stores token in localStorage
        ↓
Redirect to Dashboard
```

### **Login Flow**

```
User enters credentials
        ↓
POST /api/auth/login
        ↓
Server validates:
├─ User exists?
├─ Password matches hash?
        ↓
Server generates JWT:
├─ Payload: { id: userId, email: userEmail }
├─ Secret: JWT_SECRET (env variable)
├─ Expires: 7 days
        ↓
Client stores token in localStorage
        ↓
All future requests include:
Authorization: Bearer <token>
```

### **Token Validation**

Every protected API call:

```
Client sends: Authorization: Bearer eyJhbGc...

Server receives request
        ↓
Extract token from "Authorization" header
        ↓
Verify JWT signature with JWT_SECRET
        ↓
Check expiration time
        ↓
If valid: Extract user ID from payload
If invalid: Return 401 Unauthorized
```

**Code location**: `app/lib/auth.ts`

```typescript
// Token creation
export function signToken(id: string, email: string) {
  return jwt.sign({ id, email }, process.env.JWT_SECRET!, {
    expiresIn: "7d"
  });
}

// Token verification
export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
}

// Extract from request
export function getAuthFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1]; // "Bearer <token>"
  
  if (!token) return null;
  
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
```

---

## 🌐 Request Proxying

### **How Request Proxying Works**

When a user makes an API request through Postmen:

```
┌─ User Request ──────────────────────┐
│                                     │
│ Method: GET                         │
│ URL: https://api.github.com/users   │
│ Headers: { "X-Custom": "value" }   │
│                                     │
└─────────────┬───────────────────────┘
              ↓
      Browser sends to Postmen:
      
      POST /api/request
      Authorization: Bearer <jwt>
      Body: {
        method: "GET",
        url: "https://api.github.com/users",
        headers: { "X-Custom": "value" },
        body: null
      }
              ↓
      Postmen server processes:
      
      1. Validate JWT token
      2. Fetch from external API
      3. Record timing
      4. Save to database
      5. Return response
              ↓
┌──── Full Response ──────────┐
│ Status: 200                 │
│ Headers: {...}             │
│ Body: [{user data...}]     │
│ Time: 124ms                │
│ Size: 4.2 KB               │
└────────────────────────────┘
```

**Code location**: `app/api/request/route.ts`

```typescript
export async function POST(req: NextRequest) {
  // 1. Verify JWT
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Parse request body
  const { method, url, headers: userHeaders, body } = await req.json();

  // 3. Make external API call
  const startTime = Date.now();
  const response = await fetch(url, {
    method,
    headers: userHeaders,
    body: body ? JSON.stringify(body) : null
  });
  const endTime = Date.now();

  // 4. Read response
  const responseData = await response.json();
  const responseSize = JSON.stringify(responseData).length;

  // 5. Save to database
  await RequestHistory.create({
    user: auth.id,
    method,
    url,
    headers: userHeaders,
    requestBody: body,
    response: {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      data: responseData
    },
    timing: endTime - startTime,
    size: responseSize
  });

  // 6. Return response
  return NextResponse.json({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    data: responseData,
    timing: endTime - startTime,
    size: responseSize
  });
}
```

---

## 💾 Data Storage

### **MongoDB Collections**

#### **users Collection**

```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  password: "$2b$10$hashOfPassword...", // bcrypt hash
  createdAt: ISODate("2026-02-14T10:30:00Z")
}
```

**Schema** (`app/lib/models.ts`):
```typescript
const userSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
```

#### **requesthistories Collection**

```javascript
{
  _id: ObjectId("..."),
  user: ObjectId("..."), // Reference to user
  method: "GET",
  url: "https://api.github.com/users",
  headers: { "Authorization": "Bearer ..." },
  requestBody: null,
  response: {
    status: 200,
    headers: { "content-type": "application/json" },
    data: { ... }
  },
  timing: 124, // milliseconds
  size: 4200, // bytes
  createdAt: ISODate("2026-02-14T11:00:00Z")
}
```

**Schema** (`app/lib/models.ts`):
```typescript
const requestHistorySchema = new Schema({
  user: { type: Schema.ObjectId, ref: "User", required: true },
  method: String,
  url: String,
  headers: Schema.Types.Mixed,
  requestBody: Schema.Types.Mixed,
  response: {
    status: Number,
    headers: Schema.Types.Mixed,
    data: Schema.Types.Mixed
  },
  timing: Number,
  size: Number,
  createdAt: { type: Date, default: Date.now }
});
```

### **Database Connection**

**Code** (`app/lib/db.ts`):
```typescript
// MongoDB singleton pattern
// Prevents connection spam in development

let cached = global.mongoose;

export default async function dbConnect() {
  if (cached?.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not defined");
  }

  cached = await mongoose.connect(process.env.MONGO_URI!);
  return cached.conn;
}
```

---

## 🔄 Component Communication

### **React Context for State Management**

Postmen uses React Context API (not Redux) for simplicity:

```typescript
// app/components/Layout/context/Context.ts

interface GlobalContext {
  token: string | null;
  user: any;
  isAuthenticated: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
}
```

**How it works**:

1. **ContextProvider** wraps the entire app in `app/layout.tsx`
2. Components call `useGlobal()` hook to access context
3. Context stores JWT token in localStorage
4. All API calls include token in Authorization header

**Code flow**:

```
User clicks "Login"
        ↓
Calls context.login(email, password)
        ↓
Sends POST /api/auth/login
        ↓
Server returns JWT
        ↓
Context saves to localStorage
        ↓
Context updates isAuthenticated = true
        ↓
Dashboard component re-renders and shows app
```

### **Data Flow Example: Making a Request**

```
1. User fills form (method, URL, headers)
└─ Component state: { method, url, headers }

2. User clicks "Send Request"
└─ Calls onSubmit handler

3. Handler calls context API function
└─ const result = await apiRequest({ method, url, headers })

4. Context function:
   ├─ Creates fetch request
   ├─ Adds Authorization header with JWT
   ├─ POSTs to /api/request
   └─ Returns response

5. Response received:
   ├─ Component state updates with responseData
   ├─ ResponseDisplay component re-renders
   └─ User sees formatted JSON response
```

---

## 📡 API Endpoints

### **Authentication Endpoints**

#### POST /api/auth/signup
Register a new user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
```

#### POST /api/auth/login
Authenticate and get JWT token.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
```

#### GET /api/auth/profile
Get authenticated user's profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "id": "...",
  "email": "user@example.com",
  "createdAt": "2026-02-14T10:30:00Z"
}
```

### **Request Endpoints**

#### POST /api/request
Proxy an external API request and save to history.

**Request**:
```json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "body": null
}
```

**Response** (200):
```json
{
  "status": 200,
  "headers": { "content-type": "application/json" },
  "data": { ... },
  "timing": 124,
  "size": 4200
}
```

#### GET /api/history?page=1&limit=10
Get paginated request history.

**Response** (200):
```json
{
  "requests": [
    {
      "_id": "...",
      "method": "GET",
      "url": "https://api.example.com",
      "response": { "status": 200 },
      "timing": 124,
      "createdAt": "2026-02-14T11:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 5
}
```

#### GET /api/history/[id]
Get a single request details.

**Response** (200):
```json
{
  "_id": "...",
  "method": "GET",
  "url": "https://api.example.com",
  "headers": { ... },
  "requestBody": null,
  "response": {
    "status": 200,
    "headers": { ... },
    "data": { ... }
  },
  "timing": 124,
  "size": 4200,
  "createdAt": "2026-02-14T11:00:00Z"
}
```

#### DELETE /api/history/[id]
Delete a single request from history.

**Response** (200):
```json
{ "success": true }
```

#### DELETE /api/history
Delete all request history for user.

**Response** (200):
```json
{ "deletedCount": 42 }
```

### **Statistics Endpoint**

#### GET /api/stats
Get statistics about API usage.

**Response** (200):
```json
{
  "totalRequests": 42,
  "successfulRequests": 40,
  "failedRequests": 2,
  "successRate": 95.24,
  "methodBreakdown": {
    "GET": 25,
    "POST": 10,
    "PUT": 5,
    "DELETE": 2
  },
  "statusBreakdown": {
    "200": 32,
    "201": 8,
    "400": 1,
    "404": 1
  }
}
```

---

## 🔄 Complete Request Lifecycle Example

Here's a complete walkthrough:

```
1. User lands on site
   └─ Sees Landing.tsx home page

2. User clicks "Get Started"
   └─ Navigates to /signup

3. User fills signup form and submits
   └─ Signup.tsx calls context.signup()
   └─ Context POSTs to /api/auth/signup
   └─ Server creates user in MongoDB
   └─ Server returns JWT token
   └─ Context saves token to localStorage
   └─ Redirect to /dashboard

4. Dashboard loads with Form.tsx (request builder)
   └─ User enters:
      - Method: GET
      - URL: https://api.github.com/users/torvalds
      - Headers: none
      - Body: none

5. User clicks "Send Request"
   └─ Form.tsx calls context.apiRequest()
   └─ Context POSTs to /api/request with JWT
   └─ JWT validated via getAuthFromRequest()
   └─ Server calls external API
   └─ Server saves request to history
   └─ Server returns response

6. ResponseDisplay.tsx shows result
   └─ Status: 200
   └─ Headers: {...}
   └─ Body: {user data...}
   └─ Timing: 124ms

7. User clicks "History" tab
   └─ RequestHistory.tsx fetches /api/history
   └─ Shows paginated list of all requests

8. User clicks on request in history
   └─ Modal opens showing full details
   └─ Can re-run request or delete it

9. User checks "Statics" tab
   └─ Statics.tsx fetches /api/stats
   └─ Calculates and displays:
      - Total requests
      - Success rate
      - Method breakdown chart
      - Status code breakdown chart
```

---

## 🎯 Key Design Decisions

### **Why Next.js?**
- Single unified codebase (frontend + backend)
- No CORS issues (same origin)
- Built-in API routes (no separate Express server)
- Server-side rendering for better SEO
- Automatic code splitting

### **Why JWT over Sessions?**
- Stateless authentication
- No need for server-side session storage
- Easy to scale horizontally
- Works well with mobile apps

### **Why Context API over Redux?**
- Simpler for small/medium apps
- No boilerplate
- Built-in to React
- Sufficient for our needs

### **Why MongoDB?**
- Flexible schema (history varies by request)
- Easy to scale
- Free tier available
- Good for document storage

---

## 🚀 Performance Optimizations

1. **Request Caching**: Responses not cached (always fresh)
2. **Database Indexing**: User ID indexed for faster queries
3. **Pagination**: History limited to 10 items per page
4. **Code Splitting**: Each page/component split separately
5. **Image Optimization**: SVG icons instead of images

---

## 🔒 Security Considerations

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Secret**: Uses environment variable (not in code)
3. **HTTPS Only**: Production deployment requires SSL
4. **CORS Disabled**: Same-origin only (no CORS needed)
5. **Input Validation**: Email format, password length checked
6. **Error Messages**: Generic messages (don't leak user info)

---

## 📝 Summary

Postmen is built on these core principles:

✅ **Single Application**: Frontend + backend in one repo
✅ **Stateless Auth**: JWT tokens for scalability  
✅ **Simple State Management**: React Context API
✅ **Database-Backed**: MongoDB for persistent storage
✅ **Type-Safe**: Full TypeScript throughout
✅ **Modern UI**: Tailwind CSS + smooth animations
✅ **Open Source**: Made for and by developers

Happy coding! 🚀
