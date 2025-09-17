import {useState, useCallback} from 'react';
import {useAppStore} from '@/stores/appStore';
import {CREDIT_COSTS} from '@/utils/constants';

interface CreditUsageResult {
  success: boolean;
  remainingCredits: number;
  error?: string;
}

export const useCreditManagement = () => {
  const {credits, setCredits} = useAppStore();
  const [showUsageNotification, setShowUsageNotification] = useState(false);
  const [lastUsage, setLastUsage] = useState<{
    creditsUsed: number;
    remainingCredits: number;
    action: string;
  } | null>(null);

  const checkCredits = useCallback((requiredCredits: number): boolean => {
    return credits >= requiredCredits;
  }, [credits]);

  const deductCredits = useCallback((
    amount: number,
    action: string
  ): CreditUsageResult => {
    if (credits < amount) {
      return {
        success: false,
        remainingCredits: credits,
        error: `Insufficient credits. Need ${amount}, have ${credits}.`,
      };
    }

    const newCredits = credits - amount;
    setCredits(newCredits);
    
    // Set up notification data
    setLastUsage({
      creditsUsed: amount,
      remainingCredits: newCredits,
      action,
    });
    
    // Show notification
    setShowUsageNotification(true);

    return {
      success: true,
      remainingCredits: newCredits,
    };
  }, [credits, setCredits]);

  const deductStickerGenerationCredit = useCallback(() => {
    return deductCredits(CREDIT_COSTS.STICKER_GENERATION, 'sticker generation');
  }, [deductCredits]);

  const deductPremiumEffectCredit = useCallback(() => {
    return deductCredits(CREDIT_COSTS.PREMIUM_EFFECTS, 'premium effects');
  }, [deductCredits]);

  const hideUsageNotification = useCallback(() => {
    setShowUsageNotification(false);
    setLastUsage(null);
  }, []);

  const canAffordStickerGeneration = useCallback(() => {
    return checkCredits(CREDIT_COSTS.STICKER_GENERATION);
  }, [checkCredits]);

  const canAffordPremiumEffects = useCallback(() => {
    return checkCredits(CREDIT_COSTS.PREMIUM_EFFECTS);
  }, [checkCredits]);

  return {
    credits,
    checkCredits,
    deductCredits,
    deductStickerGenerationCredit,
    deductPremiumEffectCredit,
    canAffordStickerGeneration,
    canAffordPremiumEffects,
    showUsageNotification,
    lastUsage,
    hideUsageNotification,
  };
};