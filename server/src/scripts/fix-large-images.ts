import { supabase } from '../config/supabase';

async function fixAllListings() {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, images')
    .range(0, 100);

  if (error || !listings) {
    console.error('Error fetching listings:', error);
    return;
  }

  console.log(`Checking ${listings.length} listings...`);
  for (const l of listings) {
    const images: string[] = l.images || [];
    let needUpdate = false;
    const cleanImages = images.map((img) => {
      if (img && (img.startsWith('data:image') || img.length > 200000)) {
        console.log(`[Clean] Replacing large image for "${l.title}" (length: ${img.length})...`);
        needUpdate = true;
        return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop';
      }
      return img;
    });

    if (needUpdate) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ images: cleanImages })
        .eq('id', l.id);
      if (updateError) {
        console.error(`Error updating "${l.title}":`, updateError);
      } else {
        console.log(`Successfully updated "${l.title}"!`);
      }
    }
  }
}

fixAllListings()
  .then(() => {
    console.log('Finished fixing listings.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
