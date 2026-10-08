# Postmen

An API client in the browser, built with Next.js 15, React 19 and MongoDB. Send a request, get the response back with a postmark: status, round-trip time and size.

![Postmen](https://img.shields.io/badge/Next.js-15.5.12-black?style=flat-square)
![React](https://img.shields.io/badge/React-19.1.0-61dafb?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- **Workbench** - Method and address on one line, request and response side by side, query params synced with the address, Ctrl/Cmd + Enter to send
- **Postmarks** - Every response is stamped with its status, round-trip time and body size, all measured on the server
- **Outbox** - Signed-in requests are saved with their full responses; reopen, filter, delete one or all
- **Statistics** - Counts by method and status code, success rate and median round trip
- **Accounts** - Email and password (bcrypt) or Google sign-in, JWT sessions

Signed-in requests, response bodies included, are stored in MongoDB until you delete them. Requests sent while signed out are not stored.

## 🛠️ Tech Stack

```
Frontend:
- Next.js 15.5.12 (App Router)
- React 19.1.0
- TypeScript 5.0+
- Tailwind CSS 4.1.10
- React Icons

Backend:
- Next.js API Routes
- Node.js Runtime
- Express.js

Database:
- MongoDB Atlas
- Mongoose 8.16.0

Authentication:
- JWT (jsonwebtoken 9.0.2)
- bcrypt for password hashing

Deployment:
- Vercel (Production)
```

## 📋 Prerequisites

- **Node.js** 18.17 or higher
- **npm** 9.0 or higher
- **MongoDB Atlas** account (free tier available)

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Arshpreet62/Postmen.git
cd Postmen
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

Copy `.env.local.example` to `.env.local` and fill it in:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/postman-clone?retryWrites=true&w=majority

# Required. The server won't sign or accept tokens without it.
# Generate one with: openssl rand -base64 48
JWT_SECRET=

# Optional: Google sign-in
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_ID=

# Only on your own machine: lets Postmen call localhost and private networks
ALLOW_PRIVATE_ADDRESSES=false
```

Postmen refuses to send requests to private and internal addresses (localhost, 10.x, 192.168.x, cloud metadata) so a public deployment can't be used to reach them. Set `ALLOW_PRIVATE_ADDRESSES=true` in `.env.local` when you run it locally and want to test your own APIs.

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📚 Project Structure

```
Postmen/
├── app/
│   ├── api/                    # API Route Handlers
│   │   ├── auth/              # Authentication endpoints
│   │   │   ├── signup/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── profile/route.ts
│   │   │   └── refresh/route.ts
│   │   ├── request/route.ts    # URL proxy endpoint
│   │   ├── history/route.ts    # Request history endpoints
│   │   └── stats/route.ts      # Statistics aggregation
│   ├── components/             # React Components
│   │   ├── Layout/             # Page layout components
│   │   │   ├── Landing.tsx     # Home page
│   │   │   ├── Dashboard.tsx   # Main app interface
│   │   │   ├── Login.tsx       # Login form
│   │   │   ├── Signup.tsx      # Signup form
│   │   │   └── context/        # Auth context
│   │   └── UI/                 # Reusable UI components
│   │       ├── Form.tsx        # Request builder
│   │       ├── RequestHistory.tsx
│   │       ├── ResponseDisplay.tsx
│   │       ├── Statics.tsx     # Statistics
│   │       └── Button.tsx
│   ├── lib/                    # Shared utilities
│   │   ├── db.ts              # MongoDB connection
│   │   ├── models.ts          # Mongoose schemas
│   │   └── auth.ts            # JWT utilities
│   ├── config/                 # Config files
│   │   └── api.ts             # API URL helper
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   ├── dashboard/page.tsx      # Dashboard page
│   ├── about/page.tsx          # About page
│   └── globals.css             # Global styles
├── public/                     # Static assets
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
└── postcss.config.js           # PostCSS config
```

## 🎯 Key Features Explained

### 1. **Request Builder**
- Select HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
- Enter URL
- Add headers and request body
- See live response with formatted JSON

### 2. **Request History**
- View all your previous API requests
- Pagination (10 requests per page)
- Click to see full request/response details
- Delete individual or all history

### 3. **Statistics Dashboard**
- Total requests made
- Successful requests count
- Failed requests count
- Success rate percentage
- Breakdown by HTTP method
- Breakdown by status code

### 4. **Authentication**
- Secure signup and login
- JWT tokens stored in localStorage
- Automatic token refresh
- Protected API routes

## 🔐 API Endpoints

### Authentication

```
POST   /api/auth/signup      - Register new user
POST   /api/auth/login       - Login user
POST   /api/auth/logout      - Logout user
GET    /api/auth/profile     - Get user profile (protected)
POST   /api/auth/refresh     - Refresh JWT token
```

### Requests

```
POST   /api/request          - Proxy and save API request (protected)
GET    /api/history          - Get paginated request history (protected)
GET    /api/history/[id]     - Get single request (protected)
DELETE /api/history/[id]     - Delete single request (protected)
DELETE /api/history          - Delete all history (protected)
GET    /api/stats            - Get statistics (protected)
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
5. Click Deploy

```bash
# Or deploy using Vercel CLI
npm install -g vercel
vercel
```

### Environment Variables (Production)

Set these in your Vercel dashboard:
- `MONGO_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A long random secret (required; at least 32 characters)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` - only if you use Google sign-in
- Leave `ALLOW_PRIVATE_ADDRESSES` unset in production

## 📖 Usage Guide

### Making Your First Request

1. **Sign Up** - Create an account
2. **Login** - Log in with your credentials
3. **Go to Dashboard** - Click the "Dashboard" button
4. **Enter Request Details**:
   - Select HTTP method
   - Enter API URL (e.g., `https://api.github.com/users/github`)
   - Add headers if needed
   - Click "Send Request"
5. **View Response** - See formatted response and status code
6. **Check History** - View all your requests in the History tab
7. **View Stats** - See usage statistics in the Statics tab

### Example Requests

```
# Get GitHub user
GET https://api.github.com/users/torvalds

# Get JSON Placeholder posts
GET https://jsonplaceholder.typicode.com/posts

# Create a post
POST https://jsonplaceholder.typicode.com/posts
Headers: Content-Type: application/json
Body: {"title": "Test Post", "body": "This is a test", "userId": 1}
```

## 🔧 Development

### Build the Project

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

### Lint Code

```bash
npm run lint
```

## 📝 Git Workflow

```bash
# Clone repository
git clone https://github.com/Arshpreet62/Postmen.git

# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Add your feature"

# Push to GitHub
git push origin feature/your-feature

# Open Pull Request on GitHub
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify `MONGO_URI` in `.env.local`
- Check MongoDB Atlas whitelist includes your IP
- Ensure cluster has free tier available

### JWT Token Issues
- Clear browser localStorage: `localStorage.clear()`
- Refresh the page
- Log out and log back in

### Build Errors
- Delete `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For support, email support@postmen.app or open an issue on GitHub.

## 🎉 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [React Icons](https://react-icons.github.io/react-icons/)
- Database by [MongoDB](https://www.mongodb.com/)
- Hosted on [Vercel](https://vercel.com/)

---

**Made with ❤️ by developers, for developers**
