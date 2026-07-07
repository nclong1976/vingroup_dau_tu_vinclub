import { LanguageManager } from './languageManager';

interface ProcessedContent {
  original: string;
  translations: Record<string, string>;
  metadata: {
    detectedLanguage: string;
    sentiment: string;
    quality: number;
    timestamp: string;
  };
}

export class ContentProcessor {
  constructor(private languageManager: LanguageManager) {}

  /**
   * Process content for multi-language support
   */
  async processContent(
    content: string,
    targetLanguages: string[]
  ): Promise<ProcessedContent> {
    try {
      // Detect original language
      const detection = await this.languageManager.detectLanguage(content);
      
      // Analyze content
      const analysis = await this.languageManager.analyzeContent(content);
      
      // Translate to target languages
      const translations: Record<string, string> = {};
      
      for (const lang of targetLanguages) {
        if (lang !== detection.language) {
          const result = await this.languageManager.translate(
            content,
            lang,
            detection.language
          );
          translations[lang] = result.translated;
        } else {
          translations[lang] = content;
        }
      }

      return {
        original: content,
        translations,
        metadata: {
          detectedLanguage: detection.language,
          sentiment: analysis.sentiment,
          quality: analysis.quality,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Content processing error:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple content items
   */
  async batchProcess(
    items: Array<{ id: string; content: string }>,
    targetLanguages: string[]
  ): Promise<Array<{ id: string } & ProcessedContent>> {
    const results = await Promise.all(
      items.map(async (item) => ({
        id: item.id,
        ...(await this.processContent(item.content, targetLanguages))
      }))
    );
    return results;
  }

  /**
   * Get localized content by language
   */
  getLocalizedContent(
    processed: ProcessedContent,
    language: string
  ): string {
    return processed.translations[language] || processed.original;
  }
}
