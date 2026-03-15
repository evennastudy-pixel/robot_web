# 即梦生图API配置指南

## 问题症状

本地环境报错：
```
401 Unauthorized
SignatureDoesNotMatch
```

但 Vercel 部署环境可以正常运行。

## 解决方案

### 1. 检查环境变量文件

确保 `.env.local` 文件包含以下配置：

```env
JIMENG_ACCESS_KEY=你的AccessKey
JIMENG_SECRET_KEY=你的SecretKey
```

### 2. 获取正确的密钥

密钥应该与 Vercel 环境变量中的一致：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 查看 `JIMENG_ACCESS_KEY` 和 `JIMENG_SECRET_KEY` 的值
5. 将这些值复制到本地的 `.env.local` 文件中

### 3. 关于 Secret Key 的编码

Secret Key 可能是 Base64 编码的，代码会自动处理。两种方式都可以：

**方式 1：直接使用 Base64 编码的值（推荐）**
```env
JIMENG_SECRET_KEY=TURSbE16WmtaRFl5Tnpaa05HWXhOMkV5TURjeE0yWTVPRFJpWlRJNU1ETQ==
```

**方式 2：使用解码后的值**
```env
JIMENG_SECRET_KEY=解码后的值
```

代码会自动检测并解码。

### 4. 重启开发服务器

配置环境变量后，必须重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

### 5. 验证配置

启动服务器后，查看控制台日志：

- ✅ 如果看到警告：`⚠️ 警告: 未检测到环境变量...` → 说明环境变量未加载
- ✅ 如果看到签名错误：检查密钥是否正确

### 6. 调试步骤

如果仍然有问题：

1. **确认环境变量已加载**
   ```bash
   # 在代码中添加临时调试
   console.log('ACCESS_KEY:', process.env.JIMENG_ACCESS_KEY?.substring(0, 8));
   console.log('SECRET_KEY:', process.env.JIMENG_SECRET_KEY?.substring(0, 8));
   ```

2. **检查文件位置**
   - `.env.local` 必须在项目根目录
   - 与 `package.json` 同级

3. **检查文件格式**
   - 每行一个变量
   - 不要有多余的空格
   - 不要用引号包裹（除非值中包含特殊字符）

4. **清理缓存重启**
   ```bash
   rm -rf .next
   npm run dev
   ```

## 常见错误

### 错误 1: 环境变量未加载
**原因**: Next.js 需要在启动时读取环境变量
**解决**: 重启开发服务器

### 错误 2: 密钥格式错误
**原因**: Secret Key 可能需要 Base64 解码
**解决**: 代码已自动处理，确保密钥值正确

### 错误 3: 时间不同步
**原因**: 签名算法依赖时间戳
**解决**: 检查系统时间是否准确

## 快速检查清单

- [ ] `.env.local` 文件存在于项目根目录
- [ ] 文件包含 `JIMENG_ACCESS_KEY` 和 `JIMENG_SECRET_KEY`
- [ ] 密钥值与 Vercel 环境变量一致
- [ ] 已重启开发服务器（`npm run dev`）
- [ ] 控制台没有环境变量警告

如果以上都正确但仍无法工作，请检查密钥是否有效。

