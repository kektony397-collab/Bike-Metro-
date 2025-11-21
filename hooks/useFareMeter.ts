import { useState, useEffect, useMemo } from 'react';
import { FareModeKey, FareDetails } from '../types';
import { FARE_MATRIX } from '../constants';
import { isNightTime } from '../utils/geo';

interface UseFareMeterProps {
  mode: FareModeKey;
  speedKmh: number;
  totalDistanceKm: number;
  isTracking: boolean;
  settings: {
    allowNightFare: boolean;
    allowWaitingCharges: boolean;
  }
}

// Threshold to switch between waiting and moving state
// 1.8 km/h is approx 0.5 m/s
const MOVING_SPEED_THRESHOLD_KMH = 1.8;

export const useFareMeter = ({
  mode,
  speedKmh,
  totalDistanceKm,
  isTracking,
  settings
}: UseFareMeterProps) => {
  // Time tracking (in seconds)
  const [movingTimeSec, setMovingTimeSec] = useState(0);
  const [waitingTimeSec, setWaitingTimeSec] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const config = FARE_MATRIX[mode];

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (isTracking) {
      setHasStarted(true);
      interval = window.setInterval(() => {
        if (speedKmh > MOVING_SPEED_THRESHOLD_KMH) {
          setMovingTimeSec((prev) => prev + 1);
        } else {
          setWaitingTimeSec((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, speedKmh]);

  // Reset when tracking stops
  const resetMeter = () => {
    setMovingTimeSec(0);
    setWaitingTimeSec(0);
    setHasStarted(false);
  };

  // Calculation Logic
  const fareDetails: FareDetails = useMemo(() => {
    // If the ride hasn't really started (no tracking history), show 0
    if (!hasStarted && totalDistanceKm === 0 && movingTimeSec === 0 && waitingTimeSec === 0) {
       return {
        totalCustomerFare: 0,
        netDriverPayout: 0,
        breakdown: {
          baseFare: 0,
          distanceFare: 0,
          timeFare: 0,
          waitingFare: 0,
          nightSurcharge: 0,
          platformFee: 0,
          commission: 0,
        },
        status: {
          isMoving: false,
          isNightTime: false,
          totalDistanceKm: 0,
          totalMovingMin: 0,
          totalWaitingMin: 0,
        }
       };
    }

    // 1. Calculate Distance Fare (Tiered)
    let remainingDist = totalDistanceKm;
    let calculatedDistanceFare = 0;
    
    const tiers = [...config.distance_tiers].sort((a, b) => a.km - b.km);
    let previousTierKm = 0;
    
    for (const tier of tiers) {
      if (remainingDist <= 0) break;
      const tierSpan = tier.km - previousTierKm;
      const distInTier = Math.min(remainingDist, tierSpan);
      
      if (distInTier > 0) {
        calculatedDistanceFare += distInTier * tier.rate;
        remainingDist -= distInTier;
      }
      previousTierKm = tier.km;
    }
    if (remainingDist > 0 && tiers.length > 0) {
        calculatedDistanceFare += remainingDist * tiers[tiers.length - 1].rate;
    }

    // 2. Calculate Time Fare
    const totalMovingMin = movingTimeSec / 60;
    const timeFare = totalMovingMin * config.time_rate_per_min;

    // 3. Calculate Waiting Fare
    const totalWaitingMin = waitingTimeSec / 60;
    const chargeableWaitMin = Math.max(0, totalWaitingMin - config.wait_threshold_min);
    const rawWaitFare = chargeableWaitMin * config.wait_rate_per_min;
    // Apply waiting charge ONLY if setting is enabled
    const waitingFare = settings.allowWaitingCharges 
        ? Math.min(rawWaitFare, config.wait_max_cap) 
        : 0;

    // 4. Night Surcharge
    const isNightTimeCheck = isNightTime(config.night_fare_start, config.night_fare_end);
    // Apply Night Surcharge ONLY if setting is enabled AND it is night time
    const shouldApplyNightFare = settings.allowNightFare && isNightTimeCheck;
    
    const subTotalForSurcharge = config.base_fare + calculatedDistanceFare + timeFare;
    const nightSurcharge = shouldApplyNightFare ? subTotalForSurcharge * 0.20 : 0;

    // 5. Totals
    const totalCustomerFare = 
      config.base_fare + 
      calculatedDistanceFare + 
      timeFare + 
      waitingFare + 
      nightSurcharge + 
      config.platform_fee;

    // 6. Driver Payout
    const fareSubjectToCommission = 
      config.base_fare + 
      calculatedDistanceFare + 
      timeFare + 
      waitingFare + 
      nightSurcharge;
      
    const commission = fareSubjectToCommission * config.commission_rate;
    const netDriverPayout = totalCustomerFare - commission - config.platform_fee;

    return {
      totalCustomerFare,
      netDriverPayout,
      breakdown: {
        baseFare: config.base_fare,
        distanceFare: calculatedDistanceFare,
        timeFare,
        waitingFare,
        nightSurcharge,
        platformFee: config.platform_fee,
        commission,
      },
      status: {
        isMoving: speedKmh > MOVING_SPEED_THRESHOLD_KMH,
        isNightTime: isNightTimeCheck,
        totalDistanceKm,
        totalMovingMin,
        totalWaitingMin,
      }
    };
  }, [config, totalDistanceKm, movingTimeSec, waitingTimeSec, settings, hasStarted, speedKmh]);

  return { fareDetails, resetMeter };
};