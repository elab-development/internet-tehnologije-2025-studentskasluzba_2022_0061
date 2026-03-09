export const openApiComponents = {
  securitySchemes: {
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'token',
    },
  },
  responses: {
    BadRequestJson: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    UnauthorizedJson: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    ForbiddenJson: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    NotFoundJson: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    ServerErrorJson: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    BadRequestText: {
      description: 'Bad request',
      content: { 'text/plain': { schema: { type: 'string' } } },
    },
    UnauthorizedText: {
      description: 'Unauthorized',
      content: { 'text/plain': { schema: { type: 'string' } } },
    },
    ForbiddenText: {
      description: 'Forbidden',
      content: { 'text/plain': { schema: { type: 'string' } } },
    },
    NotFoundText: {
      description: 'Not found',
      content: { 'text/plain': { schema: { type: 'string' } } },
    },
    ServerErrorText: {
      description: 'Server error',
      content: { 'text/plain': { schema: { type: 'string' } } },
    },
    BadRequestStudentJson: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/StudentErrorResponse' },
        },
      },
    },
    UnauthorizedStudentJson: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/StudentErrorResponse' },
        },
      },
    },
    ForbiddenStudentJson: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/StudentErrorResponse' },
        },
      },
    },
    NotFoundStudentJson: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/StudentErrorResponse' },
        },
      },
    },
    ServerErrorStudentJson: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/StudentErrorResponse' },
        },
      },
    },
  },
  schemas: {
    ErrorResponse: {
      type: 'object',
      required: ['error'],
      properties: {
        error: { type: 'string' },
      },
    },
    StudentErrorResponse: {
      type: 'object',
      required: ['error'],
      properties: {
        error: { type: 'string' },
      },
    },
    OkResponse: {
      type: 'object',
      required: ['ok'],
      properties: {
        ok: { type: 'boolean' },
      },
    },
    GenericEntity: {
      type: 'object',
      additionalProperties: true,
    },
    AuthUser: {
      type: 'object',
      required: ['id', 'email', 'ime', 'prezime', 'tip'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
        ime: { type: 'string' },
        prezime: { type: 'string' },
        tip: { type: 'string' },
      },
    },
    FakultetBasic: {
      type: 'object',
      required: ['id', 'naziv'],
      properties: {
        id: { type: 'integer' },
        naziv: { type: 'string' },
      },
    },
    RealizationClass: {
      type: 'object',
      required: ['id', 'naziv', 'sifra', 'fakultetId'],
      properties: {
        id: { type: 'integer' },
        naziv: { type: 'string' },
        sifra: { type: 'string' },
        fakultetId: { type: 'integer' },
      },
    },
    AllowedResponse: {
      type: 'object',
      required: ['allowed'],
      properties: {
        allowed: { type: 'boolean' },
      },
    },
    PeriodZaBiranje: {
      type: 'object',
      required: [
        'id',
        'fakultetId',
        'akademskaGodina',
        'nivoStudija',
        'pocetakPerioda',
        'krajPerioda',
      ],
      properties: {
        id: { type: 'integer' },
        fakultetId: { type: 'integer' },
        akademskaGodina: { type: 'string' },
        nivoStudija: { type: 'string' },
        pocetakPerioda: { type: 'string', format: 'date-time' },
        krajPerioda: { type: 'string', format: 'date-time' },
      },
    },
    StudentPredmetiGetResponse: {
      type: 'object',
      required: ['activePeriod', 'activePeriodEnd', 'enrollment', 'courses', 'selectedCourseIds'],
      properties: {
        activePeriod: { type: 'boolean' },
        activePeriodEnd: { type: ['string', 'null'], format: 'date-time' },
        enrollment: {
          type: 'object',
          required: ['akademskaGodina', 'godinaStudija', 'nivoStudija', 'smer', 'program', 'modul', 'fakultet'],
          properties: {
            akademskaGodina: { type: 'string' },
            godinaStudija: { type: 'integer' },
            nivoStudija: { type: 'string' },
            smer: { type: 'string' },
            program: { type: 'string' },
            modul: { type: 'string' },
            fakultet: { type: 'string' },
          },
        },
        courses: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'semestar', 'izborni', 'godinaStudija', 'izborniBlok', 'course'],
            properties: {
              id: { type: 'integer' },
              semestar: { type: 'integer' },
              izborni: { type: 'boolean' },
              godinaStudija: { type: 'integer' },
              izborniBlok: {
                oneOf: [
                  { type: 'null' },
                  {
                    type: 'object',
                    required: ['id', 'semestar', 'ukupnoIzbornih', 'potrebnoBirati'],
                    properties: {
                      id: { type: 'integer' },
                      semestar: { type: 'integer' },
                      ukupnoIzbornih: { type: 'integer' },
                      potrebnoBirati: { type: 'integer' },
                    },
                  },
                ],
              },
              course: {
                type: 'object',
                required: ['id', 'naziv', 'opis', 'espb', 'averageRating', 'ratingCount'],
                properties: {
                  id: { type: 'integer' },
                  naziv: { type: 'string' },
                  opis: { type: 'string' },
                  espb: { type: 'integer' },
                  averageRating: { type: ['number', 'null'] },
                  ratingCount: { type: 'integer' },
                },
              },
            },
          },
        },
        selectedCourseIds: {
          type: 'array',
          items: { type: 'integer' },
        },
      },
    },
    MyCoursesResponse: {
      type: 'object',
      required: ['student', 'items', 'passedCount', 'averageGrade'],
      properties: {
        student: {
          type: 'object',
          required: ['ime', 'prezime', 'brojIndeksa'],
          properties: {
            ime: { type: 'string' },
            prezime: { type: 'string' },
            brojIndeksa: { type: 'string' },
          },
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'id',
              'datumBiranja',
              'akademskaGodina',
              'godinaStudija',
              'semestar',
              'smer',
              'program',
              'modul',
              'predmet',
              'opis',
              'espb',
              'izborni',
              'ocena',
            ],
            properties: {
              id: { type: 'integer' },
              datumBiranja: { type: 'string', format: 'date-time' },
              akademskaGodina: { type: 'string' },
              godinaStudija: { type: 'integer' },
              semestar: { type: 'integer' },
              smer: { type: 'string' },
              program: { type: 'string' },
              modul: { type: 'string' },
              predmet: { type: 'string' },
              opis: { type: 'string' },
              espb: { type: 'integer' },
              izborni: { type: 'boolean' },
              ocena: { type: ['integer', 'null'] },
            },
          },
        },
        passedCount: { type: 'integer' },
        averageGrade: { type: ['number', 'null'] },
      },
    },
    PrijavaOptionsResponse: {
      type: 'object',
      required: ['akademskaGodina', 'openRealizations', 'eligibleCourses', 'registeredCourses'],
      properties: {
        akademskaGodina: { type: 'string' },
        openRealizations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'tip', 'naziv', 'akademskaGodina', 'pocetakPrijavljivanja', 'krajPrijavljivanja'],
            properties: {
              id: { type: 'integer' },
              tip: { type: 'string', enum: ['ISPITNI_ROK', 'KOLOKVIJUMSKA_NEDELJA'] },
              naziv: { type: 'string' },
              akademskaGodina: { type: 'string' },
              pocetakPrijavljivanja: { type: 'string', format: 'date-time' },
              krajPrijavljivanja: { type: 'string', format: 'date-time' },
            },
          },
        },
        eligibleCourses: {
          type: 'array',
          items: {
            type: 'object',
            required: ['kursUModuluId', 'izvodjenjeKursaId', 'naziv', 'espb', 'godinaStudija', 'semestar', 'datumBiranja'],
            properties: {
              kursUModuluId: { type: 'integer' },
              izvodjenjeKursaId: { type: 'integer' },
              naziv: { type: 'string' },
              espb: { type: 'integer' },
              godinaStudija: { type: 'integer' },
              semestar: { type: 'integer' },
              datumBiranja: { type: 'string', format: 'date-time' },
            },
          },
        },
        registeredCourses: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'tip', 'realizacijaNaziv', 'predmet', 'espb', 'datumPrijave'],
            properties: {
              id: { type: 'string' },
              tip: { type: 'string', enum: ['ISPITNI_ROK', 'KOLOKVIJUMSKA_NEDELJA'] },
              realizacijaNaziv: { type: 'string' },
              predmet: { type: 'string' },
              espb: { type: 'integer' },
              datumPrijave: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    CourseRatings: {
      type: 'object',
      description: 'Ocene po parametrima (kljucevi su COURSE_RATING_KEYS iz aplikacije).',
      additionalProperties: {
        type: ['integer', 'null'],
        minimum: 1,
        maximum: 5,
      },
    },
    CourseRatingsInput: {
      type: 'object',
      description: 'Ocene po parametrima, ceo broj 1-5 za svaki parametar.',
      additionalProperties: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
      },
    },
    CourseRatingsListResponse: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['kursId', 'naziv', 'examGrade', 'akademskaGodina', 'datumPolaganja', 'ratings'],
            properties: {
              kursId: { type: 'integer' },
              naziv: { type: 'string' },
              examGrade: { type: 'integer' },
              akademskaGodina: { type: 'string' },
              datumPolaganja: { type: 'string', format: 'date-time' },
              ratings: { $ref: '#/components/schemas/CourseRatings' },
            },
          },
        },
      },
    },
    ActiveExamRealization: {
      type: 'object',
      required: ['id', 'naziv', 'akademskaGodina', 'pocetakRoka', 'krajRoka'],
      properties: {
        id: { type: 'integer' },
        naziv: { type: 'string' },
        akademskaGodina: { type: 'string' },
        pocetakRoka: { type: 'string', format: 'date-time' },
        krajRoka: { type: 'string', format: 'date-time' },
      },
    },
    GradeUploadSubject: {
      type: 'object',
      required: ['izvodjenjeKursaId', 'naziv', 'espb', 'akademskaGodina', 'fakultet'],
      properties: {
        izvodjenjeKursaId: { type: 'integer' },
        naziv: { type: 'string' },
        espb: { type: 'integer' },
        akademskaGodina: { type: 'string' },
        fakultet: { type: 'string' },
      },
    },
  },
} as const;
