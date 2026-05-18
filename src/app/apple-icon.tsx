import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EDE9FE',
          color: '#7B68EE',
          fontSize: 72,
          fontWeight: 700,
          borderRadius: 36,
        }}
      >
        GP
      </div>
    ),
    { ...size }
  )
}
