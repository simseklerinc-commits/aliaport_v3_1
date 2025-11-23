/**
 * Icon Component
 * Sprite içindeki <symbol id="icon-[name]"> tanımlarını kullanır.
 * Kullanım: <Icon name="add" /> => <use href="#icon-add" />
 * Props: size (tailwind w/h), className ekleri, title içerik (erişilebilirlik).
 */
import React from 'react';

interface IconProps {
  name: string; // ikon adı (dosya adı)
  size?: number; // px cinsinden (default 20)
  className?: string;
  title?: string;
  decorative?: boolean; // true ise aria-hidden
}

export function Icon({ name, size = 20, className = '', title, decorative = false }: IconProps) {
  const ariaProps = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': title || name };
  return (
    <svg
      width={size}
      height={size}
      className={className}
      {...ariaProps}
    >
      {title && !decorative && <title>{title}</title>}
      <use href={`#icon-${name}`} />
    </svg>
  );
}
