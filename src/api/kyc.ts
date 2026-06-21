import { apiFetch } from './client';
import type { KycSession, KycStatusView, KycVerifyResult } from './types';

// KYC — verificación de identidad (Didit).
// - Flujo principal: sesión hospedada de Didit. La app abre `redirectUrl` y el
//   usuario hace documento + selfie con óvalo + liveness en la pantalla de Didit.
//   Cuando Didit decide, el webhook actualiza /kyc/status solo.
// - Flujo secundario (legacy): captura manual de imágenes vía /kyc/verify-documents.

/** Estado KYC del usuario. */
export async function fetchKycStatus(): Promise<KycStatusView> {
  return apiFetch<KycStatusView>('/kyc/status');
}

/**
 * Crea una sesión hospedada de Didit y devuelve la `redirectUrl` donde el
 * usuario completa toda la verificación (documento + selfie con óvalo + liveness).
 */
export async function createKycSession(fullName?: string): Promise<KycSession> {
  return apiFetch<KycSession>('/kyc/session', {
    method: 'POST',
    body: fullName?.trim() ? { fullName: fullName.trim() } : {},
  });
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
