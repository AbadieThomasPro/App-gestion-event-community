export async function handleResponse(response, fallbackMessage) {
  if (response.status === 204) return null

  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new Error(data?.message ?? fallbackMessage)
  }

  return data
}
