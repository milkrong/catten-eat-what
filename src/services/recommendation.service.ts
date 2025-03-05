import { CozeService } from "./coze.service";
import { OpenAIService } from "./openai-like.service";
import { DifyService } from "./dify.service";
import type {
  DietaryPreferences,
  RecommendationRequest,
  LLMService,
} from "../types/preferences";
import type { Recipe, Ingredient, NutritionFacts } from "../types/recipe";
import { supabase } from "../config/supabase";

type AiRecipe = Omit<
  Recipe,
  | "id"
  | "created_by"
  | "created_at"
  | "updated_at"
  | "description"
  | "image_url"
  | "views"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
> & {
  ingredients: Ingredient[];
  nutritionFacts: NutritionFacts;
};

export interface UserSettings {
  llm_service: LLMService;
  model_name?: string;
  is_paid?: boolean;
  api_key?: string;
  api_endpoint?: string;
}

export class RecommendationService {
  private cozeService: CozeService;
  private deepseekService: OpenAIService;
  private siliconflowService: OpenAIService;
  private arkService: OpenAIService;
  private difyService: DifyService;
  private customService: OpenAIService | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.cozeService = new CozeService({
      apiKey: process.env.COZE_API_KEY!,
      botId: process.env.COZE_BOT_ID!,
      apiEndpoint: process.env.COZE_API_ENDPOINT || "https://api.coze.cn/v1",
    });
    this.deepseekService = new OpenAIService({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      apiEndpoint: process.env.DEEPSEEK_API_ENDPOINT!,
      model: process.env.DEEPSEEK_MODEL,
    });
    this.siliconflowService = new OpenAIService({
      apiKey: process.env.SILICONFLOW_API_KEY!,
      apiEndpoint: process.env.SILICONFLOW_API_ENDPOINT!,
      model: process.env.SILICONFLOW_MODEL!,
    });
    this.arkService = new OpenAIService({
      apiKey: process.env.ARK_API_KEY!,
      apiEndpoint: process.env.ARK_API_ENDPOINT!,
      model: process.env.ARK_MODEL!,
    });
    this.difyService = new DifyService({
      apiKey: process.env.DIFY_API_KEY!,
      apiEndpoint: process.env.DIFY_API_ENDPOINT!,
    });
  }

  private async initializeCustomService(userId: string) {
    if (this.currentUserId === userId && this.customService) {
      return;
    }

    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !settings) {
      this.customService = null;
      this.currentUserId = null;
      return;
    }

    if (
      settings.llm_service === "custom" &&
      settings.api_key &&
      settings.api_endpoint &&
      settings.model_name
    ) {
      this.customService = new OpenAIService({
        apiKey: settings.api_key,
        apiEndpoint: settings.api_endpoint,
        model: settings.model_name,
      });
      this.currentUserId = userId;
    }
  }

  private async getAIService(provider: LLMService = "coze", userId?: string) {
    if (provider === "custom" && userId) {
      await this.initializeCustomService(userId);
      if (this.customService) {
        return this.customService;
      }
      throw new Error("Custom service not properly configured");
    }

    switch (provider) {
      case "deepseek":
        return this.deepseekService;
      case "siliconflow":
        return this.siliconflowService;
      case "ark":
        return this.arkService;
      case "dify":
        return this.difyService;
      default:
        return this.cozeService;
    }
  }

  private generatePrompt(
    preferences: DietaryPreferences,
    mealType?: string
  ): string {
    return `基于以下用户偏好生成推荐食谱:
- 饮食类型: ${preferences.dietType?.join(", ") || ""}
- 偏好菜系: ${preferences.cuisineType?.join(", ") || ""}
- 过敏源: ${preferences.allergies?.join(", ") || ""}
- 饮食限制: ${preferences.restrictions?.join(", ") || ""}
- 卡路里范围: ${preferences.caloriesMin}-${preferences.caloriesMax}卡路里
- 最长烹饪时间: ${preferences.maxCookingTime}分钟
${mealType ? `- 餐次类型: ${mealType}` : ""}
`;
  }

  private async getRecommendation(
    request: RecommendationRequest
  ): Promise<AiRecipe> {
    const prompt = this.generatePrompt(request.preferences, request.mealType);
    const provider = request.provider || "coze";

    // Handle services based on the provider
    switch (provider) {
      case "coze": {
        // Use Coze service
        const chatResponse = await this.cozeService.createCompletion(
          [{ role: "user", content: prompt }],
          "recommendation-user",
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
          throw new Error("No answer message found in response");
        }

        return this.parseAIResponse(answerMessage.content);
      }
      case "dify": {
        // Use Dify service
        const response = await this.difyService.createCompletion(prompt);
        return this.parseAIResponse(response);
      }
      default: {
        // Use other services
        const service = await this.getAIService(provider, request.userId);
        const response = await (service as OpenAIService).createCompletion(prompt);
        return this.parseAIResponse(response);
      }
    }
  }

  private parseAIResponse(content: string): AiRecipe {
    try {
      console.log(">>2", content);
      // 移除可能的 "```json" 标记
      const cleanContent = content
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "")
        .replace("```", "");

      // 解析 JSON
      console.log(">>3", cleanContent);
      const rawRecipe = JSON.parse(cleanContent);

      // 转换为标准格式
      const recipe: AiRecipe = {
        name: rawRecipe.name,
        ingredients: rawRecipe.ingredients,
        calories: rawRecipe.calories,
        cookingTime: rawRecipe.cookingTime,
        nutritionFacts: {
          calories: rawRecipe.calories,
          protein: rawRecipe.nutritionFacts.protein,
          fat: rawRecipe.nutritionFacts.fat,
          carbs: rawRecipe.nutritionFacts.carbs,
          fiber: rawRecipe.nutritionFacts.fiber,
        },
        steps: rawRecipe.steps,
        cuisineType: rawRecipe.cuisineType,
        dietType: rawRecipe.dietType,
        img: rawRecipe.img,
      };

      // 验证必要字段
      if (
        !recipe.name ||
        !recipe.ingredients ||
        !recipe.calories ||
        !recipe.cookingTime ||
        !recipe.nutritionFacts ||
        !recipe.steps
      ) {
        throw new Error("Missing required fields in recipe");
      }

      // 验证所有食材的格式
      for (const ingredient of recipe.ingredients) {
        if (
          !ingredient.name ||
          typeof ingredient.amount !== "number" ||
          !ingredient.unit
        ) {
          throw new Error("Invalid ingredient format");
        }
      }

      // 验证营养成分
      const nutrition = recipe.nutritionFacts;
      if (
        typeof nutrition.protein !== "number" ||
        typeof nutrition.fat !== "number" ||
        typeof nutrition.carbs !== "number" ||
        typeof nutrition.fiber !== "number"
      ) {
        throw new Error("Invalid nutrition format");
      }

      return recipe;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse recipe: ${error.message}`);
      }
      throw new Error("Failed to parse recipe: Unknown error");
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
    const mealTypes = ["breakfast", "lunch", "dinner"] as const;

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
    provider: LLMService = "coze"
  ): Promise<AiRecipe> {
    const prompt = this.generatePrompt(request.preferences, request.mealType);
    let fullResponse = "";

    // Handle services based on the provider
    switch (provider) {
      case "coze": {
        await this.cozeService.createStreamCompletion(
          [{ role: "user", content: prompt }],
          (chunk) => {
            console.log(">>1", chunk);
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          },
          "recommendation-user",
          {
            auto_save_history: false,
          }
        );
        break;
      }
      case "dify": {
        await this.difyService.createStreamingCompletion(
          prompt,
          (chunk) => {
            fullResponse += chunk;
            onChunk(chunk);
          }
        );
        break;
      }
      default: {
        const service = await this.getAIService(provider, request.userId);
        await (service as OpenAIService).createStreamingCompletion(
          prompt,
          (chunk) => {
            fullResponse += chunk;
            onChunk(chunk);
          }
        );
        break;
      }
    }

    return this.parseAIResponse(fullResponse);
  }

  async getStreamingSingleMealRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void,
    provider: LLMService = "coze"
  ): Promise<AiRecipe> {
    return this.getStreamingRecommendation(request, onChunk, provider);
  }

  async getStreamingDailyPlanRecommendation(
    request: RecommendationRequest,
    onChunk: (chunk: string) => void,
    provider: LLMService = "coze"
  ): Promise<AiRecipe[]> {
    const meals = [];
    const mealTypes = ["breakfast", "lunch", "dinner"];

    for (const mealType of mealTypes) {
      const mealRequest = {
        ...request,
        mealType: mealType as "breakfast" | "lunch" | "dinner",
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
