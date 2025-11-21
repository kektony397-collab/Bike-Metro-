import { useState, useEffect, useRef, useCallback } from 'react';
import { GPSLocation } from '../types';
import { calculateDistance } from '../utils/geo';

interface UseGPSLocationReturn {
  location: GPSLocation | null;
  totalDistanceKm: number;
  speedKmh: number;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  resetDistance: () => void;
}

export const useGPSLocation = (): UseGPSLocationReturn => {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);
  const lastLocationRef = useRef<GPSLocation | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Speed threshold to reduce GPS noise drift when stationary (m/s)
  const ACCURACY_THRESHOLD = 30; // Only accept updates with accuracy < 30m

  // Function to request Wake Lock (keeps screen on and browser active)
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        console.log('Wake Lock is active');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock released');
    }
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsTracking(true);
    setError(null);
    
    // Activate Wake Lock
    requestWakeLock();

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;
        const timestamp = position.timestamp;

        // Discard low accuracy points to prevent "teleporting"
        if (accuracy > ACCURACY_THRESHOLD) return;

        const newLocation: GPSLocation = {
          latitude,
          longitude,
          speed, // speed is in m/s
          accuracy,
          timestamp,
        };

        setLocation(newLocation);

        if (lastLocationRef.current) {
          const dist = calculateDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            latitude,
            longitude
          );

          // Only accumulate distance if it's significant relative to accuracy noise
          // or if reported speed suggests movement
          if (dist > 0.005) { // 5 meters minimum jump
             setTotalDistanceKm((prev) => prev + dist);
          }
        }

        lastLocationRef.current = newLocation;
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    releaseWakeLock();
  }, []);

  const resetDistance = useCallback(() => {
    setTotalDistanceKm(0);
    lastLocationRef.current = null;
    setLocation(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      releaseWakeLock();
    };
  }, []);

  // Re-acquire wake lock if visibility changes (e.g. user switches tabs and comes back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTracking) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking]);

  // Convert m/s to km/h
  const speedKmh = location?.speed ? location.speed * 3.6 : 0;

  return {
    location,
    totalDistanceKm,
    speedKmh,
    isTracking,
    error,
    startTracking,
    stopTracking,
    resetDistance,
  };
};