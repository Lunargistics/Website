import { useState } from "react";
import { MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface Document {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
}

interface DocumentSearchPanelProps {
  documents: Document[];
  onDocumentSelect?: (doc: Document) => void;
}

export const DocumentSearchPanel = ({ documents, onDocumentSelect }: DocumentSearchPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [useAISearch, setUseAISearch] = useState(true);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      if (useAISearch) {
        // AI-powered semantic search
        const response = await fetch("/api/venice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "smartSearch",
            data: {
              query: searchQuery,
              documents: documents.map(d => ({
                id: d.id,
                type: d.type,
                title: d.title,
                date: d.date,
              })),
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Parse AI response to get matching document IDs
          const matchingIds = extractDocumentIds(result.matches);
          const matches = documents.filter(d => matchingIds.includes(d.id));
          setSearchResults(matches);
        }
      } else {
        // Traditional keyword search
        const query = searchQuery.toLowerCase();
        const matches = documents.filter(
          doc =>
            doc.title.toLowerCase().includes(query) ||
            doc.type.toLowerCase().includes(query) ||
            doc.status.toLowerCase().includes(query),
        );
        setSearchResults(matches);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to keyword search
      const query = searchQuery.toLowerCase();
      const matches = documents.filter(
        doc => doc.title.toLowerCase().includes(query) || doc.type.toLowerCase().includes(query),
      );
      setSearchResults(matches);
    } finally {
      setIsSearching(false);
    }
  };

  const extractDocumentIds = (aiResponse: string): string[] => {
    // Extract document IDs from AI response
    try {
      // Try to parse as JSON array first
      const ids = JSON.parse(aiResponse);
      if (Array.isArray(ids)) return ids;
    } catch {
      // Fallback: extract numbers from text
      const matches = aiResponse.match(/\d+/g);
      return matches || [];
    }
    return [];
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg flex items-center gap-2">
          <MagnifyingGlassIcon className="h-5 w-5" />
          Document Search
        </h3>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-primary" />
              AI-Powered Search
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={useAISearch}
              onChange={e => setUseAISearch(e.target.checked)}
            />
          </label>
        </div>

        <div className="join w-full">
          <input
            type="text"
            placeholder={useAISearch ? "Ask about your documents..." : "Search by keyword..."}
            className="input input-bordered join-item flex-1"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSearch()}
          />
          <button
            className={`btn btn-primary join-item ${isSearching ? "loading" : ""}`}
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? "" : <MagnifyingGlassIcon className="h-5 w-5" />}
            Search
          </button>
        </div>

        {useAISearch && (
          <div className="text-xs opacity-70 mt-1">
            Try: &quot;Show me all active licenses&quot;, &quot;Documents expiring soon&quot;, &quot;Environmental assessments&quot;
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">
              Found {searchResults.length} document{searchResults.length !== 1 ? "s" : ""}
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map(doc => (
                <div
                  key={doc.id}
                  className="p-3 bg-base-200 rounded hover:bg-base-300 cursor-pointer transition-colors"
                  onClick={() => onDocumentSelect?.(doc)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs opacity-70">
                        {doc.type} • {doc.date}
                      </p>
                    </div>
                    <div
                      className={`badge badge-sm ${
                        doc.status === "Active"
                          ? "badge-success"
                          : doc.status === "Pending"
                            ? "badge-warning"
                            : "badge-ghost"
                      }`}
                    >
                      {doc.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="alert alert-info mt-4">
            <span className="text-sm">No documents found matching your search.</span>
          </div>
        )}
      </div>
    </div>
  );
};
