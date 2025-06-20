# Database Environment Setup

## Option 1: Separate Supabase Projects (Recommended)

### Development Database
1. Create a new Supabase project for development
2. Copy the PostgreSQL connection string
3. Set as `SUPABASE_DEV_DATABASE_URL`

### Production Database  
1. Create another Supabase project for production
2. Copy the PostgreSQL connection string
3. Set as `SUPABASE_PROD_DATABASE_URL`

## Environment Variables

```bash
# Development
SUPABASE_DEV_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Production
SUPABASE_PROD_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Fallback (current)
SUPABASE_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## How It Works

- **Development mode** (`NODE_ENV=development`): Uses `SUPABASE_DEV_DATABASE_URL`
- **Production mode** (`NODE_ENV=production`): Uses `SUPABASE_PROD_DATABASE_URL`
- **Fallback**: Uses `SUPABASE_DATABASE_URL` if environment-specific URL not found

## Database Migration

Run schema changes on both databases:

```bash
# Development
NODE_ENV=development npm run db:push

# Production  
NODE_ENV=production npm run db:push
```

## Benefits

- **Isolated environments**: Changes in dev don't affect production
- **Safe testing**: Test features without risking production data
- **Easy deployment**: Switch environments by setting NODE_ENV
- **Data separation**: Development and production data remain separate