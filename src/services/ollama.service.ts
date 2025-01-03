interface OllamaServiceConfig {
  apiEndpoint: string;
  model: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface OllamaErrorResponse {
  error: string;
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  name: string;
  ingredients: Ingredient[];
  calories: number;
  cooking_time: number;
  nutrition_facts: {
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  steps: string[];
}

const VALID_UNITS = [
  '克',
  '千克',
  '毫升',
  '升',
  '个',
  '勺',
  '杯',
  '片',
  '根',
  '块',
  '粒',
  '包',
  '袋',
  '瓶',
  '盒',
  '条',
  '瓣',
  '茶匙',
  '汤匙',
];

const SYSTEM_PROMPT = `# Role
你是一位食谱推荐专家，能够根据用户的喜好生成食谱推荐。你的推荐应当营养丰富、易于操作，并且符合用户的饮食需求。

## Skills
### Skill 1: 生成食谱推荐
- 当用户请求食谱推荐时，首先了解用户的饮食偏好、限制和菜系偏好。如果已经了解这些信息，则跳过此步骤。
- 根据用户的偏好，生成以下JSON格式的食谱推荐：
\`\`\`json
{
  "name": "菜品名称",
  "ingredients": [
    {
      "name": "食材名称",
      "amount": 数字,
      "unit": "单位"
    }
  ],
  "calories": 数字,
  "cooking_time": 数字,
  "nutrition_facts": {
    "protein": 数字,
    "fat": 数字,
    "carbs": 数字,
    "fiber": 数字
  },
  "steps": [
    "步骤1",
    "步骤2"
  ]
}
\`\`\`
- 确保所有数值均为纯数字，不要使用分数（如1/2）或带单位的数字。
- 确保\`ingredients\`中的\`amount\`为纯数字，例如：0.5、1、2等。不要使用分数、文字描述或其他非数字形式。任何单位放在\`unit\`中。
- 确保\`ingredients\`中的\`unit\`必须是以下单位之一： ${VALID_UNITS.join(
  ', '
)}。不要使用空字符串或其他单位。
- 如果需要表示小份量，请使用小数，例如：0.5勺而不是1/2勺。
- 确保输出为有效的JSON格式。
- 不要添加任何额外的解释性文本。
- 仅输出 json 内容包括\`\`\`json和\`\`\`

## Constraints
- 仅讨论与食谱相关的内容，拒绝回答与食谱无关的话题。
- 输出内容必须按照给定格式组织，不得偏离框架要求。
- 确保食谱符合用户的饮食需求和偏好。
- 所有食材必须有明确的数量单位，不允许空单位。
- 所有数值必须为纯数字，不允许使用分数或文字描述。`;

export class OllamaService {
  private apiEndpoint: string;
  private model: string;

  constructor(config: OllamaServiceConfig) {
    this.apiEndpoint = config.apiEndpoint;
    this.model = config.model;
  }

  private validateRecipe(recipe: Recipe): void {
    // Validate ingredients
    console.log('gredients', recipe.ingredients);
    for (const ingredient of recipe.ingredients) {
      if (typeof ingredient.amount !== 'number') {
        throw new Error(
          `Invalid amount for ingredient ${ingredient.name}: must be a number`
        );
      }
      if (!VALID_UNITS.includes(ingredient.unit)) {
        throw new Error(
          `Invalid unit for ingredient ${
            ingredient.name
          }: must be one of ${VALID_UNITS.join(', ')}`
        );
      }
    }

    // Validate numeric fields
    if (typeof recipe.calories !== 'number') {
      throw new Error('Invalid calories: must be a number');
    }
    if (typeof recipe.cooking_time !== 'number') {
      throw new Error('Invalid cooking_time: must be a number');
    }

    // Validate nutrition facts
    const { nutrition_facts } = recipe;
    if (
      typeof nutrition_facts.protein !== 'number' ||
      typeof nutrition_facts.fat !== 'number' ||
      typeof nutrition_facts.carbs !== 'number' ||
      typeof nutrition_facts.fiber !== 'number'
    ) {
      throw new Error('Invalid nutrition_facts: all values must be numbers');
    }
  }

  async createCompletion(prompt: string): Promise<string> {
    try {
      let fullResponse = '';
      await this.createStreamingCompletion(prompt, (chunk) => {
        fullResponse += chunk;
      });

      // Extract JSON from the response
      const match = fullResponse.match(/```json\n([\s\S]*?)\n```/);
      if (!match) {
        throw new Error('Invalid response format: JSON not found');
      }

      const recipe = JSON.parse(match[1]) as Recipe;
      this.validateRecipe(recipe);
      return match[1];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Ollama API error: Unknown error occurred');
    }
  }

  async createStreamingCompletion(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as OllamaErrorResponse;
        throw new Error(
          `Ollama API error: ${errorData.error || response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error('Ollama API error: No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as OllamaResponse;
            if (data.message?.content) {
              onChunk(data.message.content);
            }
          } catch (e) {
            console.error('Error parsing Ollama response:', e);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Ollama API error: Unknown error occurred');
    }
  }
}
