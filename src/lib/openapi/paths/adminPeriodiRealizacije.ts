export const adminPeriodiRealizacijePaths = {
  '/api/admin/periodi-prijava/active': {
    get: {
      tags: ['Admin'],
      summary: 'Aktivni periodi biranja predmeta',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Aktivni periodi',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['periods'],
                properties: {
                  periods: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PeriodZaBiranje' },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedText' },
        403: { $ref: '#/components/responses/ForbiddenText' },
        500: { $ref: '#/components/responses/ServerErrorText' },
      },
    },
  },
  '/api/admin/periodi-prijava/create': {
    post: {
      tags: ['Admin'],
      summary: 'Kreiranje perioda za biranje predmeta',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fakultetId', 'akademskaGodina', 'nivoStudija', 'pocetakPerioda', 'krajPerioda'],
              properties: {
                fakultetId: { type: 'integer' },
                akademskaGodina: { type: 'string' },
                nivoStudija: { type: 'string' },
                pocetakPerioda: { type: 'string', format: 'date-time' },
                krajPerioda: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Period kreiran',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['period'],
                properties: {
                  period: { $ref: '#/components/schemas/PeriodZaBiranje' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequestJson' },
        401: { $ref: '#/components/responses/UnauthorizedText' },
        403: { $ref: '#/components/responses/ForbiddenText' },
        500: { $ref: '#/components/responses/ServerErrorText' },
      },
    },
  },
  '/api/admin/periodi-prijava/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'Izmena kraja perioda za biranje',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['krajPerioda'],
              properties: {
                krajPerioda: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Azuriran period',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PeriodZaBiranje' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequestText' },
        401: { $ref: '#/components/responses/UnauthorizedText' },
        403: { $ref: '#/components/responses/ForbiddenText' },
        404: { $ref: '#/components/responses/NotFoundText' },
        500: { $ref: '#/components/responses/ServerErrorText' },
      },
    },
  },
  '/api/admin/realizacije/options': {
    get: {
      tags: ['Admin'],
      summary: 'Opcije za kreiranje realizacija rokova/nedelja',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Dostupne opcije',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fakulteti', 'klaseIspitnihRokova', 'klaseKolokvijumskihNedelja'],
                properties: {
                  fakulteti: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FakultetBasic' },
                  },
                  klaseIspitnihRokova: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/RealizationClass' },
                  },
                  klaseKolokvijumskihNedelja: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/RealizationClass' },
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
  '/api/admin/realizacije/create': {
    post: {
      tags: ['Admin'],
      summary: 'Kreiranje realizacije ispitnog roka ili kolokvijumske nedelje',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'tip',
                'fakultetId',
                'klasaId',
                'akademskaGodina',
                'pocetak',
                'kraj',
                'pocetakPrijavljivanja',
                'krajPrijavljivanja',
              ],
              properties: {
                tip: {
                  type: 'string',
                  enum: ['ISPITNI_ROK', 'KOLOKVIJUMSKA_NEDELJA'],
                },
                fakultetId: { type: 'integer' },
                klasaId: { type: 'integer' },
                akademskaGodina: { type: 'string' },
                pocetak: { type: 'string', format: 'date-time' },
                kraj: { type: 'string', format: 'date-time' },
                pocetakPrijavljivanja: { type: 'string', format: 'date-time' },
                krajPrijavljivanja: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Realizacija kreirana',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['realization'],
                properties: {
                  realization: { $ref: '#/components/schemas/GenericEntity' },
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
} as const;
