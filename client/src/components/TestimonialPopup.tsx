import React, { useState, useEffect, useRef } from 'react';
import { X, Star, MessageSquareQuote } from 'lucide-react';

interface Testimonial {
  id: number;
  text: string;
  fullName: string;
  course: string;
  year: number;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "Rented a scientific calculator Casio fx-991EX for my Math-III end sem exam for just ₹20. Saved me from buying a brand new calculator that I would never use again!",
    fullName: "Priya Patel",
    course: "B.Tech (ECE)",
    year: 2,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya",
    rating: 5
  },
  {
    id: 2,
    text: "I listed my old engineering drawing board and chemistry lab coat. Cleared some space in my hostel wardrobe and earned over ₹600 this month! Met the buyers at Block-A canteen.",
    fullName: "Rahul Sharma",
    course: "B.Tech (CSE)",
    year: 3,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul",
    rating: 5
  },
  {
    id: 3,
    text: "Renting is super easy. Built-in chats let me message lenders to negotiate dates and prices. Finding lab kits for my projects took less than a minute. Highly recommend Rentora!",
    fullName: "Aman Verma",
    course: "B.Tech (ME)",
    year: 2,
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aman",
    rating: 5
  }
];

export const TestimonialPopup: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  
  const dismissRef = useRef<((isManual: boolean) => void) | null>(null);

  useEffect(() => {
    let openTimer: any;
    let closeTimer: any;
    let nextTimer: any;

    const clearTimers = () => {
      if (openTimer) clearTimeout(openTimer);
      if (closeTimer) clearTimeout(closeTimer);
      if (nextTimer) clearTimeout(nextTimer);
    };

    const schedulePopup = (delay: number) => {
      clearTimers();
      openTimer = setTimeout(() => {
        // Check if dismissed in localStorage (from manual close)
        const dismissedUntil = localStorage.getItem('testimonial_dismissed_until');
        if (dismissedUntil) {
          const timestamp = parseInt(dismissedUntil, 10);
          if (!isNaN(timestamp) && Date.now() < timestamp) {
            // Still dismissed! Schedule next check after the block expires
            const remaining = timestamp - Date.now();
            schedulePopup(remaining + 1000); // 1s buffer
            return;
          }
        }

        // Show the popup
        setShouldRender(true);
        setTimeout(() => setIsVisible(true), 50);
        
        // Auto close after 12 seconds
        closeTimer = setTimeout(() => {
          dismissPopup(false);
        }, 12000);
      }, delay);
    };

    const dismissPopup = (isManual: boolean) => {
      setIsVisible(false);
      clearTimers();
      
      setTimeout(() => {
        setShouldRender(false);
        
        // Advance to the next testimonial index
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);

        if (isManual) {
          // If closed manually ("crossed"), block for 2-5 minutes (random duration between 120,000ms and 300,000ms)
          const blockDuration = Math.floor(Math.random() * (300000 - 120000 + 1)) + 120000;
          localStorage.setItem('testimonial_dismissed_until', (Date.now() + blockDuration).toString());
          
          // Schedule next check after the block expires
          schedulePopup(blockDuration + 1000);
        } else {
          // If auto-closed, schedule the next one in 1 to 2 minutes
          const randomDelay = Math.floor(Math.random() * 60000) + 60000;
          schedulePopup(randomDelay);
        }
      }, 500); // match transition duration
    };

    dismissRef.current = dismissPopup;

    // Initial scheduling: check if currently blocked, or start after 5 seconds
    const dismissedUntil = localStorage.getItem('testimonial_dismissed_until');
    if (dismissedUntil) {
      const timestamp = parseInt(dismissedUntil, 10);
      if (!isNaN(timestamp) && Date.now() < timestamp) {
        const remaining = timestamp - Date.now();
        schedulePopup(remaining + 1000);
      } else {
        schedulePopup(5000);
      }
    } else {
      schedulePopup(5000);
    }

    return () => {
      clearTimers();
    };
  }, []);

  const handleManualClose = () => {
    if (dismissRef.current) {
      dismissRef.current(true);
    }
  };

  if (!shouldRender) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-52 md:w-[210px] transition-all duration-500 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-12 scale-90 pointer-events-none'
      }`}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 border border-gray-150 dark:border-slate-800 rounded-2xl p-3 md:p-3.5 shadow-xl relative overflow-hidden group">
        
        {/* Glow accent */}
        <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-tr from-primary-500 to-indigo-500 rounded-full opacity-10 dark:opacity-20 blur-lg pointer-events-none"></div>

        {/* Top Info Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {/* Avatar with live status dot */}
            <div className="relative flex-shrink-0">
              <img
                src={currentTestimonial.avatar}
                alt={currentTestimonial.fullName}
                className="h-7 w-7 rounded-full border border-gray-100 dark:border-slate-800 bg-primary-50 dark:bg-slate-800 object-cover"
              />
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-green-500 rounded-full border border-white dark:border-slate-900"></span>
            </div>
            
            {/* Student metadata */}
            <div className="min-w-0">
              <div className="flex flex-col">
                <h4 className="font-outfit font-black text-xs text-gray-900 dark:text-white leading-tight truncate">
                  {currentTestimonial.fullName}
                </h4>
                <div className="flex text-amber-400">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-2 w-2 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleManualClose}
            className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close message"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Testimonial Quote Bubble */}
        <div className="relative bg-slate-50 dark:bg-slate-950/40 border border-slate-100/80 dark:border-slate-800/60 rounded-xl p-2.5">
          <div className="absolute top-1.5 right-1.5 text-slate-200 dark:text-slate-800/40 pointer-events-none">
            <MessageSquareQuote className="h-4 w-4" />
          </div>
          <p className="text-gray-700 dark:text-slate-200 text-[11px] font-medium leading-snug italic pr-2">
            "{currentTestimonial.text}"
          </p>
        </div>

        {/* Small footer info */}
        <div className="flex justify-between items-center mt-2 px-0.5">
          <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary-500"></span>
            {currentTestimonial.course}
          </span>
          <span className="text-[8px] text-slate-300 dark:text-slate-700 font-bold uppercase">
            Review
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestimonialPopup;
