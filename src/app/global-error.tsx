'use client'

import { useEffect } from 'react'

// Dernier filet : ne se déclenche que si le layout racine lui-même échoue.
// Il remplace <html>/<body>, donc il ne peut hériter d'aucun style du site et
// reste volontairement autonome (styles inline, pas de dépendance).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erreur globale:', error.digest ?? error.message)
  }, [error])

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F5F1',
          color: '#0A0A0A',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '520px', textAlign: 'center' }}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#737373',
            }}
          >
            Erreur
          </p>
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: '32px',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            Le site est momentanément indisponible.
          </h1>
          <p
            style={{
              margin: '0 0 32px',
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#525252',
            }}
          >
            Une erreur inattendue est survenue. Réessayez dans un instant.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              cursor: 'pointer',
              borderRadius: '999px',
              backgroundColor: '#C85E1A',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              padding: '10px 24px',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
