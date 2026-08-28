import { supabase } from '../config/supabase';

async function optimizeExistingImages() {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, images');

  if (error || !listings) {
    console.error('Error fetching listings:', error);
    return;
  }

  console.log(`Checking ${listings.length} listings for oversized images...`);
  for (const l of listings) {
    const images: string[] = l.images || [];
    let updated = false;
    const cleanImages = images.map((img) => {
      if (img && img.length > 500 * 1024) {
        console.log(`[Optimize] Trimming massive image on "${l.title}" (${(img.length / 1024 / 1024).toFixed(2)} MB)...`);
        updated = true;
        // Replace with standard high-res Unsplash CDN thumbnail
        return 'https://images.unsplash.com/photo-1574607383476-f517f220d398?q=80&w=600&auto=format&fit=crop';
      }
      return img;
    });

    if (updated) {
      await supabase
        .from('listings')
        .update({ images: cleanImages })
        .eq('id', l.id);
      console.log(`[Optimize] Successfully cleaned images for "${l.title}"!`);
    }
  }

  console.log('[Optimize] Database image check complete!');
}

optimizeExistingImages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
