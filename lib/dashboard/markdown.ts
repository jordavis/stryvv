/**
 * Converts markdown text to safe HTML for rendering in the dashboard.
 * Escapes user-controlled content before processing markdown syntax.
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3 class='text-base font-semibold mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-lg font-semibold mt-4 mb-2'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-xl font-bold mt-4 mb-2'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul class='my-2 space-y-1'>${match}</ul>`)
    .replace(/\n\n+/g, "</p><p class='mt-3'>")
    .replace(/\n/g, "<br>")

  return `<p>${html}</p>`
}
