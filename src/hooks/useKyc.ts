import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchKycStatus, verifyDocuments, type VerifyDocumentsInput } from '../api/kyc';
import type { KycStatusView, KycVerifyResult } from '../api/types';

const KYC_STATUS_KEY = ['kyc', 'status'];

/** Estado KYC del usuario. */
export function useKycStatus() {
  return useQuery<KycStatusView>({
    queryKey: KYC_STATUS_KEY,
    queryFn: fetchKycStatus,
    retry: false,
  });
}

/** Envío de documentos para verificación síncrona. */
export function useVerifyDocuments() {
  const qc = useQueryClient();
  return useMutation<KycVerifyResult, Error, VerifyDocumentsInput>({
    mutationFn: verifyDocuments,
    onSuccess: () => qc.invalidateQueries({ queryKey: KYC_STATUS_KEY }),
  });
}
