import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = config.SUPABASE_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
