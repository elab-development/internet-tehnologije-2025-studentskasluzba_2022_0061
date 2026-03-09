export const adminUpisAnalitikaPaths = {
  '/api/admin/upis-ocena': {
    get: {
      tags: ['Admin'],
      summary: 'Podaci za masovni upis ocena',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Aktivne realizacije i predmeti',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['realizations', 'subjects'],
                properties: {
                  realizations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ActiveExamRealization' },
                  },
                  subjects: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/GradeUploadSubject' },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedJson' },
        403: { $ref: '#/components/responses/ForbiddenJson' },
        500: { $ref: '#/components/responses/ServerErrorJson' },
      },
    },
    post: {
      tags: ['Admin'],
      summary: 'Masovni upis ocena iz CSV/XLS/XLSX fajla',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['realizationId', 'izvodjenjeKursaId', 'file'],
              properties: {
                realizationId: { type: 'integer' },
                izvodjenjeKursaId: { type: 'integer' },
                file: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Upis zavrsen',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['processedRows', 'updatedRows', 'invalidRows', 'missingStudents', 'missingPrijava'],
                properties: {
                  processedRows: { type: 'integer' },
                  updatedRows: { type: 'integer' },
                  invalidRows: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['rowNumber', 'reason'],
                      properties: {
                        rowNumber: { type: 'integer' },
                        reason: { type: 'string' },
                      },
                    },
                  },
                  missingStudents: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  missingPrijava: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequestJson' },
        401: { $ref: '#/components/responses/UnauthorizedJson' },
        403: { $ref: '#/components/responses/ForbiddenJson' },
        500: { $ref: '#/components/responses/ServerErrorJson' },
      },
    },
  },
  '/api/admin/analitika/nivoi': {
    get: {
      tags: ['Analitika'],
      summary: 'Broj studenata po nivou studija (admin)',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Statistika po nivoima',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['totalStudents', 'items'],
                properties: {
                  totalStudents: { type: 'integer' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['level', 'label', 'count'],
                      properties: {
                        level: {
                          type: 'string',
                          enum: ['OSNOVNE', 'MASTER', 'DOKTORSKE', 'SPECIJALISTICKE'],
                        },
                        label: { type: 'string' },
                        count: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedJson' },
        403: { $ref: '#/components/responses/ForbiddenJson' },
        500: { $ref: '#/components/responses/ServerErrorJson' },
      },
    },
  },
} as const;
