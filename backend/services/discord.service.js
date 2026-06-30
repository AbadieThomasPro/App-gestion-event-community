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

export function sendErrorAlert(error, context) {
  const where = context ? ` (${context})` : ''
  return sendDiscordMessage(`🚨 **Erreur critique**${where}\n\`\`\`${error.message}\`\`\``)
}
