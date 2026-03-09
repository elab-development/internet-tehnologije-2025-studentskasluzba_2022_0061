export const molbePaths = {
  '/api/molbe/all': {
    get: {
      tags: ['Molbe'],
      summary: 'Sve molbe (admin)',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Lista molbi',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['molbe'],
                properties: {
                  molbe: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/GenericEntity' },
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
  '/api/molbe/create': {
    post: {
      tags: ['Molbe'],
      summary: 'Kreiranje molbe (student)',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sadrzaj'],
              properties: {
                sadrzaj: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Molba kreirana',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['molba'],
                properties: {
                  molba: { $ref: '#/components/schemas/GenericEntity' },
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
  '/api/molbe/student': {
    get: {
      tags: ['Molbe'],
      summary: 'Molbe prijavljenog studenta',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Lista molbi',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['molbe'],
                properties: {
                  molbe: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/GenericEntity' },
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
  '/api/molbe/{id}': {
    get: {
      tags: ['Molbe'],
      summary: 'Molba po ID-u (admin)',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Molba',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['molba'],
                properties: {
                  molba: { $ref: '#/components/schemas/GenericEntity' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedJson' },
        403: { $ref: '#/components/responses/ForbiddenJson' },
        404: { $ref: '#/components/responses/NotFoundJson' },
        500: { $ref: '#/components/responses/ServerErrorJson' },
      },
    },
  },
  '/api/molbe/{id}/answer': {
    post: {
      tags: ['Molbe'],
      summary: 'Odgovor na molbu (admin)',
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
              required: ['status', 'napomenaOdgovora'],
              properties: {
                status: { type: 'string' },
                napomenaOdgovora: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Azurirana molba',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['molba'],
                properties: {
                  molba: { $ref: '#/components/schemas/GenericEntity' },
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
