// utils/paymentUtils.js
export const PAYMENT_CONFIG = {
  SPLIT: {
    ADVANCE_PERCENTAGE: 33.33,
    REMAINING_PERCENTAGE: 66.67,
  },
  RAZORPAY_KEY: 'rzp_test_RvTdFy0wqstVIO', // Replace with actual key
};

/**
 * Calculate split payment amounts
 */
export const calculateSplitAmounts = (totalAmount) => {
  const advanceAmount = Math.round(
    (totalAmount * PAYMENT_CONFIG.SPLIT.ADVANCE_PERCENTAGE) / 100
  );
  const remainingAmount = totalAmount - advanceAmount;

  return {
    totalAmount,
    advanceAmount,
    remainingAmount,
    advancePercentage: PAYMENT_CONFIG.SPLIT.ADVANCE_PERCENTAGE,
    remainingPercentage: PAYMENT_CONFIG.SPLIT.REMAINING_PERCENTAGE,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Generate transaction ID
 */
export const generateTransactionId = (orderId, type) => {
  const timestamp = Date.now();
  return `MOTORS_${orderId}_${type}_${timestamp}`;
};