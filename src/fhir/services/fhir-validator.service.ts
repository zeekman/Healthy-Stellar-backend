import { Injectable, Logger } from '@nestjs/common';
import { FhirMappingException } from '../exceptions/fhir-mapping.exception';

@Injectable()
export class FhirValidatorService {
  private readonly logger = new Logger(FhirValidatorService.name);

  validateResource(resource: any): void {
    const errors = [];

    if (!resource.resourceType) {
      errors.push({ field: 'resourceType', message: 'Resource type is required' });
    }

    if (!resource.id) {
      errors.push({ field: 'id', message: 'Resource ID is required' });
    }

    switch (resource.resourceType) {
      case 'Patient':
        this.validatePatient(resource, errors);
        break;
      case 'DocumentReference':
        this.validateDocumentReference(resource, errors);
        break;
      case 'Provenance':
        this.validateProvenance(resource, errors);
        break;
      case 'Consent':
        this.validateConsent(resource, errors);
        break;
    }

    if (errors.length > 0) {
      throw new FhirMappingException(resource.resourceType, errors);
    }

    this.logger.log(`Validated ${resource.resourceType}/${resource.id}`);
  }

  private validatePatient(patient: fhir4.Patient, errors: any[]): void {
    if (!patient.name || patient.name.length === 0) {
      errors.push({ field: 'name', message: 'Patient name is required' });
    }
  }

  private validateDocumentReference(doc: fhir4.DocumentReference, errors: any[]): void {
    if (!doc.status) {
      errors.push({ field: 'status', message: 'Document status is required' });
    }
    if (!doc.subject) {
      errors.push({ field: 'subject', message: 'Document subject is required' });
    }
  }

  private validateProvenance(provenance: fhir4.Provenance, errors: any[]): void {
    if (!provenance.target || provenance.target.length === 0) {
      errors.push({ field: 'target', message: 'Provenance target is required' });
    }
    if (!provenance.recorded) {
      errors.push({ field: 'recorded', message: 'Recorded timestamp is required' });
    }
  }

  private validateConsent(consent: fhir4.Consent, errors: any[]): void {
    if (!consent.status) {
      errors.push({ field: 'status', message: 'Consent status is required' });
    }
    if (!consent.patient) {
      errors.push({ field: 'patient', message: 'Patient reference is required' });
    }
  }
}
