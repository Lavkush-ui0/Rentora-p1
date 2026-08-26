import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Rent and lend college essentials, engineering drafters, lab coats, scientific calculators, and textbooks exclusively for NIET students safely on campus.',
  keywords,
  canonical,
  image = '/rentora-logo.png',
  type = 'website',
}) => {
  useEffect(() => {
    const fullTitle = title 
      ? `${title} | Rentora NIET` 
      : 'Rentora — Student Rental Marketplace | NIET Greater Noida';
    
    document.title = fullTitle;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Update OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    // Update OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // Update OpenGraph Image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && image) ogImage.setAttribute('content', image);

    // Update OpenGraph Type
    let ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute('content', type);

    // Update Canonical URL
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonical);
      }
    }
  }, [title, description, keywords, canonical, image, type]);

  return null;
};

export default SEO;
