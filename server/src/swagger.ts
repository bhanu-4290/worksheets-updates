import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SYNC SPACE Enterprise REST API",
      version: "1.0.0",
      description:
        "Official REST API documentation for SYNC SPACE: Employee Daily Work Tracking & Management System. Supports role-scoped operations for Super Admin, Managers, Team Leads, and Executives.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1 Endpoint",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "worktrack_auth_token",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
