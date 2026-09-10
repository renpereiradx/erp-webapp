import { apiClient } from './api';

/**
 * Cuenta corriente de cliente (PLAN_MONOROL_DESCUENTOS_CREDITO_CLIENTE C4/C6).
 * La deuda vive materializada en el backend (paid_amount/due_date +
 * v_client_credit_balance); los cobros a cuenta son account_payments con
 * allocations FIFO automáticas (o manuales vía `allocations`).
 */
export interface ClientCreditCurrencyRow {
  currency_id: number | null;
  currency_code: string | null;
  open_sales: number;
  total_debt: number;
  bucket_current: number;
  bucket_1_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_over_90: number;
  oldest_due_date?: string | null;
  unapplied_amount?: number | null;
}

export interface ClientOpenSale {
  sale_id: string;
  status: string;
  sale_date: string;
  due_date?: string | null;
  branch_id?: number | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  currency_code?: string | null;
}

export interface ClientCredit {
  client_id: string;
  display_name: string;
  credit_terms_days?: number | null;
  credit_limit?: number | null;
  default_credit_terms_days: number;
  debt_total: number;
  unapplied_total: number;
  by_currency: ClientCreditCurrencyRow[];
  open_sales: ClientOpenSale[];
  credit_warning?: string | null;
}

export interface RegisterAccountPaymentInput {
  amount: number;
  cash_received?: number;
  payment_method_id?: number;
  currency_id?: number;
  cash_register_id?: number;
  branch_id?: number;
  payment_reference?: string;
  payment_notes?: string;
  allocations?: Array<{ sales_order_id: string; amount?: number }>;
}

export interface AccountPaymentResult {
  payment_id: number;
  client_id: string;
  amount: number;
  allocated_total: number;
  unapplied_amount: number;
  payment_status: string;
  change_amount: number;
  cash_register_used: boolean;
}

export const clientCreditService = {
  async getCredit(clientId: string): Promise<ClientCredit> {
    const response = await apiClient.get(`/clients/${clientId}/credit`);
    return response as unknown as ClientCredit;
  },

  async getAging(params: { branch_id?: number; as_of?: string } = {}): Promise<ClientCredit['by_currency']> {
    const response = await apiClient.get('/clients/credit/aging', { params });
    return (response as unknown as { data: ClientCredit['by_currency'] })?.data ?? [];
  },

  async registerAccountPayment(clientId: string, input: RegisterAccountPaymentInput): Promise<AccountPaymentResult> {
    const response = await apiClient.post(`/clients/${clientId}/account-payments`, input);
    return response as unknown as AccountPaymentResult;
  },
};

export default clientCreditService;
