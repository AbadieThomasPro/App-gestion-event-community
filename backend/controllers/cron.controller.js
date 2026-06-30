import { listEventsStartingBetween } from '../services/event.service.js'
import { sendEventReminder } from '../services/discord.service.js'

// Plan Hobby Vercel = 1 exécution de cron par jour max, donc fenêtre de 24h
// (24h à 48h avant le début) plutôt qu'un calcul "il y a exactement 24h".
const REMINDER_WINDOW_START_HOURS = 24
const REMINDER_WINDOW_END_HOURS = 48

export async function sendEventReminders(req, res) {
  const events = await listEventsStartingBetween(
    REMINDER_WINDOW_START_HOURS,
    REMINDER_WINDOW_END_HOURS
  )

  for (const event of events) {
    await sendEventReminder(event)
  }

  res.json({ remindersSent: events.length })
}
