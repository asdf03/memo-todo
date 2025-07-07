export const API_ENDPOINTS = {
  BOARDS: '/boards',
  LISTS: '/lists',
  CARDS: '/cards',
  AUTH: '/auth'
} as const

export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  TOUCH_TARGET_SIZE: 44,
  DRAG_THRESHOLD: 15,
  HAPTIC_FEEDBACK_DURATION: 50
} as const

export const PLATFORM = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile'
} as const

export const FEATURE_FLAGS = {
  DRAG_AND_DROP: true,
  TOUCH_GESTURES: true,
  KEYBOARD_SHORTCUTS: true,
  HAPTIC_FEEDBACK: true
} as const