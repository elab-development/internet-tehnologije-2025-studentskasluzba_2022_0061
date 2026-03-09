export const studentBiranjePaths = {
  '/api/student/biranje-predmeta/check': {
    get: {
      tags: ['Student'],
      summary: 'Provera da li student moze da bira predmete',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Rezultat provere',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AllowedResponse' },
            },
          },
        },
        401: {
          description: 'Nije prijavljen',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AllowedResponse' },
            },
          },
        },
        403: {
          description: 'Nije student',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AllowedResponse' },
            },
          },
        },
        500: {
          description: 'Serverska greska',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AllowedResponse' },
            },
          },
        },
      },
    },
  },
  '/api/student/predmeti': {
    get: {
      tags: ['Student'],
      summary: 'Kontekst za biranje predmeta',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Kontekst biranja predmeta',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StudentPredmetiGetResponse' },
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
      summary: 'Cuvanje izabranih predmeta',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['selectedCourseIds'],
              properties: {
                selectedCourseIds: {
                  type: 'array',
                  items: { type: 'integer' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Sacuvano',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['savedCourseIds', 'totalEspb'],
                properties: {
                  savedCourseIds: {
                    type: 'array',
                    items: { type: 'integer' },
                  },
                  totalEspb: { type: 'integer' },
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
  '/api/student/moji-predmeti': {
    get: {
      tags: ['Student'],
      summary: 'Pregled odabranih predmeta studenta',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Lista odabranih predmeta i uspeh',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MyCoursesResponse' },
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
} as const;
