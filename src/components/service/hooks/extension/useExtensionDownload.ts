import { useState, useCallback } from 'react'
import { api } from '~/components'

export function useExtensionDownload() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const downloadExtension = useCallback(async (extensionId: string) => {
    try {
      setError(null)
      setCompleted(false)
      setProgress(0)
      setStatus('starting')
      setMessage('Starting download...')
      setIsDownloading(true)

      const result = await api.extension.download(extensionId)
      
      if (!result || !result.success) {
        setError(result?.message || 'Failed to start download')
        setIsDownloading(false)
        setProgress(0)
        return
      }

      setStatus('downloading')
      setMessage('Downloading extension...')
      setProgress(50)

      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProgress(100)
      setStatus('completed')
      setMessage('Download complete!')
      setCompleted(true)
      setIsDownloading(false)
    } catch (err) {
      console.error('Download error:', err)
      setError((err as Error).message || 'Failed to start download')
      setIsDownloading(false)
      setProgress(0)
    }
  }, [])

  const reset = useCallback(() => {
    setIsDownloading(false)
    setProgress(0)
    setStatus('')
    setMessage('')
    setError(null)
    setCompleted(false)
  }, [])

  return {
    downloadExtension,
    isDownloading,
    progress,
    status,
    message,
    error,
    completed,
    reset,
  }
}