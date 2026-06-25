import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import eventRoutes from './routes/event.routes.js'
import { openApiDocument } from './docs/openapi.js'

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

export default app
