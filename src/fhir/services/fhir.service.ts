import { Injectable } from '@nestjs/common';
import { FhirMapperService } from '../mappers/fhir-mapper.service';
import { FhirValidatorService } from './fhir-validator.service';

@Injectable()
export class FhirService {
  constructor(
    private readonly mapperService: FhirMapperService,
    private readonly validatorService: FhirValidatorService,
  ) {}

  convertToFhir(resourceType: string, entity: any): any {
    let resource: any;

    switch (resourceType) {
      case 'Patient':
        resource = this.mapperService.mapPatientToFhir(entity);
        break;
      case 'DocumentReference':
        resource = this.mapperService.mapDocumentReferenceToFhir(entity);
        break;
      case 'Provenance':
        resource = this.mapperService.mapProvenanceToFhir(entity);
        break;
      case 'Consent':
        resource = this.mapperService.mapConsentToFhir(entity);
        break;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }

    this.validatorService.validateResource(resource);
    return resource;
  }

  convertFromFhir(resource: any): any {
    this.validatorService.validateResource(resource);

    switch (resource.resourceType) {
      case 'Patient':
        return this.mapperService.mapPatientFromFhir(resource);
      case 'DocumentReference':
        return this.mapperService.mapDocumentReferenceFromFhir(resource);
      case 'Provenance':
        return this.mapperService.mapProvenanceFromFhir(resource);
      case 'Consent':
        return this.mapperService.mapConsentFromFhir(resource);
      default:
        throw new Error(`Unsupported resource type: ${resource.resourceType}`);
    }
  }
}
