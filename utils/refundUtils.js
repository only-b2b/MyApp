// utils/refundUtils.js
export const REFUND_CONFIG = {
  // Cancellation charge percentages based on order status
  CHARGES: {
    BEFORE_ACCEPT: 0,      // 0% charge - Full refund
    AFTER_ACCEPT: 5,       // 5% charge
    IN_PROGRESS: 100,      // 100% charge - No refund
  },
  
  // Statuses that allow full refund (before technician action)
  FULL_REFUND_STATUSES: ['created', 'requested'],
  
  // Statuses that allow partial refund (after technician accepts)
  PARTIAL_REFUND_STATUSES: ['accepted', 'arrived'],
  
  // Statuses that don't allow refund
  NO_REFUND_STATUSES: ['in_progress', 'completed'],
  
  // Refund status values
  STATUS: {
    INITIATED: 'initiated',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
};

/**
 * Calculate refund amount based on order status
 * @param {number} advanceAmount - The advance amount paid
 * @param {string} orderStatus - Current order status
 * @returns {Object} - Refund calculation details
 */
export const calculateRefund = (advanceAmount, orderStatus) => {
  let chargePercentage = 0;
  let isRefundable = true;
  let refundType = 'full';
  let message = '';

  if (REFUND_CONFIG.FULL_REFUND_STATUSES.includes(orderStatus)) {
    // Full refund - before technician accepts
    chargePercentage = REFUND_CONFIG.CHARGES.BEFORE_ACCEPT;
    refundType = 'full';
    message = 'Full refund - No technician assigned yet';
  } else if (REFUND_CONFIG.PARTIAL_REFUND_STATUSES.includes(orderStatus)) {
    // Partial refund - after technician accepts
    chargePercentage = REFUND_CONFIG.CHARGES.AFTER_ACCEPT;
    refundType = 'partial';
    message = `5% cancellation charge applied (Technician was assigned)`;
  } else if (REFUND_CONFIG.NO_REFUND_STATUSES.includes(orderStatus)) {
    // No refund - service in progress or completed
    chargePercentage = REFUND_CONFIG.CHARGES.IN_PROGRESS;
    isRefundable = false;
    refundType = 'none';
    message = 'Service already started - No refund available';
  } else {
    // Unknown status - default to no refund for safety
    isRefundable = false;
    refundType = 'none';
    message = 'Unable to process refund for this order';
  }

  const cancellationCharge = Math.round((advanceAmount * chargePercentage) / 100);
  const refundAmount = advanceAmount - cancellationCharge;

  return {
    advanceAmount,
    chargePercentage,
    cancellationCharge,
    refundAmount,
    isRefundable,
    refundType,
    message,
    orderStatus,
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
 * Get refund status display info
 */
export const getRefundStatusInfo = (status) => {
  const statusMap = {
    initiated: {
      label: 'Refund Initiated',
      color: '#F59E0B',
      icon: 'time-outline',
      description: 'Your refund request has been submitted',
    },
    processing: {
      label: 'Processing',
      color: '#3B82F6',
      icon: 'sync-outline',
      description: 'Refund is being processed by your bank',
    },
    completed: {
      label: 'Refund Completed',
      color: '#10B981',
      icon: 'checkmark-circle',
      description: 'Amount credited to your account',
    },
    failed: {
      label: 'Refund Failed',
      color: '#EF4444',
      icon: 'close-circle',
      description: 'Please contact support',
    },
  };

  return statusMap[status] || statusMap.initiated;
};