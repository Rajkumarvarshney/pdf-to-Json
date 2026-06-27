/**
 * videoFrameExtractor.js
 * Extracts frames from a video file using HTML5 Canvas (browser-native, no libs needed).
 * Each frame is returned as a base64 JPEG string.
 */

/**
 * Load a video file into an <video> element and return it when metadata is ready.
 * @param {File} file
 * @returns {Promise<HTMLVideoElement>}
 */
function loadVideo(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(file)
    video.src = url

    video.onloadedmetadata = () => resolve(video)
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video. Please check the file format.'))
    }
  })
}

/**
 * Seek a video to a specific time and return the frame as base64 JPEG.
 * @param {HTMLVideoElement} video
 * @param {number} timeSeconds
 * @param {number} quality - JPEG quality 0-1
 * @returns {Promise<string>} base64 data URL
 */
function captureFrame(video, timeSeconds, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Frame capture timed out at ${timeSeconds}s`)), 5000)

    video.currentTime = timeSeconds
    video.onseeked = () => {
      clearTimeout(timeout)
      try {
        const canvas = document.createElement('canvas')
        // Scale down for API efficiency (max 480px wide)
        const scale = Math.min(1, 480 / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)

        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Returns data URL like "data:image/jpeg;base64,..."
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      } catch (err) {
        reject(err)
      }
    }
  })
}

/**
 * Extract frames from a video file at regular intervals.
 *
 * @param {File} file - The video file
 * @param {number} intervalSeconds - Seconds between frames (default: 2)
 * @param {function} onProgress - Called with (frameIndex, totalFrames, dataUrl)
 * @returns {Promise<Array<{ frameIndex: number, timestampSeconds: number, dataUrl: string }>>}
 */
export async function extractVideoFrames(file, intervalSeconds = 2, onProgress = null) {
  const video = await loadVideo(file)

  const duration = video.duration
  if (!isFinite(duration) || duration <= 0) {
    throw new Error('Could not determine video duration. The file may be corrupted.')
  }

  // Build list of timestamps to capture
  const timestamps = []
  for (let t = 0; t < duration; t += intervalSeconds) {
    timestamps.push(parseFloat(t.toFixed(2)))
  }
  // Always include the last frame
  if (timestamps[timestamps.length - 1] < duration - 0.5) {
    timestamps.push(parseFloat((duration - 0.1).toFixed(2)))
  }

  const frames = []

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i]
    const dataUrl = await captureFrame(video, ts)

    const frame = {
      frameIndex: i,
      timestampSeconds: ts,
      dataUrl,
    }

    frames.push(frame)
    onProgress?.(i + 1, timestamps.length, dataUrl)
  }

  // Cleanup
  URL.revokeObjectURL(video.src)

  return frames
}

/**
 * Get video metadata (duration, dimensions, fps estimate) without extracting frames.
 */
export function getVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    const url = URL.createObjectURL(file)
    video.src = url

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      })
      URL.revokeObjectURL(url)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read video metadata.'))
    }
  })
}

/**
 * Count how many frames will be extracted for a given duration and interval.
 */
export function estimateFrameCount(durationSeconds, intervalSeconds) {
  return Math.ceil(durationSeconds / intervalSeconds) + 1
}
