'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { useLanguage, t } from "@/hooks/useLanguage";
import Particles from "@/components/Particles";

export default function Home() {
  const router = useRouter();
  const lang = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* 粒子星空背景 */}
      <Particles
        particleCount={200}
        particleSpread={10}
        speed={0.1}
        particleColors={['#ffffff']}
        moveParticlesOnHover={false}
        particleHoverFactor={0}
        alphaParticles={false}
        particleBaseSize={100}
        sizeRandomness={1}
        cameraDistance={20}
        disableRotation={false}
      />
      <div className="absolute top-6 right-6 flex gap-4 z-10">
        {/* 右上角按钮由 layout.tsx 控制 */}
      </div>
      
      <h1 className="text-7xl font-extrabold mb-12 text-center text-white drop-shadow-2xl z-10">
        {t('Future Workshop', '未来工作坊', lang)}
      </h1>
      
      <p className={`text-xl text-center mb-12 text-gray-400 leading-relaxed z-10 px-6 ${lang === 'zh' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <span className={lang === 'zh' ? 'whitespace-nowrap' : ''}>
          {t(
            'Here, we begin with imagination and use design as a tool to explore the future possibilities of technology, society, and humanity.',
            '在这里，我们从想象开始，用设计作为工具，探索技术、社会和人类的未来可能性。',
            lang
          )}
        </span>
        <br />
        {t(
          'Join us—ask questions through design, and respond to the future with creativity.',
          '加入我们——通过设计提出问题，用创造力回应未来。',
          lang
        )}
      </p>
      
      <button
        className="backdrop-blur-md bg-white/10 text-white rounded-full px-12 py-4 text-lg font-semibold border border-white/30 hover:bg-white/20 hover:border-white/50 transition-all transform hover:scale-105 z-10 shadow-lg"
        onClick={() => router.push("/workshop")}
      >
        {t('Tap to Enter', '点击进入', lang)}
      </button>
      
      {/* 水印 */}
      <div className="absolute bottom-2 right-6 text-xs text-gray-600 opacity-40 z-10">
        Created by Evenna | 2775525392@qq.com
      </div>
    </div>
  );
}
