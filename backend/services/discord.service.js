const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
})

export async function sendDiscordMessage(content) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL non configuré : message Discord ignoré')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      console.error(`Le webhook Discord a répondu avec le statut ${response.status}`)
    }
  } catch (error) {
    console.error("Échec de l'envoi du message Discord", error)
  }
}

export function sendEventAnnouncement(event) {
  return sendDiscordMessage(
    `📢 **Nouvel événement : ${event.title}**\n` +
      `🗓️ ${dateFormatter.format(new Date(event.date))}\n` +
      `📍 ${event.location}`
  )
}

export function sendEventReminder(event) {
  return sendDiscordMessage(
    `⏰ **Rappel : ${event.title} commence bientôt !**\n` +
      `🗓️ ${dateFormatter.format(new Date(event.date))}\n` +
      `📍 ${event.location}`
  )
}

// Throttle best-effort : une fonction serverless garde cet état en mémoire tant que
// l'instance reste "chaude", ce qui suffit à éviter le spam lors d'une panne soutenue
// (ex. base de données injoignable, chaque requête en erreur). Ce n'est pas garanti
// entre deux instances froides distinctes, mais ça reste la meilleure option sans
// dépendance externe (Redis, etc.) sur ce projet.
const ERROR_ALERT_COOLDOWN_MS = 5 * 60 * 1000
let lastErrorAlertAt = 0

export function sendErrorAlert(error, context) {
  const now = Date.now()
  if (now - lastErrorAlertAt < ERROR_ALERT_COOLDOWN_MS) {
    return Promise.resolve()
  }
  lastErrorAlertAt = now

  const where = context ? ` (${context})` : ''
  return sendDiscordMessage(`🚨 **Erreur critique**${where}\n\`\`\`${error.message}\`\`\``)
}

export function _resetErrorAlertThrottle() {
  lastErrorAlertAt = 0
}
