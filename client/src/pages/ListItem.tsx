import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import { useEffect } from 'react';
import { Upload, X, Image, AlertCircle } from 'lucide-react';

const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];
const PRICE_UNITS = ['DAY', 'WEEK', 'MONTH'];

export const ListItem: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'GOOD',
    rentalPrice: '',
    priceUnit: 'DAY',
    securityDeposit: '0',
  });

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type));

    if (images.length + validFiles.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const newImages = [...images, ...validFiles].slice(0, 5);
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

    if (!form.category) { setError('Please select a category.'); return; }
    if (parseFloat(form.rentalPrice) < 0) { setError('Rental price cannot be negative.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('condition', form.condition);
      formData.append('rentalPrice', form.rentalPrice);
      formData.append('priceUnit', form.priceUnit);
      formData.append('securityDeposit', form.securityDeposit || '0');
      images.forEach(img => formData.append('images', img));

      const res = await listingService.createListing(formData);
      if (res.data?.success) {
        navigate(`/listing/${res.data.listing._id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100">List an Item</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Share your items and earn extra income from your classmates.</p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 space-y-5">

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Photos (Max 5)
          </label>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative h-24 w-24 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white h-5 w-5 rounded-full flex items-center justify-center shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all">
                <Image className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-[10px] font-bold text-gray-400">Add Photo</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG, PNG, WEBP · Max 5MB each · Max 5 photos</p>
        </div>

        <hr className="border-gray-100 dark:border-slate-800" />

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Item Title</label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. DSA Cormen Book 4th Edition"
            value={form.title}
            onChange={handleChange}
            maxLength={100}
            className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Describe the item — condition, what's included, any known issues..."
            value={form.description}
            onChange={handleChange}
            maxLength={2000}
            className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium resize-none"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{form.description.length}/2000</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category</label>
          <select
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium appearance-none"
          >
            <option value="">Select a category</option>
            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Condition</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, condition: c }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  form.condition === c
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}
              >
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Rental Price (₹)</label>
            <input
              type="number"
              name="rentalPrice"
              required
              min="0"
              placeholder="e.g. 50"
              value={form.rentalPrice}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Price Per</label>
            <select
              name="priceUnit"
              value={form.priceUnit}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium appearance-none"
            >
              {PRICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Security Deposit */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Security Deposit (₹) — Optional</label>
          <input
            type="number"
            name="securityDeposit"
            min="0"
            placeholder="0"
            value={form.securityDeposit}
            onChange={handleChange}
            className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">The deposit is collected offline and returned when the item is given back safely.</p>
        </div>

        {/* Offline Payment Notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            ⚠️ All payments (rental + deposit) are handled <strong>offline between you and the renter</strong>. Rentora does not process any payments.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Publish Listing</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
export default ListItem;
