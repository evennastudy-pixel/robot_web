'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useLanguage, t } from '@/hooks/useLanguage';
import MagicCard from '@/components/MagicCard';
import Particles from '@/components/Particles';
import { saveCurrentToHistory, resetCurrentWorkshop } from '@/lib/historyManager';

interface WorkshopSection {
  id: number;
  key: string;
  title: string;
  titleZh: string;
  subtitle: string;
  subtitleZh: string;
  path: string;
  image: string;
}

const SPOTLIGHT_RADIUS = 300;
const GLOW_COLOR = '81, 87, 232';

const updateCardGlowProperties = (card: HTMLElement, mouseX: number, mouseY: number, glow: number, radius: number) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

export default function WorkshopPage() {
  const router = useRouter();
  const lang = useLanguage();
  const gridRef = useRef<HTMLDivElement>(null);
  
  const sections: WorkshopSection[] = [
    {
      id: 1,
      key: 'theme',
      title: 'Theme Selection',
      titleZh: '主题选择',
      subtitle: 'Choose your design theme',
      subtitleZh: '选择设计主题',
      path: '/theme-selection',
      image: '/images/image_workshop/1.png',
    },
    {
      id: 2,
      key: 'collaboration',
      title: 'AI Collaboration',
      titleZh: 'AI协作',
      subtitle: 'Design solution with AI',
      subtitleZh: 'AI协作设计方案',
      path: '/ai-collaboration',
      image: '/images/image_workshop/2.png',
    },
    {
      id: 3,
      key: 'review',
      title: 'Solution Review',
      titleZh: '方案回顾',
      subtitle: 'Review your solution',
      subtitleZh: '回顾设计方案',
      path: '/solution-review',
      image: '/images/image_workshop/3.png',
    },
    {
      id: 4,
      key: 'headline',
      title: 'Visual Assets',
      titleZh: '视觉素材',
      subtitle: 'Generate visual assets',
      subtitleZh: '生成视觉素材',
      path: '/visual-assets',
      image: '/images/image_workshop/4.png',
    },
  ];
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  // 保存到历史记录
  const handleSaveHistory = () => {
    const hasData = 
      localStorage.getItem('selectedTheme') ||
      localStorage.getItem('completeSolution') ||
      sessionStorage.getItem('solutionConversation') ||
      sessionStorage.getItem('generatedReport') ||
      localStorage.getItem('visualAssets');
    
    if (!hasData) {
      alert(t('No content to save', '暂无内容可保存', lang));
      return;
    }
    
    if (confirm(t('Save current work to history?', '确定要保存当前工作到历史记录吗？', lang))) {
      saveCurrentToHistory();
      alert(t('Saved to history successfully!', '已成功保存到历史记录！', lang));
    }
  };

  // 重新开始
  const handleRestart = () => {
    const hasData = 
      localStorage.getItem('selectedTheme') ||
      localStorage.getItem('completeSolution') ||
      sessionStorage.getItem('solutionConversation') ||
      sessionStorage.getItem('generatedReport') ||
      localStorage.getItem('visualAssets');
    
    if (!hasData) {
      alert(t('Already at initial state', '已经是初始状态了', lang));
      return;
    }
    
    if (confirm(t('Start a new project? Current unsaved work will be lost.', '开始新项目？当前未保存的工作将会丢失。', lang))) {
      resetCurrentWorkshop();
      alert(t('Restarting...', '正在重新开始...', lang));
      window.location.href = '/workshop';
    }
  };

  useEffect(() => {
    setIsClient(true);
    const progress = JSON.parse(localStorage.getItem('workshopProgress') || '[]');
    setCompletedSteps(progress);
  }, []);

  // Global spotlight effect
  useEffect(() => {
    if (!isClient || !gridRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;

      const cards = gridRef.current.querySelectorAll('.magic-card');
      const proximity = SPOTLIGHT_RADIUS * 0.5;
      const fadeDistance = SPOTLIGHT_RADIUS * 0.75;

      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, SPOTLIGHT_RADIUS);
      });
    };

    const handleMouseLeave = () => {
      if (!gridRef.current) return;
      
      gridRef.current.querySelectorAll('.magic-card').forEach(card => {
        (card as HTMLElement).style.setProperty('--glow-intensity', '0');
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isClient]);

  if (!isClient) {
    return <div className="h-screen bg-black flex items-center justify-center text-gray-400">{t('Loading...', '加载中...', lang)}</div>;
  }
  
  const nextStepId = completedSteps.length + 1;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start p-8 relative overflow-hidden">
      {/* 粒子星空背景 */}
      <Particles
        particleCount={150}
        particleSpread={15}
        speed={0.08}
        particleColors={['#ffffff']}
        moveParticlesOnHover={false}
        alphaParticles={false}
        particleBaseSize={80}
        sizeRandomness={1}
        cameraDistance={22}
        disableRotation={false}
      />
      <div className="w-full max-w-6xl mx-auto pt-20 relative z-10">
        <div className="text-center mb-12 mt-0">
          <h1 className="text-4xl font-bold text-white">{t('Recommended Activities', '推荐活动', lang)}</h1>
          <p className="text-lg text-gray-400 mt-2">{t('Follow the steps or explore the card you like!', '按照步骤进行或探索你喜欢的卡片！', lang)}</p>
        </div>
        
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {sections.map((section) => {
            const isCompleted = completedSteps.includes(section.key);
            const isNextStep = section.id === nextStepId;
            const isLocked = !isCompleted && !isNextStep;

            const handleClick = () => {
              if (!isLocked) {
                router.push(section.path);
              }
            };

            return (
              <MagicCard
                key={section.id}
                onClick={!isLocked ? handleClick : undefined}
                className={`
                  w-[260px] h-[440px] rounded-xl transition-all duration-300 flex flex-col
                  ${isLocked 
                    ? 'bg-transparent cursor-not-allowed border-2 border-transparent' 
                    : 'bg-transparent cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 border-2 border-transparent'
                  }
                  ${isNextStep ? '!border-[#5157E8]' : ''}
                  ${isCompleted ? '!border-[#5157E8]/30' : ''}
                `}
                enableParticles={false}
                enableTilt={false}
                enableMagnetism={false}
                enableBorderGlow={!isLocked}
                clickEffect={false}
                particleCount={0}
                glowColor="81, 87, 232"
              >
                <div className="p-4 flex items-center gap-3 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold shrink-0
                    ${isCompleted || isNextStep ? 'bg-[#5157E8] text-white' : 'bg-gray-700 text-gray-400'}
                  `}>
                    {section.id}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white capitalize">{lang === 'zh' ? section.titleZh : section.title}</h3>
                    <p className="text-sm text-gray-400">{lang === 'zh' ? section.subtitleZh : section.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex-grow bg-transparent m-4 mt-0 rounded-md overflow-hidden relative z-10">
                  <img 
                    src={section.image} 
                    alt={section.title} 
                    className={`w-full h-full object-cover transition-all duration-300
                      ${isLocked ? 'filter grayscale opacity-60' : ''}
                    `} 
                  />
                </div>
              </MagicCard>
            );
          })}
        </div>
      </div>
      
      {/* 水印 */}
      <div className="absolute bottom-2 right-6 text-xs text-gray-600 opacity-40 z-10">
        Created by Evenna | 2775525392@qq.com
      </div>

      {/* 保存和重新开始按钮 */}
      <div className="fixed bottom-8 right-8 flex flex-row gap-3 z-20">
        <button
          onClick={handleSaveHistory}
          className="flex items-center gap-2 px-4 py-3 bg-gray-900/70 backdrop-blur-md text-white rounded-lg shadow-lg hover:bg-gray-800/70 transition-all duration-300 border border-gray-700 hover:border-[#5157E8] group"
          title={t('Save to History', '保存到历史记录', lang)}
        >
          <svg className="w-5 h-5 text-gray-300 group-hover:text-[#5157E8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span className="text-sm font-medium">{t('Save', '保存', lang)}</span>
        </button>
        
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-4 py-3 bg-gray-900/70 backdrop-blur-md text-white rounded-lg shadow-lg hover:bg-red-900/70 transition-all duration-300 border border-gray-700 hover:border-red-500 group"
          title={t('Start New Project', '开始新项目', lang)}
        >
          <svg className="w-5 h-5 text-gray-300 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">{t('Restart', '重新开始', lang)}</span>
        </button>
      </div>
    </div>
  );
} 