import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { executeCommand, getCommandSuggestions, type AppCommand, type CommandContext } from '../../commands/commandRegistry.ts'
import { useI18n } from '../../i18n/I18nContext'
import type { AutosaveStatus } from '../../project/AutosaveManager.ts'
import { autosaveStatusKey } from './autosaveStatus.ts'

interface CommandBarProps {
  context: CommandContext
  saveStatus: AutosaveStatus
  dirty: boolean
  prompt?: CommandPrompt | null
}

export interface CommandPrompt {
  placeholder: string
  submit: (value: string) => boolean
  cancel: () => void
}

export function CommandBar({ context, saveStatus, dirty, prompt }: CommandBarProps) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [invalid, setInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const suggestions = useMemo(() => getCommandSuggestions(value, t), [t, value])
  const suggestionsVisible = !prompt && focused && open && suggestions.length > 0
  const displayedSaveStatus = saveStatus === 'saved' && dirty ? 'saving' : saveStatus
  const selectedIndex = Math.min(activeIndex, Math.max(0, suggestions.length - 1))

  const choose = (command: AppCommand) => {
    command.execute(context)
    setValue('')
    setOpen(false)
    setActiveIndex(0)
  }

  useEffect(() => {
    if (!prompt) return
    setValue('')
    setInvalid(false)
    setOpen(false)
    inputRef.current?.focus()
  }, [prompt])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!suggestions.length) return
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length)
    } else if (event.key === 'Tab' && suggestionsVisible) {
      event.preventDefault()
      setValue(suggestions[selectedIndex]?.id ?? value)
      setOpen(true)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setValue('')
      setOpen(false)
      setActiveIndex(0)
      setInvalid(false)
      prompt?.cancel()
    }
  }

  return (
    <div className="desktop-command-area">
      {suggestionsVisible && (
        <div className="command-suggestions" id={listId} role="listbox" aria-label={t('commandSuggestions')}>
          {suggestions.map((command, index) => (
            <button
              key={command.id}
              id={`${listId}-${command.id}`}
              className={index === selectedIndex ? 'is-active' : ''}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(command)}
            >
              <span>{t(command.labelKey)}</span>
              <kbd>{command.id}</kbd>
            </button>
          ))}
        </div>
      )}
      <form className="command-bar" onSubmit={(event) => {
        event.preventDefault()
        if (prompt) {
          const accepted = prompt.submit(value)
          setInvalid(!accepted)
          if (accepted) setValue('')
          return
        }
        const selected = suggestionsVisible ? suggestions[selectedIndex] : undefined
        if (selected) choose(selected)
        else if (executeCommand(value, context)) {
          setValue('')
          setOpen(false)
        }
      }}>
        <span aria-hidden="true">›</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => { setValue(event.target.value); setInvalid(false); setOpen(true); setActiveIndex(0) }}
          onFocus={() => { setFocused(true); setOpen(true) }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestionsVisible}
          aria-controls={listId}
          aria-activedescendant={suggestionsVisible ? `${listId}-${suggestions[selectedIndex]?.id}` : undefined}
          aria-label={t('command')}
          aria-invalid={invalid || undefined}
          placeholder={prompt?.placeholder ?? t('command')}
          autoComplete="off"
          spellCheck="false"
        />
      </form>
      <span className={`command-save-status is-${displayedSaveStatus}`} role="status">{t(autosaveStatusKey(saveStatus, dirty))}</span>
    </div>
  )
}
