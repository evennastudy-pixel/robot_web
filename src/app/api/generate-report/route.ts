import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 延长 Vercel 最大执行时间（Hobby: 60s，Pro: 300s）
export const maxDuration = 60;

function getClient() {
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

// 检测方案数据的主要语言
function detectSolutionLanguage(solution: any): 'zh' | 'en' {
  const textsToCheck = [
    solution.coreDescription,
    solution.coreProblem,
    solution.designInsight,
    solution.potentialImpact
  ].filter(Boolean).join(' ');
  
  return detectLanguage(textsToCheck);
}

export async function POST(req: Request) {
  let solution: any = null;
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('❌ DEEPSEEK_API_KEY 未配置');
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY is not configured. Please set it in .env.local', success: false },
        { status: 500 }
      );
    }

    const body = await req.json();
    solution = body.solution;
    const { theme, style = 'default', format = 'report', userFeedback = '' } = body;

    if (!solution) {
      return NextResponse.json(
        { error: 'Solution data is required', success: false },
        { status: 400 }
      );
    }

    console.log('📡 开始调用 DeepSeek 模型生成报告...');

    // 检测输入内容的语言
    const contentLanguage = detectSolutionLanguage(solution);
    const isEnglish = contentLanguage === 'en';
    
    console.log(`🌐 检测到内容语言: ${isEnglish ? '英文' : '中文'}`);


    // 根据用户选择的风格 - 生成强约束的样式描述（含具体CSS要求）
    const styleMap: Record<string, { en: string; zh: string; css: string }> = {
      minimalist: {
        en: 'CRITICAL - Minimalist: body background MUST be #fafafa or #ffffff, text #333, accents #666. NO gradients, NO vivid colors. Lots of padding, clean lines, max-width content area. Use Georgia or system fonts.',
        zh: '【必选】极简主义：body 背景必须是 #fafafa 或 #ffffff，文字 #333，点缀色 #666。禁止渐变、禁止鲜艳色。大量留白、简洁线条、内容区最大宽度。',
        css: 'body{background:#fafafa;color:#333} .card{background:#fff;border:1px solid #eee}'
      },
      tech: {
        en: 'CRITICAL - Tech Future: body background MUST be linear-gradient(135deg,#0f0c29,#302b63,#24243e) or similar dark blue-purple. Use neon accents (#00f5ff, #ff00ff), glassmorphism (backdrop-filter), glowing effects.',
        zh: '【必选】科技未来：body 背景必须是深蓝紫渐变 linear-gradient(135deg,#0f0c29,#302b63,#24243e)。霓虹点缀 #00f5ff、#ff00ff，玻璃拟态 backdrop-filter，发光效果。',
        css: 'body{background:linear-gradient(135deg,#0f0c29,#302b63);color:#fff}'
      },
      elegant: {
        en: 'CRITICAL - Elegant Professional: body background MUST be #f5f0e6 or #e8e4dc (beige/cream). Accents gold #c9a227 or deep blue #2c3e50. Use serif font (Georgia, "Times New Roman") for headings. Delicate 1px borders.',
        zh: '【必选】典雅专业：body 背景必须是 #f5f0e6 或 #e8e4dc（米色/奶油色）。点缀色金色 #c9a227 或深蓝 #2c3e50。标题用衬线字体。精致 1px 边框。',
        css: 'body{background:#f5f0e6;color:#333} h1,h2{font-family:Georgia}'
      },
      vibrant: {
        en: 'CRITICAL - Vibrant Colorful: body background MUST be bright gradient like linear-gradient(120deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3). Bold colors, geometric shapes, high contrast. Avoid dark/muted tones.',
        zh: '【必选】活力多彩：body 背景必须是鲜艳渐变如 linear-gradient(120deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3)。大胆配色、几何图形、高对比。避免暗色。',
        css: 'body{background:linear-gradient(120deg,#ff6b6b,#48dbfb);color:#222}'
      },
      academic: {
        en: 'CRITICAL - Academic Rigorous: body background MUST be #ffffff. Black text #000, formal layout. Use serif fonts, numbered sections, citation-style formatting. NO decorative gradients or fancy effects.',
        zh: '【必选】学术严谨：body 背景必须是 #ffffff 纯白。黑色文字 #000，正式排版。衬线字体、编号小节、引用格式。禁止渐变和花哨效果。',
        css: 'body{background:#fff;color:#000;font-family:Georgia}'
      },
      default: {
        en: 'CRITICAL - Space Tech (default): body background MUST be dark gradient linear-gradient(135deg,#1a1a2e,#16213e,#0f3460). Purple-blue accents #5157E8, #667eea. Glassmorphism, modern dark theme.',
        zh: '【必选】太空科技：body 背景必须是深色渐变 linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)。蓝紫点缀 #5157E8、#667eea。玻璃拟态、现代深色主题。',
        css: 'body{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff}'
      }
    };
    const styleConfig = styleMap[style] || styleMap.default;
    const styleDescription = isEnglish ? styleConfig.en : styleConfig.zh;
    const styleCssHint = styleConfig.css;

    console.log(`🎨 用户选择风格: ${style}`);

    const feedbackSection = userFeedback ? (isEnglish ? `

User Feedback and Requirements:
${userFeedback}

Please pay special attention to user feedback and fully consider and reflect these requirements when generating the report.` : `

用户反馈与要求：
${userFeedback}

请特别注意用户的反馈意见，在生成报告时充分考虑和体现这些要求。`) : '';

    // 报告格式说明：report=详细报告含结构图，ppt=分页演示稿
    const formatInstructions = format === 'ppt' ? (isEnglish ? `
4. **PPT/Slide Format**:
   - Organize content into distinct slides (each section = one slide)
   - Each slide: clear title, concise bullet points, visual hierarchy
   - Add slide numbers and navigation cues
   - Use full-width sections with clear boundaries
   - Design like a professional presentation deck` : `
4. **PPT/幻灯片格式**：
   - 按幻灯片分页组织内容（每个小节=一页）
   - 每页：清晰标题、简洁要点、视觉层次分明
   - 添加页码与导航提示
   - 使用全宽区块、边界清晰
   - 呈现专业演示稿效果`) : (isEnglish ? `
4. **Structure Diagrams**:
   - Include at least 1-2 structure diagrams (use inline SVG or CSS)
   - E.g.: system architecture diagram, design process flow, concept relationship diagram
   - Diagrams should be clean, readable, with labels
   - Use boxes, arrows, and clear hierarchy` : `
4. **结构图**：
   - 至少包含 1-2 个结构图（使用内联 SVG 或 CSS 绘制）
   - 例如：系统架构图、设计流程图、概念关系图
   - 结构图需清晰可读、带标签
   - 使用方框、箭头和层次结构`);

    // 构建提示词
    const prompt = isEnglish ? 
    `You are a professional design report writing expert. Based on the following design solution information, please generate an exquisite, professional, and highly detailed HTML format design report.

Theme Information:
${theme ? `Theme: ${theme.titleEn || theme.title}
Core Question: ${theme.coreQuestion}
Theme Introduction: ${theme.intro || ''}` : ''}

Solution Information:
Project Name (English): ${solution.projectName?.en || 'Not provided'}
Project Name (Chinese): ${solution.projectName?.zh || 'Not provided'}
Core Description: ${solution.coreDescription || 'Not provided'}
Core Problem: ${solution.coreProblem || 'Not provided'}
Design Insight: ${solution.designInsight || 'Not provided'}
Design Methods: ${solution.designMethods?.map((m: any) => `${m.method}${m.description ? ` (${m.description})` : ''}`).join(', ') || 'Not provided'}
Core Concepts: ${solution.coreConcepts?.map((c: any) => `${c.concept}: ${c.explanation}`).join('; ') || 'Not provided'}
Technology Implementation: ${solution.technologies?.map((t: any) => `${t.tech}: ${t.application}`).join('; ') || 'Not provided'}
Application Scenarios & Impact: ${solution.potentialImpact || 'Not provided'}
Keywords: ${solution.keywords?.join(', ') || 'Not provided'}
References: ${solution.references?.map((r: any) => `${r.caseName}${r.relevance ? ` - ${r.relevance}` : ''}${r.link ? ` (${r.link})` : ''}`).join('; ') || 'Not provided'}

Requirements:
0. **VISUAL STYLE (HIGHEST PRIORITY - MUST FOLLOW)**:
   ${styleDescription}
   CSS reference (apply these or equivalent): ${styleCssHint}
   The report appearance MUST match this style. Do NOT use a different color scheme or background.

1. **Content** (be structured and clear):
   - Add a brief Table of Contents at the beginning
   - Each section: 1-2 well-written paragraphs
   - Cover: project overview, design insight, methods, technologies, application scenarios, impact
   - Be professional and focused; do not pad with filler text

2. **HTML and Styling**:
   - Generate complete HTML document with inline CSS styles
   - REMINDER: Apply the style from Requirement 0 - colors and background MUST match
   - Clear hierarchy: H1 (title) → H2 (sections) → H3 (subsections)
   - Use gradients, cards, icons, visual separators
   - Ensure readability: good contrast, line-height, spacing
   - Add spacing, shadows, rounded corners${formatInstructions}

3. **Output Format**:
   - **Return ONLY HTML code, no other explanations or markdown markers**
   - HTML should be complete and directly renderable, including <!DOCTYPE html>, <html>, <head>, <body> tags
   - Overall style should be professional, innovative, and futuristic${feedbackSection}
   - **Important: Generate the entire report in ENGLISH**

Please generate the detailed and complete report HTML code in ENGLISH:` 
    : 
    `你是一位专业的设计报告撰写专家。请根据以下设计方案信息，生成一份精美、专业、内容详实的HTML格式设计报告。

主题信息：
${theme ? `主题：${theme.title} - ${theme.titleEn}
核心问题：${theme.coreQuestion}
主题简介：${theme.intro || ''}` : ''}

方案信息：
项目名称（英文）：${solution.projectName?.en || '未填写'}
项目名称（中文）：${solution.projectName?.zh || '未填写'}
核心描述：${solution.coreDescription || '未填写'}
核心问题：${solution.coreProblem || '未填写'}
设计洞察：${solution.designInsight || '未填写'}
设计方法：${solution.designMethods?.map((m: any) => `${m.method}${m.description ? ` (${m.description})` : ''}`).join(', ') || '未填写'}
核心概念：${solution.coreConcepts?.map((c: any) => `${c.concept}: ${c.explanation}`).join('; ') || '未填写'}
技术实现：${solution.technologies?.map((t: any) => `${t.tech}: ${t.application}`).join('; ') || '未填写'}
应用场景与影响：${solution.potentialImpact || '未填写'}
关键词：${solution.keywords?.join(', ') || '未填写'}
参考资料：${solution.references?.map((r: any) => `${r.caseName}${r.relevance ? ` - ${r.relevance}` : ''}${r.link ? ` (${r.link})` : ''}`).join('; ') || '未填写'}

要求：
0. **视觉风格（最高优先级 - 必须遵守）**：
   ${styleDescription}
   CSS参考（必须使用此类样式）：${styleCssHint}
   报告外观必须符合该风格。禁止使用其他配色或背景。

1. **内容**（结构清晰即可）：
   - 在开头添加简洁目录
   - 每个章节 1-2 段专业段落
   - 涵盖：项目概述、设计洞察、方法、技术、应用场景、影响
   - 内容专业聚焦，不要填充废话

2. **HTML与样式**：
   - 生成完整的HTML文档，包含内联CSS样式
   - 提醒：严格应用要求0中的风格，配色和背景必须匹配
   - 清晰的层次：H1（标题）→ H2（章节）→ H3（小节）
   - 使用渐变、卡片、图标、视觉分隔
   - 确保可读性：对比度、行高、间距
   - 添加间距、阴影、圆角${formatInstructions}

3. **输出格式**：
   - **只返回HTML代码，不要任何其他解释或markdown标记**
   - HTML应该是完整可直接渲染的，包含<!DOCTYPE html>、<html>、<head>、<body>等标签
   - 整体风格应该专业、创新、富有未来感${feedbackSection}
   - **重要：生成的报告必须使用中文**

请生成详细完善的中文报告HTML代码：`;

    console.log('🎨 开始生成方案报告...');

    const systemMessage = isEnglish ?
      `You are a professional design report writing expert. CRITICAL: You MUST strictly follow the visual style requested by the user. Each style has distinct colors, backgrounds, and aesthetics - the output MUST look different when the user selects a different style. Apply the exact CSS/colors specified in the user message. Generate all content in ENGLISH.` :
      `你是一位专业的设计报告撰写专家。重要：你必须严格按用户选择的视觉风格生成报告。不同风格对应不同的配色、背景和美学，切换风格时报告外观必须明显不同。按用户消息中的具体CSS/配色要求执行。生成的所有内容必须使用中文。`;

    const client = getClient();

    // 使用流式 API，边生成边推送，避免 Vercel serverless 超时
    const stream = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 4000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    console.log('✅ 方案报告流式生成启动');

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('❌ 生成报告时出错:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isApiKeyError = errorMessage.includes('api_key') || errorMessage.includes('API key') || errorMessage.includes('DEEPSEEK');
    
    return NextResponse.json(
      { 
        error: isApiKeyError ? 'API key 无效或未配置，请检查 DEEPSEEK_API_KEY' : `模型调用失败: ${errorMessage}`,
        success: false,
        message: 'Model call failed - please check server logs and API configuration'
      },
      { status: 500 }
    );
  }
}

