import rawSettlements from './settlements.generated.json';
import type { Settlement } from '../types';

export const settlements = rawSettlements as Settlement[];
