import { CozeService } from './coze.service';
import {
  DietaryPreferences,
  RecommendationRequest,
} from '../types/preferences';
import { Recipe } from '../types/recipe';

export class RecommendationService {
  private cozeService: CozeService;

  constructor() {
    this.cozeService = new CozeService({
      apiKey: process.env.COZE_API_KEY!,
      botId: process.env.COZE_BOT_ID!,
      apiEndpoint: process.env.COZE_API_ENDPOINT || 'https://api.coze.cn/v1',
    });
  }

  private generatePrompt(
    preferences: DietaryPreferences,
    mealType?: string
  ): string {
    return `请基于以下用户偏好生成推荐:
- 饮食类型: ${preferences.dietType}
- 偏好菜系: ${preferences.cuisineTypes.join(', ')}
- 过敏源: ${preferences.allergies.join(', ')}
- 饮食限制: ${preferences.restrictions.join(', ')}
- 目标热量: ${preferences.targetCalories}卡路里
- 最长烹饪时间: ${preferences.maxCookingTime}分钟
${mealType ? `- 餐次类型: ${mealType}` : ''}

请推荐一份合适的食谱，包含:
1. 菜品名称
2. 所需食材清单
3. 预计热量
4. 烹饪时间
5. 主要营养成分
6. 简要烹饪步骤`;
  }

  private async getRecommendation(
    request: RecommendationRequest
  ): Promise<Recipe> {
    const prompt = this.generatePrompt(request.preferences, request.mealType);

    const response = await this.cozeService.createConversation([
      { role: 'user', content: prompt },
    ]);

    // 从 choices 中获取内容
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    // 解析 AI 响应并转换为 Recipe 格式
    const recommendation = this.parseAIResponse(content);
    return recommendation;
  }

  private parseAIResponse(content: string): Recipe {
    // 实现解析逻辑，将AI响应转换为结构化的Recipe对象
    // 这里需要根据实际的AI响应格式来实现
    // ...
    return {
      // ... 解析后的Recipe对象
    } as Recipe;
  }

  async getSingleMealRecommendation(
    request: RecommendationRequest
  ): Promise<Recipe> {
    return this.getRecommendation(request);
  }

  async getDailyPlanRecommendation(
    request: RecommendationRequest
  ): Promise<Recipe[]> {
    const meals = [];
    const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;

    for (const mealType of mealTypes) {
      const mealRequest = {
        ...request,
        mealType,
      };
      const recommendation = await this.getRecommendation(mealRequest);
      meals.push(recommendation);
    }

    return meals;
  }

  async getWeeklyPlanRecommendation(
    request: RecommendationRequest
  ): Promise<Recipe[][]> {
    const weeklyPlan = [];

    for (let day = 0; day < 7; day++) {
      const dailyPlan = await this.getDailyPlanRecommendation(request);
      weeklyPlan.push(dailyPlan);
    }

    return weeklyPlan;
  }

  async getStreamingRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void
  ): Promise<Recipe> {
    const prompt = this.generatePrompt(request.preferences, request.mealType);
    let fullResponse = '';

    await this.cozeService.createStreamConversation(
      [{ role: 'user', content: prompt }],
      (chunk) => {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }
    );

    return this.parseAIResponse(fullResponse);
  }

  async getStreamingSingleMealRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void
  ): Promise<Recipe> {
    return this.getStreamingRecommendation(request, onChunk);
  }

  async getStreamingDailyPlanRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void
  ): Promise<Recipe[]> {
    const meals = [];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];

    for (const mealType of mealTypes) {
      const mealRequest = {
        ...request,
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner',
      };
      const recommendation = await this.getStreamingRecommendation(
        mealRequest,
        onChunk
      );
      meals.push(recommendation);
    }

    return meals;
  }
}
