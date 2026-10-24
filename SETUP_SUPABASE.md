# Supabase Setup Guide

## Quick Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: clinical-risk-monitoring (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

### 2. Get Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **Connection pooling** mode (recommended for production)
4. Copy the connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`

### 3. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and update:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT_REF.supabase.co:5432/postgres
   ```

### 4. Run Database Migrations

```bash
cd backend
python ../scripts/setup_database.py
```

This will create all necessary tables in your Supabase database.

### 5. Configure IP Allowlist (Optional)

For production, you may want to restrict database access:

1. Go to **Settings** → **Database** → **Connection Pooling**
2. Configure IP allowlist if needed
3. For development, you can leave it open

### 6. Verify Connection

Test your connection by starting the backend:

```bash
cd backend
uvicorn app.main:app --reload
```

If you see "Application startup complete", your database connection is working!

## Troubleshooting

### Connection Refused
- Verify your connection string is correct
- Check that you're using **Connection Pooling** mode (port 5432)
- Ensure your IP is not blocked in Supabase settings

### Authentication Failed
- Double-check your database password
- Make sure you copied the entire connection string
- Try regenerating the connection string in Supabase dashboard

### Schema Migration Errors
- Some tables may already exist - this is normal
- The script will skip existing tables automatically
- Check Supabase SQL Editor to verify tables were created

## Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use Connection Pooling** - Better for production workloads
3. **Enable Row Level Security (RLS)** - Configure in Supabase dashboard for additional security
4. **Rotate passwords regularly** - Update DATABASE_URL when you change passwords

## Free Tier Limits

Supabase free tier includes:
- 500 MB database storage
- 2 GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

This is sufficient for development and small-scale production use.
