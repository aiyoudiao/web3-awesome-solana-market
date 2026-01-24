# PolyScore (Web3 Awesome Solana Market)

![Solana](https://img.shields.io/badge/Solana-Web3-black?style=flat-square&logo=solana)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-AGPLv3-green?style=flat-square)

**PolyScore** 是一个基于 Solana 构建的沉浸式体育/电竞预测市场平台。它打破了传统预测市场的枯燥表格形式，通过 Web3 技术与 3D 可视化交互的结合，为用户提供像“看比赛、切视角”一样直观、有趣的链上竞猜体验。

> 🏆 本项目旨在参加 Solana 黑客松，探索 Consumer Crypto 应用的新形态。

## ✨ 核心特性

- **沉浸式 3D 体验**: 基于 React Three Fiber 打造的“赛博朋克”风格 3D 大厅与市场详情页，让交易不再单调。
- **双模式切换**: 支持一键切换 **2D 极简模式** (高效交易) 与 **3D 沉浸模式** (视觉享受)。
- **Solana 极速结算**: 利用 Solana 的高 TPS 与低 Gas 特性，实现毫秒级下单与即时链上交互。
- **社交化挑战**: 生成专属“挑战卡片”，支持一键分享至 Twitter/Telegram，邀请好友链上对决。
- **实时动态**: 集成实时赔率变化与弹幕式交易流，营造紧张刺激的观赛氛围。

## 🛠 技术栈

本项目采用现代化的全栈开发架构：

### 前端与交互
- **框架**: [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS + Framer Motion (动画)
- **3D 引擎**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + Drei + Three.js
- **状态管理**: Zustand + TanStack Query

### 区块链与 Web3
- **网络**: Solana (Devnet/Mainnet)
- **SDK**: `@solana/web3.js`
- **钱包适配**: Solana Wallet Adapter (支持 Phantom, Solflare, Backpack 等)

### 后端与数据
- **BaaS**: [Supabase](https://supabase.com/) (PostgreSQL 数据库)
- **API**: Next.js API Routes (Serverless)

## 🚀 快速开始

### 前置要求
- [Node.js](https://nodejs.org/) (推荐 v20 LTS 或更高版本)
- [pnpm](https://pnpm.io/) (包管理器)
- 一个 Solana 钱包 (如 Phantom)

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/web3-awesome-solana-market.git
cd web3-awesome-solana-market
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置环境变量
复制 `.env.example` (如果不存在则手动创建) 到 `.env.local` 并填入必要的配置：

```bash
# .env.local

# Supabase 配置 (必填)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 启动开发服务器
```bash
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始体验。

## 📂 项目结构

```
src/
├── app/                 # Next.js App Router 页面与 API 路由
│   ├── api/             # 后端 API 逻辑 (创建市场, 用户数据, 下注)
│   ├── market/          # 市场详情页
│   ├── create/          # 创建预测页
│   └── ...
├── components/          # React 组件
│   ├── 3d/              # 3D 场景组件 (Avatar, Environment, Models)
│   ├── ui/              # 通用 UI 组件 (Buttons, Modals)
│   └── ...
├── lib/                 # 工具函数, API 封装, Store 定义
└── hooks/               # 自定义 React Hooks
```

## 🗺️ 路线图 (Roadmap)

- [x] **Phase 1: 原型验证**
    - [x] 基础市场列表与详情页
    - [x] 3D 场景搭建与漫游
    - [x] Solana 钱包连接与模拟下注
- [ ] **Phase 2: 智能合约集成**
    - [ ] 集成 Solana Program (Anchor) 实现链上资金托管
    - [ ] 预言机 (Oracle) 接入 (如 Pyth/Switchboard) 自动结算
- [ ] **Phase 3: 社交与生态**
    - [ ] 完善排行榜与 NFT 勋章系统
    - [ ] 推出“预测挖矿”激励机制

## 📄 许可证

本项目采用 **AGPLv3** 许可证。详情请参阅 [LICENSE](./LICENSE) 文件。

---

*Built with ❤️ on Solana*


