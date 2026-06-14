import { SignIn } from '@clerk/clerk-react'

export const SignInScreen = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--app-bg, #eef3f8)'
      }}
    >
      <SignIn routing="virtual" />
    </main>
  )
}
