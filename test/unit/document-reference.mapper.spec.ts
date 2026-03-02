import { Test, TestingModule } from '@nestjs/testing';
import { DocumentReferenceMapper } from '../../src/fhir/mappers/document-reference.mapper';
import { FhirMappingException } from '../../src/fhir/exceptions/fhir-mapping.exception';

describe('DocumentReferenceMapper', () => {
  let mapper: DocumentReferenceMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentReferenceMapper],
    }).compile();

    mapper = module.get<DocumentReferenceMapper>(DocumentReferenceMapper);
  });

  describe('toFhir', () => {
    it('should map MedicalRecord to FHIR DocumentReference', () => {
      const record = {
        id: '456',
        patientId: '123',
        providerId: '789',
        recordType: 'CONSULTATION',
        title: 'Annual Checkup',
        description: 'Routine examination',
        status: 'ACTIVE',
        recordDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        version: 1,
      };

      const result = mapper.toFhir(record as any);

      expect(result.resourceType).toBe('DocumentReference');
      expect(result.id).toBe('456');
      expect(result.status).toBe('current');
      expect(result.subject.reference).toBe('Patient/123');
      expect(result.author[0].reference).toBe('Practitioner/789');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const record = { id: '456' };

      expect(() => mapper.toFhir(record as any)).toThrow(FhirMappingException);
    });
  });

  describe('fromFhir', () => {
    it('should map FHIR DocumentReference to MedicalRecord', () => {
      const doc: fhir4.DocumentReference = {
        resourceType: 'DocumentReference',
        id: '456',
        status: 'current',
        subject: { reference: 'Patient/123' },
        author: [{ reference: 'Practitioner/789' }],
        description: 'Test document',
        content: [{ attachment: { title: 'Test' } }],
      };

      const result = mapper.fromFhir(doc);

      expect(result.id).toBe('456');
      expect(result.patientId).toBe('123');
      expect(result.providerId).toBe('789');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const doc: any = { resourceType: 'DocumentReference', id: '456' };

      expect(() => mapper.fromFhir(doc)).toThrow(FhirMappingException);
    });
  });
});
