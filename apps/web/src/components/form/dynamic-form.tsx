'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { FormTemplate, FormSection, FormField } from '@/lib/api/forms'
import { useFormPersistence } from '@/lib/hooks/useFormPersistence'

const EMPTY_INITIAL_DATA: Record<string, unknown> = {}

interface DynamicFormProps {
  template: FormTemplate
  onSubmit?: (data: Record<string, unknown>) => void
  onSave?: (data: Record<string, unknown>) => void
  initialData?: Record<string, unknown>
  submitLabel?: string
  isSubmitting?: boolean
  persistenceKey?: string
  enablePersistence?: boolean
}

interface FieldComponentProps {
  field: FormField
  value?: unknown
  onChange: (value: unknown) => void
  error?: string
}

function FieldComponent({ field, value, onChange, error }: FieldComponentProps) {
  const widthClass = {
    full: 'col-span-1',
    half: 'sm:col-span-1 md:col-span-1 lg:col-span-1 w-full',
    third: 'sm:col-span-1 md:col-span-1 lg:w-1/3',
    quarter: 'sm:col-span-1 md:col-span-1 lg:w-1/4',
  }[field.width || 'full']

  const inputId = `field-${field.id}`

  switch (field.type) {
    case 'text':
      return (
        <div className={widthClass}>
          {field.showLabel !== false && field.label && (
            <Label htmlFor={inputId} className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <Input
            id={inputId}
            type="text"
            placeholder={field.placeholder}
            value={value as string ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
            readOnly={field.readonly}
            maxLength={field.maxLength}
            minLength={field.minLength}
            autoComplete={field.autocomplete}
            className={error ? 'border-destructive' : ''}
          />
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    case 'textarea':
      return (
        <div className={widthClass}>
          {field.showLabel !== false && field.label && (
            <Label htmlFor={inputId} className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <Textarea
            id={inputId}
            placeholder={field.placeholder}
            value={value as string ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
            readOnly={field.readonly}
            maxLength={field.maxLength}
            minLength={field.minLength}
            rows={4}
            className={error ? 'border-destructive' : ''}
          />
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    case 'number':
      return (
        <div className={widthClass}>
          {field.showLabel !== false && field.label && (
            <Label htmlFor={inputId} className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <div className="flex items-center gap-2">
            <Input
              id={inputId}
              type="number"
              placeholder={field.placeholder}
              value={String(value ?? '')}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              disabled={field.disabled}
              readOnly={field.readonly}
              min={field.min}
              max={field.max}
              step={field.step}
              className={error ? 'border-destructive' : ''}
            />
            {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
          </div>
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    case 'date':
      return (
        <div className={widthClass}>
          {field.showLabel !== false && field.label && (
            <Label htmlFor={inputId} className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <Input
            id={inputId}
            type="date"
            value={value as string ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
            readOnly={field.readonly}
            min={field.minDate}
            max={field.maxDate}
            className={error ? 'border-destructive' : ''}
          />
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    case 'datetime':
      return (
        <div className={widthClass}>
          {field.showLabel !== false && field.label && (
            <Label htmlFor={inputId} className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <Input
            id={inputId}
            type="datetime-local"
            value={value as string ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
            readOnly={field.readonly}
            className={error ? 'border-destructive' : ''}
          />
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    case 'select':
      return (
        <div className={widthClass}>
          {field.showLabel !== false && field.label && (
            <Label htmlFor={inputId} className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <select
            id={inputId}
            value={value as string ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
            className={`
              flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
              ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
              placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-destructive' : ''}
            `}
          >
            <option value="">{field.placeholder || 'Chọn...'}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    case 'radio':
      return (
        <div className={widthClass}>
          {field.showLabel !== false && field.label && (
            <Label className="text-foreground mb-2 block">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <div
            className={`grid gap-2 ${field.columns ? `grid-cols-${field.columns}` : 'grid-cols-1'}`}
          >
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={field.disabled}
                  className="w-4 h-4 text-primary border-primary"
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    case 'checkbox':
      if (field.multiple) {
        // Multiple checkboxes (array of values)
        const values = Array.isArray(value) ? value : []
        return (
          <div className={widthClass}>
            {field.showLabel !== false && field.label && (
              <Label className="text-foreground mb-2 block">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}
            <div
              className={`grid gap-2 ${field.columns ? `grid-cols-${field.columns}` : 'grid-cols-1'}`}
            >
              {field.options?.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...values, option.value])
                      } else {
                        onChange(values.filter((v) => v !== option.value))
                      }
                    }}
                    disabled={field.disabled}
                    className="w-4 h-4 text-primary border-primary rounded"
                  />
                  <span className="text-sm text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
            {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        )
      }
      // Single checkbox (boolean)
      return (
        <div className={widthClass}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={field.disabled}
              className="w-4 h-4 text-primary border-primary rounded"
            />
            <span className="text-sm text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </span>
          </label>
          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      )

    default:
      return (
        <div className={widthClass}>
          <p className="text-sm text-muted-foreground">
            Loại trường không được hỗ trợ: {field.type}
          </p>
        </div>
      )
  }
}

function SectionComponent({
  section,
  values,
  onChange,
  errors,
}: {
  section: FormSection
  values: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
  errors: Record<string, string>
}) {
  const [isCollapsed, setIsCollapsed] = useState(section.collapsedByDefault ?? false)

  return (
    <Card className="glass mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">{section.name}</CardTitle>
            {section.description && (
              <CardDescription>{section.description}</CardDescription>
            )}
          </div>
          {section.collapsible && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? '▼' : '▲'}
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <FieldComponent
                  key={field.id}
                  field={field}
                  value={values[field.name]}
                  onChange={(value) => onChange(field.name, value)}
                  error={errors[field.name]}
                />
              ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function DynamicForm({
  template,
  onSubmit,
  onSave,
  initialData = EMPTY_INITIAL_DATA,
  submitLabel = 'Gửi bệnh án',
  isSubmitting = false,
  persistenceKey,
  enablePersistence = true,
}: DynamicFormProps) {
  // Initialize values from localStorage if persistence is enabled
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    if (enablePersistence && persistenceKey) {
      try {
        const saved = localStorage.getItem(`form:${persistenceKey}`)
        if (saved) {
          return { ...initialData, ...JSON.parse(saved) }
        }
      } catch {
        // Ignore parse errors
      }
    }
    return initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!enablePersistence || !persistenceKey) return

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`form:${persistenceKey}`, JSON.stringify(values))
        setLastSaved(new Date())
      } catch {
        // Ignore save errors
      }
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [values, persistenceKey, enablePersistence])

  // Validate form - must be defined before handleSubmit
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    for (const section of template.templateSchema.sections) {
      for (const field of section.fields) {
        const value = values[field.name]

        // Required validation
        if (field.required && (value === undefined || value === null || value === '')) {
          newErrors[field.name] = `${field.label || field.name} là bắt buộc`
          continue
        }

        // String length validation
        if (typeof value === 'string') {
          if (field.minLength && value.length < field.minLength) {
            newErrors[field.name] = `Tối thiểu ${field.minLength} ký tự`
          }
          if (field.maxLength && value.length > field.maxLength) {
            newErrors[field.name] = `Tối đa ${field.maxLength} ký tự`
          }
        }

        // Number range validation
        if (field.type === 'number' && typeof value === 'number') {
          if (field.min !== undefined && value < field.min) {
            newErrors[field.name] = `Giá trị tối thiểu là ${field.min}`
          }
          if (field.max !== undefined && value > field.max) {
            newErrors[field.name] = `Giá trị tối đa là ${field.max}`
          }
        }

        // Pattern validation
        if (field.pattern && typeof value === 'string') {
          const regex = new RegExp(field.pattern)
          if (!regex.test(value)) {
            newErrors[field.name] = field.patternMessage || 'Giá trị không hợp lệ'
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, template.templateSchema.sections])

  // Clear saved data after successful submit
  const handleSubmit = useCallback(() => {
    if (validate()) {
      // Clear saved data after successful submit
      if (enablePersistence && persistenceKey) {
        try {
          localStorage.removeItem(`form:${persistenceKey}`)
        } catch {
          // Ignore clear errors
        }
      }
      onSubmit?.(values)
    }
  }, [values, validate, onSubmit, enablePersistence, persistenceKey])

  const handleChange = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when field is modified
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }, [errors])

  const handleSave = useCallback(() => {
    onSave?.(values)
  }, [values, onSave])

  // Clear saved data
  const clearSaved = useCallback(() => {
    if (enablePersistence && persistenceKey) {
      try {
        localStorage.removeItem(`form:${persistenceKey}`)
        setValues(initialData)
      } catch {
        // Ignore clear errors
      }
    }
  }, [enablePersistence, persistenceKey, initialData])

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
      {/* Auto-save indicator */}
      {enablePersistence && persistenceKey && (
        <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
          {lastSaved && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Đã lưu tự động {lastSaved.toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>
      )}

      {template.templateSchema.sections
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <SectionComponent
            key={section.id}
            section={section}
            values={values}
            onChange={handleChange}
            errors={errors}
          />
        ))}

      <div className="flex gap-3 justify-end">
        {onSave && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            Lưu nháp
          </Button>
        )}
        <Button
          type="submit"
          className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang gửi...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

