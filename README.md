# 🚀 太空设计工作坊 Space Design Workshop

一个创新的AI辅助设计工具平台，帮助用户完成从主题选择到方案设计、审查和视觉呈现的完整设计流程。

---

## ✨ 核心特性

- 🎨 **4个精选太空设计主题** - 具身体验、文化仪式、时间重构、共享空间
- 🤖 **AI多专家协作系统** - 4个AI角色（设计评论家、技术顾问、机器人专家、案例专家）智能参与
- 📝 **智能内容提取** - AI自动识别对话中的设计方法和关键词
- 📊 **精美方案报告** - AI生成多风格HTML报告
- 🖼️ **AI视觉素材生成** - 智能推荐素材类型，生成高质量图片
- 💾 **完整数据持久化** - 跨页面数据保持，支持断点续做

---

## 🎯 四大板块

| 板块 | 功能 | AI能力 |
|------|------|--------|
| 1️⃣ **主题选择** | 选择4个预设主题之一 | - |
| 2️⃣ **AI协作设计** | 10个结构化字段，对话式填写 | 智能角色调度、自动提取设计方法和关键词 |
| 3️⃣ **方案审查** | 生成精美HTML报告 | AI生成详细报告，支持多种风格 |
| 4️⃣ **视觉素材生成** | 生成项目相关图片 | 智能推荐素材类型、优化提示词 |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# DeepSeek API（必需）
DEEPSEEK_API_KEY=your_deepseek_api_key

# FAL AI（必需，用于第四板块图片生成）
FAL_KEY=your_fal_api_key
FAL_API_URL=https://fal.run/fal-ai/flux-pro
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

---

## 📁 项目结构

```
design-future-project-main/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 首页
│   │   ├── workshop/page.tsx           # 工作坊主页
│   │   ├── future-signals/page.tsx     # 板块1：主题选择
│   │   ├── local-challenges/page.tsx   # 板块2：AI协作设计
│   │   ├── interpretation/page.tsx     # 板块3：方案审查
│   │   ├── tomorrow-headlines/page.tsx # 板块4：视觉素材生成
│   │   └── api/                        # API路由
│   ├── components/                     # React组件
│   └── lib/                            # 工具函数
├── public/                             # 静态资源
├── README.md                          # 项目说明（本文档）
├── PROJECT_DESIGN.md                  # 详细设计文档
├── TECHNICAL_GUIDE.md                 # 技术实现指南
└── ENV_SETUP.md                       # 环境配置详解
```

---

## 🛠️ 技术栈

### 前端
- **Next.js 14** - React框架（App Router）
- **TypeScript** - 类型安全
- **TailwindCSS** - 样式框架
- **Axios** - HTTP客户端

### AI服务
- **DeepSeek** - AI对话、内容生成
- **FAL AI Flux Pro** - 第四板块图片生成

---

## 📚 文档索引

### 核心文档
- 📖 [README.md](README.md) - 项目概述和快速开始（本文档）
- 🎨 [PROJECT_DESIGN.md](PROJECT_DESIGN.md) - 详细的项目设计文档
- 🔧 [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) - 技术实现和API说明
- ⚙️ [ENV_SETUP.md](ENV_SETUP.md) - 环境变量配置详解

### 遗留文档（参考用）
- NEW_PROJECT_PLAN.md - 初始项目策划
- SPACE_WORKSHOP_PROJECT.md - 早期项目文档
- BOARD2_REDESIGN.md - 板块2设计文档
- BOARD3_SOLUTION_REVIEW.md - 板块3设计文档
- BOARD4_SIMPLIFIED_DESIGN.md - 板块4设计文档
- 其他技术文档（AI系统、导航系统、数据持久化等）

---

## 🎓 使用指南

### 基本流程

```
1. 选择主题 → 2. AI协作设计 → 3. 生成报告 → 4. 生成视觉素材
```

### 使用建议

- ✅ **充分沟通**: 与AI专家多讨论，获取更好的建议
- ✅ **完善方案**: 确保所有字段都填写完整
- ✅ **尝试风格**: 多试试不同的报告风格
- ✅ **明确描述**: 生成图片时提供详细描述

---

## 🌟 核心亮点

### 1. 智能AI协作
- 4个专业AI角色自动参与
- 无需手动选择，AI自动识别最合适的专家
- 对话式设计体验

### 2. 自动内容提取
- AI识别对话中的设计方法（最多5个）
- 自动提取关键词标签（最多20个）
- 按相关性评分，自动优化

### 3. 数据永不丢失
- 自动保存所有数据
- 跨页面数据保持
- 支持断点续做

### 4. 专业视觉呈现
- AI生成精美HTML报告
- 多种风格选择
- 高质量图片生成

---

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

---

## 📊 项目状态

| 板块 | 状态 | 说明 |
|------|------|------|
| 主题选择 | ✅ 完成 | 4个太空设计主题 |
| AI协作设计 | ✅ 完成 | 智能多专家系统，自动提取 |
| 方案审查 | ✅ 完成 | AI生成HTML报告，多风格 |
| 视觉素材生成 | ⚠️ 开发中 | 即梦API集成中 |

---

## 🐛 问题排查

### 常见问题

**Q: AI没有响应？**  
A: 检查 `DEEPSEEK_API_KEY` 是否正确配置

**Q: 图片生成失败？**  
A: 检查即梦API密钥是否有效，或尝试使用FAL AI备用方案

**Q: 数据丢失？**  
A: 检查浏览器是否允许localStorage，查看控制台错误

**Q: 页面报错？**  
A: 清理 `.next` 缓存：`rm -rf .next`，然后重新启动

---

## 📝 环境变量说明

### 必需配置

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | [DeepSeek平台](https://platform.deepseek.com/) |
| `JIMENG_ACCESS_KEY` | 即梦访问密钥 | [火山引擎控制台](https://console.volcengineapi.com/) |
| `JIMENG_SECRET_KEY` | 即梦密钥 | 火山引擎控制台 |

### 可选配置

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `FAL_KEY` | FAL AI密钥（备用） | [FAL AI平台](https://fal.ai/) |
| `FAL_API_URL` | FAL AI端点 | 默认值已配置 |

详细配置说明请查看 [ENV_SETUP.md](ENV_SETUP.md)

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

## 📄 许可证

MIT License

---

## 🔗 相关资源

- [DeepSeek API文档](https://platform.deepseek.com/docs)
- [即梦4.0 API文档](https://www.volcengine.com/docs/visual)
- [Next.js文档](https://nextjs.org/docs)
- [TailwindCSS文档](https://tailwindcss.com/docs)

---

**项目版本**: v1.0.0  
**最后更新**: 2025-11-07  
**维护者**: AI Assistant

---

## 📞 支持

如有问题或建议，请：
1. 查看 [PROJECT_DESIGN.md](PROJECT_DESIGN.md) 了解详细设计
2. 查看 [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) 了解技术细节
3. 查看 [ENV_SETUP.md](ENV_SETUP.md) 了解配置方法
4. 提交Issue到GitHub

祝使用愉快！🚀✨
