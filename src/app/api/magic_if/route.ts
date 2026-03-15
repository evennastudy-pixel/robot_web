import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
  timeout: 60000,
  maxRetries: 3
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interpretation, templatePrompt } = body;

    if (!interpretation || !templatePrompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `
    基于以下解释内容：
    "${interpretation}"

    请按照以下提示进行分析和扩展：
    ${templatePrompt}

    要求：
    1. 保持专业性和洞察力
    2. 提供具体的分析和见解
    3. 使用 Markdown 格式组织回答
    4. 包含以下部分：
       - 主要观点
       - 具体分析
       - 未来影响
       - 建议与启示
    5. 要求使用英文，注意内容不要太长，300字以内
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({ 
      reply: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error('Error in magic if analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
