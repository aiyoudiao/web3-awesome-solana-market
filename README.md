# PolyScore (Web3 Awesome Solana Market)

![Solana](https://img.shields.io/badge/Solana-Web3-black?style=flat-square&logo=solana)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-AGPLv3-green?style=flat-square)

**PolyScore** 是一个基于 Solana 构建的沉浸式体育/电竞预测市场平台。它打破了传统预测市场的枯燥表格形式，通过 Web3 技术与 3D 可视化交互的结合，为用户提供像“看比赛、切视角”一样直观、有趣的链上竞猜体验。

> 🏆 本项目旨在参加 Solana 黑客松，探索 Consumer Crypto 应用的新形态。

> ⚠️ **关于在线演示**: GitHub 仓库 Website 设置的访问地址 prediction-market-dapp.netlify.app 仅为 **部分纯前端 UI 演示**，由于时间仓促，连接智能合约与后端服务的功能并未在线上联调。如需体验完整交互功能，请参考下方的 [快速开始](#-快速开始) 在本地运行完整版，本地版本包含了 **前后端+智能合约测试的完整交互版本**。

## 🎥 演示视频

> 观看项目演示，感受沉浸式 Web3 预测市场的魅力。

[点击观看演示视频](./video/4ba995fdf31165b0409552e043d2d151_raw.mp4)

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
- **合约框架**: [Anchor](https://www.anchor-lang.com/) (Rust)
- **SDK**: `@solana/web3.js`
- **钱包适配**: Solana Wallet Adapter (支持 Phantom, Solflare, Backpack 等)

### 后端与数据
- **BaaS**: [Supabase](https://supabase.com/) (PostgreSQL 数据库)
- **API**: Next.js API Routes (Serverless)

## 🚀 快速开始

### 前置要求
- [Node.js](https://nodejs.org/) (推荐 v20 LTS 或更高版本)
- [pnpm](https://pnpm.io/) (包管理器)
- [Rust & Anchor](https://www.anchor-lang.com/docs/installation) (用于合约开发与部署)
- [Solana CLI](https://docs.solanalabs.com/cli/install) (用于链上交互)
- 一个 Solana 钱包 (如 Phantom)

### 1. 克隆项目
```bash
git clone https://github.com/aiyoudiao/web3-awesome-solana-market.git
cd web3-awesome-solana-market
```

### 2. 智能合约部署 (Contract)

本项目包含完整的 Solana 智能合约 (`soldora`)。在运行前端之前，建议先在本地环境 (Localnet) 部署合约。

```bash
# 进入合约目录
cd contract

# 安装依赖
yarn install

# 构建合约
anchor build
```

#### 启动本地测试链
打开一个新的终端窗口，启动 Solana 本地验证器节点：
```bash
solana-test-validator
```

#### 部署合约
回到原来的终端，配置 Solana CLI 使用本地网络并部署：

```bash
# 配置为本地网络
solana config set --url localhost

# (可选) 领取本地测试币
solana airdrop 100

# 部署合约
anchor deploy
```

> 💡 **提示**: 
> 1. 部署成功后，请将生成的 Program ID 更新到 `Anchor.toml` 和前端 IDL 文件 `src/idl/soldora.json` 中的 `address` 字段。
> 2. 如果修改了 Program ID，需要重新运行 `anchor build` 和 `anchor deploy`。

### 3. 前端启动 (Frontend)

回到项目根目录，启动前端应用。

```bash
# 回到根目录
cd ..

# 安装依赖
pnpm install

# 配置环境变量
# 复制 .env.example 到 .env.local 并填入 Supabase 配置
cp .env.example .env.local
```

```bash
# 启动开发服务器
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始体验。

## 📂 项目结构

```
.
├── contract/              # Solana 智能合约 (Anchor 框架)
│   ├── programs/          # 合约源码 (Rust)
│   ├── tests/             # 合约测试
│   └── Anchor.toml        # Anchor 配置文件
├── src/
│   ├── app/               # Next.js App Router 页面与 API 路由
│   │   ├── api/           # 后端 API 逻辑 (创建市场, 用户数据, 下注)
│   │   ├── market/        # 市场详情页
│   │   ├── create/        # 创建预测页
│   │   └── ...
│   ├── components/        # React 组件
│   │   ├── 3d/            # 3D 场景组件 (Avatar, Environment, Models)
│   │   ├── ui/            # 通用 UI 组件 (Buttons, Modals)
│   │   └── ...
│   ├── lib/               # 工具函数, API 封装, Store 定义
│   └── hooks/             # 自定义 React Hooks
├── supabase/              # Supabase 数据库迁移文件
├── video/                 # 项目演示视频
└── ...
```

## 🗺️ 路线图 (Roadmap)

### ✅ Phase 1: 核心功能与 MVP (已完成)
- **沉浸式交互**: 
  - [x] 搭建 Cyberpunk 风格 3D 大厅与市场场景 (R3F)
  - [x] 实现 2D/3D 视图一键无缝切换
- **智能合约 (Soldora)**:
  - [x] 基于 Anchor 构建预测市场核心合约
  - [x] 实现 Create Event (管理员), Bet (用户), Resolve (结算), Redeem (兑奖)
  - [x] 2% 手续费 Treasury 机制
- **基础业务**:
  - [x] Solana 钱包连接 (Wallet Adapter)
  - [x] 市场列表与详情页展示
  - [x] 实时评论系统 (Supabase)
  - [x] 个人中心与下注记录

### 🚧 Phase 2: 协议增强与去中心化 (进行中)
- **多币种支持**: 
  - [ ] 支持 USDC/USDT 等 SPL Token 下注 (目前仅支持 SOL)
- **去中心化治理 (DAO)**:
  - [ ] 引入预言机 (Pyth/Chainlink) 实现自动化结果喂价，减少管理员干预
  - [ ] 争议解决机制 (Dispute Resolution): 社区投票裁决争议结果
- **流动性增强**:
  - [ ] 引入 AMM (自动做市商) 机制，支持随时买卖头寸 (目前为持有到期)

### 🔮 Phase 3: 社交化与生态扩展 (规划中)
- **SocialFi 融合**:
  - [ ] **预测挖矿**: 下注即挖矿，根据交易量奖励平台代币
  - [ ] **跟单系统**: 允许用户关注“预测大神”并一键跟单
  - [ ] **NFT 勋章**: 根据胜率和参与度发放动态 NFT 勋章
- **移动端适配**:
  - [ ] 推出 PWA 版本或 React Native 移动端 App
  - [ ] 优化移动端 3D 性能与触摸交互
- **AI 辅助**:
  - [ ] 集成 AI 分析师，基于历史数据提供赛事预测参考

## 📄 许可证

本项目采用 **AGPLv3** 许可证。详情请参阅 [LICENSE](./LICENSE) 文件。

---

*Built with ❤️ on Solana*

## 💖 致谢

特别感谢以下小伙伴，作为 Web3 Solana 的初学者，他们在无数个深夜里并肩作战，克服重重困难，最终完成了这个项目。你们的坚持与努力是 PolyScore 诞生的关键！

- [peihao](https://github.com/aiyoudiao)
- [Jade](https://github.com/JadeTwinkle)
- [bcy97](https://github.com/bcy97)
- [Livian](https://github.com/TLwen114514)
