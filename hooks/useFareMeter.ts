import { useState, useEffect, useMemo, useRef } from 'react';
import { FareModeKey, FareDetails } from '../types';
import { FARE_MATRIX } from '../constants';
import { isNightTime } from '../utils/geo';

interface UseFareMeterProps {
  mode: FareModeKey;
  speedKmh: number;
  totalDistanceKm: number;
  isTracking: boolean;
}

// Threshold to switch between waiting and moving state
// 1.8 km/h is approx 0.5 m/s
const MOVING_SPEED_THRESHOLD_KMH = 1.8;

export const useFareMeter = ({
  mode,
  speedKmh,
  totalDistanceKm,
  isTracking,
}: UseFareMeterProps) => {
  // Time tracking (in seconds)
  const [movingTimeSec, setMovingTimeSec] = useState(0);
  const [waitingTimeSec, setWaitingTimeSec] = useState(0);
  
  const config = FARE_MATRIX[mode];

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (isTracking) {
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

  // Reset when tracking stops (optional, currently we preserve state until reset explicitly)
  const resetMeter = () => {
    setMovingTimeSec(0);
    setWaitingTimeSec(0);
  };

  // Calculation Logic
  const fareDetails: FareDetails = useMemo(() => {
    // 1. Calculate Distance Fare (Tiered)
    let remainingDist = totalDistanceKm;
    let calculatedDistanceFare = 0;
    
    // Sort tiers by km just in case, though config should be sorted
    const tiers = [...config.distance_tiers].sort((a, b) => a.km - b.km);
    
    let previousTierKm = 0;
    
    for (const tier of tiers) {
      if (remainingDist <= 0) break;
      
      // The span of this tier
      const tierSpan = tier.km - previousTierKm;
      
      // How much of our distance falls into this tier
      const distInTier = Math.min(remainingDist, tierSpan);
      
      if (distInTier > 0) {
        calculatedDistanceFare += distInTier * tier.rate;
        remainingDist -= distInTier;
      }
      
      previousTierKm = tier.km;
    }
    // If there is still distance remaining (exceeding max tier defined), use the last tier rate
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
    const waitingFare = Math.min(rawWaitFare, config.wait_max_cap);

    // 4. Night Surcharge
    // Check if current time is night time
    const isNight = isNightTime(config.night_fare_start, config.night_fare_end);
    
    // Surcharge applies to Base + Distance + Time (usually waiting is excluded or included depending on specific local rules, 
    // but prompt says: "Night Fare surcharge applies to the Base, Time, and Distance Fares")
    const subTotalForSurcharge = config.base_fare + calculatedDistanceFare + timeFare;
    const nightSurcharge = isNight ? subTotalForSurcharge * 0.20 : 0;

    // 5. Totals
    // Total Customer = Base + Distance + Time + Wait + Night + Platform
    const totalCustomerFare = 
      config.base_fare + 
      calculatedDistanceFare + 
      timeFare + 
      waitingFare + 
      nightSurcharge + 
      config.platform_fee;

    // 6. Driver Payout
    // Commission is percentage of (Order + Surge + Night Fare) usually excludes platform fee
    // "applied as a percentage of the total collected fare (Order + Surge + Night Fare)"
    // Interpreting "Order" as Base + Distance + Time + Wait
    const fareSubjectToCommission = 
      config.base_fare + 
      calculatedDistanceFare + 
      timeFare + 
      waitingFare + 
      nightSurcharge;
      
    const commission = fareSubjectToCommission * config.commission_rate;
    
    // Net Payout = Total Collected - Commission - Platform Fee (Platform fee goes to platform)
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
        isNightTime: isNight,
        totalDistanceKm,
        totalMovingMin,
        totalWaitingMin,
      }
    };
  }, [config, totalDistanceKm, movingTimeSec, waitingTimeSec]);

  return { fareDetails, resetMeter };
};
