import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'API is running' })
})

app.use('/auth', authRoutes)

export default app
