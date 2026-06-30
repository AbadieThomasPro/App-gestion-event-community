import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import authRoutes from './routes/auth.routes.js'
import eventRoutes from './routes/event.routes.js'
import adminRoutes from './routes/admin.routes.js'
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

app.use('/auth', authRoutes)
app.use('/events', eventRoutes)
app.use('/admin', adminRoutes)

export default app
