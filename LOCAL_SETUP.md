# Local Development Setup

## Prerequisites

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Git** (to clone the repository)
   - Download from [git-scm.com](https://git-scm.com/)

## Setup Steps

### 1. Download the Code

**Option A: Download ZIP (if available)**
- Click "Download" or "Export" button in Replit
- Extract the ZIP file to your desired location

**Option B: Clone via Git (if repository is connected)**
```bash
git clone [your-repository-url]
cd [project-folder]
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with:

```env
# Database (Required)
SUPABASE_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Session Secret (Required)
SESSION_SECRET=your-random-secret-key-here

# Port (Optional - defaults to 5000)
PORT=5000

# Node Environment
NODE_ENV=development
```

**Important**: Replace `SUPABASE_DATABASE_URL` with your actual Supabase connection string.

### 4. Database Setup

Push the database schema to your Supabase database:

```bash
npm run db:push
```

### 5. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── pages/         # Application pages
├── server/                # Express backend
│   ├── auth.ts           # Authentication logic
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database operations
├── shared/               # Shared code
│   ├── schema.ts         # Database schema
│   └── i18n.ts           # Translations
└── uploads/              # File uploads directory
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open database studio

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Use different port
   PORT=3000 npm run dev
   ```

2. **Database connection errors**
   - Verify `SUPABASE_DATABASE_URL` is correct
   - Check if your IP is whitelisted in Supabase

3. **Module not found errors**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

### Requirements

- Node.js 18+
- Active Supabase database
- Internet connection (for Supabase)

## Production Deployment

For production deployment, set:
- `NODE_ENV=production`
- Use a secure `SESSION_SECRET`
- Configure proper CORS settings
- Set up SSL/HTTPS