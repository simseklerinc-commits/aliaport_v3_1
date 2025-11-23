/**
 * Icon Component
 * Sprite içindeki <symbol id="icon-[name]"> tanımlarını kullanır.
 * Kullanım: <Icon name="add" /> => <use href="#icon-add" />
 * Props: size (tailwind w/h), className ekleri, title içerik (erişilebilirlik).
 */
import React from 'react';

interface IconProps {
  name: string; // ikon adı (sprite içinde id "icon-[name]")
  size?: number; // px (default 20)
  className?: string;
  title?: string; // erişilebilir başlık (decorative=false ise kullanılır)
  decorative?: boolean; // true => aria-hidden
}

export function Icon({ name, size = 20, className = '', title, decorative = false }: IconProps) {
  // Kullanıcı title vermezse name'den basit bir label üret (kebab-case -> kelimeler).
  const fallbackLabel = name.replace(/[-_]/g, ' ');
  const label = title || fallbackLabel;

  const ariaProps = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': label };

  return (
    <svg
      width={size}
      height={size}
      className={className}
      focusable="false"
      {...ariaProps}
    >
      {!decorative && title && <title>{title}</title>}
      <use href={`#icon-${name}`} />
    </svg>
  );
}
