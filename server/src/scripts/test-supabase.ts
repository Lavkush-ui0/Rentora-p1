import { supabase } from '../config/supabase';
import { config } from '../config/config';

async function testConnection() {
  console.log('Testing Supabase Connection...');
  console.log(`Supabase URL: ${config.SUPABASE_URL}`);
  console.log(`Supabase Key: ${config.SUPABASE_KEY ? 'Present (length: ' + config.SUPABASE_KEY.length + ')' : 'Missing'}`);

  try {
    // Try to list tables / categories schema to verify connectivity
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "categories" does not exist')) {
        console.log('\n✅ Supabase connectivity successful! (Network Connection OK, but "categories" table does not exist yet. Run SQL setup script to create it.)');
      } else {
        console.error('\n❌ Supabase request returned error:', error);
      }
    } else {
      console.log('\n✅ Supabase connectivity successful! Schema accessible:', data);
    }
  } catch (err) {
    console.error('\n❌ Connectivity check threw exception:', err);
  }
}

testConnection();
