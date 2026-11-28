import type {
  EmployerProfileResponse,
  EmployerProfileUpdate,
  EmployerVerificationDocumentResponse,
  EmployerVerificationDocumentUpload,
} from '@repo/contracts';

export abstract class EmployerProfileRepository {
  abstract findByUserId(userId: string): Promise<EmployerProfileResponse | null>;
  abstract save(userId: string, input: EmployerProfileUpdate): Promise<EmployerProfileResponse>;
  abstract complete(userId: string): Promise<EmployerProfileResponse>;
  abstract listDocuments(
    userId: string,
  ): Promise<EmployerVerificationDocumentResponse[]>;
  abstract uploadDocument(
    userId: string,
    input: EmployerVerificationDocumentUpload,
  ): Promise<EmployerVerificationDocumentResponse>;
  abstract submit(userId: string): Promise<EmployerProfileResponse>;
  abstract deleteDocument(userId: string, documentId: string): Promise<void>;
}
