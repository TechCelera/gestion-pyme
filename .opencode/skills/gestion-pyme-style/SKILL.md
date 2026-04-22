---
name: gestion-pyme-style
description: UI and styling conventions for Gestion PYME Pro. ClickUp-style colors, shadcn/ui components, mobile-first responsive design.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: frontend
---

## What I do

Enforce consistent UI styling and component patterns for the Gestion PYME Pro financial app.

## When to use me

When creating UI components, pages, or styles in the apps/web package.

## Design System

### Colors (ClickUp-inspired)

```
Primary:        #7B68EE (mediumpurple)
Primary Dark:   #5C4EC9 (deep violet)
Primary Light:  #9B8AFF (light violet)
Background:    #FAFAFA (off-white)
Surface:       #FFFFFF (white cards)
Text Primary:   #2C2C2C (near-black)
Text Secondary: #6B7280 (gray)
Border:         #E5E7EB (light gray)
Success:        #22C55E (green)
Error:          #EF4444 (red)
Warning:        #F59E0B (amber)
Info:           #3B82F6 (blue)
```

### Typography

- Font: Inter (Google Fonts)
- Headings: font-semibold
- Body: font-normal
- Numbers/financial data: font-mono (JetBrains Mono or similar monospace)

### Spacing

- Use Tailwind spacing scale consistently
- Card padding: p-6
- Section gaps: space-y-8
- Form field gaps: space-y-4

### Component Rules

1. Use shadcn/ui components as the base
2. Extend with project-specific components in `components/`
3. Every page is a Server Component by default
4. Add 'use client' only when needed (interactivity, hooks)
5. Use Suspense boundaries for data loading
6. Mobile-first: design for 375px, then scale up

### Navigation

- Mobile: bottom navigation bar with icons (5 items max)
- Desktop: left sidebar (collapsible), 240px expanded, 64px collapsed
- Active state: primary color background with white text
- Icons: Lucide React icons

### Dashboard Cards

- White background with subtle shadow
- Title in Text Secondary color
- Value in large monospace font
- Trend indicator (up/down arrow, percentage change)
- Cards in a responsive grid: 1 col mobile, 2 col tablet, 4 col desktop

### Financial Tables

- Striped rows for readability
- Right-align all numbers
- Use monospace font for amounts
- Negative numbers in red
- Bold totals row at bottom
- Sticky header on scroll

### Forms

- Clear labels above inputs
- Validation errors below the field
- Submit button in primary color
- Cancel button in gray
- Single column layout on mobile