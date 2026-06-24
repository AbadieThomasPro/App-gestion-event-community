const eventProperties = {
  id: {
    type: 'string',
    format: 'uuid',
    readOnly: true,
    example: '1f410c29-9c9b-4c3f-a76c-36bb0b9e1687',
  },
  title: { type: 'string', example: 'Tournoi communautaire' },
  description: {
    type: 'string',
    example: 'Un tournoi convivial organisé avec la communauté Discord.',
  },
  date: { type: 'string', format: 'date-time', example: '2026-07-15T18:00:00.000Z' },
  endDate: {
    type: 'string',
    format: 'date-time',
    nullable: true,
    example: '2026-07-15T21:00:00.000Z',
  },
  location: { type: 'string', example: 'Discord - Salon vocal général' },
  capacity: { type: 'integer', minimum: 1, nullable: true, example: 32 },
  status: {
    type: 'string',
    enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
    default: 'DRAFT',
  },
  discordChannelId: { type: 'string', nullable: true, example: '123456789012345678' },
  discordMessageId: { type: 'string', nullable: true, example: '987654321098765432' },
  creatorId: {
    type: 'string',
    format: 'uuid',
    readOnly: true,
    example: '01c33a21-499e-457c-902c-95441ed1722a',
  },
  createdAt: { type: 'string', format: 'date-time', readOnly: true },
  updatedAt: { type: 'string', format: 'date-time', readOnly: true },
}

const userProperties = {
  id: {
    type: 'string',
    format: 'uuid',
    readOnly: true,
    example: '52b38672-bba3-40cc-82c4-7f7df00898b3',
  },
  email: { type: 'string', format: 'email', example: 'jane@example.com' },
  name: { type: 'string', example: 'Jane Doe' },
  role: {
    type: 'string',
    enum: ['USER', 'ORGANIZER', 'ADMIN'],
    default: 'USER',
  },
  discordId: { type: 'string', nullable: true, example: null },
  avatar: { type: 'string', nullable: true, example: null },
  isActive: { type: 'boolean', default: true },
  emailVerified: { type: 'boolean', default: false },
  createdAt: { type: 'string', format: 'date-time', readOnly: true },
  updatedAt: { type: 'string', format: 'date-time', readOnly: true },
}

const errorResponses = {
  400: {
    description: 'Données invalides',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  401: {
    description: 'Authentification requise',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  403: {
    description: 'Rôle insuffisant',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
}

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'API de gestion des événements communautaires',
    version: '1.0.0',
    description: 'Documentation des routes de gestion des événements Discord.',
  },
  servers: [{ url: '/', description: 'Serveur courant' }],
  tags: [
    { name: 'Events', description: 'Consultation et gestion des événements' },
    { name: 'Auth', description: 'Inscription et connexion des utilisateurs' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte utilisateur',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Compte créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          400: errorResponses[400],
          409: {
            description: 'Un compte existe déjà avec cet email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion réussie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: errorResponses[400],
          401: errorResponses[401],
        },
      },
    },
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'Lister les événements',
        operationId: 'getEvents',
        responses: {
          200: {
            description: 'Liste des événements triés par date',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Event' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Créer un événement',
        operationId: 'createEvent',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EventInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Événement créé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    '/events/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: "Identifiant UUID de l'événement",
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      get: {
        tags: ['Events'],
        summary: 'Obtenir un événement',
        operationId: 'getEvent',
        responses: {
          200: {
            description: 'Événement trouvé',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          404: {
            description: 'Événement introuvable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Events'],
        summary: 'Remplacer un événement',
        operationId: 'updateEvent',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EventInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Événement modifié',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          ...errorResponses,
          404: {
            description: 'Événement introuvable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Supprimer un événement',
        operationId: 'deleteEvent',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Événement supprimé' },
          401: errorResponses[401],
          403: errorResponses[403],
          404: {
            description: 'Événement introuvable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Event: {
        type: 'object',
        required: [
          'id',
          'title',
          'description',
          'date',
          'location',
          'status',
          'creatorId',
          'createdAt',
          'updatedAt',
        ],
        properties: eventProperties,
      },
      EventInput: {
        type: 'object',
        required: ['title', 'description', 'date', 'location'],
        properties: {
          title: eventProperties.title,
          description: eventProperties.description,
          date: eventProperties.date,
          endDate: eventProperties.endDate,
          location: eventProperties.location,
          capacity: eventProperties.capacity,
          status: eventProperties.status,
          discordChannelId: eventProperties.discordChannelId,
          discordMessageId: eventProperties.discordMessageId,
        },
      },
      Error: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', example: 'événement introuvable' },
        },
      },
      User: {
        type: 'object',
        required: [
          'id',
          'email',
          'name',
          'role',
          'isActive',
          'emailVerified',
          'createdAt',
          'updatedAt',
        ],
        properties: userProperties,
      },
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: userProperties.email,
          password: { type: 'string', format: 'password', minLength: 8, example: 'password123' },
          name: userProperties.name,
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: userProperties.email,
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      LoginResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: {
            type: 'string',
            format: 'jwt',
            readOnly: true,
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
}
