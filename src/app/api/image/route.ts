import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// FAL AI API 配置 - 使用Flux Pro模型
const falConfig = {
  name: 'FAL-AI',
  apiKey: process.env.FAL_KEY || 'c82b8cd1-41e9-453b-bfa5-e01b9eb36c1c:5f0f4c3d2768dca4cb32b0291673d500',
  apiUrl: process.env.FAL_API_URL || 'https://fal.run/fal-ai/flux-pro',
  timeout: 60000,
  maxRetries: 2
};

      // FAL AI专用的图像生成函数
      async function generateImageWithFAL(prompt: string, style: string, year: string) {
        // 根据风格调整提示词
        let enhancedPrompt = prompt;
        switch (style) {
          case 'positive':
            enhancedPrompt = `${prompt}, optimistic future, bright colors, innovative technology, hope, prosperity`;
            break;
          case 'neutral':
            enhancedPrompt = `${prompt}, realistic future, balanced perspective, neutral colors`;
            break;
          case 'negative':
            enhancedPrompt = `${prompt}, challenging future, dark tones, dystopian elements, caution`;
            break;
        }

        const response = await fetch(falConfig.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${falConfig.apiKey}`
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            num_images: 1
          })
        });

        if (!response.ok) {
          throw new Error(`FAL API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('FAL API response:', JSON.stringify(data, null, 2));

        // 检查响应格式
        if (data.images && data.images.length > 0) {
          // 如果返回的是图像URL
          return data.images[0].url;
        } else if (data.image && data.image.url) {
          // 如果返回的是单个图像URL
          return data.image.url;
        } else if (data.image_url) {
          // 如果直接返回image_url字段
          return data.image_url;
        }

        throw new Error('No image URL found in FAL response');
      }

// 备用客户端列表（如果 FAL AI 不可用时使用）
const fallbackClients = [
  // DeepSeek API（使用 OpenAI SDK，因为 API 兼容）
  new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    timeout: 60000,
    maxRetries: 2
  })
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interpretation, year, style } = body;

    if (!interpretation || !year || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let imageUrl = '';
    let usedMethod = '';
    let falSuccess = false;

    // 尝试使用FAL AI生成图像
    try {
      console.log('Trying FAL AI for image generation...');
      console.log('FAL Config:', { apiKey: falConfig.apiKey.substring(0, 20) + '...', apiUrl: falConfig.apiUrl });
      imageUrl = await generateImageWithFAL(interpretation, style, year);
      usedMethod = `${falConfig.name} Flux Pro`;
      falSuccess = true;
      console.log('FAL AI API success!');
    } catch (falError) {
      console.log('FAL AI failed:', falError instanceof Error ? falError.message : 'Unknown error');
      console.log('FAL Error details:', falError);
    }

    // 如果FAL AI失败，使用占位符图像
    if (!falSuccess) {
      console.log('Falling back to placeholder image');
      
      // 根据风格生成不同的占位符图像
      let placeholderColor = '#5157E8';
      let placeholderText = 'Future Headline Image';
      
      switch (style) {
        case 'positive':
          placeholderColor = '#10B981'; // 绿色
          placeholderText = 'Positive Future';
          break;
        case 'neutral':
          placeholderColor = '#6B7280'; // 灰色
          placeholderText = 'Neutral Future';
          break;
        case 'negative':
          placeholderColor = '#EF4444'; // 红色
          placeholderText = 'Challenging Future';
          break;
      }
      
      imageUrl = `https://via.placeholder.com/1024x1024/${placeholderColor.substring(1)}/FFFFFF?text=${encodeURIComponent(`${placeholderText} ${year}`)}`;
      usedMethod = 'enhanced placeholder';
    }

    return NextResponse.json({ 
      imageUrl: imageUrl,
      method: usedMethod,
      info: falSuccess ? 'Successfully generated image with FAL AI' : 'Using enhanced placeholder image',
      style: style,
      year: year,
      interpretation: interpretation,
      fullInterpretation: interpretation, // 保存完整的interpretation用于历史记录
      success: falSuccess
    });

  } catch (error) {
    console.error('Error in image API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}