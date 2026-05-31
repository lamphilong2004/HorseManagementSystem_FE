export function cn(...inputs: any[]): string {
  const classes: string[] = []
  
  for (const input of inputs.flat(Infinity)) {
    if (!input) continue
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input))
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key)
        }
      }
    }
  }
  
  return classes.join(' ')
}
