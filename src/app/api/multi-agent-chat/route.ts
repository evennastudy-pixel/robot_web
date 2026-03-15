import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import OpenAI from 'openai';

// Agent角色定义
const AGENT_PERSONAS = {
  government: {
    name: 'Government Official',
    role: 'Government Official',
    color: 'blue-500',
    prompt: `You are a Singapore government official with a pragmatic approach. Key characteristics:
- Focus on policy feasibility, budget allocation, and regulatory compliance
- Emphasize risk assessment and long-term sustainability
- Use formal, professional language with careful consideration
- Challenge unrealistic proposals while offering practical alternatives
- Prioritize implementation feasibility and societal impact
- Consider Singapore's multi-racial society and economic competitiveness
Reply limit: Keep responses between 30-60 words, be concise and impactful.`
  },
  ngo: {
    name: 'NGO Representative',
    role: 'NGO Representative', 
    color: 'green-500',
    prompt: `You are an NGO representative focused on social welfare and community issues. Key characteristics:
- Advocate for social equity and protection of vulnerable groups
- Promote sustainable development and environmental responsibility
- Use passionate, caring language with strong sense of social responsibility
- Support policies that benefit the community and oppose harmful proposals
- Provide grassroots perspectives and community-based solutions
- Consider Singapore's diverse communities and social cohesion
Reply limit: Keep responses between 30-60 words, embodying social responsibility and community care.`
  },
  citizen: {
    name: 'Citizen',
    role: 'Citizen',
    color: 'orange-500', 
    prompt: `You are an ordinary Singaporean citizen focused on practical daily life concerns. Key characteristics:
- Think from everyday life perspective and practical needs
- Focus on cost-effectiveness and convenience in daily living
- Use straightforward, down-to-earth language
- Question complex policies and support simple, practical solutions
- Prioritize family and personal well-being
- Consider impact on Singapore's cost of living and quality of life
Reply limit: Keep responses between 30-60 words, be direct and practical.`
  },
  student: {
    name: 'University Student',
    role: 'University Student',
    color: 'purple-500',
    prompt: `You are a young university student with innovative thinking. Key characteristics:
- Propose creative ideas and forward-thinking solutions
- Focus on technology applications and digital transformation
- Use energetic, contemporary language full of innovation
- Challenge traditional approaches and suggest novel solutions
- Analyze from long-term development and global perspective
- Consider Singapore's Smart Nation vision and future workforce needs
Reply limit: Keep responses between 30-60 words, be creative and forward-looking.`
  }
};

// 对话上下文
interface ConversationContext {
  topic: string;
  selectedChallenges?: string[];
  interpretation?: string;
}

// 初始化 DeepSeek 客户端 - 支持流式输出（使用 LangChain）
const llm = new ChatOpenAI({
  modelName: 'deepseek-chat',
  temperature: 0.8,
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: 'https://api.deepseek.com',
    timeout: 60000, // 60秒超时
    maxRetries: 3   // 最大重试3次
  },
  streaming: true
});

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'placeholder',
    baseURL: 'https://api.deepseek.com',
    timeout: 60000,
    maxRetries: 3
  });
}

// Agent回复生成函数 - 考虑其他Agent的观点
async function generateAgentResponse(
  agentId: string,
  context: ConversationContext,
  conversationHistory: BaseMessage[],
  userMessage: string,
  otherAgentsResponses: AIMessage[] = []
): Promise<string> {
  const persona = AGENT_PERSONAS[agentId as keyof typeof AGENT_PERSONAS];
  if (!persona) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  // 构建系统提示
  let systemPrompt = persona.prompt;
  
  // 添加上下文
  if (context.selectedChallenges?.length) {
    systemPrompt += `\n讨论话题：${context.selectedChallenges.join(', ')}`;
  }
  
  if (context.interpretation) {
    systemPrompt += `\n背景：${context.interpretation}`;
  }

  // 最近对话历史
  const recentMessages = conversationHistory.slice(-3);
  const historyText = recentMessages.map(msg => {
    if (msg instanceof HumanMessage) {
      return `用户：${msg.content}`;
    } else if (msg instanceof AIMessage) {
      return `${msg.name}：${msg.content}`;
    }
    return '';
  }).join('\n');

  // 其他Agent的观点
  const otherViewsText = otherAgentsResponses.map(msg => 
    `${msg.name}：${msg.content}`
  ).join('\n');

  const prompt = `${systemPrompt}

对话历史：
${historyText}

用户说：${userMessage}

${otherAgentsResponses.length > 0 ? `其他参与者观点：\n${otherViewsText}\n` : ''}

请基于你的角色身份回应。要求：
1. 严格控制在40-100字之间，超过100字将被截断，请务必遵守
2. 可以认可或反驳其他观点，但要简洁有力
3. 体现角色特色和专业背景
4. 提供1-2个具体的建议或方案
5. 直接回复，不要角色名称前缀
6. 语言要简练且有说服力，避免冗长表述`;

  try {
    // 暂时使用fallback响应，避免API超时问题
    console.log(`Using fallback response for agent ${agentId}`);
    
    // 根据角色返回不同的fallback响应 - 随机选择
    const fallbackResponses = {
      government: [
        "As a government official, I understand the complexity of balancing cultural diversity with national unity. We need evidence-based policies that promote social cohesion while respecting our multicultural heritage.",
        "From a policy perspective, we must ensure all initiatives comply with existing regulations and consider long-term fiscal sustainability. Social cohesion requires systematic approaches, not temporary solutions.",
        "The government needs to balance different community needs with overall national interests. We support projects that promote cross-cultural understanding while ensuring effective resource allocation.",
        "As policymakers, we focus on quantifiable indicators and long-term impacts of social cohesion. All initiatives must undergo rigorous evaluation to align with Singapore's core values.",
        "The government must consider the complexity of multicultural societies. We support community-led initiatives while ensuring they align with national development strategies.",
        "From a governance perspective, we need sustainable frameworks to support cultural diversity. This includes appropriate regulatory mechanisms and resource allocation strategies.",
        "The government is committed to creating inclusive social environments. We support projects that promote cross-cultural dialogue while ensuring compliance with legal and social norms.",
        "As public administrators, we must balance different stakeholders' needs. Social cohesion projects require comprehensive impact assessments and stakeholder consultations.",
        "The government focuses on long-term sustainability of social policies. We support evidence-based initiatives that produce measurable positive social impacts.",
        "At the national level, we need to ensure all cultural groups have equal opportunities to participate in social development. This requires systematic policy support and resource investment.",
        "The government must consider social cohesion's impact on economic competitiveness. We support initiatives that promote cultural understanding while contributing to national development goals.",
        "As policymakers, we value community feedback and participation. Social cohesion requires collaborative efforts from government, communities, and civil society."
      ],
      ngo: [
        "From an NGO perspective, we must prioritize community-based solutions that empower all cultural groups. Social cohesion comes from grassroots initiatives that celebrate diversity while building shared values.",
        "We NGOs are committed to protecting vulnerable groups' rights. Social cohesion cannot come at the expense of any group's interests. We need to ensure all initiatives are truly inclusive and fair.",
        "As community advocates, we believe in the power of grassroots action. True social cohesion comes from mutual understanding and respect at the community level, not top-down policies.",
        "NGOs focus on social justice and equity. We support initiatives that promote cultural understanding while ensuring they don't exacerbate existing social inequalities.",
        "We are committed to creating equal opportunities for all community members. Social cohesion requires proactive anti-discrimination measures and inclusive policies.",
        "From a social work perspective, we focus on actual community needs. Social cohesion projects must be based on deep community engagement and needs assessment.",
        "NGOs emphasize the importance of community empowerment. We support community-led initiatives that reflect local residents' genuine aspirations and needs.",
        "We are committed to promoting social inclusion and diversity. Social cohesion requires active work to eliminate prejudice and discrimination, creating truly inclusive environments.",
        "As community organizations, we believe in the power of dialogue and understanding. We support projects that promote cross-cultural exchange and help different groups build mutual trust.",
        "NGOs focus on long-term impacts of social change. We support sustainable social cohesion initiatives that produce lasting positive transformations.",
        "We are committed to creating social capital. Social cohesion requires investment in community relationships and networks, promoting cooperation among different groups.",
        "From an advocacy perspective, we support policies that promote cultural diversity. Social cohesion requires recognizing and celebrating all communities' cultural contributions."
      ],
      citizen: [
        "As a citizen, I want practical solutions that make daily life better for everyone. Cultural diversity is great, but we also need common ground. Simple things like community events and shared spaces help us understand each other better.",
        "We ordinary people care most about cost of living and quality of life. Social cohesion is important, but it shouldn't increase our financial burden. We need affordable and effective solutions.",
        "From a daily life perspective, I want to see more practical activities and projects. Theory is good, but we need concrete initiatives we can participate in, allowing people from different backgrounds to truly interact.",
        "As taxpayers, I want to see effective use of government funds. Social cohesion projects must produce real results, not waste resources.",
        "We ordinary people need simple, understandable solutions. Complex policies are too abstract for us. We need activities we can directly participate in and experience.",
        "From a family perspective, I want my children to grow up in a multicultural environment. Social cohesion needs to start with education, teaching children respect and understanding from a young age.",
        "We care about how these initiatives affect our daily lives. Social cohesion is good, but we need to ensure it doesn't bring inconvenience or extra costs.",
        "As community members, I want to see more opportunities for neighborhood interaction. Social cohesion needs to start locally, through daily communication and cooperation.",
        "We ordinary people need practical tools and resources. Social cohesion projects should provide concrete guidance and support to help us better understand and participate.",
        "From personal experience, true understanding comes from direct contact. We need more opportunities for people from different backgrounds to meet face-to-face.",
        "We care about the long-term impact of these initiatives. Social cohesion needs sustainable methods to ensure they can continuously produce positive effects.",
        "As ordinary citizens, I want to see more community-led initiatives. Social cohesion should reflect our community's real needs and aspirations."
      ],
      student: [
        "From a student's perspective, we need more educational programs that teach cultural appreciation from a young age. Technology can help connect different communities. We should focus on youth-led initiatives that promote cross-cultural understanding.",
        "We young people have innovative ideas and digital skills. Social cohesion can be achieved through social media, online platforms, and digital tools. Let's use technology to create inclusive spaces.",
        "As future leaders, we believe in the power of youth. Social cohesion needs youth participation and leadership because we are the drivers of social change.",
        "We students focus on the impact of globalization. Social cohesion needs international perspectives, learning from other countries' success stories while maintaining our cultural identity.",
        "From an innovation perspective, we believe social cohesion needs new approaches. Traditional solutions may not be enough. We need creative thinking and experimental projects.",
        "We young people value diversity and inclusion. Social cohesion must reflect our generation's values, including equality, justice, and sustainable development.",
        "As digital natives, we believe in the power of technology. Social cohesion can be enhanced through digital platforms, virtual reality, and artificial intelligence.",
        "We students focus on future challenges. Social cohesion needs to consider long-term trends like climate change, technological advancement, and social transformation.",
        "From a learning perspective, we believe education is key to social cohesion. We need more cross-cultural education programs to help young people understand and appreciate diversity.",
        "We young people have entrepreneurial spirit. Social cohesion can be achieved through social enterprises, innovative projects, and youth entrepreneurship.",
        "As social media users, we understand the power of connection. Social cohesion needs to leverage digital tools and platforms to create both virtual and real community spaces.",
        "We students value practical learning. Social cohesion projects should provide real experiences and skills to help young people become better community members."
      ]
    };
    
    // 随机选择一个预设回答
    const agentResponses = fallbackResponses[agentId as keyof typeof fallbackResponses];
    if (agentResponses && Array.isArray(agentResponses)) {
      const randomIndex = Math.floor(Math.random() * agentResponses.length);
      return agentResponses[randomIndex];
    }
    
    return `${persona.name}: 暂时无法参与讨论`;
    
    // 原始API调用代码（暂时注释，使用 DeepSeek）
    /*
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Please respond strictly within 40-100 words, expressing concise and impactful views based on your role characteristics' }
      ],
      temperature: 0.8,
      max_tokens: 150
    });

    return completion.choices[0]?.message?.content?.trim() || `${persona.name}: Unable to respond at the moment`;
    */
  } catch (error) {
    console.error(`Agent ${agentId} error:`, error);
    return `${persona.name}: Unable to respond at the moment`;
  }
}

// 流式响应处理
function createStreamResponse(agentResponses: { agentId: string; content: string }[]) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const response of agentResponses) {
          const persona = AGENT_PERSONAS[response.agentId as keyof typeof AGENT_PERSONAS];
          
          // 发送Agent信息
          const agentInfo = {
            type: 'agent_start',
            agentId: response.agentId,
            name: persona.name,
            color: persona.color
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(agentInfo)}\n\n`));
          
          // 逐字发送内容
          for (let i = 0; i < response.content.length; i++) {
            const char = response.content[i];
            const chunk = {
              type: 'content',
              agentId: response.agentId,
              content: char
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            
            // 模拟打字延迟
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // 发送完成信号
          const endSignal = {
            type: 'agent_end',
            agentId: response.agentId
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(endSignal)}\n\n`));
          
          // Agent间停顿
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 发送结束信号
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
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
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      message, 
      selectedAgents, 
      context, 
      conversationHistory = [] 
    } = body;

    if (!selectedAgents || selectedAgents.length === 0) {
      return NextResponse.json(
        { error: '请至少选择一个讨论参与者' },
        { status: 400 }
      );
    }

    // 构建对话历史
    const messages: BaseMessage[] = conversationHistory.map((msg: any) => 
      msg.role === 'user' 
        ? new HumanMessage(msg.content)
        : new AIMessage({ content: msg.content, name: msg.name || 'AI' })
    );

    // 生成Agent回复 - 顺序生成以便互相参考
    const agentResponses: { agentId: string; content: string }[] = [];
    const aiMessages: AIMessage[] = [];
    
    for (const agentId of selectedAgents) {
      if (AGENT_PERSONAS[agentId as keyof typeof AGENT_PERSONAS]) {
        try {
          const content = await generateAgentResponse(
            agentId,
            context || {},
            messages,
            message,
            aiMessages // 传入之前Agent的回复
          );
          
          agentResponses.push({ agentId, content });
          
          // 添加到AI消息列表，供后续Agent参考
          const aiMessage = new AIMessage({
            content,
            name: AGENT_PERSONAS[agentId as keyof typeof AGENT_PERSONAS].name
          });
          aiMessages.push(aiMessage);
          
        } catch (error) {
          console.error(`Error generating response for agent ${agentId}:`, error);
          const errorContent = `暂时无法参与讨论`;
          agentResponses.push({ agentId, content: errorContent });
        }
      }
    }
    
    // 返回流式响应
    return createStreamResponse(agentResponses);

  } catch (error) {
    console.error('Multi-agent chat error:', error);
    return NextResponse.json(
      { error: '多角色对话服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}