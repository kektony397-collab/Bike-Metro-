export type FareModeKey = 'BikeTaxi' | 'BikeBoost' | 'BikeMetro';

export interface DistanceTier {
  km: number;
  rate: number; // rate per km for this tier
}

export interface FareConfiguration {
  base_fare: number;
  platform_fee: number;
  commission_rate: number; // Decimal percentage (0.18 = 18%)
  distance_tiers: DistanceTier[];
  time_rate_per_min: number;
  wait_threshold_min: number; // Minutes before wait charges apply
  wait_rate_per_min: number;
  wait_max_cap: number; // Maximum amount chargeable for waiting
  night_fare_start: string; // "HH:MM" format
  night_fare_end: string;   // "HH:MM" format
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  speed: number | null; // m/s
  accuracy: number;
  timestamp: number;
}

export interface FareDetails {
  totalCustomerFare: number;
  netDriverPayout: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    waitingFare: number;
    nightSurcharge: number;
    platformFee: number;
    commission: number;
  };
  status: {
    isMoving: boolean;
    isNightTime: boolean;
    totalDistanceKm: number;
    totalMovingMin: number;
    totalWaitingMin: number;
  }
}