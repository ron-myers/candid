'use client'

export default function Logo({ className = '' }) {
  return (
    <div className={`logo ${className}`}>
      <div className="logo-icon">
        <svg viewBox="-2 0 34 32" width="34" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* The "Comment Bubble" - outlined with white fill */}
          <path
            d="M6 4H22C25.3137 4 28 6.68629 28 10V18C28 21.3137 25.3137 24 22 24H14L8 28V24H6C2.68629 24 0 21.3137 0 18V10C0 6.68629 2.68629 4 6 4Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        </svg>
      </div>
      <span className="logo-text">candid</span>
    </div>
  )
}
