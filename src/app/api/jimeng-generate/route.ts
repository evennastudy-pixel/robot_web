import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 即梦 API 配置
const JIMENG_CONFIG = {
  host: 'visual.volcengineapi.com',
  region: 'cn-north-1',
  endpoint: 'https://visual.volcengineapi.com',
  service: 'cv',
  method: 'POST'
};

// 密钥从环境变量读取，不设默认值（避免泄露）
function getAccessKey(): string {
  return process.env.JIMENG_ACCESS_KEY || '';
}

// 处理SECRET_KEY：可能是Base64编码，需要解码
function decodeSecretKey(secretKey: string): string {
  // 尝试Base64解码（可能有多层编码）
  try {
    let decoded = secretKey;
    let lastDecoded = '';
    
    // 最多尝试3次解码（处理多层Base64编码）
    for (let i = 0; i < 3; i++) {
      try {
        lastDecoded = decoded;
        decoded = Buffer.from(decoded, 'base64').toString('utf-8');
        
        // 如果解码后是空字符串或与原值相同，停止解码
        if (!decoded || decoded === lastDecoded) {
          break;
        }
        
        // 如果解码后的字符串不再像Base64编码（没有等号或长度显著变短），使用它
        if (!decoded.includes('=') && decoded.length < secretKey.length * 0.8) {
          return decoded;
        }
      } catch (e) {
        // Base64解码失败，返回上一次成功解码的值
        return lastDecoded || secretKey;
      }
    }
    
    // 如果解码后和原始值不同，使用解码后的值
    if (decoded !== secretKey && decoded.length > 0) {
      return decoded;
    }
  } catch (e) {
    // Base64解码失败，使用原始值
  }
  
  return secretKey;
}

function getSecretKey(): string {
  const raw = process.env.JIMENG_SECRET_KEY || '';
  return raw ? decodeSecretKey(raw) : '';
}

// 不参与签名的header（注意：CV服务需要content-type参与签名，所以不在忽略列表中）
const HEADER_KEYS_TO_IGNORE = new Set([
  'authorization',
  'content-length',
  'user-agent',
  'presigned-expires',
  'expect',
]);

/**
 * HMAC-SHA256（基于官方示例）
 */
function hmac(secret: string | Buffer, str: string): Buffer {
  return crypto.createHmac('sha256', secret).update(str, 'utf8').digest();
}

/**
 * SHA256 hash（基于官方示例）
 */
function hash(str: string): string {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * 获取当前UTC时间（基于官方示例）
 */
function getDateTimeNow(): string {
  const now = new Date();
  return now.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

/**
 * URI转义（基于官方示例）
 */
function uriEscape(str: string): string {
  try {
    return encodeURIComponent(str)
      .replace(/[^A-Za-z0-9_.~\-%]+/g, escape)
      .replace(/[*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
  } catch (e) {
    return '';
  }
}

/**
 * Query参数转字符串（基于官方示例）
 */
function queryParamsToString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => {
      const val = params[key];
      if (typeof val === 'undefined' || val === null) {
        return undefined;
      }
      const escapedKey = uriEscape(key);
      if (!escapedKey) {
        return undefined;
      }
      return `${escapedKey}=${uriEscape(val)}`;
    })
    .filter((v) => v)
    .join('&');
}

/**
 * 获取签名Headers（基于官方示例）
 */
function getSignHeaders(
  originHeaders: Record<string, string>,
  needSignHeaders: string[] = []
): [string, string] {
  function trimHeaderValue(header: string): string {
    return header.toString().trim().replace(/\s+/g, ' ');
  }

  let h = Object.keys(originHeaders);
  
  // 根据 needSignHeaders 过滤
  if (Array.isArray(needSignHeaders) && needSignHeaders.length > 0) {
    const needSignSet = new Set([...needSignHeaders, 'x-date'].map((k) => k.toLowerCase()));
    h = h.filter((k) => needSignSet.has(k.toLowerCase()));
  }
  
  // 根据 ignore headers 过滤
  h = h.filter((k) => !HEADER_KEYS_TO_IGNORE.has(k.toLowerCase()));
  
  const signedHeaderKeys = h
    .slice()
    .map((k) => k.toLowerCase())
    .sort()
    .join(';');
  
  const canonicalHeaders = h
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
    .map((k) => `${k.toLowerCase()}:${trimHeaderValue(originHeaders[k])}`)
    .join('\n');
  
  return [signedHeaderKeys, canonicalHeaders];
}

/**
 * V4签名（完全基于官方示例）
 */
function sign(params: {
  headers: Record<string, string>;
  query: Record<string, string>;
  method: string;
  pathName: string;
  bodySha: string;
  accessKey: string;
  secretKey: string;
}): string {
  const {
    headers = {},
    query = {},
    method = 'POST',
    pathName = '/',
    bodySha = '',
    accessKey,
    secretKey,
  } = params;

  const datetime = headers['X-Date'];
  const date = datetime.substring(0, 8); // YYYYMMDD

  const [signedHeaders, canonicalHeaders] = getSignHeaders(headers);
  
  const canonicalRequest = [
    method.toUpperCase(),
    pathName,
    queryParamsToString(query) || '',
    `${canonicalHeaders}\n`,
    signedHeaders,
    bodySha || hash(''),
  ].join('\n');

  const credentialScope = [date, JIMENG_CONFIG.region, JIMENG_CONFIG.service, 'request'].join('/');

  const stringToSign = [
    'HMAC-SHA256',
    datetime,
    credentialScope,
    hash(canonicalRequest)
  ].join('\n');

  const kDate = hmac(secretKey, date);
  const kRegion = hmac(kDate, JIMENG_CONFIG.region);
  const kService = hmac(kRegion, JIMENG_CONFIG.service);
  const kSigning = hmac(kService, 'request');
  const signature = hmac(kSigning, stringToSign).toString('hex');

  return [
    'HMAC-SHA256',
    `Credential=${accessKey}/${credentialScope},`,
    `SignedHeaders=${signedHeaders},`,
    `Signature=${signature}`,
  ].join(' ');
}

/**
 * 提交任务（即梦4.0 - 与Python代码一致）
 * 返回 { taskId, error? }
 */
async function submitTask(prompt: string, size: number = 4194304, forceSingle: boolean = false): Promise<{ taskId?: string; error?: string }> {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 提交即梦4.0任务');
  console.log('='.repeat(60));
  console.log(`📝 Prompt: "${prompt.slice(0, 50)}..."`);

  const query = {
    Action: 'CVSync2AsyncSubmitTask',
    Version: '2022-08-31'
  };

  const body = {
    req_key: 'jimeng_t2i_v40',
    prompt: prompt,
    size: size,
    force_single: forceSingle
  };

  const bodyString = JSON.stringify(body);
  const bodySha = hash(bodyString);

  const headers = {
    'X-Date': getDateTimeNow(),
    'Host': JIMENG_CONFIG.host,
    'Content-Type': 'application/json',
    'X-Content-Sha256': bodySha,
  };

  const accessKey = getAccessKey();
  const secretKey = getSecretKey();
  const authorization = sign({
    headers,
    query,
    method: 'POST',
    pathName: '/',
    bodySha,
    accessKey,
    secretKey,
  });

  const requestUrl = `${JIMENG_CONFIG.endpoint}?${queryParamsToString(query)}`;

  console.log(`📤 请求URL: ${requestUrl}`);
  console.log(`📝 请求Body:`, body);

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Authorization': authorization,
      },
      body: bodyString,
    });

    const responseText = await response.text();
    console.log(`📥 响应状态: ${response.status} ${response.statusText}`);
    console.log(`📥 响应内容:`, responseText);

    if (!response.ok) {
      let errMsg = `请求失败: ${response.status}`;
      try {
        const errJson = JSON.parse(responseText);
        const apiErr = errJson?.ResponseMetadata?.Error || errJson?.ResponseMetadata?.error;
        const bizMsg = errJson?.message || errJson?.Message;
        if (apiErr?.Message) errMsg = apiErr.Message;
        else if (apiErr?.Code) errMsg = `${apiErr.Code}: ${apiErr.Message || errMsg}`;
        else if (bizMsg) errMsg = bizMsg;
      } catch (_) {}
      if (response.status === 401) {
        errMsg = 'API 认证失败，请检查 JIMENG_ACCESS_KEY 和 JIMENG_SECRET_KEY 是否正确配置';
      } else if (response.status === 403) {
        errMsg = 'API 无权限，请确认即梦 API 已开通且账号余额充足';
      }
      console.error(`❌ ${errMsg}`);
      return { error: errMsg };
    }

    const data = JSON.parse(responseText);

    if (data.code && data.code !== 10000) {
      const msg = data.message || data.Message || `业务错误 code: ${data.code}`;
      console.error(`❌ ${msg}`);
      return { error: msg };
    }

    if (data.data?.task_id) {
      console.log(`✅ 任务提交成功！task_id: ${data.data.task_id}`);
      return { taskId: data.data.task_id };
    }
    console.error('❌ 未获取到 task_id');
    return { error: '接口未返回 task_id，请稍后重试' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '网络请求异常';
    console.error('❌ 请求异常:', error);
    return { error: msg };
  }
}

/**
 * 查询任务结果
 */
async function queryTask(
  taskId: string,
  maxRetries: number = 60,
  retryInterval: number = 2000
): Promise<string[] | null> {
  console.log(`\n🔍 开始查询任务结果...`);

  for (let i = 0; i < maxRetries; i++) {
    console.log(`🔄 查询 #${i + 1}/${maxRetries}...`);

    const query = {
      Action: 'CVSync2AsyncGetResult',
      Version: '2022-08-31'
    };

    const reqJson = { return_url: true };
    const body = {
      req_key: 'jimeng_t2i_v40',
      task_id: taskId,
      req_json: JSON.stringify(reqJson)
    };

    const bodyString = JSON.stringify(body);
    const bodySha = hash(bodyString);

    const headers = {
      'X-Date': getDateTimeNow(),
      'Host': JIMENG_CONFIG.host,
      'Content-Type': 'application/json',
      'X-Content-Sha256': bodySha,
    };

    const accessKey = getAccessKey();
    const secretKey = getSecretKey();
    const authorization = sign({
      headers,
      query,
      method: 'POST',
      pathName: '/',
      bodySha,
      accessKey,
      secretKey,
    });

    const requestUrl = `${JIMENG_CONFIG.endpoint}?${queryParamsToString(query)}`;

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Authorization': authorization,
        },
        body: bodyString,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 查询失败: ${response.status}`, errorText);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        continue;
      }

      const data = await response.json();

      if (data.data && data.data.status) {
        const status = data.data.status;
        console.log(`  📊 状态: ${status}`);

        if (status === 'done') {
          if (data.code === 10000) {
            console.log('✅ 图片生成成功！');

            if (data.data.image_urls && data.data.image_urls.length > 0) {
              console.log(`🖼️  获取到 ${data.data.image_urls.length} 张图片`);
              return data.data.image_urls;
            } else if (data.data.binary_data_base64 && data.data.binary_data_base64.length > 0) {
              console.log(`🖼️  获取到 ${data.data.binary_data_base64.length} 张图片（Base64）`);
              return data.data.binary_data_base64;
            } else {
              console.error('❌ 未找到图片数据');
              return null;
            }
          } else {
            console.error(`❌ 生成失败，code: ${data.code}, message: ${data.message}`);
            return null;
          }
        } else if (status === 'in_queue' || status === 'generating') {
          await new Promise(resolve => setTimeout(resolve, retryInterval));
          continue;
        } else if (status === 'not_found') {
          console.error('❌ 任务未找到');
          return null;
        } else if (status === 'expired') {
          console.error('❌ 任务已过期');
          return null;
        }
      }

      await new Promise(resolve => setTimeout(resolve, retryInterval));
    } catch (error) {
      console.error('❌ 查询异常:', error);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }

  console.error(`❌ 查询超时（${maxRetries}次）`);
  return null;
}

/**
 * 主API接口
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.JIMENG_ACCESS_KEY || !process.env.JIMENG_SECRET_KEY) {
      return NextResponse.json(
        { error: '即梦 API 未配置，请在 .env.local 中设置 JIMENG_ACCESS_KEY 和 JIMENG_SECRET_KEY' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '提示词不能为空' },
        { status: 400 }
      );
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎨 即梦4.0图片生成');
    console.log('='.repeat(60));

    // 1. 提交任务
    const submitResult = await submitTask(prompt);
    if (submitResult.error) {
      return NextResponse.json(
        { error: `提交任务失败: ${submitResult.error}` },
        { status: 500 }
      );
    }
    const taskId = submitResult.taskId!;

    // 2. 查询结果
    const imageUrls = await queryTask(taskId);
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: '生成失败' },
        { status: 500 }
      );
    }

    console.log('\n✅ 完成！');
    console.log('='.repeat(60) + '\n');

    return NextResponse.json({
      success: true,
      imageUrl: imageUrls[0],
      allImages: imageUrls,
      taskId: taskId
    });

  } catch (error: any) {
    console.error('❌ 错误:', error);
    return NextResponse.json(
      { error: error.message || '生成失败' },
      { status: 500 }
    );
  }
}
