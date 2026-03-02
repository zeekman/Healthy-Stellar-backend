import { Injectable } from '@nestjs/common';
import { AccessGrant } from '../../access-control/entities/access-grant.entity';
import { FhirMappingException } from '../exceptions/fhir-mapping.exception';

@Injectable()
export class ConsentMapper {
  toFhir(grant: AccessGrant): fhir4.Consent {
    const errors = [];

    if (!grant.id) errors.push({ field: 'id', message: 'Grant ID is required' });
    if (!grant.patientId) errors.push({ field: 'patientId', message: 'Patient ID is required' });
    if (!grant.granteeId) errors.push({ field: 'granteeId', message: 'Grantee ID is required' });

    if (errors.length > 0) {
      throw new FhirMappingException('Consent', errors);
    }

    return {
      resourceType: 'Consent',
      id: grant.id,
      status: this.mapStatus(grant.status),
      scope: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/consentscope',
            code: 'patient-privacy',
            display: 'Privacy Consent',
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system: 'http://loinc.org',
              code: '59284-0',
              display: 'Patient Consent',
            },
          ],
        },
      ],
      patient: {
        reference: `Patient/${grant.patientId}`,
      },
      dateTime: grant.createdAt?.toISOString(),
      performer: [
        {
          reference: `Patient/${grant.patientId}`,
        },
      ],
      provision: {
        type: 'permit',
        period: {
          start: grant.createdAt?.toISOString(),
          end: grant.expiresAt?.toISOString(),
        },
        actor: [
          {
            role: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                  code: 'IRCP',
                  display: 'information recipient',
                },
              ],
            },
            reference: {
              reference: `Practitioner/${grant.granteeId}`,
            },
          },
        ],
        action: this.mapActions(grant.accessLevel),
        data: grant.recordIds.map((id) => ({
          meaning: 'instance',
          reference: {
            reference: `DocumentReference/${id}`,
          },
        })),
      },
    };
  }

  fromFhir(consent: fhir4.Consent): Partial<AccessGrant> {
    const errors = [];

    if (!consent.id) errors.push({ field: 'id', message: 'Consent ID is required' });
    if (!consent.patient?.reference) errors.push({ field: 'patient', message: 'Patient reference is required' });

    if (errors.length > 0) {
      throw new FhirMappingException('Consent', errors);
    }

    const patientId = consent.patient.reference.replace('Patient/', '');
    const granteeId = consent.provision?.actor?.[0]?.reference?.reference?.replace('Practitioner/', '') || '';
    const recordIds = consent.provision?.data?.map((d) => d.reference?.reference?.replace('DocumentReference/', '') || '') || [];

    return {
      id: consent.id,
      patientId,
      granteeId,
      recordIds,
      status: this.mapStatusFromFhir(consent.status),
      accessLevel: this.mapAccessLevel(consent.provision?.action),
      createdAt: consent.dateTime ? new Date(consent.dateTime) : undefined,
      expiresAt: consent.provision?.period?.end ? new Date(consent.provision.period.end) : undefined,
    } as any;
  }

  private mapStatus(status: string): 'draft' | 'proposed' | 'active' | 'rejected' | 'inactive' | 'entered-in-error' {
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'REVOKED':
        return 'inactive';
      case 'EXPIRED':
        return 'inactive';
      default:
        return 'active';
    }
  }

  private mapStatusFromFhir(status: string): string {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'inactive':
        return 'REVOKED';
      default:
        return 'ACTIVE';
    }
  }

  private mapActions(accessLevel: string): fhir4.CodeableConcept[] {
    const actions: fhir4.CodeableConcept[] = [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/consentaction',
            code: 'access',
            display: 'Access',
          },
        ],
      },
    ];

    if (accessLevel === 'READ_WRITE') {
      actions.push({
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/consentaction',
            code: 'correct',
            display: 'Correct',
          },
        ],
      });
    }

    return actions;
  }

  private mapAccessLevel(actions?: fhir4.CodeableConcept[]): string {
    const hasCorrect = actions?.some((a) => a.coding?.some((c) => c.code === 'correct'));
    return hasCorrect ? 'READ_WRITE' : 'READ';
  }
}
