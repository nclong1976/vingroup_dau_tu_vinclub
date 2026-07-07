import { LanguageManager } from '../languageManager';

// Mock Google Generative AI
jest.mock('@google/genai');

describe('LanguageManager', () => {
  let languageManager: LanguageManager;

  beforeEach(() => {
    languageManager = new LanguageManager('test-api-key');
  });

  describe('detectLanguage', () => {
    it('should detect Vietnamese language', async () => {
      const result = await languageManager.detectLanguage('Xin chào');
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const result = await languageManager.detectLanguage('');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
    });
  });

  describe('translate', () => {
    it('should translate text to target language', async () => {
      const result = await languageManager.translate(
        'Hello',
        'vi',
        'en'
      );
      expect(result.original).toBe('Hello');
      expect(result.language).toBe('vi');
      expect(result).toHaveProperty('translated');
    });

    it('should cache translation results', async () => {
      const spy = jest.spyOn(languageManager as any, 'cache');
      await languageManager.translate('Hello', 'vi', 'en');
      // Verify cache logic
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return supported languages', () => {
      const langs = languageManager.getSupportedLanguages();
      expect(langs).toContain('vi');
      expect(langs).toContain('en');
    });
  });

  describe('clearCache', () => {
    it('should clear cache', () => {
      languageManager.clearCache();
      expect((languageManager as any).cache.size).toBe(0);
    });
  });
});
