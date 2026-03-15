import { NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'placeholder',
    baseURL: 'https://api.deepseek.com',
    timeout: 15000,
    maxRetries: 1
  });
}

// 确保这里使用 POST 方法
export async function POST(req: Request) {
  let futureSignal: any = null;
  let localChallenge: any = null;
  
  try {
    // 解析请求数据
    const body = await req.json();
    ({ futureSignal, localChallenge } = body);

    // 验证输入
    if (!futureSignal || !localChallenge) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 暂时直接返回fallback响应，避免API超时问题
    console.log('Using fallback prototyping response to avoid API timeout');
    
    const fallbackPrototypingCard = `Based on the future signal "${futureSignal.title}" and local challenge "${localChallenge.title}", I propose a Community Innovation Hub that combines emotional architecture principles with local problem-solving approaches. This hub would serve as a collaborative space where residents can co-create solutions that address both technological advancement and community needs.`;
    
    return NextResponse.json({ 
      prototypingCard: fallbackPrototypingCard,
      info: 'Using fallback response while optimizing AI prototyping APIs'
    });

  } catch (error) {
    console.error('Error in generate-prototyping:', error);
    
    // 返回一个模拟的原型卡片作为fallback
    const fallbackPrototypingCard = `Based on the future signal "${futureSignal?.title || 'Future Signal'}" and local challenge "${localChallenge?.title || 'Local Challenge'}", I propose a Community Innovation Hub that combines emotional architecture principles with local problem-solving approaches. This hub would serve as a collaborative space where residents can co-create solutions that address both technological advancement and community needs.`;
    
    return NextResponse.json({ 
      prototypingCard: fallbackPrototypingCard,
      error: 'API temporarily unavailable, using fallback response',
      fallback: true
    });
  }
}
