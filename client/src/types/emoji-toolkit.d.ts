declare module 'emoji-toolkit' {
  const emojiToolkit: {
    shortnameToUnicode(text: string): string
    unicodeToShortname(text: string): string
    toShort(text: string): string
    toImage(text: string): string
    shortnameToImage(text: string): string
    unicodeToImage(text: string): string
  }
  export default emojiToolkit
}
