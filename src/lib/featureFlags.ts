// Feature flags for controlling new features
export const FEATURE_FLAGS = {
  SCHEDULE_VIEWING: process.env.NODE_ENV === 'production' ? false : true, // Disable in production initially
  // Add more feature flags here as needed
}

export const isFeatureEnabled = (
  feature: keyof typeof FEATURE_FLAGS
): boolean => {
  return FEATURE_FLAGS[feature]
}
