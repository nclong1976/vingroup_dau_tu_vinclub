# LLM Integration - Automatic Language Management

## 概要 / Overview

This module provides automatic language management using Google's Generative AI (Gemini) API. It enables:

- **Language Detection**: Automatically detect the language of content
- **Auto Translation**: Translate content to multiple languages
- **Content Analysis**: Analyze sentiment and quality of content
- **Multi-language Support**: Support for Vietnamese, English, Japanese, Korean, and Chinese

## インストール / Installation

### 1. Setup API Key

```bash
# Copy environment template
cp .env.example .env

# Add your Google Generative AI API key
echo "GOOGLE_GENAI_API_KEY=your_key_here" >> .env
```

### 2. Verify Dependencies

The required `@google/genai` package is already in `package.json`:

```bash
npm install
```

## 사용법 / Usage

### Basic Language Detection

```typescript
import { LLMService } from '@/services/llm';

const llm = LLMService.initialize();
const manager = llm.getLanguageManager();

const detection = await manager.detectLanguage('Xin chào');
console.log(detection); // { language: 'vi', confidence: 0.95 }
```

### Translation

```typescript
const result = await manager.translate(
  'Hello, how are you?',
  'vi', // target language
  'en'  // source language (optional)
);

console.log(result.translated); // "Xin chào, bạn khỏe không?"
```

### Auto-Translation

```typescript
const result = await manager.autoTranslate(
  'こんにちは', // Japanese text
  'vi'          // user's language preference
);
```

### Content Analysis

```typescript
const analysis = await manager.analyzeContent(
  'This product is amazing!'
);

console.log(analysis);
// {
//   sentiment: 'positive',
//   quality: 0.95,
//   suggestions: []
// }
```

### React Hook Usage

```typescript
import { useLLM } from '@/hooks/useLLM';

function MyComponent() {
  const { translate, detectLanguage, loading, error } = useLLM();

  const handleTranslate = async () => {
    const result = await translate('Hello', 'vi', 'en');
    console.log(result?.translated);
  };

  return (
    <div>
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? 'Translating...' : 'Translate'}
      </button>
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}
```

## Components / コンポーネント

### LanguageSelector

Dropdown component for language selection:

```typescript
import { LanguageSelector } from '@/components/LanguageSelector';

<LanguageSelector
  currentLanguage="vi"
  onLanguageChange={(lang) => setLanguage(lang)}
/>
```

### TranslationViewer

Display original and translated content side-by-side:

```typescript
import { TranslationViewer } from '@/components/TranslationViewer';

<TranslationViewer
  content="Original text here"
  targetLanguage="en"
  sourceLanguage="vi"
/>
```

## API Reference / APIリファレンス

### LanguageManager

#### `detectLanguage(text: string)`
Detect the language of given text.
- **Returns**: `{ language: string; confidence: number }`

#### `translate(text: string, targetLanguage: string, sourceLanguage?: string)`
Translate text to target language.
- **Returns**: `TranslationResult`

#### `autoTranslate(content: string, userLanguage?: string)`
Auto-detect and translate content.
- **Returns**: `TranslationResult`

#### `analyzeContent(text: string)`
Analyze sentiment and quality of content.
- **Returns**: `{ sentiment: 'positive' | 'negative' | 'neutral'; quality: number; suggestions: string[] }`

## Configuration / 設定

### Environment Variables

```env
# Required
GOOGLE_GENAI_API_KEY=your_api_key

# Optional
LLM_DEFAULT_LANGUAGE=vi
LLM_SUPPORTED_LANGUAGES=vi,en,ja,ko,zh
LLM_AUTO_DETECT=true
```

### Custom Configuration

```typescript
const llm = new LLMService(apiKey, {
  supported: ['vi', 'en'],
  default: 'vi',
  detection: 'auto'
});
```

## Performance Tips / パフォーマンスのコツ

1. **Caching**: Translations are automatically cached to reduce API calls
2. **Batch Processing**: Use `batchProcess()` for multiple items
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Error Handling**: Always handle errors gracefully

## Troubleshooting / トラブルシューティング

### API Key Not Found
```
Error: GOOGLE_GENAI_API_KEY is required
```
**Solution**: Add your API key to `.env` file

### Translation Fails
```
Error: Translation error: ...
```
**Solutions**:
- Check API key validity
- Verify network connectivity
- Check rate limits
- Ensure text is not too long (>2000 characters)

### Language Detection Inaccuracy
- Provide more context or longer text
- Specify source language explicitly if known

## Example Integration / 統合例

### Complete Application Example

```typescript
import React, { useState } from 'react';
import { useLLM } from '@/hooks/useLLM';
import { LanguageSelector } from '@/components/LanguageSelector';
import { TranslationViewer } from '@/components/TranslationViewer';

export function App() {
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [content, setContent] = useState('');
  const { processContent, loading } = useLLM();

  const handleProcess = async () => {
    const result = await processContent(content, ['vi', 'en', 'ja']);
    // Use result...
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <LanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter content to translate..."
        className="w-full p-4 border rounded-lg mb-4"
        rows={5}
      />

      <button
        onClick={handleProcess}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : 'Process Content'}
      </button>

      {content && (
        <div className="mt-6">
          <TranslationViewer
            content={content}
            targetLanguage={currentLanguage}
          />
        </div>
      )}
    </div>
  );
}
```

## Support / サポート

For issues or questions:
1. Check the [Google Generative AI documentation](https://ai.google.dev)
2. Review error messages and logs
3. Ensure API key has proper permissions
