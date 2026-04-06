'use client'

import { useMemo, useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
const MAX_FILE_SIZE = 5 * 1024 * 1024

type ImageUploaderProps = {
  disabled?: boolean
  onUploadComplete: (payload: { imageUrl: string; fileName: string }) => void
}

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

export default function ImageUploader({
  disabled = false,
  onUploadComplete,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string>('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const helperText = useMemo(() => {
    if (error) return error
    if (fileName) return `已选择 ${fileName}`
    return '支持 JPG / PNG，单张图片不超过 5MB'
  }, [error, fileName])

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return '仅支持 JPG 或 PNG 格式。'
    }

    if (file.size > MAX_FILE_SIZE) {
      return `图片过大，当前 ${formatFileSize(file.size)}，请压缩到 5MB 内。`
    }

    return ''
  }

  const uploadFile = async (file: File) => {
    const nextError = validateFile(file)
    if (nextError) {
      setError(nextError)
      return
    }

    setError('')
    setFileName(file.name)
    setPreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as {
        error?: string
        imageUrl?: string
        fileName?: string
      }

      if (!response.ok || !data.imageUrl || !data.fileName) {
        setError(data.error ?? '上传失败，请稍后重试。')
        return
      }

      onUploadComplete({
        imageUrl: data.imageUrl,
        fileName: data.fileName,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFile = async (file?: File | null) => {
    if (!file || disabled || isUploading) return

    try {
      await uploadFile(file)
    } catch (uploadError) {
      console.error(uploadError)
      setError('上传失败，请检查网络或稍后重试。')
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !isUploading) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void handleFile(event.dataTransfer.files?.[0])
        }}
        className={`w-full rounded-3xl border border-dashed px-6 py-10 text-left transition ${
          isDragging
            ? 'border-blue-400 bg-blue-500/10 shadow-glow'
            : 'border-slate-700 bg-slate-900/70 hover:border-blue-400/70 hover:bg-slate-900'
        } ${disabled || isUploading ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
            🖼️
          </div>
          <div className="flex-1">
            <p className="text-xl font-semibold text-white">
              {isUploading ? '正在上传图片…' : '上传商品图，开始生成素材'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              支持点击选择或直接拖拽到这里。上传后会自动进入模板选择流程。
            </p>
            <p className={`mt-3 text-sm ${error ? 'text-rose-300' : 'text-slate-400'}`}>{helperText}</p>
          </div>
        </div>

        {preview ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
            <img src={preview} alt="上传预览" className="h-72 w-full object-contain" />
          </div>
        ) : null}
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
