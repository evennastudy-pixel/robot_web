"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkshopNavigation from '@/components/WorkshopNavigation';
import { useLanguage, t } from '@/hooks/useLanguage';

export default function SolutionReviewPage() {
  const router = useRouter();
  const lang = useLanguage();
  
  const steps = [
    { id: 1, label: t('Theme Selection', '主题选择', lang), path: '/theme-selection', completed: true },
    { id: 2, label: t('AI Collaboration', 'AI协作', lang), path: '/ai-collaboration', completed: true },
    { id: 3, label: t('Solution Review', '方案回顾', lang), path: '/solution-review', current: true },
    { id: 4, label: t('Visual Assets', '视觉素材', lang), path: '/visual-assets' },
  ];
  
  const reportStyles = [
    { id: 'default', name: t('Space Tech', '太空科技', lang), desc: t('Dark background, blue-purple gradient, glassmorphism', '深色背景、蓝紫渐变、玻璃拟态', lang) },
    { id: 'minimalist', name: t('Minimalist', '极简主义', lang), desc: t('Lots of white space, clean lines, black-white-gray colors', '大量留白、简洁线条、黑白灰配色', lang) },
    { id: 'tech', name: t('Tech Future', '科技未来', lang), desc: t('Neon colors, tech icons, dynamic lines', '霓虹色彩、科技感图标、动感线条', lang) },
    { id: 'elegant', name: t('Elegant Professional', '典雅专业', lang), desc: t('Beige background, delicate borders, serif fonts', '米色背景、精致边框、衬线字体', lang) },
    { id: 'vibrant', name: t('Vibrant Colorful', '活力多彩', lang), desc: t('Bright gradients, bold contrasts, geometric shapes', '鲜艳渐变、大胆对比、几何图形', lang) },
    { id: 'academic', name: t('Academic Rigorous', '学术严谨', lang), desc: t('White background, formal layout, academic style', '白色背景、正式排版、学术风格', lang) },
  ];
  const reportFormats = [
    { id: 'report', name: t('Detailed Report', '详细报告', lang), desc: t('Structured document with diagrams and rich content', '结构化文档、含结构图与丰富内容', lang) },
    { id: 'ppt', name: t('PPT Style', 'PPT演示稿', lang), desc: t('Slide-by-slide layout like presentation', '分页幻灯片式排版', lang) },
  ];
  const [solution, setSolution] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [reportHtml, setReportHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [selectedFormat, setSelectedFormat] = useState<'report' | 'ppt'>('report');
  const [userFeedback, setUserFeedback] = useState('');
  const [customStyleInput, setCustomStyleInput] = useState('');

  // 加载保存的数据
  useEffect(() => {
    try {
      const savedSolution = localStorage.getItem('completeSolution');
      const savedTheme = localStorage.getItem('selectedTheme');
      
      if (savedSolution) {
        const parsedSolution = JSON.parse(savedSolution);
        setSolution(parsedSolution);
        console.log('✅ 方案数据已加载:', parsedSolution);
      }
      
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme(parsedTheme);
        console.log('✅ 主题数据已加载:', parsedTheme);
      }

      const savedReport = sessionStorage.getItem('generatedReport');
      const savedStyle = sessionStorage.getItem('reportStyle');
      const savedFormat = sessionStorage.getItem('reportFormat');
      const savedFeedback = sessionStorage.getItem('reportFeedback');
      
      if (savedReport) {
        setReportHtml(savedReport);
        setHasGenerated(true);
        console.log('✅ 已恢复生成的报告');
      }
      if (savedStyle) setSelectedStyle(savedStyle);
      if (savedFormat === 'ppt' || savedFormat === 'report') setSelectedFormat(savedFormat);
      if (savedFeedback) setUserFeedback(savedFeedback);
    } catch (error) {
      console.error('❌ 加载数据时出错:', error);
    }
  }, []);

  // 不再自动生成，由用户选择风格后点击生成

  // 生成报告（overrides 用于重新生成时显式传入当前选择，避免闭包旧值）
  const generateReport = async (overrides?: { style?: string; format?: string }) => {
    if (!solution) {
      alert(t('No solution data found, please complete the second step first', '未找到方案数据，请先完成第二板块', lang));
      return;
    }

    const styleToUse = overrides?.style ?? selectedStyle;
    const formatToUse = (overrides?.format ?? selectedFormat) as 'report' | 'ppt';

    setIsGenerating(true);
    try {
      console.log('📡 调用API生成报告（流式）...', { style: styleToUse, format: formatToUse });

      let fullFeedback = userFeedback;
      if (customStyleInput.trim()) {
        fullFeedback = fullFeedback ? `${fullFeedback}\n\n排版风格要求: ${customStyleInput}` : `排版风格要求: ${customStyleInput}`;
      }

      // 使用 fetch + ReadableStream，边生成边接收，避免超时
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution,
          theme,
          style: styleToUse,
          format: formatToUse,
          userFeedback: fullFeedback,
        }),
      });

      if (!res.ok) {
        // 非流式错误（如 500），读取 JSON 错误信息
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `服务器返回错误 ${res.status}`);
      }

      if (!res.body) throw new Error('服务器未返回响应流');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // 清理 markdown 代码块标记
      let htmlReport = accumulated.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

      // 补全基本 HTML 结构（如有缺失）
      if (!htmlReport.includes('<!DOCTYPE html>') && !htmlReport.includes('<html')) {
        htmlReport = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>设计报告</title></head><body>${htmlReport}</body></html>`;
      }

      if (!htmlReport || htmlReport.length < 100) {
        throw new Error('生成的报告内容为空，请重试');
      }

      setReportHtml(htmlReport);
      setHasGenerated(true);
      sessionStorage.setItem('generatedReport', htmlReport);
      sessionStorage.setItem('reportStyle', styleToUse);
      sessionStorage.setItem('reportFormat', formatToUse);
      sessionStorage.setItem('reportFeedback', userFeedback);
      console.log('✅ 报告生成成功，HTML长度:', htmlReport.length);

    } catch (error: any) {
      console.error('❌ 生成报告时出错:', error);
      alert(t('Failed to generate report', '生成报告失败', lang) + ': ' + (error?.message || t('Please check API config (DEEPSEEK_API_KEY) and try again', '请检查 API 配置后重试', lang)));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    // 不先清空报告，等 API 成功后再更新；失败时保留原报告
    generateReport({ style: selectedStyle, format: selectedFormat });
  };

  // 完成并前往下一板块
  const handleComplete = () => {
    const progress = JSON.parse(localStorage.getItem('workshopProgress') || '[]');
    if (!progress.includes('review')) {
      progress.push('review');
      localStorage.setItem('workshopProgress', JSON.stringify(progress));
    }
    router.push('/workshop');
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* 导航按钮 */}
      <WorkshopNavigation previousPage="/ai-collaboration" />
      
      {/* 顶部进度条 */}
      <div className="flex-none w-full flex justify-center items-center py-6 relative bg-gray-900/50 backdrop-blur-sm shadow-sm" style={{ paddingLeft: '410px', paddingRight: '230px' }}>
        <div className="flex items-center bg-black/15 backdrop-blur-md rounded-full px-8 py-2 gap-6 border border-white/5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 group transition-colors ${
                step.current ? 'cursor-default' : ''
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white text-base
                  ${step.completed ? 'bg-gray-400' :
                    step.current ? 'bg-[#5157E8]' : 'bg-gray-300'
                  }`}
              >
                {step.completed ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className={`transition-colors ${
                step.current ? 'text-white font-medium' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 flex px-6 gap-6 w-full min-h-0 py-6">
        {/* 左侧：生成的报告 */}
        <div className="w-1/2 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-0 relative border border-gray-800">
          {/* 标题 */}
          <div className="flex-none p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#5157E8]">{t('Solution Report', '方案报告', lang)}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('AI-generated complete design solution report', 'AI生成的完整设计方案报告', lang)}</p>
              </div>
            </div>
          </div>

          {/* 报告内容区域 */}
          <div className="flex-1 overflow-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5157E8] mb-4"></div>
                <p className="text-lg">{t('Generating detailed solution report...', '正在生成详细的方案报告...', lang)}</p>
                <p className="text-sm text-gray-400 mt-2">{t('This may take 2-5 minutes, please wait patiently', '预计需要 2-5 分钟，请耐心等待', lang)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('The report will be more detailed with structure diagrams', '报告将更加详实并包含结构图', lang)}</p>
              </div>
            ) : reportHtml ? (
              <iframe
                srcDoc={reportHtml}
                className="w-full h-full border-0"
                title="Solution Report"
                sandbox="allow-same-origin"
              />
            ) : !solution ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg mb-2">{t('No solution data found', '未找到方案数据', lang)}</p>
                <p className="text-sm text-gray-400">{t('Please complete the design solution in the second step first', '请先完成第二板块的方案设计', lang)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-400 mb-1">{t('Report not yet generated', '报告尚未生成', lang)}</p>
                <p className="text-sm text-gray-500 mb-6">{t('Select style and format on the right, then click Generate Report', '请在右侧选择风格和格式，点击「生成报告」', lang)}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>⏱</span>
                  <span>{t('Generation takes about 2-5 minutes', '生成约需 2-5 分钟', lang)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：控制面板（与左侧高度对齐） */}
        <div className="w-1/2 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-0 border border-gray-800">
          {/* 标题 */}
          <div className="flex-none p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-[#5157E8]">{t('Report Control Panel', '报告控制面板', lang)}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('Customize your report style and content', '自定义您的报告风格和内容', lang)}</p>
          </div>

          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* 报告格式选择 */}
            <div>
              <h3 className="text-base font-bold text-white mb-3">📄 {t('Report Format', '报告格式', lang)}</h3>
              <div className="grid grid-cols-2 gap-2">
                {reportFormats.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id as 'report' | 'ppt')}
                    className={`p-2.5 rounded-lg text-left transition-all border-2 ${
                      selectedFormat === fmt.id
                        ? 'border-[#5157E8] bg-blue-900/30 backdrop-blur-sm'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="font-medium text-sm text-white">{fmt.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 排版风格选择 */}
            <div>
              <h3 className="text-base font-bold text-white mb-3">🎨 {t('Select Report Style', '选择报告风格', lang)}</h3>
              <div className="grid grid-cols-3 gap-2">
                {reportStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-2.5 rounded-lg text-left transition-all border-2 ${
                      selectedStyle === style.id
                        ? 'border-[#5157E8] bg-blue-900/30 backdrop-blur-sm'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="font-medium text-sm text-white">{style.name}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{style.desc}</div>
                  </button>
                ))}
              </div>
              
              {/* 自定义风格描述 */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-white mb-2">
                  💬 {t('Custom Style (Optional)', '自定义风格（可选）', lang)}
                </label>
                <textarea
                  value={customStyleInput}
                  onChange={(e) => setCustomStyleInput(e.target.value)}
                  placeholder={t('e.g., Use green as the main color, add more chart elements...', '例如：使用绿色作为主色调，增加图表元素...', lang)}
                  className="w-full p-2.5 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded-lg h-16 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
                />
              </div>
            </div>

            {/* 用户反馈与意见 */}
            <div>
              <h3 className="text-base font-bold text-white mb-3">💭 {t('Comments on the Report', '对报告的意见', lang)}</h3>
              <textarea
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                placeholder={t('Please enter your improvement requirements, for example:\n• Technical implementation needs more details\n• Application scenarios need to be more specific\n• Hope to use academic language', '请输入您的改进要求，例如：\n• 技术实现需要更多细节\n• 应用场景要更具体\n• 希望使用学术化语言', lang)}
                className="w-full p-3 text-sm border border-gray-600 bg-gray-900/30 text-white placeholder-gray-500 rounded-lg h-32 resize-none focus:ring-2 focus:ring-[#5157E8] focus:border-[#5157E8]"
              />
              <p className="text-xs text-gray-400 mt-2">
                💡 {t('Your comments will help AI generate reports that better meet expectations', '您的意见将帮助AI生成更符合预期的报告', lang)}
              </p>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex-none p-4 flex justify-between items-center gap-4 border-t border-gray-700/50">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={hasGenerated ? handleRegenerate : () => generateReport()}
                  disabled={!solution || isGenerating}
                  className="bg-[#5157E8] text-white px-8 py-3 rounded-full shadow-lg text-base font-medium hover:bg-[#3a3fa0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? t('Generating...', '生成中...', lang) : hasGenerated ? t('Regenerate', '重新生成', lang) : t('Generate Report', '生成报告', lang)}
                </button>
                <span className="text-xs text-gray-500">{t('~2-5 min', '约 2-5 分钟', lang)}</span>
              </div>
              {hasGenerated && !isGenerating && (
                <span className="text-xs text-gray-500">{t('Change style/format above, then click to regenerate', '可修改上方风格和格式后点击重新生成', lang)}</span>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={!hasGenerated || isGenerating}
              className="bg-gray-600 text-white px-6 py-2.5 rounded-full text-base hover:bg-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Complete', '完成', lang)}
            </button>
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
