/**
 * FAQSchema - JSON-LD schema for FAQ page
 * Helps search engines display FAQ rich results
 */
export default function FAQSchema() {
  const faqItems = [
    {
      question: 'Does Candid work with any language?',
      answer:
        'Yes, Candid reviews code in any language Claude Code supports. Your Technical.md standards can be language-specific or universal.',
    },
    {
      question: 'How does Candid pay for Claude Code?',
      answer:
        "Candid uses Claude Code however you're already logged in. If you're using an API key, Candid uses that. If you're on Claude Pro or Max, Candid uses that.",
    },
    {
      question: 'Can I use Candid with my team?',
      answer:
        'Yes. Share your Technical.md and .candid/config.json in your repo. Everyone gets the same standards and configuration automatically.',
    },
    {
      question: "What's the difference between Harsh and Constructive tone?",
      answer:
        'Harsh provides brutally honest feedback, great for finding issues you might miss. Constructive provides caring but direct feedback, based on Radical Candor principles.',
    },
    {
      question: 'What is Radical Candor?',
      answer:
        "Radical Candor is a management philosophy that combines caring personally with challenging directly. It's about giving honest, direct feedback while genuinely caring about the person receiving it. Candid's Constructive tone is based on these principles.",
    },
    {
      question: 'Where does Candid save its state?',
      answer:
        'Config is saved in .candid/config.json (project) or ~/.candid/config.json (user). Review state is saved in .candid/last-review.json for re-review mode. Standards are saved in Technical.md or .candid/Technical.md.',
    },
    {
      question: 'Can I ignore certain files?',
      answer:
        'Yes, use the exclude config or --exclude flag. For example: {"exclude": ["*.generated.ts", "vendor/*", "**/*.test.ts"]}',
    },
    {
      question: 'Does Candid work offline?',
      answer: 'Candid requires Claude Code, which requires an internet connection.',
    },
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
