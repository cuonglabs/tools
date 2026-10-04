import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vxaodfihdyvvnyiettsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4YW9kZmloZHl2dm55aWV0dHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzY3MTQsImV4cCI6MjEwNjUxMjcxNH0.-PMUHpaiVFqaWAj4z1LEbqRJ-7is5lx8xiCwz8uTb1g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);