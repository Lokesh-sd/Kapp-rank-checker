import React, { useState, useEffect } from "react";
import axios from "axios";

const LOCAL_STORAGE_KEY = 'kollegeApplySearchHistory';

const SearchForm = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState(null);

  useEffect(() => {
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Error parsing stored history:", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

    const updateHistory = (keyword, newResults) => {
        const existingIndex = history.findIndex(item => item.keyword === keyword);
        const historyItem = { keyword, results: newResults, timestamp: new Date().toISOString() };

        if (existingIndex > -1) {
            const updatedHistory = [...history];
            updatedHistory[existingIndex] = historyItem;
            setHistory(updatedHistory);
        } else {
            setHistory(prevHistory => [...prevHistory, historyItem]);
        }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await axios.post("http://localhost:8000/api/check-ranking", { keyword });
      const searchResults = response.data;
      setResults(searchResults);
       updateHistory(keyword, searchResults);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch ranking data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (item) => {
    setExpandedHistoryItem(expandedHistoryItem === item.keyword ? null : item.keyword);
    setKeyword(item.keyword);
    setResults(item.results);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl text-orange-500 font-semibold text-center mb-6">
        College <span className="text-black">Rank Checker</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keyword (e.g. MBA colleges in Bangalore)"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition duration-200 cursor-pointer shadow-sm"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && <p className="text-red-600 text-center">{error}</p>}
      </form>

      {/* Initial state - Show prompt to search */}
      {!loading && !results && !error && (
        <div className="mt-10 text-center text-gray-500">
          <h3 className="text-lg font-medium">Start Searching</h3>
          <p className="text-sm">Enter a keyword to check the ranking of colleges or courses.</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-10 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Fetching results...</p>
        </div>
      )}

      {/* Display Results */}
      {results && !loading && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Results for: <span className="text-blue-600">"{results?.keyword}"</span>
          </h3>

          {results?.rank !== 'Not Found' ? (
            <>
              <p className="text-green-600 mb-6">
                Found at rank {results?.rank} in the search results.
              </p>
            </>
          ) : (
            <p className="text-red-500 text-center mt-4">
              No occurrences found in the top 1000 results.
            </p>
          )}
        </div>
      )}

      {/* Search History with Accordion */}
      {history.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Searches</h3>
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.keyword} className="bg-gray-100 rounded-md p-3 flex flex-col">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.keyword}</span>
                    {item.results?.rank !== 'Not Found' ? (
                      <span className="text-green-600 ml-2 text-sm">(Rank: {item.results?.rank})</span>
                    ) : (
                      <span className="text-red-500 ml-2 text-sm">(Not found)</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewHistory(item)}
                    className="px-2 py-1 bg-blue-100 text-blue-500 hover:bg-blue-200 rounded-md text-sm  focus:outline-none"
                  >
                    {!expandedHistoryItem ? 'View' : 'Close'}
                  </button>
                </div>
                {expandedHistoryItem === item.keyword && item.results && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-600 mb-2">Results from History:</h4>
                    {item.results?.rank !== 'Not Found' ? (
                      <ul className="space-y-2">
                        <li  className="bg-gray-200 rounded-md p-3 text-sm">
                            <strong>Rank:</strong> {item.results?.rank}
                        </li>
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No occurrences found for this keyword in the top 1000 results.</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchForm;
