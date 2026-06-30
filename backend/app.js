import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import eventRoutes from './routes/event.routes.js'
import registrationRoutes from './routes/registration.routes.js'
import { openApiDocument } from './docs/openapi.js'
import { HttpError } from './utils/http-error.js'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'API is running' })
})

app.get('/api-docs.json', (req, res) => {
  res.json(openApiDocument)
})

// Swagger UI chargé depuis un CDN : les fichiers statiques de swagger-ui-dist
// ne sont pas inclus dans le bundle de la fonction serverless Vercel.
app.get('/api-docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api-docs.json',
          dom_id: '#swagger-ui',
        })
      }
    </script>
  </body>
</html>`)
})

app.use('/auth', authRoutes)
app.use('/events', eventRoutes)
app.use('/registrations', registrationRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'route introuvable' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message })
  }

  console.error(err)
  res.status(500).json({ message: 'une erreur interne est survenue' })
})

export default app
