/**
 * Formats currency with maximum 3 digits display
 * Examples: 122.1, 1.2K, 11.2K, 112K
 * Returns both the formatted display value and the exact amount
 */
export interface FormattedCurrency {
  display: string; // Formatted display (e.g., "1.2K", "122.1")
  exact: string;   // Exact amount (e.g., "$1,234.56")
}

const exactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'HKD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrencyCompact(amount: number): FormattedCurrency {
  const exact = exactFormatter.format(amount).replace('HK$', '$');
  
  const absAmount = Math.abs(amount);
  
  if (absAmount < 1000) {
    // Less than 1K: show up to 1 decimal place, max 3 digits total
    // Examples: 122.1, 99.5, 5.2
    const rounded = Math.round(absAmount * 10) / 10;
    const display = rounded.toString();
    return {
      display: `${amount < 0 ? '-' : ''}$${display}`,
      exact: exact, // exactFormatter already includes the sign
    };
  } else if (absAmount < 10000) {
    // 1K to 9.9K: show 1 decimal place
    // Examples: 1.2K, 9.9K
    const kValue = absAmount / 1000;
    const rounded = Math.round(kValue * 10) / 10;
    return {
      display: `${amount < 0 ? '-' : ''}$${rounded.toFixed(1)}K`,
      exact: exact, // exactFormatter already includes the sign
    };
  } else if (absAmount < 100000) {
    // 10K to 99.9K: show 1 decimal place
    // Examples: 11.2K, 99.9K
    const kValue = absAmount / 1000;
    const rounded = Math.round(kValue * 10) / 10;
    return {
      display: `${amount < 0 ? '-' : ''}$${rounded.toFixed(1)}K`,
      exact: exact, // exactFormatter already includes the sign
    };
  } else {
    // 100K+: show whole number in K
    // Examples: 112K, 500K
    const kValue = Math.round(absAmount / 1000);
    return {
      display: `${amount < 0 ? '-' : ''}$${kValue}K`,
      exact: exact, // exactFormatter already includes the sign
    };
  }
}

/**
 * Formats currency for display in components
 * Returns a component-friendly object with display and exact values
 */
export function formatCurrency(amount: number): FormattedCurrency {
  return formatCurrencyCompact(amount);
}

