export interface Store {
  id: string
  name: string
  address: string | null
  phone: string
  email: string
  created_at: string
}

export interface StoreUser {
  id: string
  store_id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'employee'
  expo_push_token: string | null
  created_at: string
}

export interface Customer {
  id: string
  store_id: string
  name: string
  phone: string
  aadhaar_last4: string | null
  created_at: string
}

export interface Device {
  id: string
  store_id: string
  customer_id: string
  imei_hash: string
  model: string
  supabase_device_key: string | null
  lock_payload: Record<string, unknown> | null
  hmac_secret: string
  status: 'active' | 'locked' | 'deregistered'
  device_owner_confirmed: boolean
  registered_at: string
  updated_at: string
  customers?: Customer
  emi_plans?: EmiPlan[]
}

export interface EmiPlan {
  id: string
  device_id: string
  total_amount: number
  down_payment: number
  emi_amount: number
  tenure_months: number
  start_date: string
  grace_period_days: number
  created_at: string
  emi_payments?: EmiPayment[]
}

export interface EmiPayment {
  id: string
  emi_plan_id: string
  due_date: string
  paid_date: string | null
  amount_due: number
  amount_paid: number | null
  status: 'pending' | 'paid' | 'missed'
  payment_method: string | null
  recorded_by: string | null
  created_at: string
}

export interface LockEvent {
  id: string
  device_id: string
  locked_at: string
  lock_reason: string | null
  emi_payment_id: string | null
  unlocked_at: string | null
  unlocked_by: string | null
}

export interface DeviceWithDetails extends Device {
  customers: Customer
  emi_plans: (EmiPlan & { emi_payments: EmiPayment[] })[]
  lock_events?: LockEvent[]
  outstanding_amount?: number
  next_due_date?: string | null
  next_due_days?: number | null
}

export interface RegisterDeviceInput {
  imei: string
  model: string
  customer_name: string
  customer_phone: string
  customer_aadhaar_last4?: string
  total_amount: number
  down_payment: number
  emi_amount: number
  tenure_months: number
  start_date: string
  grace_period_days: number
}
