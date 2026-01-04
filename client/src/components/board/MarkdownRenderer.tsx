import { useMemo } from 'react'
import { renderMarkdown } from '../../utils/markdown'
import { useSettingsStore } from '../../stores/settingsStore'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const { settings } = useSettingsStore()

  const html = useMemo(
    () => renderMarkdown(content, settings.customEmojis),
    [content, settings.customEmojis]
  )

  if (!content) {
    return <span className="text-slate-500 italic">No description</span>
  }

  return (
    <div
      className={`
        text-sm text-slate-300 leading-relaxed
        [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-3 [&_h1]:mb-2
        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-2
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-2 [&_h3]:mb-1
        [&_p]:my-2
        [&_a]:text-primary-400 [&_a]:underline
        [&_strong]:text-white [&_strong]:font-semibold
        [&_em]:italic
        [&_code]:text-sky-300 [&_code]:bg-slate-700/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
        [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
        [&_li]:my-0.5
        [&_blockquote]:border-l-2 [&_blockquote]:border-slate-500 [&_blockquote]:pl-3 [&_blockquote]:text-slate-400 [&_blockquote]:italic
        [&_hr]:border-slate-700 [&_hr]:my-3
        [&_.inline-emoji]:inline-block [&_.inline-emoji]:w-5 [&_.inline-emoji]:h-5 [&_.inline-emoji]:align-text-bottom [&_.inline-emoji]:mx-0.5
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
