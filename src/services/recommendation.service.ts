import { CozeService } from './coze.service';
import { DifyService } from './dify.service';
import { OllamaService } from './ollama.service';
import { DeepSeekService } from './deepseek.service';
import {
  DietaryPreferences,
  RecommendationRequest,
} from '../types/preferences';
import { Recipe } from '../types/recipe';

type AiRecipe = Omit<
  Recipe,
  | 'id'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
  | 'description'
  | 'image_url'
  | 'views'
>;
type AIProvider = 'coze' | 'dify' | 'ollama' | 'deepseek';

export class RecommendationService {
  private cozeService: CozeService;
  private difyService: DifyService;
  private ollamaService: OllamaService;
  private deepseekService: DeepSeekService;

  constructor() {
    this.cozeService = new CozeService({
      apiKey: process.env.COZE_API_KEY!,
      botId: process.env.COZE_BOT_ID!,
      apiEndpoint: process.env.COZE_API_ENDPOINT || 'https://api.coze.cn/v1',
    });
    this.difyService = new DifyService({
      apiKey: process.env.DIFY_API_KEY!,
      apiEndpoint: process.env.DIFY_API_ENDPOINT!,
    });
    this.ollamaService = new OllamaService({
      apiEndpoint: process.env.OLLAMA_API_ENDPOINT || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2',
    });
    this.deepseekService = new DeepSeekService({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      apiEndpoint: process.env.DEEPSEEK_API_ENDPOINT,
      model: process.env.DEEPSEEK_MODEL,
    });
  }

  private getAIService(provider: AIProvider = 'coze') {
    switch (provider) {
      case 'dify':
        return this.difyService;
      case 'ollama':
        return this.ollamaService;
      case 'deepseek':
        return this.deepseekService;
      default:
        return this.cozeService;
    }
  }

  private generatePrompt(
    preferences: DietaryPreferences,
    mealType?: string
  ): string {
    return `基于以下用户偏好生成推荐食谱:
- 饮食类型: ${preferences.diet_type?.join(', ') || ''}
- 偏好菜系: ${preferences.cuisine_type?.join(', ') || ''}
- 过敏源: ${preferences.allergies?.join(', ') || ''}
- 饮食限制: ${preferences.restrictions?.join(', ') || ''}
- 卡路里范围: ${preferences.calories_min}-${preferences.calories_max}卡路里
- 最长烹饪时间: ${preferences.max_cooking_time}分钟
${mealType ? `- 餐次类型: ${mealType}` : ''}
`;
  }

  private async getRecommendation(
    request: RecommendationRequest
  ): Promise<AiRecipe> {
    const prompt = this.generatePrompt(request.preferences, request.mealType);
    const provider = request.provider || 'dify';
    if (
      provider === 'dify' ||
      provider === 'ollama' ||
      provider === 'deepseek'
    ) {
      const service = this.getAIService(provider);
      const response = await (
        service as OllamaService | DifyService | DeepSeekService
      ).createCompletion(prompt);
      return this.parseAIResponse(response);
    }

    // Default to Coze service
    const chatResponse = await this.cozeService.createCompletion(
      [{ role: 'user', content: prompt }],
      'recommendation-user',
      {}
    );

    await this.cozeService.waitForCompletion(
      chatResponse.data.conversation_id,
      chatResponse.data.id
    );

    const answerMessage = await this.cozeService.getAnswerMessage(
      chatResponse.data.conversation_id,
      chatResponse.data.id
    );

    if (!answerMessage) {
      throw new Error('No answer message found in response');
    }

    return this.parseAIResponse(answerMessage.content);
  }

  private parseAIResponse(content: string): AiRecipe {
    try {
      console.log('>>2', content);
      // 移除可能的 "```json" 标记
      const cleanContent = content
        .replace(/^```json\n/, '')
        .replace(/\n```$/, '');

      // 解析 JSON
      console.log('>>3', cleanContent);
      const rawRecipe = JSON.parse(cleanContent);

      // 转换为标准格式
      const recipe: AiRecipe = {
        name: rawRecipe.name,
        ingredients: rawRecipe.ingredients,
        calories: rawRecipe.calories,
        cooking_time: rawRecipe.cooking_time,
        nutrition_facts: {
          protein: rawRecipe.nutrition_facts.protein,
          fat: rawRecipe.nutrition_facts.fat,
          carbs: rawRecipe.nutrition_facts.carbs,
          fiber: rawRecipe.nutrition_facts.fiber,
        },
        steps: rawRecipe.steps,
        cuisine_type: rawRecipe.cuisine_type,
        diet_type: rawRecipe.diet_type,
      };

      // 验证必要字段
      if (
        !recipe.name ||
        !recipe.ingredients ||
        !recipe.calories ||
        !recipe.cooking_time ||
        !recipe.nutrition_facts ||
        !recipe.steps
      ) {
        throw new Error('Missing required fields in recipe');
      }

      // 验证所有食材的格式
      for (const ingredient of recipe.ingredients) {
        if (
          !ingredient.name ||
          typeof ingredient.amount !== 'number' ||
          !ingredient.unit
        ) {
          throw new Error('Invalid ingredient format');
        }
      }

      // 验证营养成分
      const nutrition = recipe.nutrition_facts;
      if (
        typeof nutrition.protein !== 'number' ||
        typeof nutrition.fat !== 'number' ||
        typeof nutrition.carbs !== 'number' ||
        typeof nutrition.fiber !== 'number'
      ) {
        throw new Error('Invalid nutrition format');
      }

      return recipe;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse recipe: ${error.message}`);
      }
      throw new Error('Failed to parse recipe: Unknown error');
    }
  }

  async getSingleMealRecommendation(
    request: RecommendationRequest
  ): Promise<AiRecipe> {
    return this.getRecommendation(request);
  }

  async getDailyPlanRecommendation(
    request: RecommendationRequest
  ): Promise<AiRecipe[]> {
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
  ): Promise<AiRecipe[][]> {
    const weeklyPlan = [];

    for (let day = 0; day < 7; day++) {
      const dailyPlan = await this.getDailyPlanRecommendation(request);
      weeklyPlan.push(dailyPlan);
    }

    return weeklyPlan;
  }

  async getStreamingRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void,
    provider: AIProvider = 'coze'
  ): Promise<AiRecipe> {
    const prompt = this.generatePrompt(request.preferences, request.mealType);
    let fullResponse = '';

    if (provider === 'coze') {
      await this.cozeService.createStreamCompletion(
        [{ role: 'user', content: prompt }],
        (chunk) => {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
        },
        'recommendation-user',
        {
          auto_save_history: false,
        }
      );
    } else {
      const service = this.getAIService(provider);
      await (service as OllamaService | DifyService).createStreamingCompletion(
        prompt,
        (chunk) => {
          fullResponse += chunk;
          onChunk(chunk);
        }
      );
    }

    return this.parseAIResponse(fullResponse);
  }

  async getStreamingSingleMealRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void,
    provider: AIProvider = 'dify'
  ): Promise<AiRecipe> {
    return this.getStreamingRecommendation(request, onChunk);
  }

  async getStreamingDailyPlanRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void,
    provider: AIProvider = 'dify'
  ): Promise<AiRecipe[]> {
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
