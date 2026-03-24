import React, { useRef, useState } from 'react'

export default function FaceAuth({ mode = 'login', onSuccess, onError }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('Click Start Camera to begin')
  const [cameraOn, setCameraOn] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [email, setEmail] = useState('')

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        setCameraOn(true)
        setStatus(mode === 'register'
          ? 'Position your face and click Capture'
          : 'Position your face and click Scan')
      }
    } catch {
      setStatus('Camera access denied. Please allow camera.')
      onError?.('Camera denied')
    }
  }

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    setCameraOn(false)
  }

  const captureFace = async () => {
    if (!cameraOn) { setStatus('Please start camera first.'); return }
    if (mode === 'login' && !email.trim()) {
      setStatus('Please enter your email first.')
      return
    }

    setScanning(true)
    setStatus('Capturing...')

    try {
      const video = videoRef.current
      if (!video.videoWidth || !video.videoHeight) {
        setStatus('Camera not ready. Try again.')
        setScanning(false)
        return
      }

      const canvas = canvasRef.current
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, 64, 64)

      const imageData = ctx.getImageData(0, 0, 64, 64)
      const pixels = imageData.data

      const descriptor = []
      for (let i = 0; i < 128; i++) {
        const idx = Math.floor((i / 128) * (64 * 64)) * 4
        const r = pixels[idx] / 255
        const g = pixels[idx + 1] / 255
        const b = pixels[idx + 2] / 255
        descriptor.push((0.299 * r + 0.587 * g + 0.114 * b))
      }

      setStatus(mode === 'register' ? '✅ Face captured!' : '✅ Face scanned!')
      stopCamera()

      // Pass both descriptor AND email for login
      onSuccess?.(descriptor, email.trim())
    } catch (err) {
      setStatus('Capture failed. Try again.')
      setScanning(false)
      onError?.(err.message)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Email field only shown on login */}
      {mode === 'login' && (
        <div className="w-full">
          <label className="block text-sm font-medium mb-2">Your Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Enter your email then scan your face to login
          </p>
        </div>
      )}

      <div className="relative w-full h-48 bg-gray-900 rounded-2xl overflow-hidden border-2"
        style={{ borderColor: cameraOn ? '#8b5cf6' : '#374151' }}>
        <video ref={videoRef} autoPlay muted playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} className="hidden" />
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">📷</span>
          </div>
        )}
        {scanning && (
          <div className="absolute inset-0 border-4 border-purple-400 rounded-2xl animate-pulse" />
        )}
        {cameraOn && !scanning && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white"
            style={{ background: 'rgba(239,68,68,0.8)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      <p className="text-sm text-center px-2" style={{ color: 'var(--text-muted)' }}>{status}</p>

      <div className="flex gap-3 w-full">
        {!cameraOn ? (
          <button onClick={startCamera} className="btn-secondary flex-1 py-2.5 text-sm">
            📷 Start Camera
          </button>
        ) : (
          <button onClick={stopCamera} className="btn-secondary flex-1 py-2.5 text-sm">
            ✕ Stop Camera
          </button>
        )}
        <button
          onClick={captureFace}
          disabled={scanning || !cameraOn}
          className="btn-primary flex-1 py-2.5 text-sm"
          style={(scanning || !cameraOn) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {scanning ? '🔍 Capturing...' : mode === 'register' ? '📸 Capture Face' : '🔍 Scan Face'}
        </button>
      </div>
    </div>
  )
}