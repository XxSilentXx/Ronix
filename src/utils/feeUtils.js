// Central utility file for managing all fees across the site
// All fee percentages and calculations should be referenced from here

// Fee configuration (all percentages as decimals)
export const FEE_CONFIG = {
  wager: 0.05,     // 5% fee on wagers
  withdrawal: 0.05, // 5% fee on withdrawals
  tip: 0.03,       // 3% fee on tips
  minWagerAmount: 0.50,       // Minimum wager amount in tokens
  minWithdrawalAmount: 5.00,  // Minimum withdrawal amount in USD
  minWithdrawalFee: 0.25,     // Minimum fee for withdrawals in USD
  minWithdrawalTokens: 5      // Minimum tokens required for withdrawal ($5)
};

// Calculate fee and prize breakdown for a wager
export function getWagerPrizeAndFee(entry, numPlayers = 2, feePercent = FEE_CONFIG.wager) {
  // Calculate fee as a decimal rounded to 2 decimal places
  const feePerPlayer = Math.round(entry * feePercent * 100) / 100;
  const prizePerPlayer = Math.round((entry - feePerPlayer) * 100) / 100;

  const totalFee = Math.round(feePerPlayer * numPlayers * 100) / 100;
  const totalPrize = Math.round(prizePerPlayer * numPlayers * 100) / 100;

  return {
    feePerPlayer,
    totalFee,
    totalPrize,
    prizePerPlayer,
    feePercent
  };
}

// Calculate withdrawal fee
export function getWithdrawalFee(amount, feePercent = FEE_CONFIG.withdrawal) {
  const calculatedFee = Math.round(amount * feePercent * 100) / 100;
  // Apply minimum fee in tokens (directly use USD value since 1 coin = $1)
  const minFeeInTokens = FEE_CONFIG.minWithdrawalFee;
  const fee = Math.max(calculatedFee, minFeeInTokens);
  const amountAfterFee = Math.round((amount - fee) * 100) / 100;
  
  return {
    fee,
    amountAfterFee,
    feePercent
  };
}

// Calculate tip fee
export function getTipFee(amount, feePercent = FEE_CONFIG.tip) {
  // Calculate fee as a decimal rounded to 2 decimal places
  const fee = Math.round(amount * feePercent * 100) / 100;
  const amountAfterFee = Math.round((amount - fee) * 100) / 100;
  
  return {
    fee,
    amountAfterFee,
    feePercent
  };
}

// Check if a withdrawal amount meets minimum requirements
export function canWithdraw(tokenBalance) {
  return tokenBalance >= FEE_CONFIG.minWithdrawalTokens;
}

// Check if a wager amount meets minimum requirements
export function isValidWagerAmount(amount) {
  return amount >= FEE_CONFIG.minWagerAmount;
} 