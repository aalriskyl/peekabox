'use client';

import { useLoading } from '../contexts/LoadingContext';
import { LoadingSpinner } from './ui/loading-spinner';

export function ExampleFetcher() {
  const { isLoading, error, fetchData } = useLoading();

  const handleFetch = async () => {
    try {
      // Example API call - replace with your actual API endpoint
      const data = await fetchData('https://api.example.com/data');
      console.log('Fetched data:', data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading && <LoadingSpinner size="sm" />}
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
      {error && (
        <div className="mt-2 text-red-500">
          Error: {error}
        </div>
      )}
    </div>
  );
}
