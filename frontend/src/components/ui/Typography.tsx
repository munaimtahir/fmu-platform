import React from 'react'

type HeadingSize = 'display' | 'h1' | 'h2' | 'h3' | 'h4'

export interface HeadingProps {
  /** Semantic heading level (h1-h4). Defaults to matching `size`. */
  level?: 1 | 2 | 3 | 4
  /** Visual size, decoupled from `level` so DOM semantics and appearance can diverge (e.g. a card title that's visually small but semantically an h3). */
  size?: HeadingSize
  as?: React.ElementType
  className?: string
  children: React.ReactNode
}

const LEVEL_TO_SIZE: Record<1 | 2 | 3 | 4, HeadingSize> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
}

const HEADING_SIZE_CLASSES: Record<HeadingSize, string> = {
  display: 'text-display',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
}

/**
 * Page/section heading using the shared type scale (tailwind.config.ts
 * `fontSize.display/h1-h4`). Only page-level titles and section headings are
 * expected to migrate to this component — table-cell/form-value text is out
 * of scope for this pass.
 */
export const Heading: React.FC<HeadingProps> = ({ level = 1, size, as, className = '', children }) => {
  const Tag = as ?? (`h${level}` as React.ElementType)
  const resolvedSize = size ?? LEVEL_TO_SIZE[level]

  return (
    <Tag className={`${HEADING_SIZE_CLASSES[resolvedSize]} text-ink-primary ${className}`}>
      {children}
    </Tag>
  )
}

type TextVariant = 'body-lg' | 'body' | 'body-sm' | 'caption'
type TextTone = 'primary' | 'secondary' | 'muted' | 'danger' | 'success'

export interface TextProps {
  variant?: TextVariant
  tone?: TextTone
  as?: 'p' | 'span' | 'div'
  className?: string
  children: React.ReactNode
}

const TEXT_VARIANT_CLASSES: Record<TextVariant, string> = {
  'body-lg': 'text-body-lg',
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
}

const TEXT_TONE_CLASSES: Record<TextTone, string> = {
  primary: 'text-ink-primary',
  secondary: 'text-ink-secondary',
  muted: 'text-ink-muted',
  danger: 'text-danger',
  success: 'text-success',
}

/** Body copy using the shared type scale, with a tone that maps to the semantic/ink color tokens. */
export const Text: React.FC<TextProps> = ({ variant = 'body', tone = 'secondary', as = 'p', className = '', children }) => {
  const Tag = as

  return (
    <Tag className={`${TEXT_VARIANT_CLASSES[variant]} ${TEXT_TONE_CLASSES[tone]} ${className}`}>
      {children}
    </Tag>
  )
}
