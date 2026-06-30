export const EMPTY_EVENT_FORM_VALUES = {
  title: '',
  description: '',
  date: '',
  endDate: '',
  location: '',
  capacity: '',
  status: 'DRAFT',
  discordChannelId: '',
  discordMessageId: '',
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

export function eventFormValuesFromEvent(event) {
  return {
    title: event.title,
    description: event.description,
    date: toDateTimeLocal(event.date),
    endDate: toDateTimeLocal(event.endDate),
    location: event.location,
    capacity: event.capacity ?? '',
    status: event.status,
    discordChannelId: event.discordChannelId ?? '',
    discordMessageId: event.discordMessageId ?? '',
  }
}

export function eventFormValuesToPayload(values) {
  return {
    title: values.title,
    description: values.description,
    date: values.date ? new Date(values.date).toISOString() : '',
    endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
    location: values.location,
    capacity: values.capacity === '' ? null : Number(values.capacity),
    status: values.status,
    discordChannelId: values.discordChannelId || null,
    discordMessageId: values.discordMessageId || null,
  }
}
