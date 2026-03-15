"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import WorkshopNavigation from '@/components/WorkshopNavigation';
import { useLanguage, t } from '@/hooks/useLanguage';


// 方案数据结构
interface SolutionData {
  projectName: { en: string; cn: string };
  projectTags: { type: string[]; timeFrame: string; organization: string };
  coreDescription: string;
  coreProblem: string;
  designInsight: string;
  designMethods: Array<{ method: string; description: string; relevance?: number }>;
  coreConcepts: Array<{ concept: string; explanation: string }>;
  technologies: Array<{ tech: string; application: string }>;
  outputForms: string[];
  targetScenarios: string[];
  potentialImpact: string;
  keywords: string[];
  references: Array<{ caseName: string; link?: string; relevance: string }>;
}

// 对话消息类型
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  agentName?: string;
}

const sanitizeConversation = (history: any[]): ChatMessage[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  const sanitized: ChatMessage[] = [];

  for (const item of history) {
    if (!item || typeof item !== 'object') continue;

    const role = (item as any).role;
    const content = (item as any).content;

    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim().length > 0) {
      sanitized.push({
        role,
        content,
        agentId: typeof (item as any).agentId === 'string' ? (item as any).agentId : undefined,
        agentName: typeof (item as any).agentName === 'string' ? (item as any).agentName : undefined
      });
    }
  }

  return sanitized;
};

export default function AICollaborationPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lang = useLanguage();
  
  // 版本号（用于确认部署版本）
  const APP_VERSION = '2024.11.12.v2';
  
  // AI 专家配置
  const AI_EXPERTS = [
    {
      id: 'design-critic',
      name: lang === 'zh' ? '设计评论家' : 'Design Critic',
      nameEn: 'Design Critic',
      icon: '🎨',
      avatar: '/images/future-signals/设计评论家.png',
      color: 'bg-purple-500',
      description: lang === 'zh' ? '设计理论与用户体验专家' : 'Design Theory & UX Expert'
    },
    {
      id: 'tech-advisor',
      name: lang === 'zh' ? '技术顾问' : 'Tech Advisor',
      nameEn: 'Tech Advisor',
      icon: '🔬',
      avatar: '/images/future-signals/技术专家.png',
      color: 'bg-blue-500',
      description: lang === 'zh' ? '工程实现与技术专家' : 'Engineering & Tech Expert'
    },
    {
      id: 'robot-specialist',
      name: lang === 'zh' ? '机器人专家' : 'Robot Specialist',
      nameEn: 'Robot Specialist',
      icon: '🤖',
      avatar: '/images/future-signals/技术专家.png',
      color: 'bg-indigo-500',
      description: lang === 'zh' ? '机器人设计与应用专家' : 'Robot Design & Application Expert'
    },
    {
      id: 'case-specialist',
      name: lang === 'zh' ? '案例专家' : 'Case Specialist',
      nameEn: 'Case Specialist',
      icon: '📚',
      avatar: '/images/future-signals/案例专家.png',
      color: 'bg-green-500',
      description: lang === 'zh' ? '设计案例与参考专家' : 'Design Case & Reference Expert'
    }
  ];
  
  // 快捷问题模板
  const QUICK_PROMPTS = [
    { id: 1, text: t("How to improve the project description?", "如何完善项目描述？", lang), icon: "📝" },
    { id: 2, text: t("What are some reference cases?", "有什么参考案例？", lang), icon: "💡" },
    { id: 3, text: t("What technical support is needed?", "需要哪些技术支持？", lang), icon: "🔧" },
  ];
  
  const steps = [
    { id: 1, label: t('Theme Selection', '主题选择', lang), path: '/theme-selection', completed: true },
    { id: 2, label: t('AI Collaboration', 'AI协作', lang), path: '/ai-collaboration', current: true },
    { id: 3, label: t('Solution Review', '方案回顾', lang), path: '/solution-review' },
    { id: 4, label: t('Visual Assets', '视觉素材', lang), path: '/visual-assets' },
  ];
  
  // 主题数据
  const [selectedTheme, setSelectedTheme] = useState<any>(null);
  
  // 方案数据
  const [solution, setSolution] = useState<Partial<SolutionData>>({
    projectName: { en: '', cn: '' },
    projectTags: { type: [], timeFrame: '', organization: '' },
    coreDescription: '',
    coreProblem: '',
    designInsight: '',
    designMethods: [],
    coreConcepts: [],
    technologies: [],
    outputForms: [],
    targetScenarios: [],
    potentialImpact: '',
    keywords: [],
    references: []
  });
  
  // 对话相关 - 简化状态管理
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // 加载保存的数据（只在组件挂载时执行一次）
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 添加消息到历史的统一方法 - 立即持久化
  const addMessage = (message: ChatMessage) => {
    setChatHistory(prev => {
      const newHistory = [...prev, message];
      // 立即保存到 sessionStorage
      sessionStorage.setItem('solutionConversation', JSON.stringify(newHistory));
      console.log('✅ 添加消息并保存:', message.role, newHistory.length);
      return newHistory;
    });
  };
  
  // 更新最后一条消息的统一方法 - 立即持久化
  const updateLastMessage = (updater: (msg: ChatMessage) => ChatMessage) => {
    setChatHistory(prev => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      newHistory[newHistory.length - 1] = updater(newHistory[newHistory.length - 1]);
      // 立即保存到 sessionStorage
      sessionStorage.setItem('solutionConversation', JSON.stringify(newHistory));
      return newHistory;
    });
  };
  
  useEffect(() => {
    if (isInitialized) return; // 防止重复初始化
    
    try {
      console.log('🔄 开始加载保存的数据...');
      console.log('📦 当前版本:', APP_VERSION);
      
      // 1. 恢复主题
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        setSelectedTheme(theme);
        console.log('✅ 主题已恢复:', theme.title);
      }
      
      // 2. 恢复方案数据（并应用数量限制）
      const savedSolution = localStorage.getItem('completeSolution');
      if (savedSolution) {
        const parsedSolution = JSON.parse(savedSolution);
        
        // 应用数量限制到恢复的数据
        const MAX_METHODS = 5;
        const MAX_KEYWORDS = 20;
        
        // 限制设计方法
        if (parsedSolution.designMethods && Array.isArray(parsedSolution.designMethods)) {
          if (parsedSolution.designMethods.length > MAX_METHODS) {
            console.warn(`⚠️ 设计方法超过限制 (${parsedSolution.designMethods.length} > ${MAX_METHODS})，进行限制`);
            // 保留前5个
            parsedSolution.designMethods = parsedSolution.designMethods.slice(0, MAX_METHODS);
          }
        }
        
        // 限制关键词
        if (parsedSolution.keywords && Array.isArray(parsedSolution.keywords)) {
          if (parsedSolution.keywords.length > MAX_KEYWORDS) {
            console.warn(`⚠️ 关键词超过限制 (${parsedSolution.keywords.length} > ${MAX_KEYWORDS})，进行限制`);
            // 保留前20个
            parsedSolution.keywords = parsedSolution.keywords.slice(0, MAX_KEYWORDS);
          }
        }
        
        setSolution(parsedSolution);
        console.log('✅ 方案数据已恢复:', {
          字段: Object.keys(parsedSolution),
          设计方法: parsedSolution.designMethods?.length || 0,
          关键词: parsedSolution.keywords?.length || 0
        });
      }
      
      // 3. 恢复对话历史
      const savedConversation = sessionStorage.getItem('solutionConversation');
      if (savedConversation) {
        try {
          const parsedConversation = JSON.parse(savedConversation);
          if (Array.isArray(parsedConversation) && parsedConversation.length > 0) {
            setChatHistory(parsedConversation);
            console.log('✅ 对话历史已恢复:', parsedConversation.length, '条消息');
          }
        } catch (error) {
          console.error('❌ 解析对话历史失败:', error);
          sessionStorage.removeItem('solutionConversation');
        }
      } else if (savedTheme && !savedConversation) {
        // 如果有主题但没有对话历史，显示欢迎消息
        const theme = JSON.parse(savedTheme);
        setTimeout(() => {
          const themeTitle = lang === 'zh' ? theme.title : theme.titleEn;
          const welcomeMessage = {
            role: 'assistant' as const,
            content: lang === 'zh' 
              ? `你好！我是你的设计协作团队。我看到你选择了「${themeTitle}」这个主题。\n\n让我们一起设计一个完整的方案吧！你可以：\n- 从项目名称开始\n- 描述你的初步想法\n- 或者直接提问\n\n我会根据话题自动调度合适的专家来回答你。`
              : `Hello! I'm your design collaboration team. I see you've chosen the theme "${themeTitle}".\n\nLet's design a complete solution together! You can:\n- Start with a project name\n- Describe your initial ideas\n- Or ask questions directly\n\nI will automatically dispatch appropriate experts to answer based on the topic.`,
            agentId: 'design-critic',
            agentName: lang === 'zh' ? '设计评论家' : 'Design Critic'
          };
          setChatHistory([welcomeMessage]);
          console.log('✅ 显示欢迎消息');
        }, 500);
      }
      
      setIsInitialized(true);
      console.log('✅ 数据加载完成');
    } catch (error) {
      console.error('❌ 加载数据时出错:', error);
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  // 自动保存方案数据
  useEffect(() => {
    if (!isInitialized) return; // 等待初始化完成后再开始保存
    
    if (Object.keys(solution).length > 0) {
      localStorage.setItem('completeSolution', JSON.stringify(solution));
      console.log('💾 方案数据已保存');
    }
  }, [solution, isInitialized]);
  
  // 滚动到底部
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);
  
  // 发送消息 - 完全重写，使用简单可靠的方式
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const currentInput = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);
    
    // 1. 添加用户消息
    addMessage({ role: 'user', content: currentInput });
    console.log('📤 发送用户消息:', currentInput);
    
    try {
      const response = await fetch('/api/smart-discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          theme: selectedTheme,
          solution: solution,
          conversationHistory: sanitizeConversation(chatHistory).slice(-10)
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentMessageIndex = -1;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'agent_start') {
              // 新专家开始 - 添加空消息
              console.log('🎯 专家开始:', data.name);
              addMessage({
                role: 'assistant',
                content: '',
                agentId: data.agentId,
                agentName: data.name
              });
              currentMessageIndex = chatHistory.length; // 记录当前消息位置
              
            } else if (data.type === 'content') {
              // 追加内容 - 更新最后一条消息
              updateLastMessage(msg => ({
                ...msg,
                content: msg.content + data.content
              }));
              
            } else if (data.type === 'agent_end') {
              console.log('✅ 专家回复完成');
              currentMessageIndex = -1;
              
            } else if (data.type === 'extracted_data') {
              // 接收并合并提取的结构化数据
              const extractedData = data.data;
              if (extractedData) {
                setSolution(prev => {
                  const updated = { ...prev };
                  
                  // 合并设计方法（限制5个，按相关度排序）
                  if (extractedData.designMethods && Array.isArray(extractedData.designMethods)) {
                    const MAX_METHODS = 5;
                    let allMethods = [...(prev.designMethods || [])];
                    
                    allMethods = allMethods.map((m: any) => ({
                      ...m,
                      relevance: m.relevance || 50
                    }));
                    
                    for (const newMethod of extractedData.designMethods) {
                      const existingIndex = allMethods.findIndex(
                        (m: any) => m.method.toLowerCase() === newMethod.method.toLowerCase()
                      );
                      
                      if (existingIndex >= 0) {
                        allMethods[existingIndex].relevance = Math.max(
                          allMethods[existingIndex].relevance || 0,
                          newMethod.relevance || 60
                        );
                      } else {
                        allMethods.push({
                          ...newMethod,
                          relevance: newMethod.relevance || 60
                        });
                      }
                    }
                    
                    allMethods.sort((a: any, b: any) => (b.relevance || 0) - (a.relevance || 0));
                    updated.designMethods = allMethods.slice(0, MAX_METHODS);
                  }
                  
                  // 合并关键词（限制20个，按相关度排序）
                  if (extractedData.keywords && Array.isArray(extractedData.keywords)) {
                    const MAX_KEYWORDS = 20;
                    let allKeywords: Array<{keyword: string, relevance: number}> = [];
                    
                    if (prev.keywords && Array.isArray(prev.keywords)) {
                      allKeywords = prev.keywords.map((k: any) =>
                        typeof k === 'string'
                          ? { keyword: k, relevance: 50 }
                          : { keyword: k.keyword || k, relevance: k.relevance || 50 }
                      );
                    }
                    
                    for (const newKeyword of extractedData.keywords) {
                      const keywordStr = typeof newKeyword === 'string' ? newKeyword : newKeyword.keyword || newKeyword;
                      const relevance = typeof newKeyword === 'object' ? newKeyword.relevance || 60 : 60;
                      
                      const existingIndex = allKeywords.findIndex(
                        k => k.keyword.toLowerCase() === keywordStr.toLowerCase()
                      );
                      
                      if (existingIndex >= 0) {
                        allKeywords[existingIndex].relevance = Math.max(
                          allKeywords[existingIndex].relevance,
                          relevance
                        );
                      } else {
                        allKeywords.push({ keyword: keywordStr, relevance });
                      }
                    }
                    
                    allKeywords.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
                    updated.keywords = allKeywords.slice(0, MAX_KEYWORDS).map(k => k.keyword);
                  }
                  
                  // 合并参考资料
                  if (extractedData.references && Array.isArray(extractedData.references)) {
                    const existing = (prev.references || []).map((r: any) => r.caseName.toLowerCase());
                    const newRefs = extractedData.references.filter(
                      (r: any) => !existing.includes(r.caseName.toLowerCase())
                    );
                    updated.references = [...(prev.references || []), ...newRefs];
                  }
                  
                  return updated;
                });
              }
              
            } else if (data.type === 'done') {
              console.log('✅ 所有AI回复完成');
              //  不需要break，让循环自然结束
            }
          } catch (e) {
            console.error('❌ 解析SSE数据错误:', e);
          }
        }
      }
      
      console.log('💬 对话完成，当前历史记录:', chatHistory.length, '条消息');
      
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
      addMessage({
        role: 'assistant',
        content: lang === 'zh' ? '抱歉，发生了错误。请稍后再试。' : 'Sorry, an error occurred. Please try again later.'
      });
    } finally {
      setIsChatLoading(false);
    }
  };
  
  // 使用快捷问题 - 直接调用 handleSendMessage 的逻辑
  const useQuickPrompt = (text: string) => {
    if (!text.trim()) return;
    setChatInput(text);
    // 短暂延迟后自动发送
    setTimeout(() => handleSendMessage(), 100);
  };
  
  // 更新方案字段
  const updateSolution = (field: string, value: any) => {
    setSolution(prev => ({ ...prev, [field]: value }));
  };
  
  // 计算完成度
  const calculateCompleteness = () => {
    let completed = 0;
    const total = 10;
    
    if (solution.projectName?.en || solution.projectName?.cn) completed++;
    if (solution.coreDescription && solution.coreDescription.length >= 50) completed++;
    if (solution.coreProblem && solution.coreProblem.length >= 50) completed++;
    if (solution.designInsight && solution.designInsight.length >= 50) completed++;
    if (solution.designMethods && solution.designMethods.length > 0) completed++;
    if (solution.coreConcepts && solution.coreConcepts.length > 0) completed++;
    if (solution.technologies && solution.technologies.length > 0) completed++;
    if (solution.potentialImpact && solution.potentialImpact.length >= 50) completed++;
    if (solution.keywords && solution.keywords.length >= 3) completed++;
    if (solution.references && solution.references.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };
  
  // 下一步
  const handleNextStep = () => {
    const completeness = calculateCompleteness();
    if (completeness < 50) {
      alert(t('Solution completion is less than 50%, please continue to improve the solution.', '方案完成度不足50%，请继续完善方案内容。', lang));
      return;
    }
    
    const progress = JSON.parse(localStorage.getItem('workshopProgress') || '[]');
    if (!progress.includes('collaboration')) {
      progress.push('collaboration');
      localStorage.setItem('workshopProgress', JSON.stringify(progress));
    }
    
    router.push('/workshop');
  };
  
  const completeness = calculateCompleteness();
  
  return (
    <div className="h-screen bg-black flex flex-col">
      {/* 导航按钮 */}
      <WorkshopNavigation previousPage="/theme-selection" />
      
      {/* 顶部进度条 */}
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
        {/* 左侧方案画布 (1/3) */}
        <div className="w-1/3 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-0 border border-gray-800">
          {/* 标题和进度 */}
          <div className="flex-none p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-[#5157E8]">{t('Design Solution Canvas', '设计方案画板', lang)}</span>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">{t('Progress', '完成度', lang)}</div>
                <div className="flex items-center gap-1">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#5157E8] transition-all duration-500"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#5157E8]">{completeness}%</span>
                </div>
              </div>
            </div>
            {selectedTheme && (
              <div className="text-sm text-gray-600">
                {t('Theme', '主题', lang)}: <span className="font-medium text-[#5157E8]">{lang === 'zh' ? selectedTheme.title : selectedTheme.titleEn}</span>
              </div>
            )}
          </div>

          {/* 方案内容 - 可滚动 */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* 1. 项目基础信息 */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">📛 {t('Project Name', '项目名称', lang)}</h3>
                <div className={`w-2 h-2 rounded-full shrink-0 ${solution.projectName?.en || solution.projectName?.cn ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t('Enter project name...', '输入项目名称...', lang)}
                  className="w-full p-2 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                  value={solution.projectName?.en || solution.projectName?.cn || ''}
                  onChange={(e) => updateSolution('projectName', { en: e.target.value, cn: e.target.value })}
                />
              </div>
            </div>

            {/* 2. 核心描述 */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">📝 {t('Core Description', '核心描述', lang)}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {solution.coreDescription?.length || 0}/300
                  </span>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.coreDescription?.length || 0) >= 200 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
                </div>
              </div>
              <textarea
                placeholder={t('Describe the core content, goals, and features of the project...', '描述项目的核心内容、目标、特点...', lang)}
                className="w-full p-2 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded h-32 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                value={solution.coreDescription || ''}
                onChange={(e) => updateSolution('coreDescription', e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">{t('Recommended 200-300 words', '建议 200-300 字', lang)}</div>
            </div>

            {/* 3. 设计背景与问题 */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">🎯 {t('Core Problem', '核心问题', lang)}</h3>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.coreProblem?.length || 0) >= 150 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              <textarea
                placeholder={t('The core problem to solve...', '要解决的核心问题...', lang)}
                className="w-full p-2 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded h-24 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                value={solution.coreProblem || ''}
                onChange={(e) => updateSolution('coreProblem', e.target.value)}
              />
            </div>

            {/* 4. 设计洞察 */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">💡 {t('Design Insight', '设计洞察', lang)}</h3>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.designInsight?.length || 0) >= 150 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              <textarea
                placeholder={t('Deep design thinking...', '深层次的设计思考...', lang)}
                className="w-full p-2 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded h-24 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                value={solution.designInsight || ''}
                onChange={(e) => updateSolution('designInsight', e.target.value)}
              />
            </div>

            {/* 5. 核心概念 */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">🔑 {t('Core Concepts', '核心概念', lang)}</h3>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.coreConcepts?.length || 0) > 0 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              <textarea
                placeholder={t('Key concepts and their explanations...', '关键概念及其解释...', lang)}
                className="w-full p-2 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded h-24 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                value={solution.coreConcepts?.map(c => `${c.concept}: ${c.explanation}`).join('\n') || ''}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter(l => l.trim());
                  const concepts = lines.map(line => {
                    const [concept, ...rest] = line.split(':');
                    return { concept: concept.trim(), explanation: rest.join(':').trim() };
                  });
                  updateSolution('coreConcepts', concepts);
                }}
              />
            </div>

            {/* 7. 技术实现 */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">🔧 {t('Technologies', '技术实现', lang)}</h3>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.technologies?.length || 0) > 0 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              <textarea
                placeholder={t('Technology stack and application descriptions...', '技术栈和应用说明...', lang)}
                className="w-full p-2 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded h-24 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                value={solution.technologies?.map(t => `${t.tech}: ${t.application}`).join('\n') || ''}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter(l => l.trim());
                  const techs = lines.map(line => {
                    const [tech, ...rest] = line.split(':');
                    return { tech: tech.trim(), application: rest.join(':').trim() };
                  });
                  updateSolution('technologies', techs);
                }}
              />
            </div>

            {/* 8. 应用场景与影响 */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">🌍 {t('Application & Impact', '应用场景与影响', lang)}</h3>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.potentialImpact?.length || 0) >= 100 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              <textarea
                placeholder={t('Target scenarios and potential impact...', '目标场景和潜在影响...', lang)}
                className="w-full p-2 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded h-24 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                value={solution.potentialImpact || ''}
                onChange={(e) => updateSolution('potentialImpact', e.target.value)}
              />
            </div>

            {/* 8. 关键词标签（AI自动识别+用户可编辑） */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">🏷️ {t('Keywords', '关键词标签', lang)}</h3>
                  <span className={`text-xs ${
                    (solution.keywords?.length || 0) >= 20 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {solution.keywords?.length || 0}/20
                  </span>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.keywords?.length || 0) >= 3 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              {solution.keywords && solution.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {solution.keywords.map((keyword, idx) => (
                    <div key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/30 backdrop-blur-sm border border-blue-700 text-blue-300 rounded-full text-xs">
                      <span>{keyword}</span>
                      <button
                        onClick={() => {
                          const newKeywords = solution.keywords?.filter((_, i) => i !== idx);
                          updateSolution('keywords', newKeywords);
                        }}
                        className="text-blue-400 hover:text-blue-200 font-bold"
                      >
                        ✕
                      </button>
                  </div>
                ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 mb-2">{t('AI will automatically identify keywords based on conversations...', 'AI会根据对话自动识别关键词...', lang)}</div>
              )}
              <button
                onClick={() => {
                  const keyword = prompt(t('Please enter a keyword:', '请输入关键词：', lang));
                  if (keyword && keyword.trim()) {
                    const currentKeywords = solution.keywords || [];
                    if (currentKeywords.length >= 20) {
                      // 超过限制，替换最旧的（第一个）
                      const newKeywords = [...currentKeywords.slice(1), keyword.trim()];
                      updateSolution('keywords', newKeywords);
                    } else {
                      updateSolution('keywords', [...currentKeywords, keyword.trim()]);
                    }
                  }
                }}
                className="text-sm text-[#5157E8] hover:underline"
              >
                + {t('Add keyword manually', '手动添加关键词', lang)}
              </button>
              {(solution.keywords?.length || 0) >= 20 && (
                <div className="text-xs text-amber-600 mt-2">
                  ⚠️ {t('Limit reached (20), new additions will replace the oldest tags', '已达上限（20个），新添加将自动替换最旧的标签', lang)}
                </div>
              )}
            </div>

            {/* 9. 设计方法（AI自动识别+用户可编辑） */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">🎨 {t('Design Methods', '设计方法', lang)}</h3>
                  <span className="text-xs text-gray-500">
                    {solution.designMethods?.length || 0}/5
                  </span>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.designMethods?.length || 0) > 0 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              {solution.designMethods && solution.designMethods.length > 0 ? (
                <div className="space-y-2 mb-2">
                  {solution.designMethods.map((method, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-gray-800/50 backdrop-blur-sm p-2 rounded border border-gray-700">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{method.method}</div>
                        {method.description && (
                          <div className="text-xs text-gray-400 mt-1">{method.description}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const newMethods = solution.designMethods?.filter((_, i) => i !== idx);
                          updateSolution('designMethods', newMethods);
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 mb-2">{t('AI will automatically identify design methods based on conversations...', 'AI会根据对话自动识别设计方法...', lang)}</div>
              )}
              <button
                onClick={() => {
                  const methodName = prompt(t('Please enter design method name:', '请输入设计方法名称：', lang));
                  if (methodName) {
                    const description = prompt(t('Please enter method description (optional):', '请输入方法说明（可选）：', lang));
                    const newMethod = { method: methodName, description: description || '', relevance: 50 };
                    const currentMethods = solution.designMethods || [];
                    if (currentMethods.length >= 5) {
                      // 超过限制，替换最旧的（第一个）
                      const newMethods = [...currentMethods.slice(1), newMethod];
                      updateSolution('designMethods', newMethods);
                    } else {
                      updateSolution('designMethods', [...currentMethods, newMethod]);
                    }
                  }
                }}
                className="text-sm text-[#5157E8] hover:underline"
              >
                + {t('Add method manually', '手动添加方法', lang)}
              </button>
              {(solution.designMethods?.length || 0) >= 5 && (
                <div className="text-xs text-amber-600 mt-2">
                  ⚠️ {t('Limit reached (5), new additions will replace the oldest method', '已达上限（5个），新添加将自动替换最旧的方法', lang)}
                </div>
              )}
            </div>

            {/* 10. 参考资料（AI自动识别+用户可编辑） */}
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">🔗 {t('References', '参考资料', lang)}</h3>
                <div className={`w-2 h-2 rounded-full shrink-0 ${(solution.references?.length || 0) > 0 ? 'bg-emerald-400/50' : 'bg-gray-500/60'}`} />
              </div>
              {solution.references && solution.references.length > 0 ? (
                <div className="space-y-2 mb-2">
                  {solution.references.map((ref, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-gray-800/50 backdrop-blur-sm p-2 rounded border border-gray-700">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{ref.caseName}</div>
                        {ref.relevance && (
                          <div className="text-xs text-gray-400 mt-1">{ref.relevance}</div>
                        )}
                        {ref.link && (
                          <a href={ref.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5157E8] hover:text-[#7a7fe8] hover:underline mt-1 block">
                            {ref.link}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const newRefs = solution.references?.filter((_, i) => i !== idx);
                          updateSolution('references', newRefs);
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 mb-2">{t('AI will automatically identify reference cases based on conversations...', 'AI会根据对话自动识别参考案例...', lang)}</div>
              )}
              <button
                onClick={() => {
                  const caseName = prompt(t('Please enter case name:', '请输入案例名称：', lang));
                  if (caseName) {
                    const relevance = prompt(t('Relevance description (optional):', '相关性说明（可选）：', lang));
                    const link = prompt(t('Link (optional):', '链接（可选）：', lang));
                    const newRef = { 
                      caseName, 
                      relevance: relevance || '', 
                      link: link || '' 
                    };
                    updateSolution('references', [...(solution.references || []), newRef]);
                  }
                }}
                className="text-sm text-[#5157E8] hover:underline"
              >
                + {t('Add reference manually', '手动添加参考', lang)}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧AI协作区 (2/3) */}
        <div className="w-2/3 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-0 border border-gray-800">
          {/* 标题 */}
          <div className="flex-none p-6 border-b border-gray-700/50">
            <h3 className="text-lg font-bold text-[#5157E8]">{t('AI Collaboration Team', 'AI 协作团队', lang)}</h3>
            <div className="text-sm text-gray-600 mt-1">
              {t('The system will automatically dispatch appropriate experts based on your questions', '系统会根据你的问题自动调度合适的专家回答', lang)}
            </div>
          </div>

          {/* 对话区域 */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {chatHistory.map((message, index) => {
              const agent = AI_EXPERTS.find(a => a.id === message.agentId);
              
              // 检测并翻译欢迎消息
              let displayContent = message.content;
              const isWelcomeMessage = index === 0 && message.role === 'assistant' && 
                (message.content.includes('你好！我是你的设计协作团队') || 
                 message.content.includes('Hello! I\'m your design collaboration team'));
              
              if (isWelcomeMessage && selectedTheme) {
                const themeTitle = lang === 'zh' ? selectedTheme.title : selectedTheme.titleEn;
                displayContent = lang === 'zh' 
                  ? `你好！我是你的设计协作团队。我看到你选择了「${themeTitle}」这个主题。\n\n让我们一起设计一个完整的方案吧！你可以：\n- 从项目名称开始\n- 描述你的初步想法\n- 或者直接提问\n\n我会根据话题自动调度合适的专家来回答你。`
                  : `Hello! I'm your design collaboration team. I see you've chosen the theme "${themeTitle}".\n\nLet's design a complete solution together! You can:\n- Start with a project name\n- Describe your initial ideas\n- Or ask questions directly\n\nI will automatically dispatch appropriate experts to answer based on the topic.`;
              }
              
              return (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    {/* 头像 */}
                    {message.role === 'user' ? (
                      <div className="w-10 h-10 rounded-full flex-none flex items-center justify-center text-white text-lg bg-[#5157E8]">
                        👤
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex-none overflow-hidden bg-gray-800 border-2 border-gray-700">
                        {agent?.avatar ? (
                          <img 
                            src={agent.avatar} 
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-white text-lg ${agent?.color || 'bg-gray-500'}`}>
                            {agent?.icon || '🤖'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 消息内容 */}
                    <div className={`py-3 px-4 rounded-2xl ${
                      message.role === 'user' 
                        ? 'bg-[#5157E8] text-white rounded-tr-none' 
                        : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white rounded-tl-none'
                    }`}>
                      {message.agentName && message.role === 'assistant' && (
                        <div className="text-xs font-medium text-[#5157E8] mb-1">
                          {agent?.icon} {lang === 'zh' ? (agent?.name || message.agentName) : (agent?.nameEn || message.agentName)}
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.role === 'assistant' ? (
                          <ReactMarkdown>{displayContent}</ReactMarkdown>
                        ) : (
                          displayContent
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-10 h-10 rounded-full bg-gray-700/50 backdrop-blur-sm border border-gray-600 flex-none flex items-center justify-center text-white">
                    🤖
                  </div>
                  <div className="py-3 px-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white rounded-tl-none">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#5157E8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#5157E8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#5157E8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* 底部输入区 */}
          <div className="flex-none p-6 border-t border-gray-200 space-y-3">
            {/* 快捷问题 */}
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => useQuickPrompt(prompt.text)}
                  className="px-3 py-1.5 text-sm bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 text-gray-300 hover:text-white rounded-full transition-colors flex items-center gap-1"
                >
                  <span>{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>

            {/* 输入框 */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('Enter your question or idea...', '输入你的问题或想法...', lang)}
                className="flex-1 p-3 border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="px-6 py-3 bg-[#5157E8] text-white rounded-lg hover:bg-[#3a3fa0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('Send', '发送', lang)}
              </button>
            </div>

            {/* AI专家指示和Complete按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{t('Expert Team:', '专家团队:', lang)}</span>
                {AI_EXPERTS.map(expert => (
                  <div key={expert.id} className="flex items-center gap-1">
                    <span>{expert.icon}</span>
                    <span>{expert.name}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleNextStep}
                disabled={completeness < 50}
                className="bg-[#5157E8] text-white px-8 py-3 rounded-full shadow-lg text-lg hover:bg-[#3a3fa0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={completeness < 50 ? t(`Completion ${completeness}% (at least 50% required to continue)`, `完成度 ${completeness}%（至少需要50%才能继续）`, lang) : t(`Completion ${completeness}%`, `完成度 ${completeness}%`, lang)}
              >
                {t('Complete', '完成', lang)}
                <span className="text-sm">({completeness}%)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 水印 */}
      <div className="absolute bottom-2 right-6 text-xs text-gray-600 opacity-40 z-10">
        Created by Evenna | 2775525392@qq.com
      </div>
    </div>
  );
}
