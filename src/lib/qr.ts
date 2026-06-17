import QRCode from 'qrcode'

/**
 * Üzerinde masa oturum açma linki barındıran bir QR kod veri URL'i (Data URL) üretir.
 * @param tableToken Masaya ait benzersiz QR token'ı (UUID)
 * @returns Base64 formatında QR kod görsel adresi
 */
export async function generateTableQR(tableToken: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = `${baseUrl}/m/${tableToken}`
  
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',   // Barkod rengi
      light: '#FFFFFF'   // Arka plan rengi
    }
  })
}
