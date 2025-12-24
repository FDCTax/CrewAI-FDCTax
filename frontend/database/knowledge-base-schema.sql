-- Knowledge Base table for Luna Chat
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  keywords TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS knowledge_base_search_idx ON knowledge_base USING GIN(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(keywords, '')));

-- Create category index for filtering
CREATE INDEX IF NOT EXISTS knowledge_base_category_idx ON knowledge_base(category);

-- Sample data (will be populated by user)
INSERT INTO knowledge_base (title, content, category, tags, keywords) VALUES
('ABN Registration Basics', 'An Australian Business Number (ABN) is a unique 11-digit identifier for businesses. You need an ABN if you are carrying on an enterprise or business activity in Australia. Key requirements include: intention to make a profit, repetition and regularity of activities, and commercial nature.', 'ABN', ARRAY['abn', 'registration', 'business'], 'ABN registration business number australia'),
('GST Registration Requirements', 'You must register for GST if your business or enterprise has a GST turnover of $75,000 or more ($150,000 or more for non-profit organizations). GST turnover is your gross business income minus GST. You can choose to register if your turnover is less than the threshold.', 'GST', ARRAY['gst', 'tax', 'registration'], 'GST registration turnover threshold tax'),
('Tax File Number Privacy', 'Your Tax File Number (TFN) is encrypted and stored securely. We use industry-standard Fernet encryption to protect your TFN. Your TFN is only used for tax lodgment purposes and is never shared with third parties except as required by law.', 'Privacy', ARRAY['tfn', 'privacy', 'security'], 'TFN privacy security encryption')
ON CONFLICT DO NOTHING;
