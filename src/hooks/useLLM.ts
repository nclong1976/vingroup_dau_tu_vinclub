import { useState, useCallback, useEffect } from 'react';
import { LLMService } from '../services/llm';
import type { TranslationResult } from '../services/llm';

interface UseLLMOptions {
  autoDetect?: boolean;
  defaultLanguage?: string;
  cacheResults?: boolean;
}

export function useLLM(options: UseLLMOptions = {}) {
  const [llmService] = useState(() => {
    try {
      return LLMService.initialize();
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const detectLanguage = useCallback(
    async (text: string) => {
      if (!llmService) return null;
      try {
        setLoading(true);
        setError(null);
        const result = await llmService.getLanguageManager().detectLanguage(text);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [llmService]
  );

  const translate = useCallback(
    async (
      text: string,
      targetLanguage: string,
      sourceLanguage?: string
    ): Promise<TranslationResult | null> => {
      if (!llmService) return null;
      try {
        setLoading(true);
        setError(null);
        const result = await llmService
          .getLanguageManager()
          .translate(text, targetLanguage, sourceLanguage);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [llmService]
  );

  const analyzeContent = useCallback(
    async (text: string) => {
      if (!llmService) return null;
      try {
        setLoading(true);
        setError(null);
        const result = await llmService
          .getLanguageManager()
          .analyzeContent(text);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [llmService]
  );

  const processContent = useCallback(
    async (content: string, targetLanguages: string[]) => {
      if (!llmService) return null;
      try {
        setLoading(true);
        setError(null);
        const result = await llmService
          .getContentProcessor()
          .processContent(content, targetLanguages);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [llmService]
  );

  return {
    detectLanguage,
    translate,
    analyzeContent,
    processContent,
    loading,
    error,
    isInitialized: !!llmService
  };
}
