import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Vercel配置：使用Node.js runtime并设置60秒超时
export const runtime = 'nodejs';
export const maxDuration = 60;

// 4个AI专家的完整persona定义
const EXPERT_PERSONAS = {
  'design-critic': {
    id: 'design-critic',
    name: '设计评论家',
    nameEn: 'Design Critic',
    icon: '🎨',
    color: 'purple-500',
    systemPrompt: `You are an expert design critic specializing in space design and human-centered design principles. 

Your expertise includes:
- Design theory and philosophy
- User experience (UX) in extreme environments
- Embodied interaction and sensory design
- Cultural and emotional dimensions of design
- Design methodology and frameworks

Your speaking style:
- Thoughtful and analytical
- Challenge assumptions about Earth-based design patterns
- Ask probing questions about user needs and experiences
- Provide theoretical frameworks and design principles
- Balance innovation with human factors

Reply in 60-100 words, be insightful and thought-provoking.`,
    keywords: ['设计', '体验', '用户', '哲学', '理念', '概念', '为什么', '如何', '意义', '感受', '交互', '界面', '美学', '文化', '情感', 'design', 'experience', 'user', 'ux', 'philosophy', 'concept', 'why', 'how', 'meaning', 'feel', 'interaction', 'interface', 'aesthetic', 'culture', 'emotion', 'embodied']
  },
  
  'tech-advisor': {
    id: 'tech-advisor',
    name: '技术顾问',
    nameEn: 'Tech Advisor',
    icon: '🔬',
    color: 'blue-500',
    systemPrompt: `You are a technical advisor with expertise in space technology, engineering, and emerging technologies.

Your expertise includes:
- Space engineering and technology
- Materials science and manufacturing
- Sensor systems and robotics
- Software architecture and AI/ML
- System integration and reliability

Your speaking style:
- Practical and solution-oriented
- Evaluate technical feasibility
- Suggest specific technologies and approaches
- Consider safety, reliability, and maintenance
- Balance innovation with practical constraints

Reply in 60-100 words, be specific and actionable.`,
    keywords: ['技术', '实现', '可行性', '系统', '软件', '硬件', '材料', '传感器', '算法', '集成', '工程', '制造', '如何实现', '需要什么', 'technology', 'technical', 'implement', 'feasibility', 'system', 'software', 'hardware', 'material', 'sensor', 'algorithm', 'integration', 'engineering', 'manufacture', 'how to', 'what need', 'build', 'develop']
  },
  
  'robot-specialist': {
    id: 'robot-specialist',
    name: '机器人专家',
    nameEn: 'Robot Specialist',
    icon: '🤖',
    color: 'indigo-500',
    systemPrompt: `You are a robot design and application specialist with deep understanding of robotics, human-robot interaction, and practical robot deployment.

Your expertise includes:
- Service robots, industrial cobots, and smart home robots
- Human-robot interaction and UX design for robots
- Robot safety, path planning, and multi-robot coordination
- Robot applications in healthcare, education, logistics, agriculture
- Practical design considerations for real-world deployment

Your speaking style:
- Focus on practical, actionable design guidance
- Draw from real robot deployment cases
- Consider safety, efficiency, and user experience
- Balance innovation with implementation feasibility

Reply in 60-100 words, be realistic and experience-based.`,
    keywords: ['机器人', '机械臂', '人机交互', '协作', '服务', '工业', '医疗', '教育', '物流', '仓储', '农业', '路径', '调度', '安全', '传感器', 'robot', 'robotics', 'cobot', 'HRI', 'human-robot', 'service', 'industrial', 'logistics', 'warehouse', 'agriculture', 'path', 'scheduling', 'safety', 'sensor']
  },
  
  'case-specialist': {
    id: 'case-specialist',
    name: '案例专家',
    nameEn: 'Case Specialist',
    icon: '📚',
    color: 'green-500',
    systemPrompt: `You are a design case specialist with extensive knowledge of space design projects, precedents, and best practices.

Your expertise includes:
- Historical and current space design projects
- Design patterns and methodologies
- Comparative analysis of solutions
- Lessons learned from past projects
- Cross-industry innovation examples

Your speaking style:
- Reference specific projects and examples
- Provide context and background
- Compare different approaches
- Highlight successes and failures
- Inspire through concrete examples

Reply in 60-100 words, always include at least one specific case or example.`,
    keywords: ['案例', '参考', '例子', '项目', '类似', '之前', '已有', '研究', '实验', 'MIT', 'NASA', 'ISS', '空间站', '历史', 'case', 'example', 'reference', 'project', 'similar', 'previous', 'existing', 'research', 'experiment', 'study', 'precedent', 'station', 'history', 'past']
  }
};

// 智能角色调度函数
function selectExperts(userMessage: string, conversationHistory: any[]): string[] {
  const message = userMessage.toLowerCase();
  const selectedExperts: Set<string> = new Set();
  
  // 基于关键词匹配
  Object.entries(EXPERT_PERSONAS).forEach(([id, expert]) => {
    const keywords = expert.keywords || [];
    const matches = keywords.filter(keyword => 
      message.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      selectedExperts.add(id);
    }
  });
  
  // 如果没有匹配到任何专家，默认使用设计评论家
  if (selectedExperts.size === 0) {
    selectedExperts.add('design-critic');
  }
  
  // 限制最多3个专家同时回复
  const expertsArray = Array.from(selectedExperts);
  return expertsArray.slice(0, 3);
}

// 初始化 DeepSeek 客户端
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
  timeout: 60000,
  maxRetries: 3
});

// 生成专家回复
async function generateExpertResponse(
  expertId: string,
  userMessage: string,
  theme: any,
  solution: any,
  conversationHistory: any[]
): Promise<{ content: string; extracted: any }> {
  const expert = EXPERT_PERSONAS[expertId as keyof typeof EXPERT_PERSONAS];
  if (!expert) {
    throw new Error(`Unknown expert: ${expertId}`);
  }
  
  // 构建系统提示，包含主题信息
  let systemPrompt = expert.systemPrompt;
  
  if (theme) {
    systemPrompt += `\n\n当前设计主题：${theme.title}（${theme.titleEn}）
核心问题：${theme.coreQuestion}
关键词：${theme.keywords?.join('、')}

请基于这个主题背景来回答用户的问题。`;
  }
  
  // 添加已有方案信息
  if (solution && Object.keys(solution).length > 0) {
    systemPrompt += `\n\n当前方案进度：`;
    if (solution.projectName?.en || solution.projectName?.cn) {
      systemPrompt += `\n项目名称：${solution.projectName?.en || solution.projectName?.cn}`;
    }
    if (solution.coreDescription) {
      systemPrompt += `\n核心描述：${solution.coreDescription.substring(0, 100)}...`;
    }
  }
  
  // 构建对话历史（过滤无效消息）
  const recentHistory = conversationHistory
    .filter((msg: any) => {
      // 严格验证每个消息
      if (!msg || typeof msg !== 'object') return false;
      if (!msg.role || typeof msg.role !== 'string') return false;
      if (!msg.content || typeof msg.content !== 'string') return false;
      if (msg.content.trim().length === 0) return false;
      return true;
    })
    .slice(-6);
  
  // 构建messages数组，确保每条消息都有role和content
  const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
    { role: 'system' as const, content: systemPrompt },
    ...recentHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: String(msg.content)
    })),
    { role: 'user' as const, content: userMessage }
  ];
  
  // 调试日志：打印实际发送的消息结构
  console.log(`[${expertId}] Sending ${messages.length} messages to API:`, 
    messages.map((m, i) => `[${i}] role=${m.role}, content_length=${m.content?.length || 0}`).join(', '));
  
  try {
    // 第一步：生成回复（减少max_tokens加快响应）
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.8,
      max_tokens: 200, // 减少token数量以加快响应
      stream: false
    });
    
    const content = response.choices[0]?.message?.content || '抱歉，我暂时无法回答。';
    
    // 第二步：提取结构化数据（设计方法、关键词、参考案例）
    // 包含当前已有的数据，让AI做相关度判断
    const currentMethodsText = solution.designMethods?.map((m: any) => m.method).join(', ') || '无';
    const currentKeywordsText = solution.keywords?.join(', ') || '无';
    
    const extractionPrompt = `请从以下AI回复中提取结构化信息，并评估每项的相关度（0-100分）。

主题：${theme?.title || '未知'}
核心问题：${theme?.coreQuestion || '未知'}

当前已有的设计方法（${solution.designMethods?.length || 0}/5）：${currentMethodsText}
当前已有的关键词（${solution.keywords?.length || 0}/20）：${currentKeywordsText}

AI回复：
${content}

请分析并返回JSON格式（只返回JSON，不要其他内容）：
{
  "designMethods": [
    {
      "method": "方法名", 
      "description": "说明",
      "relevance": 85  // 0-100，与主题和项目的相关度
    }
  ],
  "keywords": [
    {
      "keyword": "关键词",
      "relevance": 90  // 0-100，重要性和相关度
    }
  ],
  "references": [
    {
      "caseName": "案例名", 
      "relevance": "相关性说明", 
      "link": "",
      "score": 80  // 0-100，参考价值
    }
  ]
}

注意：
1. 只提取与主题高度相关的内容
2. 设计方法最多5个，关键词最多20个
3. 如果已有项目接近限制，只提取相关度更高的新内容`;

    try {
      const extractionResponse = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.3,
        max_tokens: 500,
        stream: false
      });
      
      const extractedText = extractionResponse.choices[0]?.message?.content || '{}';
      // 提取JSON（可能被markdown代码块包裹）
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      return { content, extracted };
    } catch (extractError) {
      console.error('Extraction error:', extractError);
      // 如果提取失败，只返回内容
      return { content, extracted: {} };
    }
  } catch (error) {
    console.error(`Error generating response for ${expertId}:`, error);
    throw error;
  }
}

// 智能合并提取的数据（带相关度评分和数量限制）
function mergeExtractedData(currentSolution: any, newExtracted: any) {
  const merged = { ...currentSolution };
  
  const MAX_METHODS = 5;
  const MAX_KEYWORDS = 20;
  
  // 合并设计方法（最多5个，按相关度智能替换）
  if (newExtracted.designMethods && Array.isArray(newExtracted.designMethods)) {
    let allMethods = [...(merged.designMethods || [])];
    
    // 为已有方法添加默认相关度（如果没有）
    allMethods = allMethods.map((m: any) => ({
      ...m,
      relevance: m.relevance || 50
    }));
    
    // 添加新方法
    for (const newMethod of newExtracted.designMethods) {
      const methodData = typeof newMethod === 'string' 
        ? { method: newMethod, description: '', relevance: 60 }
        : { ...newMethod, relevance: newMethod.relevance || 60 };
      
      // 检查是否已存在
      const existingIndex = allMethods.findIndex(
        (m: any) => m.method.toLowerCase() === methodData.method.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // 更新已有方法的相关度
        allMethods[existingIndex].relevance = Math.max(
          allMethods[existingIndex].relevance,
          methodData.relevance
        );
      } else {
        // 添加新方法
        allMethods.push(methodData);
      }
    }
    
    // 按相关度排序并限制数量
    allMethods.sort((a: any, b: any) => (b.relevance || 0) - (a.relevance || 0));
    merged.designMethods = allMethods.slice(0, MAX_METHODS);
  }
  
  // 合并关键词（最多20个，按相关度智能替换）
  if (newExtracted.keywords && Array.isArray(newExtracted.keywords)) {
    let allKeywords: Array<{keyword: string, relevance: number}> = [];
    
    // 转换已有关键词
    if (merged.keywords && Array.isArray(merged.keywords)) {
      allKeywords = merged.keywords.map((k: any) => 
        typeof k === 'string' 
          ? { keyword: k, relevance: 50 }
          : { keyword: k.keyword || k, relevance: k.relevance || 50 }
      );
    }
    
    // 添加新关键词
    for (const newKeyword of newExtracted.keywords) {
      const keywordData = typeof newKeyword === 'string'
        ? { keyword: newKeyword, relevance: 60 }
        : { keyword: newKeyword.keyword || newKeyword, relevance: newKeyword.relevance || 60 };
      
      // 检查是否已存在
      const existingIndex = allKeywords.findIndex(
        k => k.keyword.toLowerCase() === keywordData.keyword.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // 更新已有关键词的相关度
        allKeywords[existingIndex].relevance = Math.max(
          allKeywords[existingIndex].relevance,
          keywordData.relevance
        );
      } else {
        // 添加新关键词
        allKeywords.push(keywordData);
      }
    }
    
    // 按相关度排序并限制数量
    allKeywords.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    // 只保存关键词字符串（不保存relevance到前端，只用于排序）
    merged.keywords = allKeywords.slice(0, MAX_KEYWORDS).map(k => k.keyword);
  }
  
  // 合并参考资料（避免重复，但不限制数量）
  if (newExtracted.references && Array.isArray(newExtracted.references)) {
    const existingRefs = (merged.references || []).map((r: any) => r.caseName.toLowerCase());
    const newRefs = newExtracted.references.filter(
      (r: any) => {
        const caseName = r.caseName || r;
        return !existingRefs.includes(caseName.toLowerCase());
      }
    );
    merged.references = [...(merged.references || []), ...newRefs];
  }
  
  return merged;
}

// 主处理函数
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      message, 
      theme, 
      solution = {}, 
      conversationHistory = [] 
    } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // 调试：打印收到的conversationHistory
    console.log(`Received conversationHistory (${conversationHistory.length} items):`,
      conversationHistory.map((msg: any, i: number) => 
        `[${i}] role=${msg?.role || 'MISSING'}, content=${msg?.content ? `"${msg.content.substring(0, 30)}..."` : 'MISSING'}`
      ).join(', ')
    );
    
    // 智能选择专家
    const selectedExperts = selectExperts(message, conversationHistory);
    
    console.log(`User: ${message}`);
    console.log(`Selected experts: ${selectedExperts.join(', ')}`);
    
    // 创建流式响应
    const encoder = new TextEncoder();
    let accumulatedExtracted: any = {};
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 依次生成每个专家的回复
          for (const expertId of selectedExperts) {
            const expert = EXPERT_PERSONAS[expertId as keyof typeof EXPERT_PERSONAS];
            
            // 发送专家开始标记
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'agent_start',
                agentId: expertId,
                name: expert.name,
                icon: expert.icon
              })}\n\n`)
            );
            
            try {
              // 生成回复（包含内容和提取的数据）
              const { content, extracted } = await generateExpertResponse(
                expertId,
                message,
                theme,
                solution,
                conversationHistory
              );
              
              // 累积提取的数据
              accumulatedExtracted = mergeExtractedData(accumulatedExtracted, extracted);
              
              // 流式发送内容（快速发送，减少延迟）
              const words = content.split('');
              for (let i = 0; i < words.length; i++) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'content',
                    content: words[i]
                  })}\n\n`)
                );
                // 减少延迟避免超时（5ms instead of 20ms）
                await new Promise(resolve => setTimeout(resolve, 5));
              }
              
              // 发送专家结束标记
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'agent_end',
                  agentId: expertId
                })}\n\n`)
              );
              
              // 专家之间的间隔（减少延迟）
              await new Promise(resolve => setTimeout(resolve, 100));
              
            } catch (error) {
              console.error(`Error with expert ${expertId}:`, error);
              // 发送错误但继续处理其他专家
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'content',
                  content: '（该专家暂时无法回答）'
                })}\n\n`)
              );
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'agent_end',
                  agentId: expertId
                })}\n\n`)
              );
            }
          }
          
          // 发送提取的结构化数据
          if (Object.keys(accumulatedExtracted).length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'extracted_data',
                data: accumulatedExtracted
              })}\n\n`)
            );
          }
          
          // 发送完成标记
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'done'
            })}\n\n`)
          );
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

