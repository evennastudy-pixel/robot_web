import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getDeepseek() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'placeholder',
    baseURL: 'https://api.deepseek.com',
  });
}

// 检测文本主要语言（中文或英文）
function detectLanguage(text: string): 'zh' | 'en' {
  if (!text) return 'zh';
  
  // 统计中文字符数量
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const chineseCount = chineseChars.length;
  
  // 统计英文单词数量（简单估算）
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const englishCount = englishWords.length;
  
  // 如果中文字符数量超过英文单词数量，认为是中文
  return chineseCount > englishCount ? 'zh' : 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userPrompt, solution, assetType } = body;
    
    if (!userPrompt || !solution || !assetType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 检测输入的语言
    const inputLanguage = detectLanguage(userPrompt);
    const isEnglish = inputLanguage === 'en';
    
    console.log(`\n🎨 优化提示词 - 类型: ${assetType}`);
    console.log(`用户描述: ${userPrompt}`);
    console.log(`🌐 检测到语言: ${isEnglish ? '英文' : '中文'}`);
    
    // 获取项目名称（处理对象类型）
    const projectName = typeof solution.projectName === 'string' 
      ? solution.projectName 
      : solution.projectName?.cn || solution.projectName?.en || solution.projectNameEn || '未命名项目';
    
    // 获取关键词（处理对象类型）
    const keywords = solution.keywords?.map((kw: any) => 
      typeof kw === 'string' ? kw : kw?.keyword || kw?.cn || kw?.en || ''
    ).filter(Boolean).join(', ') || '';
    
    // 构建系统提示词（根据语言）
    const systemPrompt = isEnglish ? 
    `You are a professional AI image generation prompt optimization expert, skilled at generating high-quality English image generation prompts for space design projects.

Project Information:
- Project Name: ${projectName}
- Theme: ${solution.theme || 'Space Design'}
- Core Concepts: ${solution.coreConcepts || solution.coreDescription?.slice(0, 100) || ''}
- Keywords: ${keywords}
- Design Methods: ${solution.designMethods?.map((m: any) => m.method || m).join(', ') || ''}

Asset Type: ${assetType}

Task:
Optimize the user's English description into a professional English image generation prompt.

Requirements:
1. Use English throughout
2. Choose appropriate style and descriptive words based on the asset type
3. Incorporate the project's core concepts and keywords
4. Add quality-enhancing terms (e.g., 8K, professional, high-tech, futuristic, etc.)
5. Keep prompt length between 150-250 words
6. Return only the optimized prompt, no additional explanations

Style Guidelines by Asset Type:
- Project Poster: Create a professional project poster, futuristic design, space aesthetic, award-winning, dramatic composition
- UI Design: Design a modern UI/UX interface, clean layout, high-tech style, professional mockup, user-friendly
- Space Rendering: Render a futuristic space environment, 3D visualization, architectural rendering, photorealistic, cinematic lighting
- Product Display: Product design rendering, industrial design, futuristic aesthetics, sleek design
- Use Case: Real-world application scene, user interaction, lifestyle photography style, authentic setting
- Technical Diagram: Technical diagram, infographic style, clean and clear, professional illustration, informative
- Team Collaboration: Team collaboration scene, working together, modern workspace, dynamic interaction

Please directly output the optimized English prompt with all text elements in English.`
    :
    `你是一个专业的AI图像生成提示词优化专家，擅长为机器人与智能系统相关项目生成高质量的中文图像生成提示词。

项目信息：
- 项目名称：${projectName}
- 主题：${solution.theme || '机器人设计'}
- 核心概念：${solution.coreConcepts || solution.coreDescription?.slice(0, 100) || ''}
- 关键词：${keywords}
- 设计方法：${solution.designMethods?.map((m: any) => m.method || m).join(', ') || ''}

素材类型：${assetType}

任务：
将用户的中文描述优化成专业的中文图像生成提示词。

要求：
1. 使用中文
2. 根据素材类型选择合适的风格和描述词
3. 融入项目的核心概念和关键词
4. 添加质量提升词汇（如：8K、专业、高科技、未来感等）
5. 提示词长度控制在150-250字
6. 直接返回优化后的提示词，不要有额外解释

素材类型对应的风格指导（围绕机器人与智能系统主题，而不是宇宙/太空）：
- 项目海报：围绕机器人或智能系统的核心场景，聚焦人与机器人互动、应用环境、关键信息，构图清晰、有记忆点
- 界面设计：机器人控制台、监控界面、服务机器人 App 等 UI/UX，强调信息层级、状态反馈、可操作性
- 空间渲染：机器人所在的真实或半真实空间（工厂、医院、家庭、校园、城市公共空间等），体现空间布局与机器人动线
- 产品展示：单个或一组机器人的外观与结构细节，工业设计感、材质质感、关节与传感器等关键部位
- 使用场景：真实用户与机器人交互的瞬间（如老人与陪护机器人、工人与协作机器人、儿童与教育机器人），强调情绪与体验
- 技术图解：机器人系统结构图、数据流、感知-决策-执行链路等技术示意，以信息图/线框图方式清晰呈现
- 团队协作：多角色（设计师、工程师、运营人员、一线工作人员）围绕机器人系统协作的场景，强调角色分工与协同流程

请直接输出优化后的中文提示词，图片中所有文字元素都用中文。`;
    
    // 调用 DeepSeek API
    const deepseek = getDeepseek();
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const optimizedPrompt = response.choices[0].message.content?.trim() || '';
    
    console.log(`✅ 优化后提示词: ${optimizedPrompt.slice(0, 100)}...`);
    
    return NextResponse.json({
      success: true,
      optimizedPrompt: optimizedPrompt
    });
    
  } catch (error: any) {
    console.error('❌ 优化提示词失败:', error);
    return NextResponse.json(
      { error: error.message || '优化失败' },
      { status: 500 }
    );
  }
}

