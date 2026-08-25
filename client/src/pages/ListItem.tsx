import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { compressImagesIfNeeded } from '../utils/imageCompressor';
import { Upload, X, Image, AlertCircle, Sparkles } from 'lucide-react';
import { ArtworkTile } from '../components/RentoraBrand';

const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];
const PRICE_UNITS = ['DAY', 'WEEK', 'MONTH'];
const CAMPUS_LOCATIONS = [
  'NIET Plot 19',
  'NIET Plot 15',
  'NIET Plot 14'
];

const THEME_LABELS: Record<string, string> = {
  mint: 'Mint Green',
  peach: 'Peach Orange',
  lavender: 'Lavender Purple',
  blue: 'Sky Blue',
  sand: 'Sand Gold',
  rose: 'Rose Pink',
};

const THEME_COLORS: Record<string, string> = {
  mint: 'bg-[#DCF2E9] border-[#1E6865]/35',
  peach: 'bg-[#FFE8DC] border-[#C04B2A]/35',
  lavender: 'bg-[#ECE4FC] border-[#653BB5]/35',
  blue: 'bg-[#DFF0FC] border-[#246596]/35',
  sand: 'bg-[#F7EED8] border-[#876527]/35',
  rose: 'bg-[#FDE4EA] border-[#AA2A4C]/35',
};

export const ListItem: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { id } = useParams<{ id: string }>();
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [shareLocation, setShareLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleLocationToggle = () => {
    if (!shareLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoordinates({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setShareLocation(true);
          },
          () => {
            alert('Unable to retrieve location coordinates. Please grant location permissions to this website.');
            setShareLocation(false);
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    } else {
      setShareLocation(false);
      setCoordinates(null);
    }
  };

  // Customizable Card Theme
  const [selectedTheme, setSelectedTheme] = useState<'mint' | 'peach' | 'lavender' | 'blue' | 'sand' | 'rose'>('blue');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'GOOD',
    rentalPrice: '',
    priceUnit: 'DAY',
    securityDeposit: '0',
    location: user?.collegeName || 'NIET Plot 19',
  });

  // Load listing details if editing
  useEffect(() => {
    if (id) {
      const fetchListing = async () => {
        setLoading(true);
        try {
          const res = await listingService.getListingById(id);
          if (res.data?.success) {
            const listing = res.data.listing;
            
            // Extract description and card theme if present
            let cleanDesc = listing.description;
            let themeVal = 'blue';
            const themeMatch = listing.description.match(/<!-- theme: (\w+) -->/);
            if (themeMatch) {
              themeVal = themeMatch[1];
              cleanDesc = listing.description.replace(/<!-- theme: \w+ -->/, '').trim();
            }
            
            setForm({
              title: listing.title,
              description: cleanDesc,
              category: listing.category?._id || listing.category,
              condition: listing.condition,
              rentalPrice: String(listing.rentalPrice),
              priceUnit: listing.priceUnit,
              securityDeposit: String(listing.securityDeposit),
              location: listing.location,
            });
            setSelectedTheme(themeVal as any);
            setExistingImageUrls(listing.images || []);
          }
        } catch (err) {
          console.error(err);
          setError('Failed to load listing details.');
        } finally {
          setLoading(false);
        }
      };
      fetchListing();
    }
  }, [id]);

  useEffect(() => {
    if (user?.collegeName) {
      setForm(f => ({ ...f, location: user.collegeName }));
    }
  }, [user]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.data?.success) setCategories(res.data.categories.filter((c: any) => c.isActive));
      } catch (err) { console.error(err); }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type));

    if (images.length + validFiles.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Automatically compress any image exceeding 2MB down to < 2MB
    const compressedFiles = await compressImagesIfNeeded(validFiles);

    const newImages = [...images, ...compressedFiles].slice(0, 5);
    setImages(newImages);

    const newPreviews = newImages.map(f => URL.createObjectURL(f));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (images.length === 0 && existingImageUrls.length === 0) {
      setError('You must upload at least one photo of the item.');
      return;
    }
    if (!form.category) { setError('Please select a category.'); return; }
    if (parseFloat(form.rentalPrice) < 0) { setError('Rental price cannot be negative.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      
      // Append customizable theme comment at the end of the description
      const descWithTheme = `${form.description}\n\n<!-- theme: ${selectedTheme} -->`;
      formData.append('description', descWithTheme);
      
      formData.append('category', form.category);
      formData.append('condition', form.condition);
      formData.append('rentalPrice', form.rentalPrice);
      formData.append('priceUnit', form.priceUnit);
      formData.append('securityDeposit', form.securityDeposit || '0');
      formData.append('location', form.location);
      if (shareLocation && coordinates) {
        formData.append('latitude', String(coordinates.latitude));
        formData.append('longitude', String(coordinates.longitude));
      }
      images.forEach(img => formData.append('images', img));

      let res;
      if (id) {
        res = await listingService.updateListing(id, formData);
      } else {
        res = await listingService.createListing(formData);
      }

      if (res.data?.success) {
        if (id) {
          // If edited, redirect back to My Listings to show the PENDING status
          navigate('/my-listings');
        } else {
          navigate(`/listing/${res.data.listing._id}`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryName = form.category 
    ? categories.find(c => c._id === form.category)?.name || 'Gear'
    : 'Gear';

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black font-display uppercase tracking-tight text-slate-900 dark:text-gray-100">
          {id ? 'Edit Listing' : 'List an Item'}
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {id ? 'Update your listing details. Note that changes require admin approval.' : 'Upload study materials, engineering kits, or calculators for campus sharing.'}
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* Split Layout: Form on Left (7 cols), Live Preview on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Listing Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5 shadow-sm">
            
            {/* Location Consent & Coordinates tracking */}
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/40 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-gray-200">Attach Security Location Coordinates</p>
                <p className="text-[10px] text-gray-400">Attach coordinates for safety audits. Lenders are tracked to prevent listing fraud.</p>
              </div>
              <button
                type="button"
                onClick={handleLocationToggle}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  shareLocation
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {shareLocation ? '📍 Attached' : 'Attach GPS'}
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Item Name / Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. CASIO FX-991EX Scientific Calculator"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Specifications / Details</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Describe details, conditions, what is included, any minor scratches..."
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-semibold resize-none"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right font-bold">{form.description.length} / 2000</p>
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <select
                  name="category"
                  required
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold appearance-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Campus Plot Spot</label>
                <select
                  name="location"
                  required
                  value={form.location}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold appearance-none"
                >
                  {CAMPUS_LOCATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Item Condition</label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, condition: c }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      form.condition === c
                        ? 'bg-[#9E1B1B] text-white border-[#9E1B1B]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                    }`}
                  >
                    {c.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Rental Price (₹)</label>
                <input
                  type="number"
                  name="rentalPrice"
                  required
                  min="0"
                  placeholder="e.g. 50"
                  value={form.rentalPrice}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Per Duration</label>
                <select
                  name="priceUnit"
                  value={form.priceUnit}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold appearance-none"
                >
                  {PRICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Security Deposit */}
            <div>
              <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2">Security Deposit (₹) - Optional</label>
              <input
                type="number"
                name="securityDeposit"
                min="0"
                placeholder="0"
                value={form.securityDeposit}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#9E1B1B] text-xs font-bold"
              />
            </div>

            {/* Compulsory photo uploads */}
            <div>
              <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-3">
                Listing Photos <span className="text-red-500">*</span>
              </label>
              
              {/* Display existing images if any */}
              {existingImageUrls.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current Photos (will be replaced if you upload new ones below):</p>
                  <div className="flex flex-wrap gap-2.5">
                    {existingImageUrls.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-md hover:bg-red-650 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length + existingImageUrls.length < 5 && (
                  <label className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#9E1B1B] hover:bg-[#9E1B1B]/5 transition-all flex-shrink-0">
                    <Image className="h-5 w-5 text-slate-400 mb-0.5" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      {existingImageUrls.length > 0 ? 'Replace' : 'Add'}
                    </span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9E1B1B] hover:bg-[#801414] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-[#9E1B1B]/15 transition-all disabled:opacity-50 text-xs uppercase tracking-wider active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Upload className="h-4.5 w-4.5" />
                  <span>{id ? 'Update Listing Details' : 'Publish Campus Listing'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Interactive Live Artwork Card Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-display flex items-center space-x-1">
              <Sparkles className="h-4.5 w-4.5 text-[#9E1B1B]" />
              <span>Live Card Art Illustrator</span>
            </h3>

            {/* Displaying Live ArtworkTile */}
            <ArtworkTile
              category={selectedCategoryName}
              location={form.location}
              theme={selectedTheme}
              title={form.title || 'Your Item Title'}
              className="w-full aspect-[4/3] rounded-2xl"
            />

            {/* Pastel color theme selector buttons */}
            <div className="space-y-2 text-left">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Card Pastel Tone</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(THEME_LABELS).map((themeKey) => (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setSelectedTheme(themeKey as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border text-left transition-all flex items-center space-x-2 ${
                      selectedTheme === themeKey
                        ? 'border-[#9E1B1B] text-[#9E1B1B] bg-[#9E1B1B]/5 ring-1 ring-[#9E1B1B]/20 font-black'
                        : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full flex-shrink-0 border ${THEME_COLORS[themeKey]}`} />
                    <span>{THEME_LABELS[themeKey]}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              💡 Selecting a pastel tone styles your item card in the explore marketplace catalog. Lenders will see your item styled in this exact color theme!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ListItem;
