import { LanguageManager } from './languageManager';
import { ContentProcessor } from './contentProcessor';

/**
 * Main LLM Service for automatic language management
 * Integrates language detection, translation, and content processing
 */
export class LLMService {
  private languageManager: LanguageManager;
  private contentProcessor: ContentProcessor;

  constructor(apiKey: string) {
    this.languageManager = new LanguageManager(apiKey, {
      supported: ['vi', 'en', 'ja', 'ko', 'zh'],
      default: 'vi',
      detection: 'auto'
    });
    this.contentProcessor = new ContentProcessor(this.languageManager);
  }

  /**
   * Get language manager instance
   */
  getLanguageManager(): LanguageManager {
    return this.languageManager;
  }

  /**
   * Get content processor instance
   */
  getContentProcessor(): ContentProcessor {
    return this.contentProcessor;
  }

  /**
   * Initialize LLM service with environment variables
   */
  static initialize(apiKey?: string): LLMService {
    const key = apiKey || process.env.GOOGLE_GENAI_API_KEY || '';
    if (!key) {
      throw new Error('GOOGLE_GENAI_API_KEY is required');
    }
    return new LLMService(key);
  }
}
