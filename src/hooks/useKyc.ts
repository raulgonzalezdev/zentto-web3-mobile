import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createKycSession,
  fetchKycStatus,
  verifyDocuments,
  type VerifyDocumentsInput,
} from '../api/kyc';
import type { KycSession, KycStatusView, KycVerifyResult } from '../api/types';

const KYC_STATUS_KEY = ['kyc', 'status'];

/** Estado KYC del usuario. */
export function useKycStatus() {
  return useQuery<KycStatusView>({
    queryKey: KYC_STATUS_KEY,
    queryFn: fetchKycStatus,
    retry: false,
  });
}

/** Crea la sesión hospedada de Didit (devuelve `redirectUrl`). */
export function useCreateKycSession() {
  return useMutation<KycSession, Error, string | undefined>({
    mutationFn: (fullName) => createKycSession(fullName),
  });
}

/** Invalida el estado KYC para re-consultar /kyc/status (ej. al volver del browser de Didit). */
export function useRefreshKycStatus() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KYC_STATUS_KEY });
}

/** Envío de documentos para verificación síncrona (flujo manual secundario). */
export function useVerifyDocuments() {
  const qc = useQueryClient();
  return useMutation<KycVerifyResult, Error, VerifyDocumentsInput>({
    mutationFn: verifyDocuments,
    onSuccess: () => qc.invalidateQueries({ queryKey: KYC_STATUS_KEY }),
  });
}
