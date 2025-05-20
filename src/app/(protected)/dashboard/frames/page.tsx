'use client';

import { useState, useEffect } from 'react';
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

interface Frame {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export default function FramesPage() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFrames = async () => {
      try {
        setIsLoading(true);
        // In a real app, fetch from your API
        const response = await fetch('/api/frames');
        
        if (!response.ok) {
          throw new Error('Failed to fetch frames');
        }
        
        const data = await response.json();
        setFrames(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Error fetching frames:', err);
        setError('Failed to load frames. Please try again.');
        
        // For demo purposes, set mock data if API fails
        setFrames([
          {
            id: 'frame-1',
            name: 'Classic Frame',
            url: '/frames/classic.png',
            createdAt: new Date().toISOString()
          },
          {
            id: 'frame-2',
            name: 'Modern Frame',
            url: '/frames/modern.png',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'frame-3',
            name: 'Holiday Frame',
            url: '/frames/holiday.png',
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFrames();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frames</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage photo frames available in the application.
          </p>
        </div>
        <Link
          href="/dashboard/frames/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add Frame
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {frames.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No frames</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new frame.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/frames/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Frame
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {frames.map((frame) => (
            <div
              key={frame.id}
              className="relative bg-white border rounded-lg shadow overflow-hidden"
            >
              <div className="aspect-w-10 aspect-h-7 bg-gray-200">
                <div className="relative h-48 w-full">
                  <Image
                    src={frame.thumbnailUrl || frame.url}
                    alt={frame.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback if image doesn't load
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%236b7280'%3ENo Preview%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900">{frame.name}</h3>
                <p className="mt-1 text-sm text-gray-500">Added {formatDate(frame.createdAt)}</p>
                <div className="mt-4 flex space-x-3">
                  <Link
                    href={`/dashboard/frames/${frame.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
