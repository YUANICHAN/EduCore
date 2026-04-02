
/**
 * Bulk Operations Utilities
 * Provides functions for selecting, filtering, and bulk actions on items
 */

/**
 * Initialize selection state
 * @returns {Object} - Initial selection state
 */
export const initializeSelection = () => ({
  selectedIds: new Set(),
  selectAll: false,
});

/**
 * Toggle selection for a single item
 * @param {Set} selectedIds - Current selected IDs
 * @param {*} id - Item ID to toggle
 * @returns {Set} - Updated selected IDs
 */
export const toggleItemSelection = (selectedIds, id) => {
  const newSelected = new Set(selectedIds);
  if (newSelected.has(id)) {
    newSelected.delete(id);
  } else {
    newSelected.add(id);
  }
  return newSelected;
};

/**
 * Select all items
 * @param {Array} items - Items to select
 * @returns {Set} - Set of all item IDs
 */
export const selectAllItems = (items = []) => {
  return new Set(items.map((item) => item.id));
};

/**
 * Deselect all items
 * @returns {Set} - Empty set
 */
export const deselectAllItems = () => {
  return new Set();
};

/**
 * Check if item is selected
 * @param {Set} selectedIds - Selected IDs
 * @param {*} id - Item ID to check
 * @returns {boolean}
 */
export const isItemSelected = (selectedIds, id) => {
  return selectedIds.has(id);
};

/**
 * Get count of selected items
 * @param {Set} selectedIds - Selected IDs
 * @returns {number}
 */
export const getSelectionCount = (selectedIds) => {
  return selectedIds.size;
};

/**
 * Check if all items are selected
 * @param {Set} selectedIds - Selected IDs
 * @param {number} totalItems - Total items count
 * @returns {boolean}
 */
export const isAllSelected = (selectedIds, totalItems) => {
  return selectedIds.size === totalItems && totalItems > 0;
};

/**
 * Get selected items from full list
 * @param {Array} items - All items
 * @param {Set} selectedIds - Selected IDs
 * @returns {Array} - Selected items
 */
export const getSelectedItems = (items = [], selectedIds = new Set()) => {
  return items.filter((item) => selectedIds.has(item.id));
};

/**
 * Bulk delete items
 * @param {Array} items - Items to delete (should have id field)
 * @param {Function} deleteFunction - Function to call for deletion (receives item)
 * @returns {Promise<Object>} - { success: number, failed: number, errors: [] }
 */
export const bulkDelete = async (items = [], deleteFunction) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const item of items) {
    try {
      await deleteFunction(item);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        itemId: item.id,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Bulk update status
 * @param {Array} items - Items to update
 * @param {string} newStatus - New status value
 * @param {Function} updateFunction - Function to call for update (receives item, newStatus)
 * @returns {Promise<Object>} - { success: number, failed: number, errors: [] }
 */
export const bulkUpdateStatus = async (items = [], newStatus, updateFunction) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const item of items) {
    try {
      await updateFunction(item, newStatus);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        itemId: item.id,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Bulk update field
 * @param {Array} items - Items to update
 * @param {string} fieldName - Field to update
 * @param {*} value - New value
 * @param {Function} updateFunction - Function to call (receives item, fieldName, value)
 * @returns {Promise<Object>} - Results with success/failed counts
 */
export const bulkUpdateField = async (items = [], fieldName, value, updateFunction) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const item of items) {
    try {
      await updateFunction(item, fieldName, value);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        itemId: item.id,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Create confirmation message for bulk operation
 * @param {number} count - Number of items selected
 * @param {string} action - Action to perform (e.g., 'delete', 'archive')
 * @param {string} entityName - Name of entity (e.g., 'students')
 * @returns {string} - Confirmation message
 */
export const createBulkConfirmation = (count, action, entityName = 'items') => {
  if (count === 0) {
    return `Please select ${entityName} to ${action}`;
  }
  if (count === 1) {
    return `Are you sure you want to ${action} 1 ${entityName}? This action cannot be undone.`;
  }
  return `Are you sure you want to ${action} ${count} ${entityName}? This action cannot be undone.`;
};

/**
 * Format bulk results message
 * @param {Object} results - Results from bulk operation
 * @param {string} action - Action performed
 * @returns {string} - Formatted message
 */
export const formatBulkResults = (results, action = 'operation') => {
  const { success, failed } = results;
  let message = `${action.charAt(0).toUpperCase()}${action.slice(1)} completed. `;

  if (failed > 0) {
    message += `${success} successful, ${failed} failed.`;
  } else {
    message += `All ${success} item(s) ${action}d successfully.`;
  }

  return message;
};

/**
 * Filter items based on selection criteria
 * @param {Array} items - Items to filter
 * @param {Object} criteria - Filter criteria { fieldName: value }
 * @returns {Array} - Filtered items
 */
export const filterItems = (items = [], criteria = {}) => {
  return items.filter((item) => {
    return Object.entries(criteria).every(([field, value]) => {
      if (value === null || value === undefined || value === '') return true;
      return item[field] == value;
    });
  });
};

/**
 * Select items matching criteria
 * @param {Array} items - Items to select from
 * @param {Object} criteria - Filter criteria
 * @returns {Set} - Set of matching item IDs
 */
export const selectItemsByFilter = (items = [], criteria = {}) => {
  const filtered = filterItems(items, criteria);
  return new Set(filtered.map((item) => item.id));
};

/**
 * Bulk assign handler
 * @param {Array} items - Items to assign
 * @param {string} fieldName - Field to assign to
 * @param {*} value - Value to assign
 * @param {Function} updateFunction - Update function
 * @returns {Promise<Object>}
 */
export const bulkAssign = async (items = [], fieldName, value, updateFunction) => {
  return bulkUpdateField(items, fieldName, value, updateFunction);
};

/**
 * Get summary of selected items
 * @param {Array} items - Items to summarize
 * @param {Set} selectedIds - Selected IDs
 * @param {string} groupBy - Field name to group by
 * @returns {Object} - Summary grouped by the specified field
 */
export const getSummaryOfSelections = (items = [], selectedIds = new Set(), groupBy = null) => {
  const selected = getSelectedItems(items, selectedIds);

  if (!groupBy) {
    return {
      total: selected.length,
      items: selected,
    };
  }

  const summary = {};
  selected.forEach((item) => {
    const key = item[groupBy];
    if (!summary[key]) {
      summary[key] = [];
    }
    summary[key].push(item);
  });

  return summary;
};

/**
 * Create bulk action toolbar data
 * @param {number} selectedCount - Number of selected items
 * @param {Array} actions - Available actions [{ label, icon, onClick, dangerous?: true }]
 * @returns {Object} - Toolbar data
 */
export const createBulkActionToolbar = (selectedCount, actions = []) => {
  return {
    isVisible: selectedCount > 0,
    selectedCount,
    actions,
  };
};

/**
 * Validate bulk operation preconditions
 * @param {Array} selectedItems - Selected items
 * @param {Function} validator - Validation function
 * @returns {Object} - { isValid: boolean, invalidItems: [], message: string }
 */
export const validateBulkOperation = (selectedItems = [], validator) => {
  const invalidItems = selectedItems.filter((item) => !validator(item));

  return {
    isValid: invalidItems.length === 0,
    invalidItems,
    message:
      invalidItems.length > 0
        ? `${invalidItems.length} item(s) cannot be processed due to their current state`
        : '',
  };
};
