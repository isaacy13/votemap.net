/** Shared catalog / home pill — 48px, fully round. Not GIS 40×4. */
export const catalogPill = {
    variant: 'outline' as const,
    size: 'lg' as const,
    h: '12' as const,
    w: 'full' as const,
    px: '8' as const,
    fontSize: { base: 'lg', md: 'xl' } as const,
    fontWeight: 'medium' as const,
    rounded: 'full' as const,
    transition: 'all 0.2s' as const,
}

export const catalogPillHover = {
    transform: 'translateY(-3px)',
    shadow: 'md',
} as const
