export function getPlatform() {
  if (typeof window == 'undefined') {
    return 'node' as const
  }
  let userAgent = window.navigator.userAgent.toLowerCase()
  if (
    userAgent.includes('android') ||
    userAgent.includes('iphone') ||
    userAgent.includes('mobi')
  ) {
    return 'mobile' as const
  }
  return 'desktop' as const
}

export function adjust_difficulty_by_platform(difficulty: number): number {
  let platform = getPlatform()
  switch (platform) {
    case 'desktop':
      return difficulty * 0.5
    case 'mobile':
      return difficulty * 0.25
    case 'node':
    default:
      return difficulty
  }
}
