/**
 * 音频管理器 (Singleton)
 * @description
 * 统一管理 Web Audio API 的 AudioContext，防止创建过多实例导致浏览器报错。
 * 提供全局混音、音量控制和资源缓存。
 */
class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * 初始化音频上下文 (必须由用户交互触发)
   */
  public init() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return;
      }

      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5; // 默认 50% 音量

      this.isInitialized = true;
      console.log('[AudioManager] Initialized');
      
      // 预生成常用合成音效
      this.generateWhiteNoise('noise');
    } catch (e) {
      console.error('[AudioManager] Init failed:', e);
    }
  }

  /**
   * 获取上下文，如果未初始化则尝试初始化
   */
  public getContext(): AudioContext | null {
    if (!this.isInitialized) this.init();
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  /**
   * 恢复被挂起的上下文 (通常在点击事件中调用)
   */
  public async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
      console.log('[AudioManager] Resumed');
    }
  }

  /**
   * 生成白噪声缓存
   */
  private generateWhiteNoise(key: string) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2.0; // 2秒
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    this.buffers.set(key, buffer);
  }

  /**
   * 获取缓存的 AudioBuffer
   */
  public getBuffer(key: string): AudioBuffer | undefined {
    return this.buffers.get(key);
  }
}

export const audioManager = AudioManager.getInstance();
