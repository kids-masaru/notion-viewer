'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import Dashboard from '@/components/Dashboard';
import SettingsModal from '@/components/SettingsModal';

export default function Home() {
  const { settings, isLoaded, updateSettings, updateDatabaseSettings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Open settings automatically if no API key is configured
  useEffect(() => {
    if (isLoaded && !settings.apiKey && settings.databases.length === 0) {
      setIsSettingsOpen(true);
    }
  }, [isLoaded, settings.apiKey, settings.databases.length]);

  // Show loading state while reading from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Dashboard
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUpdateDatabaseSettings={updateDatabaseSettings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
