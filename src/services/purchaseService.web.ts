export const IAP_PRODUCT_ID = 'mansil_premium_season1';
export const IAP_ENTITLEMENT_ID = 'premium';
export const SEED_DONATION_PRODUCT_ID = 'seed_donation_1';
export const REVENUECAT_GOOGLE_API_KEY = 'goog_placeholder_api_key';

export async function initPurchaseService(): Promise<void> {
  // Web does not need native IAP initialization
}

export async function purchasePremiumSeason(): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
  // Web preview mode auto-succeeds
  return { success: true };
}

export async function purchaseSeedDonation(): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
  // Web preview mode auto-succeeds
  return { success: true };
}

export async function restorePurchases(): Promise<{ success: boolean; hasPurchases: boolean; error?: string }> {
  return { success: true, hasPurchases: true };
}

import i18n from '@/i18n';

export async function getProductPrices(): Promise<{ premiumPrice?: string; seedPrice?: string }> {
  const isEn = i18n.language?.startsWith('en');
  return {
    premiumPrice: isEn ? '$1.99' : '₩2,000',
    seedPrice: isEn ? '$1.99' : '₩2,000',
  };
}

export async function checkHasPurchased(): Promise<boolean> {
  return false;
}

export function addCustomerInfoUpdateListener(_callback: (hasPurchased: boolean) => void): () => void {
  return () => {};
}

export async function debugResetAndSyncPurchases(): Promise<{ success: boolean; activeEntitlements: string[]; message?: string }> {
  return { success: true, activeEntitlements: [], message: 'Web environment' };
}

