import { Injectable } from '@nestjs/common';
import { AuditLogEntity } from '../../common/audit/audit-log.entity';
import { FhirMappingException } from '../exceptions/fhir-mapping.exception';

@Injectable()
export class ProvenanceMapper {
  toFhir(audit: AuditLogEntity): fhir4.Provenance {
    const errors = [];

    if (!audit.id) errors.push({ field: 'id', message: 'Audit ID is required' });
    if (!audit.entityId) errors.push({ field: 'entityId', message: 'Entity ID is required' });

    if (errors.length > 0) {
      throw new FhirMappingException('Provenance', errors);
    }

    return {
      resourceType: 'Provenance',
      id: audit.id,
      target: [
        {
          reference: `${audit.entity}/${audit.entityId}`,
        },
      ],
      recorded: audit.timestamp?.toISOString() || new Date().toISOString(),
      agent: [
        {
          who: audit.userId
            ? {
                reference: `Practitioner/${audit.userId}`,
              }
            : {
                display: 'Unknown',
              },
        },
      ],
      activity: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
            code: this.mapAction(audit.action),
            display: audit.action,
          },
        ],
      },
      reason: audit.description
        ? [
            {
              text: audit.description,
            },
          ]
        : undefined,
    };
  }

  fromFhir(provenance: fhir4.Provenance): Partial<AuditLogEntity> {
    const errors = [];

    if (!provenance.id) errors.push({ field: 'id', message: 'Provenance ID is required' });
    if (!provenance.target?.[0]) errors.push({ field: 'target', message: 'Target is required' });

    if (errors.length > 0) {
      throw new FhirMappingException('Provenance', errors);
    }

    const target = provenance.target[0].reference?.split('/');
    const userId = provenance.agent?.[0]?.who?.reference?.replace('Practitioner/', '');

    return {
      id: provenance.id,
      entity: target?.[0] || '',
      entityId: target?.[1] || '',
      userId,
      action: provenance.activity?.coding?.[0]?.display || 'UNKNOWN',
      description: provenance.reason?.[0]?.text,
      timestamp: provenance.recorded ? new Date(provenance.recorded) : new Date(),
      severity: 'MEDIUM',
    };
  }

  private mapAction(action: string): string {
    const actionMap: Record<string, string> = {
      DATA_ACCESS: 'READ',
      USER_CREATED: 'CREATE',
      PASSWORD_CHANGE: 'UPDATE',
      DATA_EXPORT: 'READ',
      LOGIN: 'READ',
      LOGOUT: 'READ',
    };
    return actionMap[action] || 'READ';
  }
}
