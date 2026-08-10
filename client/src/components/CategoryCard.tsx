import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  iconName?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  iconName = 'Layers',
  isSelected = false,
  onClick,
}) => {
  // Dynamically extract the correct Lucide icon
  const IconComponent = (Icons as any)[iconName] || Icons.Layers;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 min-w-[100px] w-full text-center ${
        isSelected
          ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20 scale-105'
          : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-md'
      }`}
    >
      <div className={`p-2 rounded-2xl mb-2.5 transition-colors ${
        isSelected 
          ? 'bg-white/20 text-white' 
          : 'bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
      }`}>
        <IconComponent className="h-6 w-6 stroke-[1.8]" />
      </div>
      <span className="text-xs font-bold font-outfit truncate w-full px-1">{name}</span>
    </button>
  );
};

export default CategoryCard;
