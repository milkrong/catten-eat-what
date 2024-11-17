// src/services/warmup-scheduler.service.ts
import { CacheWarmupService } from './cache-warmup.service';
import { SupabaseClient } from '@supabase/supabase-js';

export class WarmupSchedulerService {
  private warmupService: CacheWarmupService;
  private intervalId: NodeJS.Timer | null = null;

  constructor(
    supabase: SupabaseClient,
    private config: {
      initialDelay: number; // 服务启动后多久开始第一次预热（毫秒）
      warmupInterval: number; // 预热间隔（分钟）
      popularRecipeCount: number;
      recentRecipeCount: number;
      popularCuisineTypes: string[];
    }
  ) {
    this.warmupService = new CacheWarmupService(supabase, config);
  }

  // 启动调度器
  start() {
    console.log('Starting warmup scheduler...');

    // 延迟首次预热，避免服务启动时负载过大
    setTimeout(() => {
      // 执行首次预热
      this.warmupService.warmup();

      // 设置定期预热
      this.intervalId = setInterval(
        () => this.warmupService.warmup(),
        this.config.warmupInterval * 60 * 1000
      );
    }, this.config.initialDelay);
  }

  // 停止调度器
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // 获取预热状态
  getStatus() {
    return this.warmupService.getWarmupStatus();
  }

  // 手动触发预热
  async manualWarmup() {
    await this.warmupService.warmup();
  }
}
