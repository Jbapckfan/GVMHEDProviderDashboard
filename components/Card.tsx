"use client";

import { ReactNode, useState, useRef, MouseEvent } from 'react';

/**
 * Card - Glass-morphic card with mouse-tracking spotlight effect
 *
 * Features:
 * - Multi-layer shadows for depth
 * - Mouse-tracking radial gradient spotlight (signature interaction)
 * - Gradient background with subtle borders
 * - Hover animations with precision micro-interactions
 */

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  hover?: boolean;
  spotlight?: boolean;
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = true,
  spotlight = true,
}: CardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const variantStyles = {
    default: 'bg-gradient-to-b from-white/[0.08] to-white/[0.02]',
    glass: 'bg-white/[0.05] backdrop-blur-xl',
    gradient: 'bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02]',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative rounded-2xl border border-white/[0.06] overflow-hidden
        ${variantStyles[variant]}
        ${hover ? 'transition-all duration-300 hover:-translate-y-1 card-shadow hover:card-shadow-hover hover:border-white/[0.10]' : 'card-shadow'}
        ${className}
      `}
    >
      {/* Mouse-tracking spotlight effect */}
      {spotlight && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(94, 106, 210, 0.15), transparent 40%)`,
          }}
        />
      )}

      {/* Inner highlight line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
