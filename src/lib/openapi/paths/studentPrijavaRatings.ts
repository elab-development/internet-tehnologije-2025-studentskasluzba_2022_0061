export const studentPrijavaRatingsPaths = {
  '/api/student/prijava/options': {
    get: {
      tags: ['Student'],
      summary: 'Opcije za prijavu ispita/kolokvijuma',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Aktivne realizacije i dostupni predmeti',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PrijavaOptionsResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedStudentJson' },
        403: { $ref: '#/components/responses/ForbiddenStudentJson' },
        404: { $ref: '#/components/responses/NotFoundStudentJson' },
        500: { $ref: '#/components/responses/ServerErrorStudentJson' },
      },
    },
  },
  '/api/student/prijava/create': {
    post: {
      tags: ['Student'],
      summary: 'Prijava ispita ili kolokvijuma',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tip', 'realizationId', 'selectedCourseIds'],
              properties: {
                tip: {
                  type: 'string',
                  enum: ['ISPITNI_ROK', 'KOLOKVIJUMSKA_NEDELJA'],
                },
                realizationId: { type: 'integer' },
                selectedCourseIds: {
                  type: 'array',
                  items: { type: 'integer' },
                },
                sendEmailConfirmation: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Prijava sacuvana',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ok', 'emailSent'],
                properties: {
                  ok: { type: 'boolean' },
                  emailSent: { type: 'boolean' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequestStudentJson' },
        401: { $ref: '#/components/responses/UnauthorizedStudentJson' },
        403: { $ref: '#/components/responses/ForbiddenStudentJson' },
        404: { $ref: '#/components/responses/NotFoundStudentJson' },
        500: { $ref: '#/components/responses/ServerErrorStudentJson' },
      },
    },
  },
  '/api/student/ocene-predmeta': {
    get: {
      tags: ['Student'],
      summary: 'Lista polozenih predmeta i postojece ocene kursa',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Polozeni predmeti sa ocenama kursa',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CourseRatingsListResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedStudentJson' },
        403: { $ref: '#/components/responses/ForbiddenStudentJson' },
        404: { $ref: '#/components/responses/NotFoundStudentJson' },
        500: { $ref: '#/components/responses/ServerErrorStudentJson' },
      },
    },
    put: {
      tags: ['Student'],
      summary: 'Cuvanje ocena kursa',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['kursId', 'ratings'],
              properties: {
                kursId: { type: 'integer' },
                ratings: { $ref: '#/components/schemas/CourseRatingsInput' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Ocene kursa uspesno sacuvane',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OkResponse' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequestStudentJson' },
        401: { $ref: '#/components/responses/UnauthorizedStudentJson' },
        403: { $ref: '#/components/responses/ForbiddenStudentJson' },
        404: { $ref: '#/components/responses/NotFoundStudentJson' },
        500: { $ref: '#/components/responses/ServerErrorStudentJson' },
      },
    },
  },
} as const;
