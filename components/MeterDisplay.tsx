import React, { useState } from 'react';
import { FareDetails, FareModeKey } from '../types';
import { SegmentedControl } from './SegmentedControl';
import { Skeleton } from './Skeleton';

interface MeterDisplayProps {
  fareDetails: FareDetails;
  isTracking: boolean;
  isGPSReady: boolean;
  mode: FareModeKey;
  setMode: (mode: FareModeKey) => void;
  onToggleTracking: () => void;
  speedKmh: number;
}

export const MeterDisplay: React.FC<MeterDisplayProps> = ({
  fareDetails,
  isTracking,
  isGPSReady,
  mode,
  setMode,
  onToggleTracking,
  speedKmh
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const formatDist = (val: number) => `${val.toFixed(2)} km`;
  const formatTime = (val: number) => `${Math.floor(val)}m ${Math.round((val % 1) * 60)}s`;

  if (!isGPSReady && isTracking) {
     // Initial acquiring state
     return (
        <div className="flex flex-col gap-6 p-4 w-full max-w-md mx-auto mt-10">
             <div className="text-center space-y-2">
                 <h2 className="text-md-sys-color-onSurfaceVariant">Acquiring GPS Signal...</h2>
                 <Skeleton variant="rectangular" className="h-32 w-full" />
             </div>
             <Skeleton variant="text" className="h-12" />
             <Skeleton variant="text" className="h-12" />
        </div>
     )
  }

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative pb-24">
      
      {/* Mode Selector */}
      <div className="p-4">
        <SegmentedControl 
            selected={mode} 
            onChange={setMode} 
            disabled={isTracking}
        />
      </div>

      {/* Main Fare Display */}
      <div className="px-4 py-6 flex flex-col items-center justify-center bg-md-sys-color-surface">
        <div className="text-md-sys-color-onSurfaceVariant text-sm uppercase tracking-wider font-medium mb-1">
          Total Fare
        </div>
        <div className="text-7xl font-bold text-md-sys-color-onSurface tracking-tight mb-2 transition-all duration-300">
          {formatCurrency(fareDetails.totalCustomerFare)}
        </div>
        
        {/* Status Badge */}
        <div className={`
            px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
            ${fareDetails.status.isMoving 
                ? 'bg-green-900/30 text-green-400 border border-green-800' 
                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'}
        `}>
            <span className="material-symbols-rounded text-sm">
                {fareDetails.status.isMoving ? 'speed' : 'timer'}
            </span>
            {fareDetails.status.isMoving ? 'MOVING' : 'WAITING'} 
            <span className="ml-1 opacity-75">({speedKmh.toFixed(1)} km/h)</span>
        </div>
        
        {fareDetails.status.isNightTime && (
             <div className="mt-2 text-xs text-md-sys-color-tertiary flex items-center gap-1">
                 <span className="material-symbols-rounded text-sm">bedtime</span>
                 Night Surcharge Active
             </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        <div className="bg-md-sys-color-surfaceVariant/30 p-4 rounded-2xl">
            <div className="text-xs text-md-sys-color-onSurfaceVariant mb-1">Distance</div>
            <div className="text-xl font-semibold text-md-sys-color-onSurface">
                {formatDist(fareDetails.status.totalDistanceKm)}
            </div>
        </div>
        <div className="bg-md-sys-color-surfaceVariant/30 p-4 rounded-2xl">
            <div className="text-xs text-md-sys-color-onSurfaceVariant mb-1">Duration</div>
            <div className="text-xl font-semibold text-md-sys-color-onSurface">
                {formatTime(fareDetails.status.totalMovingMin + fareDetails.status.totalWaitingMin)}
            </div>
        </div>
      </div>

      {/* Collapsible Breakdown */}
      <div className="px-4">
         <button 
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-md-sys-color-surfaceVariant/20 transition-colors"
         >
            <span className="text-sm font-medium text-md-sys-color-primary">Fare Breakdown</span>
            <span className="material-symbols-rounded text-md-sys-color-primary transform transition-transform duration-300" style={{ rotate: showDetails ? '180deg' : '0deg'}}>
                expand_more
            </span>
         </button>
         
         {showDetails && (
             <div className="mt-2 bg-md-sys-color-surfaceVariant/20 rounded-xl p-4 space-y-2 text-sm animate-[fadeIn_0.3s_ease-out]">
                 <div className="flex justify-between">
                     <span className="text-md-sys-color-onSurfaceVariant">Base Fare</span>
                     <span>{formatCurrency(fareDetails.breakdown.baseFare)}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-md-sys-color-onSurfaceVariant">Distance</span>
                     <span>{formatCurrency(fareDetails.breakdown.distanceFare)}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-md-sys-color-onSurfaceVariant">Time</span>
                     <span>{formatCurrency(fareDetails.breakdown.timeFare)}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-md-sys-color-onSurfaceVariant">Waiting</span>
                     <span>{formatCurrency(fareDetails.breakdown.waitingFare)}</span>
                 </div>
                 <div className="flex justify-between text-md-sys-color-tertiary">
                     <span>Night Surcharge</span>
                     <span>{formatCurrency(fareDetails.breakdown.nightSurcharge)}</span>
                 </div>
                 <div className="flex justify-between pt-2 border-t border-md-sys-color-outline/20">
                     <span className="text-md-sys-color-onSurfaceVariant">Platform Fee</span>
                     <span>{formatCurrency(fareDetails.breakdown.platformFee)}</span>
                 </div>
                 <div className="flex justify-between pt-2 mt-2 border-t border-dashed border-md-sys-color-outline/20 font-bold text-green-400">
                     <span>Driver Net Payout</span>
                     <span>{formatCurrency(fareDetails.netDriverPayout)}</span>
                 </div>
             </div>
         )}
      </div>

      {/* FAB Controller */}
      <div className="fixed bottom-6 right-6 left-6 flex justify-center">
        <button
          onClick={onToggleTracking}
          className={`
            h-16 px-8 rounded-2xl shadow-lg flex items-center gap-3 transition-all duration-300
            hover:shadow-xl hover:scale-105 active:scale-95
            ${isTracking 
                ? 'bg-md-sys-color-error text-md-sys-color-onError' 
                : 'bg-md-sys-color-primaryContainer text-md-sys-color-onPrimaryContainer'}
          `}
        >
            <span className="material-symbols-rounded text-3xl">
                {isTracking ? 'stop_circle' : 'play_arrow'}
            </span>
            <span className="text-lg font-bold font-sans">
                {isTracking ? 'End Ride' : 'Start Ride'}
            </span>
        </button>
      </div>
    </div>
  );
};
