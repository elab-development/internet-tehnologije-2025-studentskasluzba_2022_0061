export const authPaths = {
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Prijava korisnika',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Uspesna prijava',
          headers: {
            'Set-Cookie': {
              schema: { type: 'string' },
              description: 'JWT token cookie.',
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OkResponse' },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequestJson' },
        401: { $ref: '#/components/responses/UnauthorizedJson' },
        500: { $ref: '#/components/responses/ServerErrorJson' },
      },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Odjava korisnika',
      responses: {
        200: {
          description: 'Uspesna odjava',
          headers: {
            'Set-Cookie': {
              schema: { type: 'string' },
              description: 'Brise JWT token cookie.',
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OkResponse' },
            },
          },
        },
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Trenutno prijavljeni korisnik',
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Trenutni korisnik',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user'],
                properties: {
                  user: { $ref: '#/components/schemas/AuthUser' },
                },
              },
            },
          },
        },
        401: {
          description: 'Nije prijavljen ili token nije vazeci',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user'],
                properties: {
                  user: { type: 'null' },
                },
              },
            },
          },
        },
        500: {
          description: 'Serverska greska',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user'],
                properties: {
                  user: { type: 'null' },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
