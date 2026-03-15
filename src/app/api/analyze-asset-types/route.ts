import { NextRequest, NextResponse } from 'next/server';

// 素材类型定义
interface AssetType {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  recommended: boolean;
  keywords: string[]; // 用于匹配的关键词
}

// 所有可用的素材类型（优化后，只保留需要视觉展示的类型）
const ALL_ASSET_TYPES: AssetType[] = [
  {
    id: 'poster',
    name: '项目海报',
    nameEn: 'Project Poster',
    icon: '🎨',
    description: '宣传用主视觉，包含项目名称和核心概念',
    descriptionEn: 'Main visual for promotion, with project name and core concepts',
    recommended: true, // 默认总是推荐
    keywords: []
  },
  {
    id: 'ui_design',
    name: '界面设计',
    nameEn: 'UI Design',
    icon: '📱',
    description: '软件/应用的界面设计稿',
    descriptionEn: 'Interface design mockups for software/applications',
    recommended: false,
    keywords: ['软件', '应用', 'app', 'UI', '界面', '系统', '平台', '网页', 'web', 'mobile', '交互', '界面设计', '用户界面', '屏幕', '显示']
  },
  {
    id: 'space_render',
    name: '空间渲染',
    nameEn: 'Space Rendering',
    icon: '🏗️',
    description: '空间/环境的3D效果图',
    descriptionEn: '3D renderings of spaces/environments',
    recommended: false,
    keywords: ['空间', '环境', '建筑', '场所', '空间站', '舱室', '布局', '室内', '设施', '空间设计', '环境设计', '场景']
  },
  {
    id: 'installation',
    name: '装置展示',
    nameEn: 'Installation Display',
    icon: '🎪',
    description: '装置艺术或实体装置的效果图',
    descriptionEn: 'Renderings of art installations or physical installations',
    recommended: false,
    keywords: ['装置', '艺术装置', '装置艺术', '实体', '装置作品', '艺术品', '雕塑', '物理']
  },
  {
    id: 'product_display',
    name: '产品展示',
    nameEn: 'Product Display',
    icon: '📦',
    description: '产品/设备的渲染图',
    descriptionEn: 'Product/device renderings',
    recommended: false,
    keywords: ['产品', '设备', '工具', '器械', '硬件', '物品', '产品设计', '工业设计', '设备设计']
  },
  {
    id: 'use_case',
    name: '使用场景',
    nameEn: 'Use Case',
    icon: '👥',
    description: '用户使用场景展示',
    descriptionEn: 'User use case scenarios',
    recommended: false,
    keywords: ['使用', '体验', '场景', '用户', '人机', '互动', '操作', '应用场景', '使用情境']
  }
];

// 分析方案内容并推荐素材类型（优化版）
function analyzeAndRecommend(solution: any): AssetType[] {
  const results: AssetType[] = [];
  
  // 将方案内容转换为文本进行分析
  const textContent = [
    solution.projectName || '',
    solution.projectNameEn || '',
    solution.coreDescription || '',
    solution.coreConcepts || '',
    solution.coreProblem || '',
    solution.designInsight || '',
    solution.technicalImplementation || '',
    solution.applicationScenario || '',
    solution.potentialImpact || '',
    ...(solution.keywords || []),
    ...(solution.designMethods?.map((m: any) => m.method || m) || [])
  ].join(' ').toLowerCase();
  
  console.log('📊 分析方案内容...');
  console.log('📝 文本长度:', textContent.length);
  
  // 计算每种素材类型的相关性得分
  const scoredTypes = ALL_ASSET_TYPES.map(assetType => {
    // 项目海报总是推荐
    if (assetType.id === 'poster') {
      return { ...assetType, score: 1000, recommended: true };
    }
    
    // 计算关键词匹配得分
    let score = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of assetType.keywords) {
      if (textContent.includes(keyword.toLowerCase())) {
        score++;
        matchedKeywords.push(keyword);
      }
    }
    
    // 如果匹配到3个或更多关键词，认为高度相关
    const recommended = score >= 3;
    
    if (score > 0) {
      console.log(`  ${assetType.icon} ${assetType.name}: ${score}分 ${recommended ? '✅ 推荐' : ''}`);
      if (matchedKeywords.length > 0) {
        console.log(`    匹配: ${matchedKeywords.slice(0, 3).join(', ')}${matchedKeywords.length > 3 ? '...' : ''}`);
      }
    }
    
    return {
      ...assetType,
      score: score,
      recommended: recommended
    };
  });
  
  // 按得分排序
  scoredTypes.sort((a, b) => b.score - a.score);
  
  // 海报 + 最多2个最相关的类型
  const recommendedTypes = scoredTypes.filter(t => t.recommended);
  
  // 如果推荐的类型少于2个（除了海报），补充得分最高的
  if (recommendedTypes.length < 3) {
    const needed = 3 - recommendedTypes.length;
    const candidates = scoredTypes
      .filter(t => !t.recommended && t.score > 0)
      .slice(0, needed);
    
    candidates.forEach(c => {
      c.recommended = true;
      console.log(`  ➕ 补充推荐 ${c.name} (得分: ${c.score})`);
    });
  }
  
  // 如果推荐的类型超过3个，只保留海报+得分最高的2个
  const finalRecommended = scoredTypes.filter(t => t.recommended);
  if (finalRecommended.length > 3) {
    // 保留海报
    const poster = finalRecommended.find(t => t.id === 'poster');
    // 保留得分最高的2个（除了海报）
    const topTwo = finalRecommended
      .filter(t => t.id !== 'poster')
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    
    // 重新设置recommended标志
    scoredTypes.forEach(t => {
      if (t.id === 'poster') {
        t.recommended = true;
      } else {
        t.recommended = topTwo.some(top => top.id === t.id);
      }
    });
    
    console.log('  🎯 限制推荐数量为3个');
  }
  
  const finalCount = scoredTypes.filter(t => t.recommended).length;
  console.log(`✅ 最终推荐 ${finalCount} 种素材类型\n`);
  
  // 移除临时的score属性
  return scoredTypes.map(({ score, ...rest }) => rest);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { solution } = body;
    
    if (!solution) {
      return NextResponse.json(
        { error: '缺少方案数据' },
        { status: 400 }
      );
    }
    
    console.log('\n🔍 分析素材类型需求...');
    console.log(`项目: ${solution.projectName || '未命名'}`);
    
    // 分析并推荐素材类型
    const assetTypes = analyzeAndRecommend(solution);
    
    const recommendedCount = assetTypes.filter(t => t.recommended).length;
    console.log(`✅ 完成分析，推荐 ${recommendedCount} 种素材类型\n`);
    
    return NextResponse.json({
      success: true,
      assetTypes: assetTypes
    });
    
  } catch (error: any) {
    console.error('❌ 分析失败:', error);
    return NextResponse.json(
      { error: error.message || '分析失败' },
      { status: 500 }
    );
  }
}

