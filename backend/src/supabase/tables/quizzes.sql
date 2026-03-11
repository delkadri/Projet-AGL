CREATE TABLE quizzes (
   id TEXT PRIMARY KEY,
   name TEXT NOT NULL,
   content JSONB NOT NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);