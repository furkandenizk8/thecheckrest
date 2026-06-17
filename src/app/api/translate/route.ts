import { NextRequest, NextResponse } from 'next/server'

const TARGETS = ['en', 'ka', 'ru'] as const

async function translateOne(text: string, target: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=tr|${target}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return text
    const data = await res.json()
    const translated = data?.responseData?.translatedText
    // MyMemory returns the original text uppercased on failure — fall back
    if (!translated || translated === text.toUpperCase()) return text
    return translated
  } catch {
    return text
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text } = body as { text: string }

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text zorunlu' }, { status: 400 })
    }

    const results = await Promise.all(TARGETS.map(t => translateOne(text, t)))

    return NextResponse.json({
      en: results[0],
      ka: results[1],
      ru: results[2],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
