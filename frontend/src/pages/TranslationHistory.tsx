import { useState, useEffect } from "react";
import {
  getTranslationHistory,
  type TranslationLogEntry,
} from "../services/translation";

function TranslationHistory() {
  const [apiKey, setApiKey] = useState("");
  const [history, setHistory] = useState<TranslationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const limit = 25;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const savedKey = localStorage.getItem("apiKey");
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchHistory();
    }
  }, [offset]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem("apiKey", value);
  };

  const fetchHistory = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getTranslationHistory(apiKey, limit, offset);
      setHistory(data.translations);
      setTotal(data.total);
    } catch (err) {
      setError("Failed to fetch history. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePrevPage = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Translation History
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Enter your API key (edtech_xxx_xxx)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800"
              />
            </div>
            <button
              onClick={fetchHistory}
              disabled={isLoading || !apiKey.trim()}
              className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Loading..." : "Fetch History"}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {offset + 1}-{Math.min(offset + history.length, total)}{" "}
                of {total} translations
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0 || isLoading}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={offset + limit >= total || isLoading}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        {entry.targetLanguage}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.model}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Source
                      </p>
                      <p className="text-sm text-gray-800 line-clamp-3">
                        {entry.sourceText}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Translation
                      </p>
                      <p className="text-sm text-gray-800 line-clamp-3">
                        {entry.translatedText || "(No translation yet)"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span>Latency: {entry.latencyMs}ms</span>
                    {entry.tokenCount && (
                      <span>Tokens: {entry.tokenCount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && !isLoading && !error && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No translations yet</p>
            <p className="text-sm">
              Enter your API key and click "Fetch History" to see your
              translations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TranslationHistory;
