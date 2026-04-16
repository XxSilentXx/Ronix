import { getFunctions, httpsCallable } from 'firebase/functions';

export async function purchaseVipSubscription(plan) {
  const functions = getFunctions();
  const purchaseVip = httpsCallable(functions, 'purchaseVipSubscription');
  try {
    const result = await purchaseVip({ plan });
    return result.data; // { success: true, message: ... }
  } catch (error) {
    throw error.message || error.details || 'VIP purchase failed';
  }
} 