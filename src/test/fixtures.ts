import { createDefaultFormState } from '../lib/defaultFormState'
import type { SignatureFormState } from '../types/signatureForm'
import { getLayoutSettings } from '../lib/signatureUtils'
import type { SignatureLayoutSettings } from '../types/signatureForm'

/** Minimal form for HTML/unit tests — no social URLs or logo by default. */
export const createTestForm = (
  overrides: Partial<SignatureFormState> = {}
): SignatureFormState => ({
  ...createDefaultFormState(),
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  xUrl: '',
  youtubeUrl: '',
  logoUrl: '',
  rasterizeNameTitle: false,
  ...overrides
})

export const createTestLayout = (
  form: SignatureFormState = createTestForm()
): SignatureLayoutSettings => getLayoutSettings(form)
