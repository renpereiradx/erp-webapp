/**
 * Utility functions for translating status values
 */

/**
 * Translates purchase status to user-friendly text
 * @param {string} status - The status value (PENDING, COMPLETED, CANCELLED)
 * @param {function} t - Translation function from i18n
 * @returns {string} - Translated status
 */
export const translatePurchaseStatus = (status, t) => {
  if (!status) return '';

  const statusLower = status.toLowerCase();
  const translationKey = `purchases.status.${statusLower}`;

  // Try to get translation, fallback to original status if not found
  const translated = t(translationKey);
  return translated !== translationKey ? translated : status;
};

/**
 * Translates reservation status to user-friendly text
 * @param {string} status - The status value
 * @param {function} t - Translation function from i18n
 * @returns {string} - Translated status
 */
export const translateReservationStatus = (status, t) => {
  if (!status) return '';

  const statusLower = status.toLowerCase();
  const translationKey = `reservations.status.${statusLower}`;

  const translated = t(translationKey);
  return translated !== translationKey ? translated : status;
};

/**
 * Generic status translator - automatically detects context
 * @param {string} status - The status value
 * @param {string} context - The context (purchases, reservations, etc.)
 * @param {function} t - Translation function from i18n
 * @returns {string} - Translated status
 */
export const translateStatus = (status, context, t) => {
  if (!status || !context) return status || '';

  const statusLower = status.toLowerCase();
  const translationKey = `${context}.status.${statusLower}`;

  const translated = t(translationKey);
  return translated !== translationKey ? translated : status;
};