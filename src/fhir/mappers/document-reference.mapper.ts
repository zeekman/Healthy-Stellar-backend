import { Injectable } from '@nestjs/common';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';
import { FhirMappingException } from '../exceptions/fhir-mapping.exception';

@Injectable()
export class DocumentReferenceMapper {
  toFhir(record: MedicalRecord): fhir4.DocumentReference {
    const errors = [];

    if (!record.id) errors.push({ field: 'id', message: 'Record ID is required' });
    if (!record.patientId) errors.push({ field: 'patientId', message: 'Patient ID is required' });

    if (errors.length > 0) {
      throw new FhirMappingException('DocumentReference', errors);
    }

    return {
      resourceType: 'DocumentReference',
      id: record.id,
      status: this.mapStatus(record.status),
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: this.mapRecordType(record.recordType),
            display: record.recordType,
          },
        ],
      },
      subject: {
        reference: `Patient/${record.patientId}`,
      },
      date: record.recordDate?.toISOString(),
      author: record.providerId
        ? [
            {
              reference: `Practitioner/${record.providerId}`,
            },
          ]
        : undefined,
      description: record.description,
      content: [
        {
          attachment: {
            title: record.title,
            creation: record.createdAt?.toISOString(),
          },
        },
      ],
      meta: {
        lastUpdated: record.updatedAt?.toISOString(),
        versionId: record.version?.toString(),
      },
    };
  }

  fromFhir(doc: fhir4.DocumentReference): Partial<MedicalRecord> {
    const errors = [];

    if (!doc.id) errors.push({ field: 'id', message: 'DocumentReference ID is required' });
    if (!doc.subject?.reference) errors.push({ field: 'subject', message: 'Subject reference is required' });

    if (errors.length > 0) {
      throw new FhirMappingException('DocumentReference', errors);
    }

    const patientId = doc.subject.reference.replace('Patient/', '');
    const providerId = doc.author?.[0]?.reference?.replace('Practitioner/', '');

    return {
      id: doc.id,
      patientId,
      providerId,
      title: doc.content?.[0]?.attachment?.title,
      description: doc.description,
      recordDate: doc.date ? new Date(doc.date) : undefined,
      status: this.mapStatusFromFhir(doc.status),
      recordType: this.mapRecordTypeFromFhir(doc.type?.coding?.[0]?.display),
    } as any;
  }

  private mapStatus(status: string): 'current' | 'superseded' | 'entered-in-error' {
    switch (status) {
      case 'ACTIVE':
        return 'current';
      case 'ARCHIVED':
        return 'superseded';
      case 'DELETED':
        return 'entered-in-error';
      default:
        return 'current';
    }
  }

  private mapStatusFromFhir(status: string): string {
    switch (status) {
      case 'current':
        return 'ACTIVE';
      case 'superseded':
        return 'ARCHIVED';
      case 'entered-in-error':
        return 'DELETED';
      default:
        return 'ACTIVE';
    }
  }

  private mapRecordType(type: string): string {
    const typeMap: Record<string, string> = {
      CONSULTATION: '11488-4',
      DIAGNOSIS: '29308-4',
      TREATMENT: '18776-5',
      LAB_RESULT: '11502-2',
      IMAGING: '18748-4',
      PRESCRIPTION: '57833-6',
      SURGERY: '11504-8',
      EMERGENCY: '34133-9',
      OTHER: '34133-9',
    };
    return typeMap[type] || '34133-9';
  }

  private mapRecordTypeFromFhir(display?: string): string {
    return display || 'OTHER';
  }
}
