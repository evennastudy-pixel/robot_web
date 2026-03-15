'use client';

import { useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // 初始化语言设置
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang) {
      setLanguage(savedLang);
    }

    // 监听语言变化事件
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  return language;
}

// 翻译助手函数
export function t(en: string, zh: string, lang: Language): string {
  return lang === 'zh' ? zh : en;
}





