'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateTableSession, getOrCreateBill } from '@/lib/restaurant/sessions'

interface StartSessionParams {
  tableId: string
  branchId: string
  customerName: string
  deviceId: string
  language: string
  tableToken: string
}

export async function startCustomerSession(params: StartSessionParams) {
  const { tableId, branchId, customerName, deviceId, language, tableToken } = params
  
  const supabase = await createClient()

  // 1. Get or create table session
  const sessionId = await getOrCreateTableSession(supabase, {
    tableId,
    branchId,
    customerName,
    deviceId,
    language
  })

  if (!sessionId) {
    return { success: false, error: 'Oturum oluşturulurken bir hata oluştu.' }
  }

  // 2. Get or create active bill for the table
  const billId = await getOrCreateBill(supabase, tableId, branchId)

  if (!billId) {
    return { success: false, error: 'Adisyon açılırken bir hata oluştu.' }
  }

  // 3. Set cookies for the client
  const cookieStore = await cookies()
  
  cookieStore.set('table_session_id', sessionId, {
    maxAge: 60 * 60 * 12, // 12 saat geçerli
    path: '/',
    httpOnly: false // İstemci tarafı erişebilsin
  })

  cookieStore.set('customer_name', customerName, {
    maxAge: 60 * 60 * 12,
    path: '/',
    httpOnly: false
  })

  cookieStore.set('device_id', deviceId, {
    maxAge: 60 * 60 * 24 * 365, // 1 yıl geçerli
    path: '/'
  })

  return { success: true, sessionId, billId }
}
