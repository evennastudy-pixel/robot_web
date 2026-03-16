import { NextResponse } from 'next/server';
import OpenAI from 'openai';

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'placeholder',
    baseURL: 'https://api.deepseek.com',
    timeout: 60000,
    maxRetries: 2,
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY 未配置', success: false },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { theme, userNotes, lang = 'zh' } = body;

    if (!theme) {
      return NextResponse.json(
        { error: '缺少主题数据', success: false },
        { status: 400 },
      );
    }

    if (!userNotes || typeof userNotes !== 'string' || !userNotes.trim()) {
      return NextResponse.json(
        { error: '请先输入你收集到的内容', success: false },
        { status: 400 },
      );
    }

    const isEnglish = lang === 'en';

    const systemPrompt = isEnglish
      ? `You are a design futures expert. You help students refine a clear, concise FUTURE SIGNAL / TOPIC based on a given workshop theme and the user's collected notes.`
      : `你是一名设计未来研究专家，帮助学生在给定工作坊主题下，基于他们收集到的素材，提炼出一个更加清晰、有前瞻性的「未来信号 / 选题」。`;

    const userPrompt = isEnglish
      ? `Theme (design topic):
Title: ${theme.titleEn || theme.title}
Summary: ${theme.summaryEn || theme.summary || ''}
Core Question: ${theme.coreQuestionEn || theme.coreQuestion || ''}

User's collected notes / materials:
${userNotes}

Task:
- Based on the theme AND the user's notes, synthesize ONE clear, focused FUTURE SIGNAL / TOPIC for design exploration.
- Make it specific, actionable and future-oriented (3–10 years).
- It should be related to robots / robot design if possible.

Please respond in the following JSON-like plain text structure (do NOT include markdown code fences):
TITLE: <short 1-line title of the future signal>
ONE_SENTENCE: <one concise sentence summarizing the signal>
WHY_IT_MATTERS: <3–5 bullet points explaining importance and context>
DESIGN_DIRECTIONS: <3–5 bullet points of concrete design directions / questions>`
      : `设计主题：
标题：${theme.title || ''}
英文标题：${theme.titleEn || ''}
简介：${theme.summary || ''}
核心问题：${theme.coreQuestion || ''}

用户收集到的内容（素材、观察、案例等）：
${userNotes}

任务：
- 在上述主题和素材的基础上，提炼出「一个」更加清晰、聚焦的未来信号 / 选题；
- 要具体、可操作，最好与「机器人 / 机器人设计」相关；
- 关注未来 3～10 年内有可能发生或需要提前布局的情景。

请用下面的结构化格式输出（不要使用 markdown 代码块）：
TITLE：<未来信号/选题的精炼标题（1 行）>
ONE_SENTENCE：<一句话概括这个未来信号>
WHY_IT_MATTERS：
- <3～5 条要点，说明这个信号为什么重要、背后的趋势/矛盾>
DESIGN_DIRECTIONS：
- <3～5 条要点，提出可以进一步设计探索的方向或问题>`;

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // 简单解析结构化文本，方便前端预填到可编辑区域
    const titleMatch = raw.match(/TITLE[:：]\s*(.+)/);
    const oneSentenceMatch = raw.match(/ONE_SENTENCE[:：]\s*([\s\S]*?)(?:\n[A-Z_]+[:：]|$)/);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const oneSentence = oneSentenceMatch ? oneSentenceMatch[1].trim() : '';

    return NextResponse.json({
      success: true,
      raw,
      title,
      oneSentence,
    });
  } catch (error: any) {
    console.error('Error in theme-future-signal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '生成未来信号失败',
      },
      { status: 500 },
    );
  }
}

