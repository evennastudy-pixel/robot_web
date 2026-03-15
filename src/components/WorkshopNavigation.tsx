'use client';

import { useRouter } from 'next/navigation';
import { useLanguage, t } from "@/hooks/useLanguage";

interface WorkshopNavigationProps {
  previousPage?: string;
}

export default function WorkshopNavigation({ previousPage }: WorkshopNavigationProps) {
  const router = useRouter();
  const lang = useLanguage();

  return (
    <div className="fixed top-6 left-6 z-50 flex gap-3 items-center">
      {/* Back to Workshop button */}
      <button
        onClick={() => router.push('/workshop')}
        className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-white/10 hover:border-[#5157E8] group"
      >
        <svg 
          className="w-5 h-5 text-gray-300 group-hover:text-[#5157E8] transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
          />
        </svg>
        <span className="text-sm font-medium text-white group-hover:text-[#5157E8] transition-colors">
          {t('Back to Workshop', '返回工作坊', lang)}
        </span>
      </button>

      {/* Back to Previous Page button */}
      {previousPage && (
        <button
          onClick={() => router.push(previousPage)}
          className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-white/10 hover:border-[#5157E8] group"
        >
          <svg 
            className="w-5 h-5 text-gray-300 group-hover:text-[#5157E8] transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          <span className="text-sm font-medium text-white group-hover:text-[#5157E8] transition-colors">
            {t('Back to Previous', '返回上一页', lang)}
          </span>
        </button>
      )}
    </div>
  );
}

