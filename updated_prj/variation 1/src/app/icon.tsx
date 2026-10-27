import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF8A3D 0%, #E85A00 100%)",
          borderRadius: 8,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 7 L31 11.5 V19 C31 25.8 26.3 30.5 20 32.5 C13.7 30.5 9 25.8 9 19 V11.5 Z"
            fill="rgba(0, 0, 0, 0.12)"
          />
          <path
            d="M20 7 L31 11.5 V19 C31 25.8 26.3 30.5 20 32.5 C13.7 30.5 9 25.8 9 19 V11.5 Z"
            stroke="#2B1400"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeOpacity="0.5"
          />
          <path
            d="M15 19.5 L18.5 23.5 L25.5 16"
            stroke="#120800"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
