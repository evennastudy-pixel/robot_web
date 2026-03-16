"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WorkshopNavigation from '@/components/WorkshopNavigation';
import { useLanguage, t } from '@/hooks/useLanguage';
import axios from 'axios';

// 主题数据接口（与原来的FutureSignal结构保持一致）
interface ThemeData {
  id: number | 'custom';
  sign: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  intro?: string;
  introEn?: string;
  introQuote?: string;
  introQuoteEn?: string;
  detail: string;
  thumbnail: string; // 左侧卡片图片
  detailImage: string; // 右侧详情图片
  coreQuestion?: string;
  coreQuestionEn?: string;
  keywords: string[];
  keywordsEn: string[];
  designDirections: string[];
  designDirectionsEn: string[];
  isCustom?: boolean; // 是否为自定义议题
}

// 机器人设计主题 + 自定义议题
const THEMES_DATA: ThemeData[] = [
  {
    id: 1,
    sign: "Theme 1",
    title: "服务机器人人机交互设计",
    titleEn: "Service Robot Human-Computer Interaction Design",
    summary: "如何在日常生活场景中设计自然、高效的服务机器人交互体验？",
    summaryEn: "How to design natural and efficient service robot interaction experiences in daily life scenarios?",
    coreQuestion: "如何在日常生活场景中设计自然、高效的服务机器人交互体验？",
    coreQuestionEn: "How to design natural and efficient service robot interaction experiences in daily life scenarios?",
    intro: "服务机器人正快速进入餐饮、酒店、零售等领域。本主题探讨如何通过语音、手势、界面等多元交互方式，让机器人与用户建立流畅的沟通。",
    introEn: "Service robots are rapidly entering catering, hotels, retail and other fields. This theme explores how to establish fluent communication between robots and users through voice, gesture, interface and other interaction methods.",
    introQuote: "关注「多模态交互」「任务引导」「情感反馈」「适老化设计」等方向",
    introQuoteEn: "Focus on 'Multimodal Interaction', 'Task Guidance', 'Emotional Feedback', 'Age-friendly Design' and other directions",
    detail: "设计方向：\n• 多模态自然语言交互\n• 任务流程可视化引导\n• 情感化反馈与状态呈现\n• 适老化与无障碍设计\n\n关键词：多模态交互 Multimodal Interaction、任务引导 Task Guidance、情感反馈 Emotional Feedback、适老化设计 Age-friendly Design",
    thumbnail: "/images/future-signals/1.png",
    detailImage: "/images/future-signals/1.png",
    keywords: ["多模态交互", "任务引导", "情感反馈", "适老化设计"],
    keywordsEn: ["Multimodal Interaction", "Task Guidance", "Emotional Feedback", "Age-friendly Design"],
    designDirections: ["多模态自然语言交互", "任务流程可视化引导", "情感化反馈与状态呈现", "适老化与无障碍设计"],
    designDirectionsEn: ["Multimodal Natural Language Interaction", "Visual Task Flow Guidance", "Emotional Feedback & Status Display", "Age-friendly & Accessible Design"]
  },
  {
    id: 2,
    sign: "Theme 2",
    title: "工业协作机器人安全与效率",
    titleEn: "Industrial Collaborative Robot Safety & Efficiency",
    summary: "如何平衡人机协作中的安全性与生产效率？",
    summaryEn: "How to balance safety and production efficiency in human-robot collaboration?",
    coreQuestion: "如何平衡人机协作中的安全性与生产效率？",
    coreQuestionEn: "How to balance safety and production efficiency in human-robot collaboration?",
    intro: "协作机器人在工厂流水线中与工人共享空间。本主题探索如何通过设计优化人机共处的安全边界、作业流程和认知负荷。",
    introEn: "Collaborative robots share space with workers on factory assembly lines. This theme explores how to optimize safety boundaries, workflow and cognitive load in human-robot co-working through design.",
    introQuote: "关注「安全边界」「作业流程」「认知负荷」「数字孪生」等方向",
    introQuoteEn: "Focus on 'Safety Boundaries', 'Workflow Design', 'Cognitive Load', 'Digital Twin' and other directions",
    detail: "设计方向：\n• 安全区域可视化与预警\n• 人机任务分配与流程优化\n• 操作界面简化与认知减负\n• 数字孪生仿真与培训\n\n关键词：安全边界 Safety Boundaries、作业流程 Workflow、认知负荷 Cognitive Load、数字孪生 Digital Twin",
    thumbnail: "/images/future-signals/2.png",
    detailImage: "/images/future-signals/2.png",
    keywords: ["安全边界", "作业流程", "认知负荷", "数字孪生"],
    keywordsEn: ["Safety Boundaries", "Workflow Design", "Cognitive Load", "Digital Twin"],
    designDirections: ["安全区域可视化与预警", "人机任务分配与流程优化", "操作界面简化与认知减负", "数字孪生仿真与培训"],
    designDirectionsEn: ["Safety Zone Visualization & Alert", "Task Allocation & Workflow Optimization", "Interface Simplification & Cognitive Reduction", "Digital Twin Simulation & Training"]
  },
  {
    id: 3,
    sign: "Theme 3",
    title: "医疗康复机器人体验设计",
    titleEn: "Medical Rehabilitation Robot Experience Design",
    summary: "如何设计兼具疗效与人文关怀的康复机器人体验？",
    summaryEn: "How to design rehabilitation robot experiences that combine therapeutic effect with humanistic care?",
    coreQuestion: "如何设计兼具疗效与人文关怀的康复机器人体验？",
    coreQuestionEn: "How to design rehabilitation robot experiences that combine therapeutic effect with humanistic care?",
    intro: "康复机器人在肢体训练、认知康复等领域应用广泛。本主题探讨如何将临床数据、患者反馈与情感设计结合，提升康复过程的参与度和信心。",
    introEn: "Rehabilitation robots are widely used in physical training and cognitive rehabilitation. This theme explores how to combine clinical data, patient feedback and emotional design to improve engagement and confidence in the rehabilitation process.",
    introQuote: "关注「游戏化康复」「进度可视化」「情感陪伴」「家庭场景适配」等方向",
    introQuoteEn: "Focus on 'Gamified Rehabilitation', 'Progress Visualization', 'Emotional Companion', 'Home Scenario Adaptation' and other directions",
    detail: "设计方向：\n• 游戏化康复训练设计\n• 进度与疗效可视化\n• 情感陪伴与激励机制\n• 家庭场景适配与远程监护\n\n关键词：游戏化康复 Gamified Rehabilitation、进度可视化 Progress Visualization、情感陪伴 Emotional Companion、家庭适配 Home Adaptation",
    thumbnail: "/images/future-signals/3.png",
    detailImage: "/images/future-signals/3.png",
    keywords: ["游戏化康复", "进度可视化", "情感陪伴", "家庭适配"],
    keywordsEn: ["Gamified Rehabilitation", "Progress Visualization", "Emotional Companion", "Home Adaptation"],
    designDirections: ["游戏化康复训练设计", "进度与疗效可视化", "情感陪伴与激励机制", "家庭场景适配与远程监护"],
    designDirectionsEn: ["Gamified Rehabilitation Training", "Progress & Efficacy Visualization", "Emotional Companion & Motivation", "Home Scenario Adaptation & Remote Monitoring"]
  },
  {
    id: 4,
    sign: "Theme 4",
    title: "教育陪伴机器人情感设计",
    titleEn: "Educational Companion Robot Emotional Design",
    summary: "如何设计能建立信任与情感连接的儿童教育机器人？",
    summaryEn: "How to design educational robots for children that can establish trust and emotional connection?",
    coreQuestion: "如何设计能建立信任与情感连接的儿童教育机器人？",
    coreQuestionEn: "How to design educational robots for children that can establish trust and emotional connection?",
    intro: "教育机器人正在成为儿童学习与陪伴的伙伴。本主题探索如何通过外观、语音、行为设计，让机器人获得儿童的信任并激发学习兴趣。",
    introEn: "Educational robots are becoming companions for children's learning. This theme explores how to gain children's trust and stimulate learning interest through appearance, voice and behavior design.",
    introQuote: "关注「拟人化设计」「信任建立」「学习动机」「隐私与伦理」等方向",
    introQuoteEn: "Focus on 'Anthropomorphic Design', 'Trust Building', 'Learning Motivation', 'Privacy & Ethics' and other directions",
    detail: "设计方向：\n• 拟人化外观与表情设计\n• 信任建立与情感回应机制\n• 游戏化学习与动机激发\n• 儿童隐私与伦理边界\n\n关键词：拟人化设计 Anthropomorphic Design、信任建立 Trust Building、学习动机 Learning Motivation、隐私伦理 Privacy & Ethics",
    thumbnail: "/images/future-signals/4.png",
    detailImage: "/images/future-signals/4.png",
    keywords: ["拟人化设计", "信任建立", "学习动机", "隐私伦理"],
    keywordsEn: ["Anthropomorphic Design", "Trust Building", "Learning Motivation", "Privacy & Ethics"],
    designDirections: ["拟人化外观与表情设计", "信任建立与情感回应机制", "游戏化学习与动机激发", "儿童隐私与伦理边界"],
    designDirectionsEn: ["Anthropomorphic Appearance & Expression", "Trust Building & Emotional Response", "Gamified Learning & Motivation", "Children's Privacy & Ethical Boundaries"]
  },
  {
    id: 5,
    sign: "Theme 5",
    title: "智能家居机器人场景设计",
    titleEn: "Smart Home Robot Scenario Design",
    summary: "如何设计无缝融入家庭生活的智能机器人服务场景？",
    summaryEn: "How to design smart robot service scenarios that seamlessly integrate into family life?",
    coreQuestion: "如何设计无缝融入家庭生活的智能机器人服务场景？",
    coreQuestionEn: "How to design smart robot service scenarios that seamlessly integrate into family life?",
    intro: "扫地机器人、智能音箱等已进入千家万户。本主题探讨如何通过场景化设计，让家居机器人在清洁、安防、陪伴等场景中自然融入，提升生活品质。",
    introEn: "Sweeping robots and smart speakers have entered millions of households. This theme explores how to naturally integrate home robots into cleaning, security, companionship and other scenarios through scenario-based design.",
    introQuote: "关注「场景适配」「多设备协同」「隐私保护」「被动服务与主动服务」等方向",
    introQuoteEn: "Focus on 'Scenario Adaptation', 'Multi-device Collaboration', 'Privacy Protection', 'Passive vs Active Service' and other directions",
    detail: "设计方向：\n• 家庭场景智能感知与适配\n• 多设备协同与统一控制\n• 隐私保护与数据透明\n• 被动响应与主动服务的平衡\n\n关键词：场景适配 Scenario Adaptation、多设备协同 Multi-device Collaboration、隐私保护 Privacy Protection、主动服务 Proactive Service",
    thumbnail: "/images/future-signals/5.png",
    detailImage: "/images/future-signals/5.png",
    keywords: ["场景适配", "多设备协同", "隐私保护", "主动服务"],
    keywordsEn: ["Scenario Adaptation", "Multi-device Collaboration", "Privacy Protection", "Proactive Service"],
    designDirections: ["家庭场景智能感知与适配", "多设备协同与统一控制", "隐私保护与数据透明", "被动响应与主动服务的平衡"],
    designDirectionsEn: ["Home Scenario Sensing & Adaptation", "Multi-device Collaboration & Unified Control", "Privacy Protection & Data Transparency", "Balance of Passive & Active Service"]
  },
  {
    id: 6,
    sign: "Theme 6",
    title: "农业机器人精准作业设计",
    titleEn: "Agricultural Robot Precision Operation Design",
    summary: "如何在复杂田间环境中设计高效、精准的农业机器人作业系统？",
    summaryEn: "How to design efficient and precise agricultural robot operation systems in complex field environments?",
    coreQuestion: "如何在复杂田间环境中设计高效、精准的农业机器人作业系统？",
    coreQuestionEn: "How to design efficient and precise agricultural robot operation systems in complex field environments?",
    intro: "农业机器人在播种、喷洒、采摘等环节逐步替代人力。本主题探讨如何通过路径规划、视觉识别、作业精度等设计，提升农业机器人在非结构化环境中的可靠性与效率。",
    introEn: "Agricultural robots are gradually replacing human labor in sowing, spraying, and harvesting. This theme explores how to improve reliability and efficiency in unstructured environments through path planning, visual recognition, and operation precision design.",
    introQuote: "关注「路径规划」「视觉识别」「作业精度」「多机协同」等方向",
    introQuoteEn: "Focus on 'Path Planning', 'Visual Recognition', 'Operation Precision', 'Multi-robot Coordination' and other directions",
    detail: "设计方向：\n• 非结构化地形路径规划与避障\n• 作物识别与精准作业定位\n• 作业质量与效率的平衡设计\n• 多机协同与调度优化\n\n关键词：路径规划 Path Planning、视觉识别 Visual Recognition、作业精度 Operation Precision、多机协同 Multi-robot Coordination",
    thumbnail: "/images/future-signals/6.png",
    detailImage: "/images/future-signals/6.png",
    keywords: ["路径规划", "视觉识别", "作业精度", "多机协同"],
    keywordsEn: ["Path Planning", "Visual Recognition", "Operation Precision", "Multi-robot Coordination"],
    designDirections: ["非结构化地形路径规划与避障", "作物识别与精准作业定位", "作业质量与效率的平衡设计", "多机协同与调度优化"],
    designDirectionsEn: ["Path Planning & Obstacle Avoidance in Unstructured Terrain", "Crop Recognition & Precision Operation", "Balance of Quality & Efficiency", "Multi-robot Coordination & Scheduling"]
  },
  {
    id: 7,
    sign: "Theme 7",
    title: "物流仓储机器人协作效率",
    titleEn: "Logistics & Warehouse Robot Collaboration Efficiency",
    summary: "如何设计高密度仓储场景下的机器人调度与协作系统？",
    summaryEn: "How to design robot scheduling and collaboration systems in high-density warehouse scenarios?",
    coreQuestion: "如何设计高密度仓储场景下的机器人调度与协作系统？",
    coreQuestionEn: "How to design robot scheduling and collaboration systems in high-density warehouse scenarios?",
    intro: "仓储物流机器人已广泛应用于电商、制造业仓储。本主题探讨如何通过调度算法、路径优化、人机配合等设计，在有限空间内最大化拣货与配送效率。",
    introEn: "Warehouse logistics robots are widely used in e-commerce and manufacturing. This theme explores how to maximize picking and delivery efficiency in limited space through scheduling algorithms, path optimization, and human-robot coordination design.",
    introQuote: "关注「调度算法」「路径优化」「人机配合」「订单履约」等方向",
    introQuoteEn: "Focus on 'Scheduling Algorithm', 'Path Optimization', 'Human-Robot Coordination', 'Order Fulfillment' and other directions",
    detail: "设计方向：\n• 动态调度与任务分配算法\n• 高密度环境路径避碰优化\n• 人机混合作业区安全设计\n• 订单履约时效与准确率平衡\n\n关键词：调度算法 Scheduling、路径优化 Path Optimization、人机配合 Human-Robot Coordination、订单履约 Order Fulfillment",
    thumbnail: "/images/future-signals/7.png",
    detailImage: "/images/future-signals/7.png",
    keywords: ["调度算法", "路径优化", "人机配合", "订单履约"],
    keywordsEn: ["Scheduling Algorithm", "Path Optimization", "Human-Robot Coordination", "Order Fulfillment"],
    designDirections: ["动态调度与任务分配算法", "高密度环境路径避碰优化", "人机混合作业区安全设计", "订单履约时效与准确率平衡"],
    designDirectionsEn: ["Dynamic Scheduling & Task Allocation", "Path & Collision Avoidance in Dense Environments", "Human-Robot Mixed Zone Safety Design", "Balance of Fulfillment Speed & Accuracy"]
  },
  {
    id: 8,
    sign: "Theme 8",
    title: "城市公共服务机器人系统",
    titleEn: "Urban Public Service Robot Systems",
    summary: "如何在城市公共空间中设计协同工作的服务机器人体系？",
    summaryEn: "How to design a coordinated system of service robots in urban public spaces?",
    coreQuestion: "如何在城市公共空间中，让多种服务机器人协同工作，同时兼顾安全、效率与市民体验？",
    coreQuestionEn: "How can multiple service robots work together in urban public spaces while balancing safety, efficiency, and citizen experience?",
    intro: "在商场、地铁站、医院大厅、政务服务中心等公共空间中，清洁、引导、巡逻、咨询等功能型机器人正在逐步出现。本主题聚焦于从“单个设备”走向“城市级机器人系统”，思考如何设计统一的体验和协作机制。",
    introEn: "In public spaces such as malls, subway stations, hospital lobbies and government service centers, functional robots for cleaning, guidance, patrolling and information are emerging. This theme focuses on moving from individual devices to an \"urban-scale robot system\" with unified experience and collaboration mechanisms.",
    introQuote: "关注「多角色协同」「公共安全」「无障碍导航」「多终端一体化体验」等方向",
    introQuoteEn: "Focus on 'Multi-role Collaboration', 'Public Safety', 'Accessible Navigation', 'Multi-terminal Integrated Experience' and other directions",
    detail: "设计方向：\n• 商场 / 地铁 / 医院场景中的多机器人角色分工与协同\n• 面向老人、儿童、残障人士的无障碍导航与引导体验\n• 与城市摄像头、传感器、信息屏的联动设计\n• 公共安全与隐私保护边界的交互呈现\n\n关键词：多角色协同 Multi-role Collaboration、公共服务 Public Service、无障碍导航 Accessible Navigation、城市物联网 Urban IoT",
    thumbnail: "/images/future-signals/8.png",
    detailImage: "/images/future-signals/8.png",
    keywords: ["多角色协同", "公共服务", "无障碍导航", "城市物联网"],
    keywordsEn: ["Multi-role Collaboration", "Public Service", "Accessible Navigation", "Urban IoT"],
    designDirections: [
      "商场 / 地铁 / 医院一体化公共服务机器人系统",
      "面向特殊人群的无障碍导航与陪伴机器人",
      "与城市物联网设施联动的实时信息服务",
      "公共空间中机器人行为规范与安全反馈设计"
    ],
    designDirectionsEn: [
      "Integrated public service robot systems for malls / metro / hospitals",
      "Accessible navigation and companion robots for vulnerable groups",
      "Real-time information services linked with urban IoT infrastructure",
      "Behavior norms and safety feedback design for robots in public spaces"
    ]
  },
  {
    id: 'custom',
    sign: "Custom",
    title: "自定义议题",
    titleEn: "Custom Theme",
    summary: "输入您想探索的设计议题",
    summaryEn: "Enter your own design topic",
    coreQuestion: '',
    coreQuestionEn: '',
    intro: '',
    introEn: '',
    detail: '',
    thumbnail: "/images/future-signals/4.png",
    detailImage: "/images/future-signals/8.png",
    keywords: [],
    keywordsEn: [],
    designDirections: [],
    designDirectionsEn: [],
    isCustom: true
  }
];

export default function FutureSignalsPage() {
  const router = useRouter();
  const lang = useLanguage();
  
  const steps = [
    { id: 1, label: t('Theme Selection', '主题选择', lang), path: '/theme-selection', current: true },
    { id: 2, label: t('AI Collaboration', 'AI协作', lang), path: '/ai-collaboration' },
    { id: 3, label: t('Solution Review', '方案回顾', lang), path: '/solution-review' },
    { id: 4, label: t('Visual Assets', '视觉素材', lang), path: '/visual-assets' },
  ];
  const [futureSignals, setFutureSignals] = useState<ThemeData[]>([]);
  // 默认选中第一个机器人主题（id: 1）
  const [selectedId, setSelectedId] = useState<number | 'custom'>(1);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // 直接使用静态数据，不再从CSV加载
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 模拟异步加载
        await new Promise(resolve => setTimeout(resolve, 100));
        setFutureSignals(THEMES_DATA);
        
        // 尝试从localStorage恢复之前选择的主题
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme) {
          try {
            const theme = JSON.parse(savedTheme);
            // 如果历史里的 id 在新列表中不存在，则退回到 1
            const exists = THEMES_DATA.some(t => t.id === theme.id);
            setSelectedId(exists ? theme.id : 1);
            if (theme.id === 'custom' && theme.title) setCustomTopic(theme.title);
          } catch (e) {
            console.error('Error parsing saved theme:', e);
            setSelectedId(1);
          }
        } else {
          setSelectedId(1);
        }
      } catch (err) {
        console.error('Failed to load themes:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 注释掉自动清除数据的逻辑，改为永久保存
  // useEffect(() => {
  //   // 页面卸载时不清空数据，保持数据持久化
  //   const handleUnload = () => {
  //     localStorage.removeItem('selectedFutureSignal');
  //     localStorage.removeItem('selectedLocalChallenge');
  //     localStorage.removeItem('interpretationData');
  //     localStorage.removeItem('selectedTheme');
  //   };
  //
  //   window.addEventListener('beforeunload', handleUnload);
  //
  //   return () => {
  //     window.removeEventListener('beforeunload', handleUnload);
  //   };
  // }, []);

  const baseSelected = futureSignals.find(item => item.id === selectedId);
  const selected = selectedId === 'custom' && customTopic.trim()
    ? { ...baseSelected!, title: customTopic.trim(), titleEn: customTopic.trim(), summary: customTopic.trim(), summaryEn: customTopic.trim(), coreQuestion: customTopic.trim(), coreQuestionEn: customTopic.trim(), keywords: [customTopic.trim()], keywordsEn: [customTopic.trim()], designDirections: [] as string[], designDirectionsEn: [] as string[] }
    : selectedId === 'custom' ? baseSelected : baseSelected;

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">{t('Loading...', '加载中...', lang)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* 导航按钮 */}
      <WorkshopNavigation previousPage="/workshop" />
      
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
                  ${step.current ? 'bg-[#5157E8] shadow-lg' : 'bg-[#B3B8D8]'} transition-all duration-300`}
              >
                {step.id}
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
      <div className="flex-1 flex px-8 gap-8 w-full min-h-0 py-6 pb-8">
        {/* 左侧视图区 */}
        <div className="w-1/2 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-lg flex flex-col border border-gray-800">
          {/* 标题 */}
          <div className="flex-none p-4 border-b border-gray-700/50">
            <span className="text-xl font-bold text-[#5157E8]">{t('Design Themes', '设计主题', lang)}</span>
          </div>
          {/* Gallery视图内容 - 紧凑布局，可滚动 */}
          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            <div className="w-full">
              <div className="grid grid-cols-3 gap-3">
                {futureSignals.map((item) => (
                  <div
                    key={String(item.id)}
                    className={`cursor-pointer border-2 rounded-xl bg-gray-800/90 p-0 flex flex-col transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg ${
                      selectedId === item.id ? 'border-[#5157E8] ring-2 ring-[#5157E8]/50 shadow-lg' : 'border-gray-700 hover:border-[#5157E8]/50'
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {/* 顶部色块 */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r from-[#5157E8] to-[#3a3fa0]">
                      <div className="text-[10px] text-white font-medium whitespace-nowrap truncate">{item.sign}</div>
                      <span className="text-white text-xs">&gt;</span>
                    </div>
                    {/* 主题图片 - 缩小 */}
                    <div className="w-full h-16 overflow-hidden bg-gray-100">
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* 标题 */}
                    <div className="px-2 pt-1 pb-0.5">
                      <div className="text-[11px] font-semibold text-[#E5E7FF] leading-tight line-clamp-2">{lang === 'zh' ? item.title : item.titleEn}</div>
                    </div>
                    {/* 简介 */}
                    <div className="px-2 pb-1.5">
                      <div className="text-gray-400 text-[10px] leading-snug line-clamp-3">
                        {lang === 'zh' ? item.summary : item.summaryEn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* 右侧详情区 */}
        <div className="w-1/2 bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-lg flex flex-col border border-gray-800">
          {/* 标题 */}
          <div className="flex-none p-4 border-b border-gray-700/50">
            <span className="text-xl font-bold text-[#5157E8]">{t('Theme Details', '主题详情', lang)}</span>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* 主题详情 */}
            {selectedId === 'custom' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white bg-gradient-to-r from-[#5157E8] to-[#3a3fa0] rounded-full px-3 py-1.5 whitespace-nowrap">
                    {lang === 'zh' ? '自定义' : 'Custom'}
                  </span>
                  <span className="text-xl font-bold text-[#5157E8]">{lang === 'zh' ? '自定义议题' : 'Custom Theme'}</span>
                </div>
                <p className="text-gray-400 text-sm">{lang === 'zh' ? '请输入您想探索的设计议题或方向：' : 'Enter your design topic or direction to explore:'}</p>
                <textarea
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={lang === 'zh' ? '例如：仓储物流机器人分拣效率优化、餐厅送餐机器人路径规划体验...' : 'e.g.: Warehouse robot sorting efficiency, restaurant delivery robot path planning...'}
                  className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-[#5157E8] focus:ring-2 focus:ring-[#5157E8]/30 outline-none resize-none text-sm"
                  maxLength={200}
                />
                <p className="text-gray-500 text-xs">{customTopic.length}/200</p>
              </div>
            ) : selected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white bg-gradient-to-r from-[#5157E8] to-[#3a3fa0] rounded-full px-3 py-1.5 whitespace-nowrap">
                    {selected.sign}
                  </span>
                  <span className="text-xl font-bold text-[#5157E8]">{lang === 'zh' ? selected.title : selected.titleEn}</span>
                </div>
                <div className="text-sm text-gray-400 italic">{lang === 'zh' ? selected.titleEn : selected.title}</div>
                
                {/* 主题大图 */}
                <div className="w-full h-36 rounded-lg overflow-hidden shadow-md bg-black">
                  <img 
                    src={selected.detailImage} 
                    alt={selected.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="text-gray-300 text-sm leading-relaxed">{lang === 'zh' ? selected.summary : selected.summaryEn}</div>
                {selected.intro && (
                  <div className="text-gray-400 text-sm leading-relaxed">{lang === 'zh' ? selected.intro : selected.introEn}</div>
                )}
                {selected.introQuote && (
                  <div className="text-gray-400 text-sm italic border-l-4 border-[#5157E8] pl-3 py-2 bg-gray-800 rounded-r-lg">
                    {lang === 'zh' ? selected.introQuote : selected.introQuoteEn}
                  </div>
                )}
                {selected.keywords && selected.keywords.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-white mb-2">🔑 {t('Keywords', '关键词', lang)}</div>
                    <div className="flex flex-wrap gap-2">
                      {(lang === 'zh' ? selected.keywords : selected.keywordsEn).map((kw, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-blue-900/60 text-blue-300 text-xs rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.designDirections && selected.designDirections.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-white mb-2">🎯 {t('Design Directions', '设计方向', lang)}</div>
                    <div className="space-y-1.5">
                      {(lang === 'zh' ? selected.designDirections : selected.designDirectionsEn).map((dir, idx) => (
                        <div key={idx} className="text-xs text-gray-300 flex items-start">
                          <span className="mr-1.5">•</span>
                          <span>{dir}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">{t('Please select a theme on the left', '请在左侧选择一个主题', lang)}</div>
            )}

            {/* 用户素材输入 + 未来信号分析 */}
            <div className="mt-2 pt-4 border-t border-gray-700/60 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                🔍 {t('Refine Future Signal', '分析并提炼未来信号', lang)}
              </h3>
              <p className="text-xs text-gray-400">
                {t(
                  'Paste your collected materials (cases, observations, data, etc.) here. AI will combine them with the current theme to generate a more focused future signal/topic, and you can freely edit the result.',
                  '在这里粘贴你收集到的素材（案例、观察、数据等），AI 会结合当前主题，帮你生成一个更聚焦的未来信号 / 选题，你也可以在结果里继续自由编辑。',
                  lang
                )}
              </p>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder={
                  lang === 'zh'
                    ? '例如：\n- 最近看到某某场景中已经在使用送餐机器人…\n- 观察到老人对服务机器人存在哪些担忧或期待…\n- 收集到的行业报告中的关键数据…'
                    : 'For example:\n- Cases where service robots are already used…\n- Observations about user concerns/expectations…\n- Key data points from industry reports…'
                }
                className="w-full h-28 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[#5157E8] focus:ring-2 focus:ring-[#5157E8]/30 outline-none text-xs resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isAnalyzing || !userNotes.trim() || !selected}
                  onClick={async () => {
                    if (!selected) return;
                    setIsAnalyzing(true);
                    try {
                      const res = await axios.post('/api/theme-future-signal', {
                        theme: selected,
                        userNotes,
                        lang,
                      });
                      if (res.data?.success && res.data.raw) {
                        setAnalysisResult(res.data.raw);
                      } else {
                        alert(
                          (lang === 'zh' ? '分析失败: ' : 'Failed to analyze: ') +
                            (res.data?.error || (lang === 'zh' ? '请稍后重试' : 'Please try again later'))
                        );
                      }
                    } catch (err: any) {
                      console.error('analyze future signal error', err);
                      const msg =
                        err?.response?.data?.error ||
                        (lang === 'zh' ? '请检查 DEEPSEEK_API_KEY 配置后重试' : 'Please check DEEPSEEK_API_KEY config and try again');
                      alert((lang === 'zh' ? '分析失败: ' : 'Failed to analyze: ') + msg);
                    } finally {
                      setIsAnalyzing(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isAnalyzing || !userNotes.trim() || !selected
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-[#5157E8] text-white hover:bg-[#3a3fa0] shadow'
                  }`}
                >
                  {isAnalyzing
                    ? t('Analyzing...', '正在分析...', lang)
                    : t('Analyze Future Signal', '分析未来信号', lang)}
                </button>
                <span className="text-[10px] text-gray-500">
                  {t('AI will generate an editable draft', 'AI 将生成一份可自行修改的草稿', lang)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white">
                    ✏️ {t('Future Signal Draft', '未来信号草稿（可编辑）', lang)}
                  </span>
                  {analysisResult && (
                    <button
                      type="button"
                      className="text-[10px] text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
                      onClick={() => setAnalysisResult('')}
                    >
                      {t('Clear', '清空', lang)}
                    </button>
                  )}
                </div>
                <textarea
                  value={analysisResult}
                  onChange={(e) => setAnalysisResult(e.target.value)}
                  placeholder={
                    lang === 'zh'
                      ? '点击「分析未来信号」后，这里会出现一份可编辑的未来信号草稿。你可以在此基础上自由增删、修改。'
                      : 'After clicking \"Analyze Future Signal\", an editable draft will appear here. You can freely refine it.'
                  }
                  className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[#5157E8] focus:ring-2 focus:ring-[#5157E8]/30 outline-none text-xs resize-none"
                />
              </div>
            </div>
          </div>
          {/* 底部确认按钮 */}
          <div className="flex-none p-4 flex justify-end">
            <button
              disabled={selectedId === 'custom' && !customTopic.trim()}
              className={`px-8 py-3 rounded-full shadow-lg text-base font-medium transition-all ${
                selectedId === 'custom' && !customTopic.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#5157E8] text-white hover:bg-[#3a3fa0] hover:shadow-xl'
              }`}
              onClick={() => {
                const themeToSave = selectedId === 'custom' && customTopic.trim()
                  ? { id: 'custom', title: customTopic.trim(), titleEn: customTopic.trim(), description: customTopic.trim(), coreQuestion: customTopic.trim(), keywords: [customTopic.trim()], designDirections: [] }
                  : selected ? { id: selected.id, title: selected.title, description: selected.summary, titleEn: selected.titleEn, coreQuestion: selected.coreQuestion, keywords: selected.keywords, designDirections: selected.designDirections } : null;
                if (themeToSave) {
                  const previousTheme = localStorage.getItem('selectedTheme');
                  const isThemeChanged = previousTheme && JSON.parse(previousTheme).id !== themeToSave.id;
                  localStorage.setItem('selectedFutureSignal', JSON.stringify(themeToSave));
                  localStorage.setItem('selectedTheme', JSON.stringify(themeToSave));
                  if (isThemeChanged) {
                    localStorage.removeItem('completeSolution');
                    sessionStorage.removeItem('solutionConversation');
                    localStorage.setItem('workshopProgress', JSON.stringify(['theme']));
                  } else {
                    const progress = JSON.parse(localStorage.getItem('workshopProgress') || '[]');
                    if (!progress.includes('theme')) progress.push('theme');
                    localStorage.setItem('workshopProgress', JSON.stringify(progress));
                  }
                }
                router.push('/workshop');
              }}
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
