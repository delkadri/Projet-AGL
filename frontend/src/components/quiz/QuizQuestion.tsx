import type { Question, QuestionAnswer } from '@/types/quiz'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { QuestionMultipleChoice } from './QuestionMultipleChoice'
import { QuestionNumber } from './QuestionNumber'
import { QuestionSingleChoice } from './QuestionSingleChoice'

type QuizQuestionProps = {
  question: Question
  value: QuestionAnswer | undefined
  onChange: (value: QuestionAnswer) => void
  /** When set and non-empty after trim, shows a « ? » button next to the title. */
  helpContent?: string | null
  className?: string
}

/** Splits help text into renderable blocks: bulleted lists or paragraphs. */
type HelpBlock =
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; text: string }

function parseHelpBlocks(text: string): HelpBlock[] {
  const blocks: HelpBlock[] = []
  const lines = text.split('\n').map((l) => l.trim())
  let buffer: string[] = []
  let currentList: string[] | null = null

  const flushParagraph = () => {
    if (buffer.length === 0) return
    blocks.push({ kind: 'paragraph', text: buffer.join(' ') })
    buffer = []
  }
  const flushList = () => {
    if (!currentList || currentList.length === 0) return
    blocks.push({ kind: 'list', items: currentList })
    currentList = null
  }

  for (const line of lines) {
    if (line === '') {
      flushParagraph()
      flushList()
      continue
    }
    if (line.startsWith('•')) {
      flushParagraph()
      currentList ??= []
      currentList.push(line.replace(/^•\s*/, ''))
    } else {
      flushList()
      buffer.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

export function QuizQuestion({
  question,
  value,
  onChange,
  helpContent,
  className,
}: QuizQuestionProps) {
  const trimmedHelp = helpContent?.trim()
  const showHelp = Boolean(trimmedHelp)
  const helpBlocks = trimmedHelp ? parseHelpBlocks(trimmedHelp) : []

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <div className="flex shrink-0 items-start gap-2">
        <h2 className="min-w-0 flex-1 text-base font-bold leading-tight text-foreground decoration-muted-foreground/30 underline-offset-2">
          {question.title}
        </h2>
        {showHelp && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0 rounded-full border-[#1C5138]/35 text-[#1C5138] hover:bg-[#1C5138]/10"
                aria-label="Informations complémentaires sur cette question"
              >
                <span className="text-sm font-bold leading-none">?</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[min(85vh,30rem)] gap-0 overflow-hidden rounded-2xl border-[#1C5138]/15 p-0">
              <DialogHeader className="space-y-1 border-b border-[#1C5138]/10 bg-[#1C5138]/5 px-5 py-4">
                <div className="flex items-center gap-2 text-[#1C5138]">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#1C5138]/10 text-sm font-bold">
                    ?
                  </span>
                  <DialogTitle className="text-left text-base font-semibold">
                    Précisions sur la question
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="max-h-[min(60vh,20rem)] space-y-3 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-foreground">
                {helpBlocks.map((block, i) =>
                  block.kind === 'list' ? (
                    <ul key={i} className="space-y-2">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex gap-2">
                          <span
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#1C5138]"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{block.text}</p>
                  ),
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-4">
        {question.type === 'single' && (
          <QuestionSingleChoice
            options={question.options}
            value={(value as string | undefined) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'multiple' && (
          <QuestionMultipleChoice
            options={question.options}
            value={((value as string[] | undefined) ?? []) as string[]}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'number' && (
          <QuestionNumber
            min={question.min}
            max={question.max}
            value={(value as number | undefined) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
      </div>
    </div>
  )
}
