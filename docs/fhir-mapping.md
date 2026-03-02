# FHIR R4 Mapping Documentation

## Overview
This document describes the bidirectional mapping between internal entities and FHIR R4 resources.

## Patient ↔ User Entity

### Mapping Table

| FHIR Patient Field | User Entity Field | Direction | Notes |
|-------------------|-------------------|-----------|-------|
| id | id | Both | UUID identifier |
| active | status | Both | ACTIVE → true, others → false |
| name[0].family | lastName | Both | Required field |
| name[0].given[0] | firstName | Both | Required field |
| telecom[0].value | email | Both | Email contact |
| telecom[0].system | - | To FHIR | Always "email" |
| meta.lastUpdated | updatedAt | Both | ISO 8601 timestamp |

### Mapping Decisions
- User status maps to Patient.active: ACTIVE=true, all others=false
- Only email telecom is supported currently
- Name uses official use type
- Optional fields: telecom (if no email)

## DocumentReference ↔ Medical Record Entity

### Mapping Table

| FHIR DocumentReference Field | MedicalRecord Field | Direction | Notes |
|-----------------------------|---------------------|-----------|-------|
| id | id | Both | UUID identifier |
| status | status | Both | ACTIVE→current, ARCHIVED→superseded, DELETED→entered-in-error |
| type.coding[0].code | recordType | Both | LOINC codes mapped to record types |
| subject.reference | patientId | Both | Patient/{id} format |
| author[0].reference | providerId | Both | Practitioner/{id} format |
| description | description | Both | Free text |
| content[0].attachment.title | title | Both | Document title |
| date | recordDate | Both | ISO 8601 timestamp |
| meta.versionId | version | Both | Version number |
| meta.lastUpdated | updatedAt | Both | ISO 8601 timestamp |

### Mapping Decisions
- Record type to LOINC code mapping:
  - CONSULTATION → 11488-4
  - DIAGNOSIS → 29308-4
  - TREATMENT → 18776-5
  - LAB_RESULT → 11502-2
  - IMAGING → 18748-4
  - PRESCRIPTION → 57833-6
  - SURGERY → 11504-8
  - EMERGENCY → 34133-9
  - OTHER → 34133-9
- Status mapping preserves workflow state
- Optional fields: author, description, date

## Provenance ↔ Audit Log Entity

### Mapping Table

| FHIR Provenance Field | AuditLog Field | Direction | Notes |
|----------------------|----------------|-----------|-------|
| id | id | Both | UUID identifier |
| target[0].reference | entity + entityId | Both | {entity}/{entityId} format |
| recorded | timestamp | Both | ISO 8601 timestamp |
| agent[0].who.reference | userId | Both | Practitioner/{id} format |
| activity.coding[0].display | action | Both | Action type |
| activity.coding[0].code | action | To FHIR | Mapped to CRUD operations |
| reason[0].text | description | Both | Free text description |

### Mapping Decisions
- Action to CRUD mapping:
  - DATA_ACCESS → READ
  - USER_CREATED → CREATE
  - PASSWORD_CHANGE → UPDATE
  - DATA_EXPORT → READ
  - LOGIN/LOGOUT → READ
- Target reference combines entity type and ID
- Severity always set to MEDIUM on import
- Optional fields: reason, agent.who

## Consent ↔ Access Grant Entity

### Mapping Table

| FHIR Consent Field | AccessGrant Field | Direction | Notes |
|-------------------|-------------------|-----------|-------|
| id | id | Both | UUID identifier |
| status | status | Both | ACTIVE→active, REVOKED/EXPIRED→inactive |
| patient.reference | patientId | Both | Patient/{id} format |
| dateTime | createdAt | Both | ISO 8601 timestamp |
| provision.actor[0].reference.reference | granteeId | Both | Practitioner/{id} format |
| provision.data[].reference.reference | recordIds | Both | Array of DocumentReference/{id} |
| provision.period.start | createdAt | To FHIR | Grant start time |
| provision.period.end | expiresAt | Both | Grant expiration |
| provision.action | accessLevel | Both | READ or READ_WRITE |

### Mapping Decisions
- Access level to actions:
  - READ → [access]
  - READ_WRITE → [access, correct]
- Status mapping: ACTIVE→active, REVOKED/EXPIRED→inactive
- Scope always set to "patient-privacy"
- Category always set to LOINC 59284-0 (Patient Consent)
- Provision type always "permit"
- Actor role always IRCP (information recipient)
- Optional fields: provision.period.end

## Validation Rules

### Patient
- Required: id, name[0].family, name[0].given[0]
- Optional: active, telecom, meta

### DocumentReference
- Required: id, status, subject
- Optional: type, author, description, content, date, meta

### Provenance
- Required: id, target[0], recorded
- Optional: agent, activity, reason

### Consent
- Required: id, status, patient
- Optional: dateTime, provision (all fields)

## Error Handling

All mapping errors throw `FhirMappingException` with:
- resourceType: The FHIR resource type
- fieldErrors: Array of { field, message, value? }

Example:
```json
{
  "statusCode": 400,
  "message": "FHIR mapping failed for Patient",
  "errors": [
    {
      "field": "firstName",
      "message": "First name is required"
    }
  ]
}
```

## Usage Examples

### Convert to FHIR
```typescript
const fhirPatient = fhirService.convertToFhir('Patient', userEntity);
```

### Import from FHIR
```typescript
const userEntity = fhirService.convertFromFhir(fhirPatient);
```

## Standards Compliance

- FHIR R4 (v4.0.1)
- LOINC for document types
- HL7 terminology for consent and provenance
