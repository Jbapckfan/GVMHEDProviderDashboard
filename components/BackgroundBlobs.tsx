"use client";

/**
 * BackgroundBlobs - Animated ambient lighting system
 *
 * Creates floating gradient shapes that simulate cinematic lighting pools.
 * This is a signature element of the Linear/Modern design system.
 */
export default function BackgroundBlobs() {
  return (
    <>
      {/* Base radial gradient */}
      <div
        className="background-layer"
        style={{
          background: 'radial-gradient(ellipse at top, #0a0a0f 0%, #050506 50%, #020203 100%)',
          zIndex: 0,
        }}
      />

      {/* Noise texture */}
      <div className="background-layer noise-texture" style={{ zIndex: 1 }} />

      {/* Grid overlay */}
      <div className="background-layer grid-overlay" style={{ zIndex: 2 }} />

      {/* Animated gradient blobs */}
      <div className="background-layer" style={{ zIndex: 3 }}>
        {/* Primary blob - Top center */}
        <div
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[900px] h-[1400px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(94, 106, 210, 0.4) 0%, transparent 70%)',
            filter: 'blur(150px)',
            animation: 'float 10s ease-in-out infinite',
          }}
        />

        {/* Secondary blob - Left side */}
        <div
          className="absolute top-1/4 -left-[200px] w-[600px] h-[800px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(94, 106, 210, 0.2) 50%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'float-reverse 12s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />

        {/* Tertiary blob - Right side */}
        <div
          className="absolute top-1/3 -right-[100px] w-[500px] h-[700px] rounded-full opacity-12"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(94, 106, 210, 0.2) 50%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'float 9s ease-in-out infinite',
            animationDelay: '4s',
          }}
        />

        {/* Bottom accent blob - Pulsing */}
        <div
          className="absolute bottom-0 left-1/3 w-[700px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(94, 106, 210, 0.15) 0%, transparent 70%)',
            filter: 'blur(130px)',
            animation: 'pulse-glow 6s ease-in-out infinite',
          }}
        />
      </div>
    </>
  );
}
