import type { ChatMessage, ChatTableData } from '#shared/types/domain'

/**
 * Chat analítico vía EventSource sobre /api/nl-query/stream (§6).
 * Renderizado incremental: SQL generado → tabla de resultados → respuesta.
 */
export function useChatStream() {
  const messages = ref<ChatMessage[]>([])
  const streaming = ref(false)
  let source: EventSource | null = null

  function stop(): void {
    source?.close()
    source = null
    streaming.value = false
  }

  function ask(question: string): void {
    if (streaming.value || !question.trim()) return

    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
      createdAt: new Date().toISOString(),
    })

    const assistant = reactive<ChatMessage>({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    })
    messages.value.push(assistant)
    streaming.value = true

    source = new EventSource(`/api/nl-query/stream?q=${encodeURIComponent(question)}`)

    source.addEventListener('sql', (e: MessageEvent<string>) => {
      assistant.sql = (JSON.parse(e.data) as { sql: string }).sql
    })
    source.addEventListener('rows', (e: MessageEvent<string>) => {
      assistant.table = JSON.parse(e.data) as ChatTableData
    })
    source.addEventListener('chunk', (e: MessageEvent<string>) => {
      assistant.content += (JSON.parse(e.data) as { text: string }).text
    })
    source.addEventListener('done', stop)
    source.onerror = () => {
      if (!assistant.content) {
        assistant.content = 'No pude procesar tu consulta. Intenta de nuevo.'
      }
      stop()
    }
  }

  onBeforeUnmount(stop)

  return { messages, streaming, ask, stop }
}
