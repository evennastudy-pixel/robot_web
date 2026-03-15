'use client';

import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en');

  useEffect(() => {
    // 从 localStorage 读取语言设置
    const savedLang = localStorage.getItem('language') as 'en' | 'zh' | null;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    // 触发自定义事件，通知其他组件语言已更改
    window.dispatchEvent(new CustomEvent('languageChange', { detail: newLang }));
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-white/10 hover:border-[#5157E8] group"
      title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
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
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
        />
      </svg>
      <span className="text-sm font-medium text-white group-hover:text-[#5157E8] transition-colors">
        {language === 'en' ? 'EN' : '中文'}
      </span>
    </button>
  );
}



