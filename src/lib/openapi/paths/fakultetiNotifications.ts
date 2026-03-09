export const fakultetiAndNotificationsPaths = {
  '/api/fakulteti': {
    get: {
      tags: ['Fakulteti'],
      summary: 'Lista fakulteta',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Fakulteti',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fakulteti'],
                properties: {
                  fakulteti: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FakultetBasic' },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedText' },
      },
    },
  },
  '/api/notifications/groups': {
    get: {
      tags: ['Notifikacije'],
      summary: 'Grupe notifikacija (admin)',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Grupe notifikacija',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groups'],
                properties: {
                  groups: {
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
  '/api/notifications/by-group': {
    get: {
      tags: ['Notifikacije'],
      summary: 'Notifikacije po grupi (admin)',
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'groupId',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Notifikacije',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['notifications'],
                properties: {
                  notifications: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/GenericEntity' },
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
  '/api/notifications/student': {
    get: {
      tags: ['Notifikacije'],
      summary: 'Notifikacije za prijavljenog studenta',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Lista notifikacija',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['notifications'],
                properties: {
                  notifications: {
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
  '/api/notifications/create': {
    post: {
      tags: ['Notifikacije'],
      summary: 'Kreiranje notifikacije (admin)',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['grupaNotifikacijaId', 'naslov', 'sadrzaj'],
              properties: {
                grupaNotifikacijaId: { type: 'integer' },
                naslov: { type: 'string' },
                sadrzaj: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Notifikacija kreirana',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['notification'],
                properties: {
                  notification: { $ref: '#/components/schemas/GenericEntity' },
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
