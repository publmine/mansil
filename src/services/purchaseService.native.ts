import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export const IAP_PRODUCT_ID = 'mansil_premium_season1';
export const IAP_ENTITLEMENT_ID = '만다라 온실 Pro';
export const SEED_DONATION_PRODUCT_ID = 'seed_donation_1';

export const REVENUECAT_GOOGLE_API_KEY = 'goog_QrCrYmwfLTWHNgnBFRkisnUFYyZ';

let isConfigured = false;

export async function initPurchaseService(): Promise<void> {
  try {
    if (!isConfigured && Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });
      isConfigured = true;
    }
  } catch (error) {
    console.warn('[IAP] Failed to initialize purchases:', error);
  }
}

export async function purchasePremiumSeason(): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
  try {
    let customerInfo;

    // 1. RevenueCat Offerings (오퍼링) 조회 시도 (가장 안정적)
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      // 현재 활성화된 패키지(예: lifetime, default)로 결제 진행
      const targetPackage =
        offerings.current.availablePackages.find(p => p.product.identifier === IAP_PRODUCT_ID) ||
        offerings.current.availablePackages[0];
      const purchaseResult = await Purchases.purchasePackage(targetPackage);
      customerInfo = purchaseResult.customerInfo;
    } else {
      // 2. Fallback: Google Play Store 상품 정보 직접 조회 후 결제
      const products = await Purchases.getProducts([IAP_PRODUCT_ID]);
      if (products && products.length > 0) {
        const purchaseResult = await Purchases.purchaseStoreProduct(products[0]);
        customerInfo = purchaseResult.customerInfo;
      } else {
        // 3. Fallback: 상품 ID 직접 결제
        const purchaseResult = await Purchases.purchaseProduct(IAP_PRODUCT_ID);
        customerInfo = purchaseResult.customerInfo;
      }
    }

    const isUnlocked =
      customerInfo.entitlements.active['만다라 온실 Pro'] !== undefined ||
      customerInfo.entitlements.active['premium'] !== undefined ||
      customerInfo.entitlements.active[IAP_PRODUCT_ID] !== undefined ||
      customerInfo.allPurchasedProductIdentifiers.includes(IAP_PRODUCT_ID) ||
      (customerInfo.nonSubscriptionTransactions && customerInfo.nonSubscriptionTransactions.some((t: any) => t.productIdentifier === IAP_PRODUCT_ID));

    return { success: isUnlocked };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, userCancelled: true };
    }
    console.error('[IAP] Purchase error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; hasPurchases: boolean; error?: string }> {
  try {
    const customerInfo = await Purchases.restorePurchases();

    const hasPurchases =
      customerInfo.entitlements.active[IAP_ENTITLEMENT_ID] !== undefined ||
      customerInfo.entitlements.active['premium'] !== undefined ||
      customerInfo.entitlements.active[IAP_PRODUCT_ID] !== undefined ||
      customerInfo.allPurchasedProductIdentifiers.includes(IAP_PRODUCT_ID) ||
      (customerInfo.nonSubscriptionTransactions && customerInfo.nonSubscriptionTransactions.some((t: any) => t.productIdentifier === IAP_PRODUCT_ID));

    return { success: true, hasPurchases };
  } catch (error: any) {
    console.error('[IAP] Restore error:', error);
    return { success: false, hasPurchases: false, error: error?.message || 'Unknown error' };
  }
}

export async function checkHasPurchased(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    return (
      customerInfo.entitlements.active[IAP_ENTITLEMENT_ID] !== undefined ||
      customerInfo.entitlements.active['premium'] !== undefined ||
      customerInfo.entitlements.active[IAP_PRODUCT_ID] !== undefined ||
      customerInfo.allPurchasedProductIdentifiers.includes(IAP_PRODUCT_ID) ||
      (customerInfo.nonSubscriptionTransactions && customerInfo.nonSubscriptionTransactions.some((t: any) => t.productIdentifier === IAP_PRODUCT_ID))
    );
  } catch (error) {
    console.warn('[IAP] Silent check error:', error);
    return false;
  }
}

export function addCustomerInfoUpdateListener(callback: (hasPurchased: boolean) => void): () => void {
  const listener = (customerInfo: any) => {
    const hasPurchased =
      customerInfo.entitlements.active[IAP_ENTITLEMENT_ID] !== undefined ||
      customerInfo.entitlements.active['premium'] !== undefined ||
      customerInfo.entitlements.active[IAP_PRODUCT_ID] !== undefined ||
      customerInfo.allPurchasedProductIdentifiers.includes(IAP_PRODUCT_ID) ||
      (customerInfo.nonSubscriptionTransactions && customerInfo.nonSubscriptionTransactions.some((t: any) => t.productIdentifier === IAP_PRODUCT_ID));
    callback(hasPurchased);
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

export async function purchaseSeedDonation(): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
  try {
    let purchaseResult;
    // 1. Google Play Store 상품 정보 조회 후 결제 시도
    const products = await Purchases.getProducts([SEED_DONATION_PRODUCT_ID]);
    if (products && products.length > 0) {
      purchaseResult = await Purchases.purchaseStoreProduct(products[0]);
    } else {
      purchaseResult = await Purchases.purchaseProduct(SEED_DONATION_PRODUCT_ID);
    }

    return { success: !!purchaseResult };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, userCancelled: true };
    }
    console.error('[IAP] Seed donation purchase error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

export async function getProductPrices(): Promise<{ premiumPrice?: string; seedPrice?: string }> {
  try {
    const products = await Purchases.getProducts([IAP_PRODUCT_ID, SEED_DONATION_PRODUCT_ID]);
    const premiumProd = products.find(p => p.identifier === IAP_PRODUCT_ID);
    const seedProd = products.find(p => p.identifier === SEED_DONATION_PRODUCT_ID);
    return {
      premiumPrice: premiumProd?.priceString,
      seedPrice: seedProd?.priceString,
    };
  } catch (error) {
    console.warn('[IAP] Failed to fetch product prices:', error);
    return {};
  }
}
