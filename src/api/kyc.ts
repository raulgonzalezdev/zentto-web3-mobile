import { apiFetch } from './client';
import type { KycStatusView, KycVerifyResult } from './types';

// KYC — verificación de identidad. Flujo standalone síncrono (Didit): la app
// captura las imágenes y el backend resuelve la verificación de forma síncrona.

/** Estado KYC del usuario. */
export async function fetchKycStatus(): Promise<KycStatusView> {
  return apiFetch<KycStatusView>('/kyc/status');
}

export interface VerifyDocumentsInput {
  front: Blob; // documento (frente) — obligatorio
  back?: Blob | null; // dorso — opcional
  selfie?: Blob | null; // selfie — opcional
  fullName?: string;
}

/**
 * Envía las imágenes del documento (multipart/form-data) para verificación
 * síncrona. Reusa apiFetch (cookies httpOnly + CSRF). NO se fija Content-Type:
 * el navegador añade el boundary del multipart.
 */
export async function verifyDocuments(input: VerifyDocumentsInput): Promise<KycVerifyResult> {
  const fd = new FormData();
  fd.append('front_image', input.front, 'front.jpg');
  if (input.back) fd.append('back_image', input.back, 'back.jpg');
  if (input.selfie) fd.append('selfie', input.selfie, 'selfie.jpg');
  if (input.fullName) fd.append('fullName', input.fullName);

  return apiFetch<KycVerifyResult>('/kyc/verify-documents', {
    method: 'POST',
    formData: fd,
  });
}
