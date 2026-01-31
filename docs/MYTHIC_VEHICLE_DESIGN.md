# 神话赛博载具系统设计文档 (Project Mythic)

## 1. 核心理念 (Core Concept)

本项目旨在打造一个融合**东方神话图腾**与**赛博朋克科技**的终极载具系统。不仅仅是一个静态模型，而是一个能够适应海、陆、空三栖作战的变形机甲。

**关键词**：
- **神话 (Mythic)**：上古神兽（麒麟、鲲、朱雀）的灵魂注入机械躯壳。
- **赛博 (Cyber)**：霓虹光流、能量护盾、全息投影、故障艺术。
- **变形 (Transform)**：实时形态切换，伴随粒子重组特效。

## 2. 三大形态 (The Trinity Modes)

### 2.1 陆地形态：麒麟战车 (The Kylin Cruiser)
- **原型**：CyberCar (幻影)
- **神兽**：麒麟 (Kylin) - 仁兽，踏火而行。
- **外观**：楔形装甲，重型刀片轮毂，底盘散发熔岩橙或电光紫光芒。
- **场景**：赛博荒原 (Cyber Wasteland)，霓虹网格地面，故障风建筑。
- **特效**：轮胎摩擦火花，尾部能量拖尾。

### 2.2 海洋形态：灵鲲游艇 (The Leviathan Yacht)
- **神兽**：鲲 (Leviathan) - 北冥有鱼，其名为鲲。
- **外观**：流线型水滴设计，取消轮毂，改为反重力浮筒或水翼。船身覆盖鳞片状太阳能板。
- **场景**：无尽数字海 (Digital Ocean)，动态波浪，水面反射，深海数据流。
- **特效**：尾部水花粒子，船身周围的声纳波纹。

### 2.3 天空形态：朱雀战机 (The Phoenix Jet)
- **神兽**：朱雀 (Phoenix) - 南方之神，浴火重生。
- **外观**：前掠翼设计，极具攻击性。机翼展开光翼（能量场）。
- **场景**：平流层 (Stratosphere)，云海，极光，空间站背景。
- **特效**：音爆云，引擎喷射火焰，机翼末端的光流。

## 3. 技术架构 (Technical Architecture)

### 3.1 状态管理 (Zustand)
新增 `vehicleMode` 状态：`'car' | 'yacht' | 'jet'`。
所有组件（场景、载具、UI）均订阅此状态，实现联动切换。

### 3.2 组件结构
```
SceneView
├── MythicEnvironment (环境管理器)
│   ├── CyberWasteland (陆地)
│   ├── DigitalOcean (海洋)
│   └── Stratosphere (天空)
├── MythicVehicle (载具管理器)
│   ├── KylinChassis (车身)
│   ├── LeviathanHull (船身)
│   └── PhoenixWings (机翼)
│   └── TransformEffect (变形特效)
└── VehicleHUD (操作界面)
    └── ModeSwitcher (模式切换轮盘)
```

### 3.3 关键技术点
- **Three.js / R3F**：核心渲染引擎。
- **ShaderMaterial**：用于实现流动的能量护盾、动态海面和云层。
- **React Spring / Drei**：用于变形动画的平滑过渡。
- **Web Audio API**：为三种模式定制不同的引擎音效（低沉轰鸣、水流激荡、喷气尖啸）。

### 3.4 视觉预设 (Visual Presets)
在不改变玩法与操控手感的前提下，通过预设快速切换“画面风格/竞技性能”。

- **ESPORTS（赛事）**：极低输入延迟优先；关闭后期（Bloom/色散/噪点/暗角/DOF），DPR 固定 1，渲染器 AA 由画质档位决定但建议关闭。
- **NEON（霓虹）**：默认赛博观感；Bloom 常开，噪点/暗角在非低画质启用，Jet 可启用轻量色散。
- **CINEMATIC（电影）**：镜头质感优先；Ultra + 非俯视镜头启用 DOF，其它后期按画质档位开启并保持克制强度。

### 3.5 编码架构 (Trinity Architecture)
为了让“三大形态”的关键词、交互与渲染策略在代码中可追踪、可扩展、可测试，新增统一的 Registry 层：

- **类型与模式定义**：`src/mythic/types.ts` 定义 `MythicVehicleMode` 等基础类型。
- **三大形态 Registry**：`src/mythic/trinity.ts` 作为唯一事实来源（zh/en 名称、图腾、关键词、场景调色板、标志性特效）。
- **视觉预设 Registry**：`src/mythic/visualPresets.ts` 统一管理预设策略与判定函数（DPR/后期/色散/DOF）。
- **调用规范**：
  - UI 层（HUD）仅渲染 Registry 的 label，并通过 Store 写入 `vehicleMode/visualPreset`。
  - 渲染层（SceneView/Environment）只读 Store 与 Registry，根据策略启用/禁用开销项（例如赛事模式禁用阴影与后期）。

## 4. 开发路线图 (Roadmap)

1.  **Phase 1: 架构搭建** (已完成)
    - 状态定义
    - 文档编写

2.  **Phase 2: 环境系统** (已完成)
    - 实现 `MythicEnvironment` 组件。
    - 集成 Ocean Shader 和 Sky Shader。

3.  **Phase 3: 载具建模与变形** (已完成：基础版)
    - 拆分 `CyberCar`，提取通用核心（驾驶舱）。
    - 制作 `Yacht` 和 `Jet` 的几何体组件。
    - 实现变形逻辑（基础形态切换 + 操控/高度插值 + 变形 VFX）。

4.  **Phase 4: 视觉打磨 (Polishing)** (已完成：基础版)
    - 已完成：光影与后期处理（Bloom、色散、胶片颗粒、暗角）。
    - 已完成：DOF（仅 Ultra + 非俯视镜头启用，避免低配掉帧）。
    - 已完成：变形粒子/扫描环。
    - 已完成：“神话”符文贴花（载具车身 + 陆地地面纹理叠加）。

5.  **Phase 5: 音效与交互** (已完成：基础版)
    - 已完成：三形态声浪配置（Car/Yacht/Jet）。
    - 已完成：HUD 界面（模式切换器）。
    - 已完成：手柄输入（Gamepad API）基础映射（摇杆/扳机/按键切换形态）。

6.  **Phase 6: 性能与美术优化** (进行中：第一轮完成)
    - 已完成：陆地场景按画质档位降低 Stars/Grid 开销，并收敛雾/视距以减少无效绘制。
    - 已完成：天空场景重做（深空配色、云层尺度与构图、远景空间站剪影、极光更协调）。
    - 已完成：水面网格细分与极光 Shader 复杂度按画质/实现侧降本（顶点数与片元负载下降）。
    - 策略：所有开销项与 `useQualityStore` 档位联动，低档位优先帧率与输入响应。

## 5. 分阶段交付记录 (Deliverables)

### 阶段 1：基础框架搭建与关键词映射（已交付）
- 代码：`src/mythic/types.ts`、`src/mythic/trinity.ts`、`src/mythic/visualPresets.ts`
- 交付物：三大形态关键词/调色板/特效清单 Registry；视觉预设策略与判定函数
- 测试：新增 Registry 单元测试（见 `src/mythic/*.test.ts`）

### 阶段 2：形态核心逻辑与交互（已交付）
- 代码：HUD 使用 Registry 统一渲染图腾与预设标签（赛事/霓虹/电影）；切形态时 HUD 自动提示“系统重构”
- 影响面：`VehicleHUD`（UI）→ Store（状态）→ `SceneView`/`MythicEnvironment`（渲染策略）
- 三形态能力落地（载具侧）：
  - 麒麟战车：漂移时触发轮胎火花/能量碎屑（Sparkles），尾部能量拖尾
  - 灵鲲游艇：浮筒/水翼结构，尾迹拖尾（wake trail），船体声纳波纹（扩散环）
  - 朱雀战机：机翼末端光流拖尾（wingtip trails），高速触发音爆环（sonic boom ring），引擎加力火焰（afterburner）

### 阶段 3：性能优化与细节打磨（已交付）
- 代码：赛事预设强制禁用后期与阴影；DPR/AA 与预设/画质严格联动；水面 Shader 按画质降级
- 目标：在保证观感一致的前提下，赛事模式获得最稳帧率与最低输入延迟
- 细节：速度触发类 VFX 使用引用驱动可见性/强度（避免依赖 React 重渲染），确保效果在运行时实时生效
- 优化：音爆/加力等触发由“持续条件”升级为“阈值穿越”，避免高速巡航期间重复刷屏
- 开销分级：低画质与赛事预设默认不挂载重 VFX（避免隐藏组件仍消耗更新），高画质才开启机翼尾迹/闪电等重效果

### 阶段 4：集成测试与回归验证（已交付）
- 脚本：`pnpm test`（Vitest），`pnpm run lint`（TypeScript 类型检查），`pnpm run build`
- 结果：测试 7/7 通过；类型检查通过；生产构建通过
