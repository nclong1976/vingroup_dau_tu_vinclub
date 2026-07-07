import React, { useState } from 'react';
import { useLLM } from '../hooks/useLLM';
import { Loader2, Copy, Check } from 'lucide-react';

interface TranslationViewerProps {
  content: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export function TranslationViewer({
  content,
  sourceLanguage,
  targetLanguage
}: TranslationViewerProps) {
  const { translate, loading, error } = useLLM();
  const [translation, setTranslation] = useState<string>('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (content) {
      translate(content, targetLanguage, sourceLanguage).then((result) => {
        if (result) {
          setTranslation(result.translated);
        }
      });
    }
  }, [content, targetLanguage, sourceLanguage, translate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Original</h3>
        <p className="text-gray-600 bg-gray-50 p-3 rounded">{content}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Translation</h3>
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            <span>Translating...</span>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 text-red-600 rounded">
            {error.message}
          </div>
        ) : (
          <div className="bg-blue-50 p-3 rounded flex justify-between items-start">
            <p className="text-gray-700 flex-1">{translation}</p>
            <button
              onClick={handleCopy}
              className="ml-2 p-2 hover:bg-blue-100 rounded transition-colors"
              title="Copy translation"
            >
              {copied ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} className="text-gray-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
