import { Test, TestingModule } from '@nestjs/testing';
import { PatientMapper } from '../../src/fhir/mappers/patient.mapper';
import { FhirMappingException } from '../../src/fhir/exceptions/fhir-mapping.exception';

describe('PatientMapper', () => {
  let mapper: PatientMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientMapper],
    }).compile();

    mapper = module.get<PatientMapper>(PatientMapper);
  });

  describe('toFhir', () => {
    it('should map User to FHIR Patient', () => {
      const user = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'ACTIVE',
        updatedAt: new Date('2024-01-01'),
      };

      const result = mapper.toFhir(user as any);

      expect(result.resourceType).toBe('Patient');
      expect(result.id).toBe('123');
      expect(result.active).toBe(true);
      expect(result.name[0].family).toBe('Doe');
      expect(result.name[0].given[0]).toBe('John');
      expect(result.telecom[0].value).toBe('john@example.com');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const user = { id: '123' };

      expect(() => mapper.toFhir(user as any)).toThrow(FhirMappingException);
    });

    it('should handle optional fields', () => {
      const user = {
        id: '123',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'INACTIVE',
      };

      const result = mapper.toFhir(user as any);

      expect(result.telecom).toBeUndefined();
      expect(result.active).toBe(false);
    });
  });

  describe('fromFhir', () => {
    it('should map FHIR Patient to User', () => {
      const patient: fhir4.Patient = {
        resourceType: 'Patient',
        id: '123',
        active: true,
        name: [{ family: 'Doe', given: ['John'] }],
        telecom: [{ system: 'email', value: 'john@example.com' }],
      };

      const result = mapper.fromFhir(patient);

      expect(result.id).toBe('123');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw FhirMappingException for missing required fields', () => {
      const patient: any = { resourceType: 'Patient' };

      expect(() => mapper.fromFhir(patient)).toThrow(FhirMappingException);
    });
  });
});
