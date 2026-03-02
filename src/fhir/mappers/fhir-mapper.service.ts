import { Injectable } from '@nestjs/common';
import { PatientMapper } from './patient.mapper';
import { DocumentReferenceMapper } from './document-reference.mapper';
import { ProvenanceMapper } from './provenance.mapper';
import { ConsentMapper } from './consent.mapper';

@Injectable()
export class FhirMapperService {
  constructor(
    private readonly patientMapper: PatientMapper,
    private readonly documentReferenceMapper: DocumentReferenceMapper,
    private readonly provenanceMapper: ProvenanceMapper,
    private readonly consentMapper: ConsentMapper,
  ) {}

  mapPatientToFhir(user: any): fhir4.Patient {
    return this.patientMapper.toFhir(user);
  }

  mapPatientFromFhir(patient: fhir4.Patient): any {
    return this.patientMapper.fromFhir(patient);
  }

  mapDocumentReferenceToFhir(record: any): fhir4.DocumentReference {
    return this.documentReferenceMapper.toFhir(record);
  }

  mapDocumentReferenceFromFhir(doc: fhir4.DocumentReference): any {
    return this.documentReferenceMapper.fromFhir(doc);
  }

  mapProvenanceToFhir(audit: any): fhir4.Provenance {
    return this.provenanceMapper.toFhir(audit);
  }

  mapProvenanceFromFhir(provenance: fhir4.Provenance): any {
    return this.provenanceMapper.fromFhir(provenance);
  }

  mapConsentToFhir(grant: any): fhir4.Consent {
    return this.consentMapper.toFhir(grant);
  }

  mapConsentFromFhir(consent: fhir4.Consent): any {
    return this.consentMapper.fromFhir(consent);
  }
}
