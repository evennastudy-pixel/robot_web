import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { ChatCompletionMessageParam } from 'openai/resources';

// 创建 DeepSeek 客户端实例（使用 OpenAI SDK，因为 API 兼容）
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
  timeout: 60000, // 设置60秒超时
  maxRetries: 3,  // 最大重试次数
});

export async function POST(request: Request) {
  console.log('API路由被调用');
  
  try {
    // 检查API密钥
    if (!process.env.DEEPSEEK_API_KEY && !openai.apiKey) {
      console.error('API密钥未设置');
      return new NextResponse(
        JSON.stringify({ error: 'DeepSeek API密钥未配置' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 解析请求体
    let body;
    try {
      body = await request.json();
      console.log('请求体:', body);
    } catch (e) {
      console.error('请求体解析失败:', e);
      return new NextResponse(
        JSON.stringify({ error: '无效的请求数据' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, selectedChallenge } = body;

    if (!message) {
      console.error('消息内容为空');
      return new NextResponse(
        JSON.stringify({ error: '消息内容不能为空' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('准备发送到OpenAI的数据');

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant helping users explore local challenges in the Aizu region.

        Current topic: ${selectedChallenge ? JSON.stringify(selectedChallenge) : 'No topic selected'}

        Your response should be in this format:
        TITLE: [A short 3-5 word title for a new challenge]
        CONTENT: [Your main response in 50-80 words]

        Guidelines:
        1. Title should be concise and capture the key point
        2. Use plain English text
        3. Focus on practical insights
        4. Be direct and clear
        5. Maintain a professional tone`
      },
      {
        role: "user",
        content: message
      }
    ];

    console.log('调用 DeepSeek API');
    
    try {
      console.log('开始调用 DeepSeek API，配置:', {
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 1000,
        messages: messages
      });
      
      // 添加重试逻辑
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          const completion = await openai.chat.completions.create({
            messages,
            model: "deepseek-chat",
            temperature: 0.7,
            max_tokens: 1000
          });

          console.log('DeepSeek 响应成功:', completion);

          if (completion.choices[0].message.content) {
            // Parse the response to extract title and content
            const responseText = completion.choices[0].message.content || '';
            const titleMatch = responseText.match(/TITLE:\s*([\s\S]+?)(?=\s*CONTENT:|$)/);
            const contentMatch = responseText.match(/CONTENT:\s*([\s\S]+)$/);

            const title = titleMatch ? titleMatch[1].trim() : 'New Challenge';
            const content = contentMatch ? contentMatch[1].trim() : responseText.trim();

          return new NextResponse(
              JSON.stringify({ 
                reply: content,
                title: title
              }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
          }
        } catch (error: any) {
          lastError = error;
          console.error(`DeepSeek API 调用失败，剩余重试次数: ${retries - 1}`, {
            error: error.message,
            code: error.code,
            type: error.type
          });
          
          if (retries > 1) {
            // 使用指数退避策略
            const delay = Math.pow(2, 4 - retries) * 1000; // 1秒, 2秒, 4秒
            console.log(`等待 ${delay/1000} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          retries--;
        }
      }
      
      // 所有重试都失败后抛出最后一个错误
      throw lastError;
      
    } catch (deepseekError: any) {
      console.error('DeepSeek API 调用最终失败，详细错误:', {
        error: deepseekError,
        message: deepseekError?.message,
        status: deepseekError?.status,
        response: deepseekError?.response,
        code: deepseekError?.code,
        type: deepseekError?.type
      });
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'AI服务暂时不可用，请稍后重试',
          details: deepseekError?.message || '未知错误'
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('整体错误:', error);
    return new NextResponse(
      JSON.stringify({ error: '服务器内部错误' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 