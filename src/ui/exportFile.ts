export function downloadText(name: string, text: string, type: string) {
  downloadUrl(name, URL.createObjectURL(new Blob([text], { type })))
}

export function downloadUrl(name: string, url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeName(s: string): string {
  return s.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'drafter'
}

export function readFile(file: File): Promise<string> {
  return file.text()
}
