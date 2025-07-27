-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('upload', 'camera')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'permanently-deleted')),
  user_id UUID,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);
CREATE INDEX IF NOT EXISTS idx_photos_source ON photos(source);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_photos_updated_at 
  BEFORE UPDATE ON photos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (you can modify this based on your needs)
CREATE POLICY "Allow public read access" ON photos
  FOR SELECT USING (true);

-- Create policy for insert (you can modify this based on your needs)
CREATE POLICY "Allow public insert" ON photos
  FOR INSERT WITH CHECK (true);

-- Create policy for update (you can modify this based on your needs)
CREATE POLICY "Allow public update" ON photos
  FOR UPDATE USING (true);

-- Create policy for delete (you can modify this based on your needs)
CREATE POLICY "Allow public delete" ON photos
  FOR DELETE USING (true); 