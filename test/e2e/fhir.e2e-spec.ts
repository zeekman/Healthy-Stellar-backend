import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { FhirModule } from '../../src/fhir/fhir.module';

describe('FHIR Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FhirModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /fhir/convert/:resourceType', () => {
    it('should convert User to Patient', () => {
      const user = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'ACTIVE',
      };

      return request(app.getHttpServer())
        .post('/fhir/convert/Patient')
        .send(user)
        .expect(201)
        .then((response) => {
          expect(response.body.resourceType).toBe('Patient');
          expect(response.body.id).toBe('123');
          expect(response.body.name[0].family).toBe('Doe');
        });
    });

    it('should return 400 for invalid mapping', () => {
      return request(app.getHttpServer())
        .post('/fhir/convert/Patient')
        .send({ id: '123' })
        .expect(400);
    });
  });

  describe('POST /fhir/import', () => {
    it('should import Patient to User', () => {
      const patient = {
        resourceType: 'Patient',
        id: '123',
        active: true,
        name: [{ family: 'Doe', given: ['John'] }],
        telecom: [{ system: 'email', value: 'john@example.com' }],
      };

      return request(app.getHttpServer())
        .post('/fhir/import')
        .send(patient)
        .expect(201)
        .then((response) => {
          expect(response.body.id).toBe('123');
          expect(response.body.firstName).toBe('John');
          expect(response.body.lastName).toBe('Doe');
        });
    });
  });
});
