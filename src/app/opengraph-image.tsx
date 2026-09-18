import { ImageResponse } from 'next/og';

export const alt = 'K-Home - Smart Living, Better Together';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F6B4F',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #15803d 0%, #0F6B4F 60%)',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle decorative circle */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'rgba(52, 211, 153, 0.1)',
            filter: 'blur(80px)',
          }}
        />

        {/* Center Logo and Brand Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            marginBottom: '20px',
            zIndex: 1,
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 8L88 38V84C88 88.4 84.4 92 80 92H20C15.6 92 12 88.4 12 84V38L50 8Z"
              stroke="#FFFFFF"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M32 36V74" stroke="#FFFFFF" strokeWidth="8.5" strokeLinecap="round" />
            <path d="M36 55L52 38" stroke="#34D399" strokeWidth="8" strokeLinecap="round" />
            <path d="M40 51L56 74" stroke="#34D399" strokeWidth="8.5" strokeLinecap="round" />
            <rect x="62" y="52" width="6.5" height="6.5" rx="1.8" fill="#34D399" />
            <rect x="71.5" y="52" width="6.5" height="6.5" rx="1.8" fill="#34D399" />
            <rect x="62" y="61.5" width="6.5" height="6.5" rx="1.8" fill="#34D399" />
            <rect x="71.5" y="61.5" width="6.5" height="6.5" rx="1.8" fill="#34D399" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '84px',
                fontWeight: 800,
                letterSpacing: '-2px',
                lineHeight: 1,
              }}
            >
              K-Home
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 600,
                color: '#A7F3D0',
                letterSpacing: '1px',
                marginTop: '8px',
              }}
            >
              Smart Living, Better Together
            </div>
          </div>
        </div>

        {/* Vietnamese Tagline */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.85)',
            marginTop: '16px',
            letterSpacing: '0.5px',
            zIndex: 1,
          }}
        >
          Hệ thống Quản lý Vận hành Chung cư Thông minh Chuẩn Quốc tế
        </div>
      </div>
    ),
    { ...size }
  );
}
