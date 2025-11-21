import { FareModeKey, FareConfiguration } from './types';

export const FARE_MATRIX: Record<FareModeKey, FareConfiguration> = {
  BikeTaxi: {
    base_fare: 19.0,
    platform_fee: 2.5,
    commission_rate: 0.18,
    distance_tiers: [
      { km: 2, rate: 0.0 },
      { km: 4, rate: 4.0 },
      { km: 100, rate: 6.5 },
    ],
    time_rate_per_min: 0.5,
    wait_threshold_min: 3,
    wait_rate_per_min: 1.0,
    wait_max_cap: 15.0,
    night_fare_start: '23:00',
    night_fare_end: '06:00',
  },
  BikeBoost: {
    base_fare: 13.0,
    platform_fee: 2.5,
    commission_rate: 0.09,
    distance_tiers: [
      { km: 2, rate: 0.0 },
      { km: 4, rate: 5.5 },
      { km: 100, rate: 5.5 },
    ],
    time_rate_per_min: 0.35,
    wait_threshold_min: 3,
    wait_rate_per_min: 1.5,
    wait_max_cap: 15.0,
    night_fare_start: '22:00',
    night_fare_end: '05:00',
  },
  BikeMetro: {
    base_fare: 17.0,
    platform_fee: 2.5,
    commission_rate: 0.09,
    distance_tiers: [
      { km: 3, rate: 0.0 },
      { km: 4, rate: 7.0 },
      { km: 100, rate: 6.0 },
    ],
    time_rate_per_min: 0.35,
    wait_threshold_min: 5,
    wait_rate_per_min: 1.0,
    wait_max_cap: 15.0,
    night_fare_start: '22:00',
    night_fare_end: '05:00',
  },
};
