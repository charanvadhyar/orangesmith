export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

// Use environment variables with fallback to default values for development
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

// Using the actual Sanity project ID as fallback
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'yyxme3w8'

// For deployments, you should set up proper environment variables

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
