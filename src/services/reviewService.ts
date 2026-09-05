import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

const STORAGE_KEY_REVIEW_PROMPT_SHOWN = 'mansil_has_seen_review_prompt';
const ANDROID_PACKAGE_NAME = 'com.mansil.mandalaonsil';
// App Store ID (can be set upon iOS store release)
const IOS_APP_ID = '';

/**
 * Checks whether the user has already seen the review prompt.
 */
export async function hasSeenReviewPrompt(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_REVIEW_PROMPT_SHOWN);
    return val === 'true';
  } catch (e) {
    console.warn('[Review] Failed to read review prompt flag:', e);
    return false;
  }
}

/**
 * Marks that the user has seen or interacted with the review prompt so it won't appear again
 * until the greenhouse data is reset.
 */
export async function setHasSeenReviewPrompt(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_REVIEW_PROMPT_SHOWN, 'true');
  } catch (e) {
    console.warn('[Review] Failed to save review prompt flag:', e);
  }
}

/**
 * Clears the review prompt flag (called on greenhouse / game data reset).
 */
export async function resetReviewPromptFlag(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_REVIEW_PROMPT_SHOWN);
  } catch (e) {
    console.warn('[Review] Failed to reset review prompt flag:', e);
  }
}

/**
 * Opens store page directly (used for Settings menu and fallback).
 */
export async function openStoreReviewPage(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const marketUrl = `market://details?id=${ANDROID_PACKAGE_NAME}`;
      const webUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;
      const canOpen = await Linking.canOpenURL(marketUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(marketUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } else if (Platform.OS === 'ios') {
      if (IOS_APP_ID) {
        const iosUrl = `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`;
        await Linking.openURL(iosUrl);
      } else if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      }
    } else {
      const webUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.warn('[Review] Failed to open store page:', error);
  }
}

/**
 * Requests an in-app review popup via expo-store-review, with fallback to opening the store page.
 */
export async function requestAppReview(): Promise<void> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync().catch(() => false);
    if (isAvailable) {
      await StoreReview.requestReview();
    } else {
      await openStoreReviewPage();
    }
  } catch (e) {
    console.warn('[Review] In-app review request failed, opening store page fallback:', e);
    await openStoreReviewPage();
  }
}
