import { HttpException, HttpStatus } from '@nestjs/common';

export interface FieldError {
  field: string;
  message: string;
  value?: any;
}

export class FhirMappingException extends HttpException {
  constructor(
    public readonly resourceType: string,
    public readonly fieldErrors: FieldError[],
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `FHIR mapping failed for ${resourceType}`,
        errors: fieldErrors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
