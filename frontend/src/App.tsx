import { useState } from 'react';
import { Languages, Sparkles, KeyRound, X, Check } from 'lucide-react';
import { cn } from './lib/utils';
import { TranslationStudio } from './pages/TranslationStudio';
import { TemplateGenerator } from './pages/TemplateGenerator';

type Tab = 'translate' | 'generate';

function SetupScreen({ onSave }: { onSave: (key: string) => void }) {
  const [key, setKey] = useState('');

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-6xl text-zinc-900 mb-2 text-balance">METY</h1>
        <p className="text-zinc-400 text-base mb-12 text-pretty">
          METY Technology — Educational AI Platform
        </p>

        <div className="text-left">
          <label htmlFor="api-key-input" className="block text-xs font-medium text-zinc-500 mb-2">
            API Key
          </label>
          <input
            id="api-key-input"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && key.trim() && onSave(key.trim())}
            placeholder="sk_live_..."
            className="w-full border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-900 font-mono text-sm placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 bg-white"
          />
          <button
            onClick={() => key.trim() && onSave(key.trim())}
            disabled={!key.trim()}
            className="w-full mt-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-300 text-white font-medium rounded-lg px-6 py-2.5 text-sm transition-colors"
          >
            Connect
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 text-center">
        <p className="text-zinc-300 text-xs">
          METY Technology — CSC 392 / 492
        </p>
      </div>
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('translate');
  const [apiKey, setApiKey] = useState(localStorage.getItem('api_key') || '');
  const [showKeyEditor, setShowKeyEditor] = useState(false);
  const [editingKey, setEditingKey] = useState('');

  const handleSaveKey = (key: string) => {
    localStorage.setItem('api_key', key);
    setApiKey(key);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('api_key');
    setApiKey('');
    setShowKeyEditor(false);
  };

  if (!apiKey) {
    return <SetupScreen onSave={handleSaveKey} />;
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-zinc-100 sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <h1 className="font-display text-xl text-zinc-900 select-none">
            METY
          </h1>

          <nav className="flex items-center gap-1 p-1">
            <button
              onClick={() => setActiveTab('translate')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === 'translate'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Languages className="size-3.5" />
              Translate
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === 'generate'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Sparkles className="size-3.5" />
              Generate
            </button>
          </nav>

          <div className="relative">
            <button
              onClick={() => {
                setShowKeyEditor(!showKeyEditor);
                setEditingKey(apiKey);
              }}
              className="text-zinc-300 hover:text-zinc-500 transition-colors p-2 rounded-md"
              aria-label="API Key settings"
            >
              <KeyRound className="size-4" />
            </button>

            {showKeyEditor && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-zinc-200 rounded-lg p-4 shadow-lg shadow-zinc-200/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-500">API Key</span>
                  <button
                    onClick={() => setShowKeyEditor(false)}
                    className="text-zinc-300 hover:text-zinc-500 transition-colors"
                    aria-label="Close API key editor"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingKey}
                    onChange={(e) => setEditingKey(e.target.value)}
                    className="flex-1 border border-zinc-200 rounded-md px-3 py-2 text-zinc-700 font-mono text-xs focus:outline-none focus:border-zinc-400 bg-white"
                  />
                  <button
                    onClick={() => {
                      if (editingKey.trim()) {
                        handleSaveKey(editingKey.trim());
                        setShowKeyEditor(false);
                      }
                    }}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 p-2 rounded-md transition-colors"
                    aria-label="Save API key"
                  >
                    <Check className="size-4" />
                  </button>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="mt-3 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 pb-24">
        {activeTab === 'translate' ? <TranslationStudio /> : <TemplateGenerator />}
      </main>

      <footer className="border-t border-zinc-100 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-zinc-300 text-xs">
            METY Technology — CSC 392 / 492
          </p>
          <p className="text-zinc-300 text-xs font-display italic">
            METY
          </p>
        </div>
      </footer>
    </div>
  );
}
