import { useState, useEffect, useRef } from 'react';
import { FileUp, ArrowRight, Loader2, ChevronDown, FileText, X, Plus, Trash2, Languages, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/api';

interface Language {
  id: number;
  code: string;
  name: string;
}

interface BatchItem {
  id: string;
  text: string;
}

interface BatchResult {
  translatedText: string;
}

type Mode = 'batch' | 'pdf';

let itemCounter = 1;

export function TranslationStudio() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [targetLang, setTargetLang] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('batch');
  const [file, setFile] = useState<File | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch items
  const [items, setItems] = useState<BatchItem[]>([
    { id: String(itemCounter++), text: '' },
    { id: String(itemCounter++), text: '' },
  ]);
  const [results, setResults] = useState<Record<string, BatchResult>>({});

  // PDF result
  const [pdfResult, setPdfResult] = useState('');

  useEffect(() => {
    const fetchLangs = async () => {
      try {
        const res = await api.get('/api/languages');
        const data = Array.isArray(res.data) ? res.data : res.data?.languages ?? [];
        setLanguages(data);
        if (data.length > 0 && !targetLang) {
          setTargetLang(data[0].code);
        }
      } catch {
        setLanguages([]);
      }
    };
    fetchLangs();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLanguage = languages.find(l => l.code === targetLang);

  const addItem = () => {
    setItems((prev) => [...prev, { id: String(itemCounter++), text: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateItemText = (id: string, text: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
  };

  const handleBatchTranslate = async () => {
    const validItems = items.filter((i) => i.text.trim());
    if (validItems.length === 0) return;
    setLoading(true);
    setResults({});
    setError('');
    try {
      const res = await api.post('/api/translate/batch', {
        items: validItems.map((i) => ({ id: i.id, text: i.text.trim() })),
        targetLanguage: selectedLanguage?.name || 'French',
        ...(gradeLevel.trim() ? { gradeLevel: gradeLevel.trim() } : {}),
      });
      setResults(res.data.results || {});
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Batch translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslatePdf = async () => {
    if (!file) return;
    setLoading(true);
    setPdfResult('');
    setError('');
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('targetLanguage', selectedLanguage?.name || 'French');
    try {
      const res = await api.post('/api/translate/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPdfResult(res.data.translatedContent || 'PDF translated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'PDF translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = () => {
    if (mode === 'batch') handleBatchTranslate();
    else handleTranslatePdf();
  };

  const canTranslate =
    mode === 'batch'
      ? items.some((i) => i.text.trim()) && !!selectedLanguage
      : file !== null && !!selectedLanguage;

  return (
    <div>
      {/* Section header */}
      <div className="mb-8">
        <h2 className="font-display text-4xl text-zinc-900 text-balance">
          Translation Studio
        </h2>
        <p className="text-zinc-400 mt-2 text-base text-pretty max-w-xl">
          Translate educational content across languages.
          Supports batch text and PDF documents.
        </p>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Language selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:border-zinc-300 transition-colors min-w-[180px] justify-between"
          >
            <span className="flex items-center gap-2">
              <Languages className="size-3.5 text-zinc-400" />
              {selectedLanguage ? (
                <>
                  <span className="text-zinc-800 font-medium">{selectedLanguage.name}</span>
                  <span className="text-zinc-400 font-mono text-xs">{selectedLanguage.code}</span>
                </>
              ) : (
                <span className="text-zinc-400">Select language</span>
              )}
            </span>
            <ChevronDown className={cn('size-3.5 text-zinc-400 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg shadow-zinc-100 overflow-hidden">
              <div className="max-h-60 overflow-y-auto py-1">
                {languages.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-zinc-400">No languages available</p>
                ) : (
                  languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setTargetLang(lang.code);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between',
                        targetLang === lang.code
                          ? 'bg-zinc-50 text-zinc-900 font-medium'
                          : 'text-zinc-600 hover:bg-zinc-50'
                      )}
                    >
                      <span>{lang.name}</span>
                      <span className="text-xs text-zinc-400 font-mono">{lang.code}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-1">
          <button
            onClick={() => setMode('batch')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
              mode === 'batch'
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-600'
            )}
          >
            <Languages className="size-3.5" />
            Batch
          </button>
          <button
            onClick={() => setMode('pdf')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
              mode === 'pdf'
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-600'
            )}
          >
            <FileUp className="size-3.5" />
            PDF
          </button>
        </div>

        {/* Grade level (optional) */}
        {mode === 'batch' && (
          <input
            type="text"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            placeholder="Grade level (optional)"
            className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 w-44"
          />
        )}

        <div className="flex-1" />

        {/* Translate button */}
        <button
          onClick={handleTranslate}
          disabled={!canTranslate || loading}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
            canTranslate && !loading
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Translating…
            </>
          ) : (
            <>
              Translate
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-500 transition-colors">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Main content area */}
      {mode === 'batch' ? (
        <div className="flex flex-col gap-3">
          {/* Batch items */}
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border border-zinc-200 rounded-lg overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 tabular-nums">
                  Item {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  {results[item.id] && (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  )}
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-zinc-300 hover:text-red-400 transition-colors p-1"
                      aria-label={`Remove item ${idx + 1}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className={cn('grid gap-0', results[item.id] ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                {/* Source text */}
                <div className={cn(results[item.id] && 'md:border-r md:border-zinc-100')}>
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                    placeholder="Enter text to translate…"
                    rows={3}
                    className="w-full bg-transparent p-4 text-zinc-800 text-sm leading-relaxed resize-none placeholder:text-zinc-300 focus:outline-none"
                  />
                </div>

                {/* Result */}
                {results[item.id] && (
                  <div className="p-4 border-t border-zinc-100 md:border-t-0 bg-zinc-50/50">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">
                      {selectedLanguage?.name}
                    </span>
                    <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap text-pretty">
                      {results[item.id].translatedText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add item button */}
          <button
            onClick={addItem}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed border-zinc-200 text-zinc-400 text-sm hover:border-zinc-300 hover:text-zinc-500 transition-colors"
          >
            <Plus className="size-4" />
            Add item
          </button>
        </div>
      ) : (
        /* PDF Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload area */}
          <div
            className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile?.type === 'application/pdf') setFile(droppedFile);
            }}
          >
            <div className="px-4 py-2.5 border-b border-zinc-100">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Upload PDF</span>
            </div>
            <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center p-8">
              {file ? (
                <div className="text-center">
                  <div className="size-14 rounded-xl bg-zinc-50 flex items-center justify-center mx-auto mb-3">
                    <FileText className="size-7 text-zinc-400" />
                  </div>
                  <p className="text-zinc-800 font-medium text-sm mb-0.5 truncate max-w-[260px]">{file.name}</p>
                  <p className="text-zinc-400 text-xs tabular-nums mb-3">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-xs text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1 mx-auto"
                  >
                    <X className="size-3" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="size-14 rounded-xl bg-zinc-50 flex items-center justify-center mx-auto mb-3 border border-dashed border-zinc-200">
                    <FileUp className="size-7 text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 text-sm mb-1">Drop a PDF here or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-zinc-900 text-sm font-medium hover:text-zinc-600 transition-colors"
                  >
                    browse files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-zinc-100">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {selectedLanguage?.name || 'Translation'}
              </span>
            </div>
            <div className="flex-1 min-h-[280px] p-4 overflow-y-auto">
              {pdfResult ? (
                <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap text-pretty">
                  {pdfResult}
                </p>
              ) : (
                <p className="text-zinc-300 text-sm italic">
                  {loading ? 'Translating your document…' : 'Translated content will appear here'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Languages info */}
      {languages.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Supported Languages
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTargetLang(lang.code)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  targetLang === lang.code
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200'
                )}
              >
                {lang.name}
                <span className="ml-1 font-mono text-[10px] opacity-50">{lang.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
