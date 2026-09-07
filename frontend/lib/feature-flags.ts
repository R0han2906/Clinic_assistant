/**
 * Global feature flags for gradual, modular feature rollout.
 * Features can be toggled without breaking application stability.
 */

export const flags = {
  walkInV2: true,
  whatsappAgent: false, // Deferred to Stage 2
  supabaseAuth: false,  // Deferred to Stage 4
  dragToCancel: false,  // Deferred to Stage 3
} as const

export type FeatureFlags = typeof flags
