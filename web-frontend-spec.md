# 猫咪吃什么 - Web 客户端设计文档

## 技术栈

- **框架**: Next.js 14 (App Router)
- **状态管理**: Zustand
- **认证**: Supabase Auth
- **样式**: TailwindCSS + shadcn/ui
- **HTTP 客户端**: Axios
- **表单处理**: React Hook Form + Zod
- **类型检查**: TypeScript
- **测试**: Vitest + Testing Library
- **构建工具**: Vite
- **包管理**: pnpm

## 应用架构

### 目录结构

```
src/
├── app/              # Next.js 页面和布局
├── components/       # 可复用组件
│   ├── ui/          # shadcn/ui 组件
│   └── shared/      # 业务组件
├── stores/          # Zustand stores
├── hooks/           # 自定义 hooks
├── lib/             # 工具函数和配置
├── types/           # TypeScript 类型定义
└── styles/          # 全局样式和主题
```

## 数据类型定义

```typescript
// types/auth.ts
interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// types/recipe.ts
interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  steps: {
    order: number;
    description: string;
  }[];
  cuisine_type: string;
  diet_type: string[];
  cooking_time: number;
  calories: number;
  nutrition_facts: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ... 其他类型定义与移动端相同 ...
```

## 页面路由

```typescript
// app/layout.tsx - 根布局
// app/page.tsx - 首页
// app/(auth)/login/page.tsx - 登录页
// app/(auth)/register/page.tsx - 注册页
// app/recipes/page.tsx - 食谱列表
// app/recipes/[id]/page.tsx - 食谱详情
// app/meal-plans/page.tsx - 餐饮计划
// app/recommendations/page.tsx - 推荐页面
// app/profile/page.tsx - 个人资料
```

## 状态管理

### Zustand Store 设计

```typescript
// stores/useAuthStore.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  loading: false,
  error: null,
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const response = await authApi.login({ email, password });
      set({ session: response.data.session, user: response.data.user });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  // ... 其他方法
}));

// ... 其他 stores 与移动端类似 ...
```

## 组件示例

```typescript
// components/ui/recipe-card.tsx
interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
      <div className="aspect-w-16 aspect-h-9">
        <Image
          src={recipe.image_url || '/placeholder.png'}
          alt={recipe.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{recipe.name}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {recipe.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center text-sm text-gray-500">
              <ClockIcon className="mr-1 h-4 w-4" />
              {recipe.cooking_time}分钟
            </span>
            <span className="flex items-center text-sm text-gray-500">
              <FlameIcon className="mr-1 h-4 w-4" />
              {recipe.calories}卡路里
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-red-500"
          >
            <HeartIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// components/ui/meal-plan-calendar.tsx
interface MealPlanCalendarProps {
  plans: MealPlan[];
  onSelectDate: (date: Date) => void;
  onCreatePlan: (date: Date) => void;
}

export function MealPlanCalendar({
  plans,
  onSelectDate,
  onCreatePlan,
}: MealPlanCalendarProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <Calendar
        mode="month"
        selected={plans.map((plan) => new Date(plan.date))}
        onSelect={onSelectDate}
        className="rounded-md border"
      />
      <div className="mt-4">
        <h4 className="font-medium">今日餐单</h4>
        {/* 餐单��表 */}
      </div>
    </div>
  );
}
```

## 开发环境设置

1. 初始化项目

```bash
pnpm create next-app catten-eat-what-web --typescript --tailwind --app --use-pnpm
```

2. 安装依赖

```bash
pnpm add zustand @supabase/supabase-js axios react-hook-form zod @hookform/resolvers/zod @radix-ui/react-icons lucide-react date-fns
pnpm add -D @types/node @types/react @types/react-dom typescript tailwindcss postcss autoprefixer shadcn-ui @testing-library/react @testing-library/jest-dom vitest
```

3. 配置 shadcn/ui

```bash
pnpm dlx shadcn-ui@latest init
```

4. 环境变量配置

```env
NEXT_PUBLIC_API_BASE_URL=your_api_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 性能优化

### 服务端渲染

- 使用 Next.js App Router 的服务端组件
- 实现流式渲染和 Suspense
- 页面级别的预渲染和增量静态再生成

### 缓存策略

- SWR 数据缓存
- 静态资源缓存
- 服务端状态缓存

### 图片优化

- Next.js Image 组件自动优化
- WebP 格式支持
- 响应式图片加载

### 代码分割

- 动态导入组件
- 路由级别的代码分割
- 第三方库按需加载

## 测试策略

### 单元测试

```typescript
// __tests__/components/RecipeCard.test.tsx
import { render, screen } from '@testing-library/react';
import { RecipeCard } from '@/components/ui/recipe-card';

describe('RecipeCard', () => {
  it('renders recipe information correctly', () => {
    const recipe = {
      name: '测试食谱',
      description: '这是一个测试食谱',
      cooking_time: 30,
      calories: 300,
      // ... 其他必要属性
    };

    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('测试食谱')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试食谱')).toBeInTheDocument();
    expect(screen.getByText('30分钟')).toBeInTheDocument();
    expect(screen.getByText('300卡路里')).toBeInTheDocument();
  });
});
```

### E2E 测试

- 使用 Playwright 进行端到端测试
- 关键用户流程测试
- 跨浏览器兼容性测试

## 部署流程

### 开发环境

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
pnpm start
```

### CI/CD

- GitHub Actions 自动化部署
- Vercel/Netlify 集成
- 自动化测试和代码质量检查

## 版本计划

### v1.0.0

- 基础认证功能
- 食谱浏览和搜索
- 响应式设计
- PWA 支持

### v1.1.0

- 高级搜索和筛选
- 个性化推荐
- 社交分享功能
- 性能优化

### v1.2.0

- 多语言支持
- 深色模式
- 高级数据可视化
- SEO 优化
