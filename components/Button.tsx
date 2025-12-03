"use client";

import { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Button - Precision-crafted button component with multi-layer shadows
 *
 * Variants:
 * - primary: Solid accent with glow effect
 * - secondary: Glass effect with subtle borders
 * - ghost: Transparent with hover state
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}: ButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/50 focus:ring-offset-2 focus:ring-offset-[#050506] disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-2.5 text-base rounded-lg',
    lg: 'px-8 py-3 text-lg rounded-xl',
  };

  const variantStyles = {
    primary: `
      bg-[#5E6AD2] text-white
      hover:bg-[#6872D9]
      active:scale-[0.98]
      button-shadow-accent
      hover:shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_6px_16px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)]
      overflow-hidden
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700
    `,
    secondary: `
      bg-white/[0.05] text-[#EDEDEF] border border-white/[0.06]
      hover:bg-white/[0.08] hover:border-white/[0.10]
      active:scale-[0.98]
      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]
      hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.3)]
    `,
    ghost: `
      bg-transparent text-[#8A8F98]
      hover:bg-white/[0.05] hover:text-[#EDEDEF]
      active:scale-[0.98]
    `,
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${widthStyles}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
