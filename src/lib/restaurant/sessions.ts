import { SupabaseClient } from '@supabase/supabase-js'

interface TableDetails {
  id: string
  name: string
  branch_id: string
  branch_name: string
  currency: string
  service_fee_percent: number
  languages: string[]
}

/**
 * QR Token'ından masa ve şube bilgilerini çözer.
 */
export async function resolveTableToken(
  supabase: SupabaseClient,
  tableToken: string
): Promise<TableDetails | null> {
  const { data, error } = await supabase
    .from('tables')
    .select(`
      id,
      name,
      branch_id,
      branches (
        name,
        currency,
        service_fee_percent,
        languages
      )
    `)
    .eq('qr_token', tableToken)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    console.error('Error resolving table token:', error)
    return null
  }

  const branch = data.branches as any

  return {
    id: data.id,
    name: data.name,
    branch_id: data.branch_id,
    branch_name: branch?.name || '',
    currency: branch?.currency || 'GEL',
    service_fee_percent: branch?.service_fee_percent || 0,
    languages: branch?.languages || ['tr', 'en', 'ru']
  }
}

/**
 * Masa için aktif bir oturum (table_session) bulur veya oluşturur.
 */
export async function getOrCreateTableSession(
  supabase: SupabaseClient,
  params: {
    tableId: string
    branchId: string
    customerName: string
    deviceId: string
    language: string
  }
): Promise<string | null> {
  const { tableId, branchId, customerName, deviceId, language } = params

  // 1. Önce bu masada aktif bir oturum var mı kontrol et
  const { data: existingSession, error: checkError } = await supabase
    .from('table_sessions')
    .select('id')
    .eq('table_id', tableId)
    .eq('is_active', true)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (checkError) {
    console.error('Error checking existing session:', checkError)
  }

  if (existingSession) {
    // Aktif oturum varsa onu kullan
    return existingSession.id
  }

  // 2. Aktif oturum yoksa yeni bir tane oluştur
  const { data: newSession, error: createError } = await supabase
    .from('table_sessions')
    .insert({
      table_id: tableId,
      branch_id: branchId,
      customer_name: customerName,
      device_id: deviceId,
      language: language,
      is_active: true
    })
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating new table session:', createError)
    return null
  }

  // Masanın durumunu 'occupied' (dolu) olarak güncelle
  await supabase
    .from('tables')
    .update({ status: 'occupied' })
    .eq('id', tableId)

  return newSession.id
}

/**
 * Masanın açık adisyonunu (bill) bulur veya oluşturur.
 */
export async function getOrCreateBill(
  supabase: SupabaseClient,
  tableId: string,
  branchId: string
): Promise<string | null> {
  // 1. Önce masanın açık adisyonunu bul
  const { data: existingBill, error: checkError } = await supabase
    .from('bills')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .maybeSingle()

  if (checkError) {
    console.error('Error checking existing bill:', checkError)
  }

  if (existingBill) {
    return existingBill.id
  }

  // 2. Açık adisyon yoksa yeni bir tane oluştur
  const { data: newBill, error: createError } = await supabase
    .from('bills')
    .insert({
      table_id: tableId,
      branch_id: branchId,
      status: 'open',
      total_amount: 0,
      paid_amount: 0,
      service_fee: 0,
      tip_amount: 0
    })
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating new bill:', createError)
    return null
  }

  return newBill.id
}
