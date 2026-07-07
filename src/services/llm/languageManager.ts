import { GoogleGenerativeAI } from '@google/genai';

interface LanguageConfig {
  supported: string[];
  default: string;
  detection: 'auto' | 'manual';
}

interface TranslationResult {
  original: string;
  translated: string;
  language: string;
  confidence: number;
}

export class LanguageManager {
  private genai: InstanceType<typeof GoogleGenerativeAI>;
  private config: LanguageConfig;
  private cache: Map<string, TranslationResult> = new Map();

  constructor(apiKey: string, config?: Partial<LanguageConfig>) {
    this.genai = new GoogleGenerativeAI(apiKey);
    this.config = {
      supported: ['vi', 'en', 'ja', 'ko', 'zh'],
      default: 'vi',
      detection: 'auto',
      ...config
    };
  }

  /**
   * Detect the language of given text
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    const cacheKey = `detect:${text}`;
    
    try {
      const model = this.genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(
        `Detect the language of this text and respond with JSON format: {"language": "code", "confidence": 0-1}. Text: "${text}"`
      );

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);
      
      return {
        language: parsed.language,
        confidence: parsed.confidence
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return { language: this.config.default, confidence: 0 };
    }
  }

  /**
   * Translate text to target language
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const cacheKey = `${sourceLanguage || 'auto'}:${targetLanguage}:${text}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const model = this.genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = sourceLanguage
        ? `Translate this ${sourceLanguage} text to ${targetLanguage}: "${text}"`
        : `Translate this text to ${targetLanguage}: "${text}"`;

      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();

      const translationResult: TranslationResult = {
        original: text,
        translated,
        language: targetLanguage,
        confidence: 0.9
      };

      this.cache.set(cacheKey, translationResult);
      return translationResult;
    } catch (error) {
      console.error('Translation error:', error);
      return {
        original: text,
        translated: text,
        language: targetLanguage,
        confidence: 0
      };
    }
  }

  /**
   * Auto-translate content based on user language preference
   */
  async autoTranslate(
    content: string,
    userLanguage?: string
  ): Promise<TranslationResult> {
    try {
      const detection = await this.detectLanguage(content);
      const targetLang = userLanguage || this.config.default;

      if (detection.language === targetLang) {
        return {
          original: content,
          translated: content,
          language: targetLang,
          confidence: 1
        };
      }

      return this.translate(content, targetLang, detection.language);
    } catch (error) {
      console.error('Auto-translate error:', error);
      return {
        original: content,
        translated: content,
        language: this.config.default,
        confidence: 0
      };
    }
  }

  /**
   * Analyze content sentiment and language quality
   */
  async analyzeContent(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    quality: number;
    suggestions: string[];
  }> {
    try {
      const model = this.genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(
        `Analyze this text and respond with JSON: {"sentiment": "positive|negative|neutral", "quality": 0-1, "suggestions": []}. Text: "${text}"`
      );

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);
      
      return parsed;
    } catch (error) {
      console.error('Content analysis error:', error);
      return {
        sentiment: 'neutral',
        quality: 0.5,
        suggestions: []
      };
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return this.config.supported;
  }
}
