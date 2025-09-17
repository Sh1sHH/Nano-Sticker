import {renderHook, act} from '@testing-library/react-native';
import {useCreditManagement} from '../useCreditManagement';
import {CREDIT_COSTS} from '@/utils/constants';

// Mock the store
const mockUseAppStore = {
  credits: 10,
  setCredits: jest.fn(),
};

jest.mock('@/stores/appStore', () => ({
  useAppStore: () => mockUseAppStore,
}));

describe('useCreditManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppStore.credits = 10;
  });

  it('should check credits correctly', () => {
    const {result} = renderHook(() => useCreditManagement());
    
    expect(result.current.checkCredits(5)).toBe(true);
    expect(result.current.checkCredits(15)).toBe(false);
  });

  it('should deduct credits successfully when sufficient', () => {
    const {result} = renderHook(() => useCreditManagement());
    
    act(() => {
      const creditResult = result.current.deductCredits(3, 'test action');
      expect(creditResult.success).toBe(true);
      expect(creditResult.remainingCredits).toBe(7);
      expect(mockUseAppStore.setCredits).toHaveBeenCalledWith(7);
    });
  });

  it('should fail to deduct credits when insufficient', () => {
    mockUseAppStore.credits = 2;
    const {result} = renderHook(() => useCreditManagement());
    
    act(() => {
      const creditResult = result.current.deductCredits(5, 'test action');
      expect(creditResult.success).toBe(false);
      expect(creditResult.error).toContain('Insufficient credits');
      expect(mockUseAppStore.setCredits).not.toHaveBeenCalled();
    });
  });

  it('should show usage notification after deducting credits', () => {
    const {result} = renderHook(() => useCreditManagement());
    
    act(() => {
      result.current.deductCredits(2, 'sticker generation');
    });
    
    expect(result.current.showUsageNotification).toBe(true);
    expect(result.current.lastUsage).toEqual({
      creditsUsed: 2,
      remainingCredits: 8,
      action: 'sticker generation',
    });
  });

  it('should hide usage notification', () => {
    const {result} = renderHook(() => useCreditManagement());
    
    act(() => {
      result.current.deductCredits(1, 'test');
    });
    
    expect(result.current.showUsageNotification).toBe(true);
    
    act(() => {
      result.current.hideUsageNotification();
    });
    
    expect(result.current.showUsageNotification).toBe(false);
    expect(result.current.lastUsage).toBe(null);
  });

  it('should handle sticker generation credit deduction', () => {
    const {result} = renderHook(() => useCreditManagement());
    
    act(() => {
      const creditResult = result.current.deductStickerGenerationCredit();
      expect(creditResult.success).toBe(true);
      expect(mockUseAppStore.setCredits).toHaveBeenCalledWith(
        10 - CREDIT_COSTS.STICKER_GENERATION
      );
    });
  });

  it('should handle premium effects credit deduction', () => {
    const {result} = renderHook(() => useCreditManagement());
    
    act(() => {
      const creditResult = result.current.deductPremiumEffectCredit();
      expect(creditResult.success).toBe(true);
      expect(mockUseAppStore.setCredits).toHaveBeenCalledWith(
        10 - CREDIT_COSTS.PREMIUM_EFFECTS
      );
    });
  });

  it('should check affordability correctly', () => {
    const {result} = renderHook(() => useCreditManagement());
    
    expect(result.current.canAffordStickerGeneration()).toBe(true);
    expect(result.current.canAffordPremiumEffects()).toBe(true);
    
    // Test with insufficient credits
    mockUseAppStore.credits = 0;
    const {result: result2} = renderHook(() => useCreditManagement());
    
    expect(result2.current.canAffordStickerGeneration()).toBe(false);
    expect(result2.current.canAffordPremiumEffects()).toBe(false);
  });
});