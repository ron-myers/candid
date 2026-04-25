export const metadata = {
  title: 'Privacy | Candid',
  description: 'Privacy policy for candid.tools — what data is collected and how.',
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 1.5rem', lineHeight: '1.7' }}>
      <h1>Privacy</h1>
      <p>
        This site uses{' '}
        <a href="https://usefathom.com" target="_blank" rel="noopener noreferrer">
          Fathom Analytics
        </a>
        , a privacy-friendly, cookieless analytics service that is GDPR, CCPA, and PECR compliant.
      </p>
      <p>
        No personal data is collected, stored, or sold. Fathom counts page views and referrers in
        aggregate without tracking individuals or setting cookies.
      </p>
      <p>
        For details on what Fathom collects, see the{' '}
        <a href="https://usefathom.com/data" target="_blank" rel="noopener noreferrer">
          Fathom data page
        </a>
        .
      </p>
    </div>
  )
}
