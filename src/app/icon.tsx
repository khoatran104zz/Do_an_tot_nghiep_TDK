import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F6B4F',
          borderRadius: '7px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 8L88 38V84C88 88.4 84.4 92 80 92H20C15.6 92 12 88.4 12 84V38L50 8Z"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M32 36V74" stroke="#34D399" strokeWidth="9.5" strokeLinecap="round" />
          <path d="M36 55L52 38" stroke="#34D399" strokeWidth="9" strokeLinecap="round" />
          <path d="M40 51L56 74" stroke="#34D399" strokeWidth="9.5" strokeLinecap="round" />
          <rect x="62" y="52" width="7" height="7" rx="2" fill="#34D399" />
          <rect x="72" y="52" width="7" height="7" rx="2" fill="#34D399" />
          <rect x="62" y="62" width="7" height="7" rx="2" fill="#34D399" />
          <rect x="72" y="62" width="7" height="7" rx="2" fill="#34D399" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
