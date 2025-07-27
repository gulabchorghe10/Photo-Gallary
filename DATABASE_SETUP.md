# PostgreSQL Database Setup Guide

This guide will help you set up a PostgreSQL database for your photo gallery application using Supabase.

## Option 1: Supabase (Recommended)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### Step 2: Get Your Project Credentials
1. In your Supabase dashboard, go to Settings → API
2. Copy your Project URL and anon/public key
3. Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Set Up Database Schema
1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `database-schema.sql`
3. Run the SQL to create the photos table and indexes

### Step 4: Set Up Storage Bucket
1. In your Supabase dashboard, go to Storage
2. Create a new bucket called `photo-storage`
3. Set the bucket to public (for now - you can make it private later with authentication)
4. Set up storage policies:

```sql
-- Allow public read access to photos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'photo-storage');

-- Allow public upload to photos
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photo-storage');

-- Allow public delete from photos
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'photo-storage');
```

### Step 5: Test Your Setup
1. Start your development server: `npm run dev`
2. Try uploading a photo
3. Check your Supabase dashboard to see if the photo appears in both Storage and Database

## Option 2: Local PostgreSQL

If you prefer to run PostgreSQL locally:

### Step 1: Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### Step 2: Set Up Database
```bash
# Create database
createdb photo_gallery

# Run schema
psql photo_gallery < database-schema.sql
```

### Step 3: Install Additional Dependencies
```bash
npm install pg @types/pg
```

### Step 4: Update Configuration
Create a local database service instead of using Supabase:

```typescript
// src/lib/local-database.ts
import { Pool } from 'pg'

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'photo_gallery',
  password: 'your_password',
  port: 5432,
})

// Implement similar methods as in database.ts
```

## Option 3: Railway or Render

### Railway
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Get connection string and update your environment variables

### Render
1. Go to [render.com](https://render.com)
2. Create a new PostgreSQL service
3. Get connection string and update your environment variables

## Environment Variables

Create a `.env.local` file with:

```env
# For Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For local PostgreSQL (if using Option 2)
VITE_DATABASE_URL=postgresql://username:password@localhost:5432/photo_gallery
```

## Security Considerations

1. **Row Level Security**: The schema includes RLS policies. Modify them based on your authentication needs.
2. **Storage Policies**: Consider making storage private and implementing proper authentication.
3. **Environment Variables**: Never commit `.env.local` to version control.
4. **Backup**: Set up regular backups of your database.

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your Supabase project allows your domain
2. **Storage Upload Fails**: Check storage bucket policies
3. **Database Connection**: Verify environment variables are correct
4. **File Size Limits**: Supabase has file size limits (50MB for free tier)

### Debug Mode:
Add this to your `.env.local` for debugging:
```env
VITE_DEBUG=true
```

## Next Steps

1. **Authentication**: Add user authentication to secure photos
2. **Image Optimization**: Implement image resizing and compression
3. **CDN**: Set up a CDN for faster image delivery
4. **Backup Strategy**: Implement automated backups
5. **Monitoring**: Add database monitoring and logging 