// Utility to calculate prize and fee breakdown for a wager
import { getWagerPrizeAndFee as calculateWagerPrizeAndFee } from './feeUtils';

// Re-export the function from the centralized fee utils
export function getWagerPrizeAndFee(entry, numPlayers = 2, feePercent) {
  return calculateWagerPrizeAndFee(entry, numPlayers, feePercent);
} 