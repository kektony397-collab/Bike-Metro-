import React, { useState, useEffect } from 'react';
import { useGPSLocation } from './hooks/useGPSLocation';
import { useFareMeter } from './hooks/useFareMeter';
import { MeterDisplay } from './components/MeterDisplay';
import { FareModeKey } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<FareModeKey>('BikeTaxi');
  
  // 1. GPS Logic
  const {
    location,
    totalDistanceKm,
    speedKmh,
    isTracking,
    startTracking,
    stopTracking,
    resetDistance,
    error: gpsError
  } = useGPSLocation();

  // 2. Fare Logic
  const { fareDetails, resetMeter } = useFareMeter({
    mode,
    speedKmh,
    totalDistanceKm,
    isTracking,
  });

  const handleToggleTracking = () => {
    if (isTracking) {
      // Stopping
      const confirmStop = window.confirm("End current ride?");
      if (confirmStop) {
        stopTracking();
      }
    } else {
      // Starting
      // Reset previous data if any
      if (totalDistanceKm > 0 || fareDetails.totalCustomerFare > 25) {
           resetDistance();
           resetMeter();
      }
      startTracking();
    }
  };

  // Error Toast
  useEffect(() => {
    if (gpsError) {
      alert(`GPS Error: ${gpsError}. Please enable high accuracy location.`);
    }
  }, [gpsError]);

  return (
    <div className="min-h-screen bg-md-sys-color-background text-md-sys-color-onBackground flex flex-col font-sans selection:bg-md-sys-color-primaryContainer">
      {/* App Bar */}
      <header className="sticky top-0 z-10 bg-md-sys-color-surface/80 backdrop-blur-md border-b border-md-sys-color-outline/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-md-sys-color-primaryContainer rounded-full flex items-center justify-center">
                <span className="material-symbols-rounded text-md-sys-color-onPrimaryContainer">two_wheeler</span>
            </div>
            <div>
                <h1 className="text-lg font-bold leading-tight">BikeMeter Pro</h1>
                <p className="text-xs text-md-sys-color-onSurfaceVariant">Driver Partner App</p>
            </div>
        </div>
        {isTracking && (
             <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto">
        <MeterDisplay
          fareDetails={fareDetails}
          isTracking={isTracking}
          isGPSReady={!!location || !isTracking}
          mode={mode}
          setMode={setMode}
          onToggleTracking={handleToggleTracking}
          speedKmh={speedKmh}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-md-sys-color-outline border-t border-md-sys-color-outline/10">
         Created by Yash K Pathak
      </footer>
    </div>
  );
};

export default App;
