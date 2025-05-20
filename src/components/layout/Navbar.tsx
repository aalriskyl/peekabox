'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CodeModal } from '../session/CodeModal';

export default function Navbar() {
  const { logout } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/generate-session-code', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate code');
      }
      
      setGeneratedCode(data.code);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to generate code:', error);
      // You might want to show an error toast here
    } finally {
      setIsGenerating(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-black">Peekabox</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Session Code'}
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
            {isModalOpen && generatedCode && (
              <CodeModal code={generatedCode} onClose={closeModal} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}