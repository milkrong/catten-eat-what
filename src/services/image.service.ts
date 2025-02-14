interface ImageGenerationResponse {
  data: Array<{
    url: string;
  }>;
}

export class ImageService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY!;
    this.apiUrl = `${process.env.SILICONFLOW_API_ENDPOINT!}/images/generations`;
  }

  async generateRecipeImage(
    recipeName: string,
    description: string,
    image_size = "512x512"
  ): Promise<string> {
    const prompt = `A delicious looking dish of ${recipeName}. ${description}. Food photography style, professional lighting, high resolution, appetizing presentation`;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.SILICONFLOW_PICTURE_MODEL!,
          prompt,
          seed: Math.floor(Math.random() * 9999999999),
          image_size: image_size,
          batch_size: 1,
          guidance_scale: 7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }

      const result = (await response.json()) as ImageGenerationResponse;
      return result.data[0].url;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }

  /**
   * 处理上传的图片
   * @param buffer 图片buffer
   * @param options 处理选项
   * @returns 处理后的图片buffer
   */
  async processUploadedImage(
    buffer: ArrayBuffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<Buffer> {
    const sharp = require('sharp');
    const {
      width = 400,  // 默认宽度
      height = 400, // 默认高度
      quality = 80  // 默认质量
    } = options;

    try {
      // 将 ArrayBuffer 转换为 Buffer
      const inputBuffer = Buffer.from(buffer);

      // 处理图片
      const processedImageBuffer = await sharp(inputBuffer)
        .resize(width, height, {
          fit: 'cover',     // 保持比例裁剪
          position: 'center'
        })
        .webp({ quality }) // 转换为 WebP 格式
        .toBuffer();

      return processedImageBuffer;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }
}
