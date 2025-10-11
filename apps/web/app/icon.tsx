import { ImageResponse } from 'next/og';

// Required for Cloudflare Pages deployment
export const runtime = 'edge';

export const size = {
  width: 16,
  height: 16,
};
export const contentType = 'image/svg+xml';

export default function Icon() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#3b82f6"/>
        <text x="8" y="12" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif">
          S
        </text>
      </svg>
    ),
    {
      ...size,
    }
  );
}
