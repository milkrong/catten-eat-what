# 饮食推荐 APP 设计方案

## 1. 产品需求

### 1.1 核心功能

- 单次饮食推荐

  - 基于用户喜好快速推荐当前餐次的选择
  - 支持重新生成
  - 可以收藏喜欢的推荐结果

- 食谱规划

  - 支持生成每日/每周食谱
  - 可设置餐次数量(2-4 餐)
  - 支持替换单个餐次的推荐

- 个性化设置

  - 饮食偏好(中餐/西餐/日料等)
  - 饮食习惯(素食/低碳水/高蛋白等)
  - 过敏源设置
  - 卡路里需求
  - 烹饪时间限制

- 社交功能
  - 分享食谱到社交平台
  - 收藏其他用户分享的食谱
  - 评论与打分

### 1.2 辅助功能

- 食材营养成分查询
- 烹饪步骤指导
- 食材购买清单生成
- 用餐提醒
- 饮食记录与统计

## 2. 技术架构

### 2.1 前端架构 (React Native)

```
src/
├── components/          # 可复用组件
│   ├── common/         # 通用UI组件
│   └── screens/        # 页面级组件
├── screens/            # 主要页面
│   ├── Home/
│   ├── Planner/
│   ├── Profile/
│   └── Social/
├── navigation/         # 路由导航
├── services/          # API服务
├── store/             # 状态管理
├── utils/             # 工具函数
└── themes/            # 样式主题
```

### 2.2 后端架构 (Node.js)

```
server/
├── src/
│   ├── controllers/   # 业务逻辑控制器
│   ├── models/        # 数据模型
│   ├── routes/        # API路由
│   ├── services/      # 业务服务
│   │   └── ai/       # AI推荐服务
│   └── utils/        # 工具函数
├── config/           # 配置文件
└── tests/           # 测试文件
```

### 2.3 数据库设计

- 用户表 (users)
- 食谱表 (recipes)
- 用户偏好表 (preferences)
- 食材表 (ingredients)
- 收藏表 (favorites)
- 评论表 (comments)

### 2.4 API 设计

- 用户相关

  - POST /api/auth/register
  - POST /api/auth/login
  - PUT /api/users/preferences

- 推荐相关

  - POST /api/recommendations/single
  - POST /api/recommendations/daily
  - POST /api/recommendations/weekly

- 食谱相关
  - GET /api/recipes
  - POST /api/recipes
  - GET /api/recipes/:id
  - PUT /api/recipes/:id
  - DELETE /api/recipes/:id

### 2.5 AI 推荐系统

- 使用 ChatGPT API 进行推荐
- 示例 Prompt 模板:

```
基于以下用户偏好生成推荐:
- 饮食类型: ${preference.type}
- 饮食限制: ${preference.restrictions}
- 过敏源: ${preference.allergies}
- 期望热量: ${preference.calories}
- 可用烹饪时间: ${preference.cookingTime}

请推荐一份合适的{餐次}食谱，包含:
1. 菜品名称
2. 所需食材
3. 预计热量
4. 烹饪时间
5. 营养成分
```

## 3. 开发计划

### 3.1 第一阶段 (MVP)

- 基础用户系统
- 单次饮食推荐
- 基本的用户偏好设置

### 3.2 第二阶段

- 每日/每周食谱规划
- 详细的个性化设置
- 食材营养查询

### 3.3 第三阶段

- 社交功能
- 数据统计与分析
- 高级 AI 推荐算法优化
