import { Test, TestingModule } from '@nestjs/testing';
import { ProvenanceMapper } from '../../src/fhir/mappers/provenance.mapper';
import { FhirMappingException } from '../../src/fhir/exceptions/fhir-mapping.exception';

describe('ProvenanceMapper', () => {
  let mapper: ProvenanceMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProvenanceMapper],
    }).compile();

    mapper = module.get<ProvenanceMapper>(ProvenanceMapper);
  });

  describe('toFhir', () => {
    it('should map AuditLog to FHIR Provenance', () => {
      const audit = {
        id: '789',
        entityId: '456',
        entity: 'MedicalRecord',
        userId: '123',
        action: 'DATA_ACCESS',
        description: 'Accessed patient record',
        timestamp: new Date('2024-01-01'),
        severity: 'MEDIUM',
      };

      const result = mapper.toFhir(audit as any);

      expect(result.resourceType).toBe('Provenance');
      expect(result.id).toBe('789');
      expect(result.target[0].reference).toBe('MedicalRecord/456');
      expect(result.agent[0].who.reference).toBe('Practitioner/123');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const audit = { id: '789' };

      expect(() => mapper.toFhir(audit as any)).toThrow(FhirMappingException);
    });
  });

  describe('fromFhir', () => {
    it('should map FHIR Provenance to AuditLog', () => {
      const provenance: fhir4.Provenance = {
        resourceType: 'Provenance',
        id: '789',
        target: [{ reference: 'MedicalRecord/456' }],
        recorded: '2024-01-01T00:00:00Z',
        agent: [{ who: { reference: 'Practitioner/123' } }],
        activity: { coding: [{ display: 'DATA_ACCESS' }] },
      };

      const result = mapper.fromFhir(provenance);

      expect(result.id).toBe('789');
      expect(result.entity).toBe('MedicalRecord');
      expect(result.entityId).toBe('456');
      expect(result.userId).toBe('123');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const provenance: any = { resourceType: 'Provenance', id: '789' };

      expect(() => mapper.fromFhir(provenance)).toThrow(FhirMappingException);
    });
  });
});
