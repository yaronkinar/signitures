import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { t, type AppLanguage } from '../i18n'

export const UserMenu = ({ lang }: { lang: AppLanguage }) => {
  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="btn-sign-in">
            {t(lang, 'signIn')}
          </button>
        </SignInButton>
      </SignedOut>
    </>
  )
}
