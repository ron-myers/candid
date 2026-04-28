import * as Fathom from 'fathom-client'

/**
 * Track a custom event in Fathom analytics
 * @param {string} eventName - Name of the event to track
 */
export function trackEvent(eventName) {
  if (typeof window !== 'undefined') {
    Fathom.trackEvent(eventName)
  }
}

// Pre-defined event names for consistency
export const EVENTS = {
  // CTA buttons
  GET_STARTED_CLICK: 'get_started_click',
  LEARN_MORE_CLICK: 'learn_more_click',
  DOCS_CTA_CLICK: 'docs_cta_click',
  SHIP_CONFIG_CTA_CLICK: 'ship_config_cta_click',

  // External links
  GITHUB_CLICK: 'github_click',
  SLACK_CLICK: 'slack_click',
  LINKEDIN_CLICK: 'linkedin_click',
  FRITTER_FACTORY_CLICK: 'fritter_factory_click',
  PRIVACY_CLICK: 'privacy_click',

  // Code interactions
  CODE_COPY: 'code_copy',
}
