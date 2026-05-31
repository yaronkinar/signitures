import JSZip from 'jszip'
import { sanitizeFileName } from './fileNames'
import {
  addImageAssetsToZip,
  buildImageAssets,
  collectFormImageSources,
  rewriteRecordImageUrls
} from './signatureImageAssets'
import type { SignatureFormState } from '../types/signatureForm'

const EXPORT_IMAGES_FOLDER = 'images'

export const buildExportBaseName = (form: SignatureFormState): string =>
  sanitizeFileName(form.fullName.trim() || form.company.trim() || 'signature')

export const buildNamedExportZip = async (
  jsonFilename: string,
  payload: Record<string, unknown>,
  form: SignatureFormState
): Promise<Blob> => {
  const { urlMap, files } = buildImageAssets(collectFormImageSources(form), EXPORT_IMAGES_FOLDER)
  const exportPayload = files.length > 0 ? rewriteRecordImageUrls(payload, urlMap) : payload

  if (!files.length) {
    return new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
  }

  const zip = new JSZip()
  zip.file(jsonFilename, JSON.stringify(exportPayload, null, 2))
  addImageAssetsToZip(zip, EXPORT_IMAGES_FOLDER, files)
  return zip.generateAsync({ type: 'blob' })
}

export const buildFormParamsExportZip = async (form: SignatureFormState): Promise<Blob> => {
  const baseName = buildExportBaseName(form)
  return buildNamedExportZip(`${baseName}-params.json`, form as unknown as Record<string, unknown>, form)
}

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Cannot read blob'))
        return
      }
      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(new Error('Cannot read blob'))
    reader.readAsDataURL(blob)
  })
