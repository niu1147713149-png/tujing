import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未收到上传文件。' }, { status: 400 })
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG 或 PNG 格式。' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 5MB。' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const imageUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      fileName: file.name,
      imageUrl,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '上传失败，请稍后重试。' }, { status: 500 })
  }
}
