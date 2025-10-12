import { describe, it, expect, vi, beforeEach } from 'vitest';
import useInventoryStore from '../store/useInventoryStore';
import { inventoryService } from '../services/inventoryService';

vi.mock('../services/inventoryService');

describe('Inventory Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInventoryStore.getState().clearInventories();
    useInventoryStore.getState().clearTransactions();
    useInventoryStore.getState().clearError();
  });

  it('should fetch inventories successfully', async () => {
    const mockData = [
      { 
        id: 1, 
        user_id: 'test-user', 
        check_date: '2025-09-06T10:00:00Z', 
        state: true 
      }
    ];
    inventoryService.getInventories.mockResolvedValue({ inventories: mockData });
    
    await useInventoryStore.getState().fetchInventories();
    
    const state = useInventoryStore.getState();
    expect(state.inventories).toEqual(mockData);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle fetch inventories error', async () => {
    inventoryService.getInventories.mockRejectedValue(new Error('Network error'));
    
    await useInventoryStore.getState().fetchInventories();
    
    const state = useInventoryStore.getState();
    expect(state.inventories).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
  });

  it('should create inventory successfully', async () => {
    const inventoryData = {
      check_date: '2025-09-06T10:00:00Z',
      details: [
        { product_id: 'PROD_001', quantity_checked: 100 }
      ]
    };
    const mockResponse = { 
      success: true, 
      inventory_id: 22,
      message: 'Inventory created successfully'
    };
    
    inventoryService.createInventory.mockResolvedValue(mockResponse);
    inventoryService.getInventories.mockResolvedValue({ inventories: [] });
    
    const result = await useInventoryStore.getState().createInventory(inventoryData);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResponse);
    expect(inventoryService.createInventory).toHaveBeenCalledWith(inventoryData);
  });

  it('should handle create inventory error', async () => {
    const inventoryData = {
      details: [{ product_id: 'PROD_001', quantity_checked: 100 }]
    };
    
    inventoryService.createInventory.mockRejectedValue(new Error('Validation error'));
    
    const result = await useInventoryStore.getState().createInventory(inventoryData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation error');
  });

  it('should invalidate inventory successfully', async () => {
    const inventoryId = 22;
    const mockResponse = { 
      success: true,
      message: 'Inventory invalidated successfully'
    };
    
    inventoryService.invalidateInventory.mockResolvedValue(mockResponse);
    inventoryService.getInventories.mockResolvedValue({ inventories: [] });
    
    const result = await useInventoryStore.getState().invalidateInventory(inventoryId);
    
    expect(result.success).toBe(true);
    expect(inventoryService.invalidateInventory).toHaveBeenCalledWith(inventoryId);
  });

  it('should fetch product transactions successfully', async () => {
    const mockTransactions = [
      {
        id: 1,
        product_id: 'PROD_001',
        transaction_type: 'PURCHASE',
        quantity_change: 50,
        quantity_before: 10,
        quantity_after: 60,
        transaction_date: '2025-09-06T10:00:00Z'
      }
    ];
    
    inventoryService.getProductTransactionHistory.mockResolvedValue(mockTransactions);
    
    await useInventoryStore.getState().fetchProductTransactions('PROD_001');
    
    const state = useInventoryStore.getState();
    expect(state.stockTransactions).toEqual(mockTransactions);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should create stock transaction successfully', async () => {
    const transactionData = {
      product_id: 'PROD_001',
      transaction_type: 'PURCHASE',
      quantity_change: 25,
      unit_price: 10.50,
      reason: 'Weekly purchase'
    };
    
    const mockResponse = {
      success: true,
      id: 123,
      message: 'Transaction created successfully'
    };
    
    inventoryService.createStockTransaction.mockResolvedValue(mockResponse);
    
    const result = await useInventoryStore.getState().createStockTransaction(transactionData);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResponse);
    expect(inventoryService.createStockTransaction).toHaveBeenCalledWith(transactionData);
  });

  it('should create manual adjustment successfully', async () => {
    const adjustmentData = {
      product_id: 'PROD_001',
      new_quantity: 75,
      reason: 'Damaged products removed'
    };
    
    const mockResponse = {
      success: true,
      adjustment_id: 456,
      message: 'Manual adjustment created successfully'
    };
    
    inventoryService.createManualAdjustment.mockResolvedValue(mockResponse);
    
    const result = await useInventoryStore.getState().createManualAdjustment(adjustmentData);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResponse);
    expect(inventoryService.createManualAdjustment).toHaveBeenCalledWith(adjustmentData);
  });

  it('should validate stock consistency successfully', async () => {
    const mockValidationResult = [
      {
        product_id: 'PROD_001',
        product_name: 'Test Product',
        current_stock: 100,
        calculated_stock: 98,
        difference: 2,
        is_consistent: false,
        recommendation: 'Review recent transactions'
      }
    ];
    
    inventoryService.validateStockConsistency.mockResolvedValue(mockValidationResult);
    
    const result = await useInventoryStore.getState().validateStockConsistency('PROD_001');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockValidationResult);
    expect(inventoryService.validateStockConsistency).toHaveBeenCalledWith('PROD_001');
  });

  it('should get transaction types successfully', async () => {
    const mockTypes = {
      'PURCHASE': 'Compra',
      'SALE': 'Venta',
      'ADJUSTMENT': 'Ajuste Manual',
      'INVENTORY': 'Inventario Físico'
    };
    
    inventoryService.getTransactionTypes.mockResolvedValue(mockTypes);
    
    const result = await useInventoryStore.getState().getTransactionTypes();
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTypes);
  });

  it('should clear error', () => {
    // Set an error first
    useInventoryStore.setState({ error: 'Test error' });
    
    useInventoryStore.getState().clearError();
    
    const state = useInventoryStore.getState();
    expect(state.error).toBe(null);
  });

  it('should clear inventories', () => {
    // Set some inventories first
    useInventoryStore.setState({ 
      inventories: [{ id: 1, name: 'Test' }], 
      error: 'Some error' 
    });
    
    useInventoryStore.getState().clearInventories();
    
    const state = useInventoryStore.getState();
    expect(state.inventories).toEqual([]);
    expect(state.error).toBe(null);
  });

  it('should clear transactions', () => {
    // Set some transactions first
    useInventoryStore.setState({ 
      stockTransactions: [{ id: 1, type: 'PURCHASE' }], 
      error: 'Some error' 
    });
    
    useInventoryStore.getState().clearTransactions();
    
    const state = useInventoryStore.getState();
    expect(state.stockTransactions).toEqual([]);
    expect(state.error).toBe(null);
  });
});
