"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import WorkshopNavigation from '@/components/WorkshopNavigation';
import { useLanguage, t } from '@/hooks/useLanguage';

// 素材类型接口
interface AssetType {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  recommended: boolean;
  selected: boolean;
}

// 生成的图片接口
interface GeneratedImage {
  id: string;
  assetType: string;
  imageUrl: string;
  userPrompt: string;
  optimizedPrompt: string;
  generatedAt: Date;
}

export default function VisualAssetsPage() {
  const router = useRouter();
  const lang = useLanguage();
  
  const steps = [
    { id: 1, label: t('Theme Selection', '主题选择', lang), path: '/theme-selection', completed: true },
    { id: 2, label: t('AI Collaboration', 'AI协作', lang), path: '/ai-collaboration', completed: true },
    { id: 3, label: t('Solution Review', '方案回顾', lang), path: '/solution-review', completed: true },
    { id: 4, label: t('Visual Assets', '视觉素材', lang), path: '/visual-assets', current: true },
  ];
  
  // 状态
  const [solution, setSolution] = useState<any | null>(null);
  const [theme, setTheme] = useState<any | null>(null);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: GeneratedImage[]}>({});
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // 加载方案数据
  useEffect(() => {
    try {
      const savedSolution = localStorage.getItem('completeSolution');
      const savedTheme = localStorage.getItem('selectedTheme');
      
      if (savedSolution) {
        const parsedSolution = JSON.parse(savedSolution);
        setSolution(parsedSolution);
        console.log('✅ 方案数据已加载');
      }
      
      if (savedTheme) {
        setTheme(JSON.parse(savedTheme));
        console.log('✅ 主题数据已加载');
      }
      
      // 加载生成历史
      const savedImages = localStorage.getItem('visualAssets');
      if (savedImages) {
        setGeneratedImages(JSON.parse(savedImages));
        console.log('✅ 生成历史已加载');
      }
    } catch (error) {
      console.error('加载数据时出错:', error);
    }
  }, []);
  
  // 智能分析并推荐素材类型
  useEffect(() => {
    if (solution) {
      analyzeAssetTypes();
    }
  }, [solution]);
  
  const analyzeAssetTypes = async () => {
    try {
      console.log('🔍 开始分析素材类型...');
      const response = await axios.post('/api/analyze-asset-types', {
        solution: solution
      });
      
      if (response.data.success) {
        const types = response.data.assetTypes.map((t: any) => ({
          ...t,
          selected: t.recommended // 推荐的默认勾选
        }));
        setAssetTypes(types);
        
        // 默认选中第一个推荐的类型
        const firstRecommended = types.find((t: any) => t.recommended);
        if (firstRecommended) {
          setSelectedType(firstRecommended.id);
        }
        
        console.log('✅ 素材类型分析完成');
      }
    } catch (error) {
      console.error('分析素材类型失败:', error);
      // 使用默认配置
      setAssetTypes([
        { id: 'poster', name: '项目海报', nameEn: 'Project Poster', icon: '🎨', description: '宣传用主视觉', descriptionEn: 'Main visual for promotion', recommended: true, selected: true },
        { id: 'ui_design', name: '界面设计', nameEn: 'UI Design', icon: '📱', description: '软件界面设计稿', descriptionEn: 'Interface design mockups', recommended: false, selected: false },
        { id: 'space_render', name: '空间渲染', nameEn: 'Space Rendering', icon: '🏗️', description: '空间3D效果图', descriptionEn: '3D renderings of spaces', recommended: false, selected: false }
      ]);
      setSelectedType('poster');
    }
  };
  
  // 切换素材类型选择
  const toggleTypeSelection = (typeId: string) => {
    setAssetTypes(prev =>
      prev.map(t => t.id === typeId ? { ...t, selected: !t.selected } : t)
    );
  };
  
  // 选择当前素材类型
  const selectType = (typeId: string) => {
    setSelectedType(typeId);
    setUserPrompt('');
    setOptimizedPrompt('');
  };
  
  // AI优化提示词
  const handleOptimizePrompt = async () => {
    if (!userPrompt.trim() || !solution || !selectedType) {
      alert(t('Please enter a description first', '请先输入描述', lang));
      return;
    }
    
    setIsOptimizing(true);
    try {
      console.log('🎲 开始优化提示词...');
      const response = await axios.post('/api/optimize-visual-prompt', {
        userPrompt: userPrompt,
        solution: solution,
        assetType: assetTypes.find(t => t.id === selectedType)?.name || ''
      });
      
      if (response.data.success) {
        setOptimizedPrompt(response.data.optimizedPrompt);
        console.log('✅ 提示词优化完成');
      }
    } catch (error) {
      console.error('优化提示词失败:', error);
      alert(t('Optimization failed, please try again', '优化失败，请重试', lang));
    } finally {
      setIsOptimizing(false);
    }
  };
  
  // 生成图片
  const handleGenerateImage = async () => {
    let promptToUse = optimizedPrompt.trim();
    
    // 如果没有优化的提示词，自动优化
    if (!promptToUse && userPrompt.trim()) {
      console.log('🎲 自动优化提示词...');
      setIsOptimizing(true);
      try {
        const response = await axios.post('/api/optimize-visual-prompt', {
          userPrompt: userPrompt,
          solution: solution,
          assetType: assetTypes.find(t => t.id === selectedType)?.name || ''
        });
        
        if (response.data.success) {
          promptToUse = response.data.optimizedPrompt;
          setOptimizedPrompt(promptToUse);
          console.log('✅ 提示词优化完成，继续生成...');
        } else {
          setIsOptimizing(false);
          alert(t('Failed to optimize prompt', '优化提示词失败', lang));
          return;
        }
      } catch (error) {
        console.error('优化提示词失败:', error);
        setIsOptimizing(false);
        alert(t('Failed to optimize prompt, please try again', '优化提示词失败，请重试', lang));
        return;
      } finally {
        setIsOptimizing(false);
      }
    }
    
    if (!promptToUse) {
      alert(t('Please enter a description first', '请先输入描述', lang));
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(t('Submitting task...', '提交任务中...', lang));
    
    try {
      console.log('🎨 开始生成图片...');
      console.log('📝 使用提示词:', promptToUse.slice(0, 100) + '...');
      const response = await axios.post('/api/jimeng-generate', {
        prompt: promptToUse
      });
      
      if (response.data.success) {
        const newImage: GeneratedImage = {
          id: `img_${Date.now()}`,
          assetType: selectedType!,
          imageUrl: response.data.imageUrl,
          userPrompt: userPrompt,
          optimizedPrompt: optimizedPrompt,
          generatedAt: new Date()
        };
        
        // 添加到生成历史
        setGeneratedImages(prev => {
          const updated = {
            ...prev,
            [selectedType!]: [...(prev[selectedType!] || []), newImage]
          };
          localStorage.setItem('visualAssets', JSON.stringify(updated));
          return updated;
        });
        
        // 设置为当前显示
        setCurrentImage(newImage);
        
        console.log('✅ 图片生成成功！');
        alert(t('Image generated successfully!', '图片生成成功！', lang));
        
        // 清空输入
        setUserPrompt('');
        setOptimizedPrompt('');
      }
    } catch (error: any) {
      console.error('生成图片失败:', error);
      alert(error.response?.data?.error || t('Generation failed, please try again', '生成失败，请重试', lang));
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };
  
  // 删除图片
  const handleDeleteImage = (typeId: string, imageId: string) => {
    if (!confirm(t('Are you sure you want to delete this image?', '确定要删除这张图片吗？', lang))) return;
    
    setGeneratedImages(prev => {
      const updated = {
        ...prev,
        [typeId]: prev[typeId].filter(img => img.id !== imageId)
      };
      localStorage.setItem('visualAssets', JSON.stringify(updated));
      
      // 如果删除的是当前显示的图片，清空currentImage
      if (currentImage?.id === imageId) {
        setCurrentImage(null);
      }
      
      return updated;
    });
  };
  
  // 获取某类型的图片数量
  const getImageCount = (typeId: string): number => {
    return generatedImages[typeId]?.length || 0;
  };
  
  // 获取某类型的所有图片
  const getImagesByType = (typeId: string): GeneratedImage[] => {
    return generatedImages[typeId] || [];
  };
  
  // 完成
  const handleComplete = () => {
    const progress = JSON.parse(localStorage.getItem('workshopProgress') || '[]');
    if (!progress.includes('headline')) {
      progress.push('headline');
      localStorage.setItem('workshopProgress', JSON.stringify(progress));
    }
    router.push('/workshop');
  };
  
  return (
    <div className="h-screen bg-black flex flex-col">
      {/* 导航按钮 */}
      <WorkshopNavigation previousPage="/solution-review" />
      
      {/* 进度条 */}
      <div className="flex-none w-full flex justify-center items-center py-6 relative bg-gray-900/50 backdrop-blur-sm shadow-sm" style={{ paddingLeft: '410px', paddingRight: '230px' }}>
        <div className="flex items-center bg-black/15 backdrop-blur-md rounded-full px-8 py-2 gap-6 border border-white/5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 group transition-all duration-300 ${
                step.current ? 'cursor-default' : ''
              }`}
            >
              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white text-base
                  ${step.completed ? 'bg-[#B3B8D8]' : 
                    step.current ? 'bg-[#5157E8] shadow-lg' : 
                    'bg-[#B3B8D8]'} transition-all duration-300`}
              >
                {step.completed ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className={`${
                step.current ? 'text-white font-medium' : 'text-gray-400'
              } transition-colors duration-300`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 主体两栏布局 */}
      <div className="flex-1 flex px-6 gap-6 w-full min-h-0 py-6">
        {/* 左侧：素材类型选择 (1/5) */}
        <div className="w-1/5 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-0 overflow-hidden border border-gray-800">
          {/* 标题 */}
          <div className="flex-none p-4 border-b border-gray-700/50">
            <h3 className="text-xl font-bold text-[#5157E8]">{t('Asset Types', '素材类型', lang)}</h3>
            <p className="text-xs text-gray-400 mt-1">{t('AI Smart Recommendations', 'AI 智能推荐', lang)}</p>
          </div>
          
          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {/* 推荐生成 */}
            <div className="p-4">
              <h4 className="font-bold text-white mb-2 flex items-center text-sm">
                <span className="text-lg mr-2">🌟</span>
                {t('Recommended', '推荐生成', lang)}
              </h4>
            
            <div className="space-y-2">
              {assetTypes.filter(t => t.recommended).map(type => (
                <button
                  key={type.id}
                  onClick={() => selectType(type.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedType === type.id
                      ? 'bg-[#5157E8] text-white shadow-lg'
                      : 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={type.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleTypeSelection(type.id);
                        }}
                        className="mr-2"
                      />
                      <span className="mr-2">{type.icon}</span>
                      <span className="font-medium">{lang === 'zh' ? type.name : type.nameEn}</span>
                    </div>
                    {getImageCount(type.id) > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedType === type.id
                          ? 'bg-white text-[#5157E8]'
                          : 'bg-green-500 text-white'
                      }`}>
                        {getImageCount(type.id)}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ml-6 ${
                    selectedType === type.id ? 'text-white/90' : 'text-gray-400'
                  }`}>
                    {lang === 'zh' ? type.description : type.descriptionEn}
                  </div>
                </button>
              ))}
            </div>
            </div>
          
            {/* 可选生成 */}
            <div className="p-4 border-t border-gray-700/50">
              <h4 className="font-bold text-white mb-2 flex items-center text-sm">
                <span className="text-lg mr-2">💡</span>
                {t('Optional', '可选生成', lang)}
              </h4>
            
            <div className="space-y-2">
              {assetTypes.filter(t => !t.recommended).map(type => (
                <button
                  key={type.id}
                  onClick={() => selectType(type.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedType === type.id
                      ? 'bg-[#5157E8] text-white shadow-lg'
                      : 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={type.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleTypeSelection(type.id);
                        }}
                        className="mr-2"
                      />
                      <span className="mr-2">{type.icon}</span>
                      <span className="font-medium">{lang === 'zh' ? type.name : type.nameEn}</span>
                    </div>
                    {getImageCount(type.id) > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedType === type.id
                          ? 'bg-white text-[#5157E8]'
                          : 'bg-green-500 text-white'
                      }`}>
                        {getImageCount(type.id)}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ml-6 ${
                    selectedType === type.id ? 'text-white/90' : 'text-gray-400'
                  }`}>
                    {lang === 'zh' ? type.description : type.descriptionEn}
                  </div>
                </button>
              ))}
            </div>
            </div>
          </div>
        </div>
        
        {/* 中间：生成/预览区 - 更大的预览空间 (3/5) */}
        <div className="w-3/5 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-0 border border-gray-800">
          {/* 标题 */}
          <div className="flex-none p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#5157E8]">{t('Visual Assets', '视觉素材', lang)}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {solution?.projectName 
                    ? (typeof solution.projectName === 'string' 
                      ? solution.projectName 
                      : solution.projectName.cn || solution.projectName.en)
                    : t('Solution Visualization', '方案可视化', lang)}
                </p>
              </div>
              {currentImage && (
                <button
                  onClick={() => setFullscreenImage(currentImage.imageUrl)}
                  className="text-sm text-[#5157E8] hover:text-[#3a3fa0] flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {t('Full Screen', '全屏预览', lang)}
                </button>
              )}
            </div>
          </div>
          
          {/* 图片预览区 */}
          <div className="flex-1 p-6 overflow-auto">
            {isGenerating ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  {/* 精致的加载动画 */}
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    {/* 外圈 */}
                    <div className="absolute inset-0 border-[3px] border-gray-700/50 rounded-full"></div>
                    {/* 旋转的渐变圈 */}
                    <div className="absolute inset-0 border-[3px] border-transparent border-t-[#5157E8] border-r-[#5157E8] rounded-full animate-spin"></div>
                    {/* 内部脉动圆点 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 bg-[#5157E8] rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-base font-medium text-gray-300">{t('Generating image...', '正在生成图片...', lang)}</p>
                  <p className="text-sm text-gray-400 mt-2">{generationProgress}</p>
                  <p className="text-xs text-gray-400 mt-3">{t('Estimated time: 30-60 seconds', '预计需要 30-60 秒', lang)}</p>
                </div>
              </div>
            ) : currentImage ? (
              <div 
                className="h-full flex items-center justify-center bg-gray-900/20 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-800/30 transition-colors border border-gray-700"
                onClick={() => setFullscreenImage(currentImage.imageUrl)}
              >
                <img
                  src={currentImage.imageUrl}
                  alt="Generated Visual Asset"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-lg">{t('Select an asset type on the left and generate images', '选择左侧的素材类型并生成图片', lang)}</p>
                  <p className="text-sm mt-2">{t('AI will generate based on your solution', 'AI 会根据您的方案内容智能生成', lang)}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* 底部：提示词优化区 */}
          {selectedType && (
            <div className="bg-gray-900/30 backdrop-blur-sm p-4 border-t border-gray-700/50">
              <div className="space-y-3">
                {/* 原始描述 */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    {t('Describe the image you want', '描述您想要的画面', lang)}
                  </label>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder={t(
                      'e.g., A service robot helping an elderly person in a living room, warm lighting, clear interaction, realistic style',
                      '例如：客厅里服务机器人陪伴老人，温暖灯光、清晰的人机互动、真实写实风格',
                      lang
                    )}
                    className="w-full p-3 border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded-lg h-20 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                  />
                </div>
                
                {/* 生成按钮 */}
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || isOptimizing || !userPrompt.trim()}
                  className="w-full py-3 bg-[#5157E8] text-white rounded-lg font-medium hover:bg-[#3a3fa0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? t('Generating...', '生成中...', lang) : isOptimizing ? t('AI Optimizing...', 'AI优化中...', lang) : t('🎨 Generate Image', '🎨 生成图片', lang)}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧：生成历史 (1/5) */}
        <div className="w-1/5 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-0 overflow-hidden border border-gray-800">
          <div className="flex-none p-4 border-b border-gray-700/50">
            <h3 className="text-xl font-bold text-[#5157E8]">{t('History', '历史记录', lang)}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {Object.values(generatedImages).flat().length} {t('images', '张图片', lang)}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {assetTypes.filter(t => t.selected).map(type => (
              <div key={type.id}>
                {/* 类型标题 */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <span className="mr-1">{type.icon}</span>
                    {lang === 'zh' ? type.name : type.nameEn}
                  </h4>
                  <span className="text-xs text-gray-400">
                    ({getImagesByType(type.id).length})
                  </span>
                </div>
                
                {/* 缩略图网格 */}
                {getImagesByType(type.id).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {getImagesByType(type.id).map(img => (
                      <div
                        key={img.id}
                        className="relative group"
                      >
                        <img
                          src={img.imageUrl}
                          alt=""
                          onClick={() => setCurrentImage(img)}
                          className={`w-full aspect-square object-cover rounded border-2 transition-all cursor-pointer ${
                            currentImage?.id === img.id
                              ? 'border-[#5157E8]'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        />
                        
                        {/* 悬停工具栏 */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenImage(img.imageUrl);
                            }}
                            className="bg-gray-800 text-[#5157E8] px-2 py-1 rounded-full text-xs font-medium mr-1 hover:bg-gray-700 border border-gray-600"
                          >
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            {t('View', '查看', lang)}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(type.id, img.id);
                            }}
                            className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium hover:bg-red-600"
                          >
                            {t('Delete', '删除', lang)}
                          </button>
                        </div>
                        
                        {/* 当前预览标识 */}
                        {currentImage?.id === img.id && (
                          <div className="absolute top-1 left-1 bg-[#5157E8] text-white px-2 py-0.5 rounded text-xs">
                            {t('Current', '当前', lang)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-4 bg-gray-900/20 rounded border border-gray-700">
                    {t('No images yet', '暂无生成', lang)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 水印 */}
      <div className="absolute bottom-2 right-6 text-xs text-gray-600 opacity-40 z-10">
        Created by Evenna | 2775525392@qq.com
      </div>
      
      {/* 全屏预览弹窗 */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors z-10 border border-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={fullscreenImage}
            alt="Full screen preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
