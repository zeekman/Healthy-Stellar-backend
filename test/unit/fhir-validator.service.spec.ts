import { Test, TestingModule } from '@nestjs/testing';
import { FhirValidatorService } from '../../src/fhir/services/fhir-validator.service';
import { FhirMappingException } from '../../src/fhir/exceptions/fhir-mapping.exception';

describe('FhirValidatorService', () => {
  let service: FhirValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FhirValidatorService],
    }).compile();

    service = module.get<FhirValidatorService>(FhirValidatorService);
  });

  describe('validateResource', () => {
    it('should validate valid Patient resource', () => {
      const patient = {
        resourceType: 'Patient',
        id: '123',
        name: [{ family: 'Doe', given: ['John'] }],
      };

      expect(() => service.validateResource(patient)).not.toThrow();
    });

    it('should throw for missing resourceType', () => {
      const resource = { id: '123' };

      expect(() => service.validateResource(resource)).toThrow(FhirMappingException);
    });

    it('should throw for missing id', () => {
      const resource = { resourceType: 'Patient' };

      expect(() => service.validateResource(resource)).toThrow(FhirMappingException);
    });

    it('should validate DocumentReference', () => {
      const doc = {
        resourceType: 'DocumentReference',
        id: '456',
        status: 'current',
        subject: { reference: 'Patient/123' },
      };

      expect(() => service.validateResource(doc)).not.toThrow();
    });

    it('should validate Provenance', () => {
      const provenance = {
        resourceType: 'Provenance',
        id: '789',
        target: [{ reference: 'Patient/123' }],
        recorded: '2024-01-01T00:00:00Z',
      };

      expect(() => service.validateResource(provenance)).not.toThrow();
    });

    it('should validate Consent', () => {
      const consent = {
        resourceType: 'Consent',
        id: '999',
        status: 'active',
        patient: { reference: 'Patient/123' },
      };

      expect(() => service.validateResource(consent)).not.toThrow();
    });
  });
});
