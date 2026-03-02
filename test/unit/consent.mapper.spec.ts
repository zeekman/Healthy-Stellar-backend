import { Test, TestingModule } from '@nestjs/testing';
import { ConsentMapper } from '../../src/fhir/mappers/consent.mapper';
import { FhirMappingException } from '../../src/fhir/exceptions/fhir-mapping.exception';

describe('ConsentMapper', () => {
  let mapper: ConsentMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsentMapper],
    }).compile();

    mapper = module.get<ConsentMapper>(ConsentMapper);
  });

  describe('toFhir', () => {
    it('should map AccessGrant to FHIR Consent', () => {
      const grant = {
        id: '999',
        patientId: '123',
        granteeId: '789',
        recordIds: ['456', '457'],
        accessLevel: 'READ',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31'),
      };

      const result = mapper.toFhir(grant as any);

      expect(result.resourceType).toBe('Consent');
      expect(result.id).toBe('999');
      expect(result.status).toBe('active');
      expect(result.patient.reference).toBe('Patient/123');
      expect(result.provision.actor[0].reference.reference).toBe('Practitioner/789');
      expect(result.provision.data.length).toBe(2);
    });

    it('should map READ_WRITE access level', () => {
      const grant = {
        id: '999',
        patientId: '123',
        granteeId: '789',
        recordIds: ['456'],
        accessLevel: 'READ_WRITE',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
      };

      const result = mapper.toFhir(grant as any);

      expect(result.provision.action.length).toBe(2);
      expect(result.provision.action[1].coding[0].code).toBe('correct');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const grant = { id: '999' };

      expect(() => mapper.toFhir(grant as any)).toThrow(FhirMappingException);
    });
  });

  describe('fromFhir', () => {
    it('should map FHIR Consent to AccessGrant', () => {
      const consent: fhir4.Consent = {
        resourceType: 'Consent',
        id: '999',
        status: 'active',
        scope: { coding: [{ code: 'patient-privacy' }] },
        category: [{ coding: [{ code: '59284-0' }] }],
        patient: { reference: 'Patient/123' },
        dateTime: '2024-01-01T00:00:00Z',
        provision: {
          actor: [
            {
              role: { coding: [{ code: 'IRCP' }] },
              reference: { reference: 'Practitioner/789' },
            },
          ],
          data: [{ reference: { reference: 'DocumentReference/456' } }],
          action: [{ coding: [{ code: 'access' }] }],
        },
      };

      const result = mapper.fromFhir(consent);

      expect(result.id).toBe('999');
      expect(result.patientId).toBe('123');
      expect(result.granteeId).toBe('789');
      expect(result.recordIds[0]).toBe('456');
      expect(result.accessLevel).toBe('READ');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const consent: any = { resourceType: 'Consent', id: '999' };

      expect(() => mapper.fromFhir(consent)).toThrow(FhirMappingException);
    });
  });
});
