import React, { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { EyeIcon, EyeOffIcon, PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { prisma } from '@/db'
import { sourceConfigSchema, updateSourceConfigSchema } from '@/lib/schemas/source-config'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

// ─── Server functions ────────────────────────────────────────────────────────

const listSourceConfigs = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const configs = await prisma.sourceConfig.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return configs.map((c) => {
    const cfg = c.config as Record<string, string>
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      config: {
        bucket: cfg.bucket,
        region: cfg.region,
        accessKeyId: cfg.accessKeyId,
        prefix: cfg.prefix,
      },
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }
  })
})

const createSourceConfig = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => sourceConfigSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    return prisma.sourceConfig.create({
      data: {
        userId: session.user.id,
        name: data.name,
        type: data.type,
        config: data.config,
      },
    })
  })

const updateSourceConfig = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({ id: z.string().min(1) })
      .merge(updateSourceConfigSchema)
      .parse(data)
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await prisma.sourceConfig.findUnique({ where: { id: data.id } })
    if (!existing || existing.userId !== session.user.id) throw new Error('Not found')

    const existingCfg = existing.config as Record<string, string>
    const secretAccessKey = data.config.secretAccessKey || existingCfg.secretAccessKey

    return prisma.sourceConfig.update({
      where: { id: data.id },
      data: {
        name: data.name,
        type: data.type,
        config: { ...data.config, secretAccessKey },
      },
    })
  })

const deleteSourceConfig = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await prisma.sourceConfig.findUnique({ where: { id: data.id } })
    if (!existing || existing.userId !== session.user.id) throw new Error('Not found')

    return prisma.sourceConfig.delete({ where: { id: data.id } })
  })

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_authenticated/settings/sources')({
  loader: () => listSourceConfigs(),
  component: SourcesPage,
})

// ─── Types ───────────────────────────────────────────────────────────────────

type SourceConfigItem = Awaited<ReturnType<typeof listSourceConfigs>>[number]

type FormState = {
  name: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  prefix: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  name: '',
  bucket: '',
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
  prefix: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

function SourcesPage() {
  const sources = Route.useLoaderData()
  const router = useRouter()

  const [formMode, setFormMode] = useState<'idle' | 'add' | 'edit'>('idle')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [secretVisible, setSecretVisible] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openAdd() {
    setForm(emptyForm)
    setErrors({})
    setSecretVisible(false)
    setEditingId(null)
    setFormMode('add')
  }

  function openEdit(source: SourceConfigItem) {
    setForm({
      name: source.name,
      bucket: source.config.bucket,
      region: source.config.region,
      accessKeyId: source.config.accessKeyId,
      secretAccessKey: '',
      prefix: source.config.prefix ?? '',
    })
    setErrors({})
    setSecretVisible(false)
    setEditingId(source.id)
    setFormMode('edit')
  }

  function closeForm() {
    setFormMode('idle')
    setEditingId(null)
    setErrors({})
    setSecretVisible(false)
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validateAdd(): FormErrors | null {
    const result = sourceConfigSchema.safeParse({
      name: form.name,
      type: 'S3',
      config: {
        bucket: form.bucket,
        region: form.region,
        accessKeyId: form.accessKeyId,
        secretAccessKey: form.secretAccessKey,
        prefix: form.prefix || undefined,
      },
    })
    if (result.success) return null
    return extractErrors(result.error.issues)
  }

  function validateEdit(): FormErrors | null {
    const result = updateSourceConfigSchema.safeParse({
      name: form.name,
      type: 'S3',
      config: {
        bucket: form.bucket,
        region: form.region,
        accessKeyId: form.accessKeyId,
        secretAccessKey: form.secretAccessKey,
        prefix: form.prefix || undefined,
      },
    })
    if (result.success) return null
    return extractErrors(result.error.issues)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = formMode === 'add' ? validateAdd() : validateEdit()
    if (fieldErrors) {
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    try {
      if (formMode === 'add') {
        await createSourceConfig({
          data: {
            name: form.name,
            type: 'S3',
            config: {
              bucket: form.bucket,
              region: form.region,
              accessKeyId: form.accessKeyId,
              secretAccessKey: form.secretAccessKey,
              prefix: form.prefix || undefined,
            },
          },
        })
      } else if (formMode === 'edit' && editingId) {
        await updateSourceConfig({
          data: {
            id: editingId,
            name: form.name,
            type: 'S3',
            config: {
              bucket: form.bucket,
              region: form.region,
              accessKeyId: form.accessKeyId,
              secretAccessKey: form.secretAccessKey,
              prefix: form.prefix || undefined,
            },
          },
        })
      }
      closeForm()
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setSubmitting(true)
    try {
      await deleteSourceConfig({ data: { id } })
      setConfirmDeleteId(null)
      await router.invalidate()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/settings/sources">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Sources</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Source Configurations</h1>
            <p className="text-sm text-muted-foreground">
              Manage the external data sources Dictalog reads from.
            </p>
          </div>
          {formMode === 'idle' && (
            <Button onClick={openAdd} size="sm">
              <PlusIcon />
              Add Source
            </Button>
          )}
        </div>

        {formMode !== 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle>{formMode === 'add' ? 'Add Source' : 'Edit Source'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} noValidate>
                <FieldGroup className="max-w-lg">
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="e.g. Production S3"
                      aria-invalid={!!errors.name}
                    />
                    <FieldError>{errors.name}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.bucket}>
                    <FieldLabel htmlFor="bucket">Bucket</FieldLabel>
                    <Input
                      id="bucket"
                      value={form.bucket}
                      onChange={(e) => setField('bucket', e.target.value)}
                      placeholder="my-bucket"
                      aria-invalid={!!errors.bucket}
                    />
                    <FieldError>{errors.bucket}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.region}>
                    <FieldLabel htmlFor="region">Region</FieldLabel>
                    <Input
                      id="region"
                      value={form.region}
                      onChange={(e) => setField('region', e.target.value)}
                      placeholder="us-east-1"
                      aria-invalid={!!errors.region}
                    />
                    <FieldError>{errors.region}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.accessKeyId}>
                    <FieldLabel htmlFor="accessKeyId">Access Key ID</FieldLabel>
                    <Input
                      id="accessKeyId"
                      value={form.accessKeyId}
                      onChange={(e) => setField('accessKeyId', e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      aria-invalid={!!errors.accessKeyId}
                    />
                    <FieldError>{errors.accessKeyId}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.secretAccessKey}>
                    <FieldLabel htmlFor="secretAccessKey">Secret Access Key</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="secretAccessKey"
                        type={secretVisible ? 'text' : 'password'}
                        value={form.secretAccessKey}
                        onChange={(e) => setField('secretAccessKey', e.target.value)}
                        placeholder={formMode === 'edit' ? '••••••••' : ''}
                        aria-invalid={!!errors.secretAccessKey}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSecretVisible((v) => !v)}
                        aria-label={secretVisible ? 'Hide secret' : 'Show secret'}
                      >
                        {secretVisible ? <EyeOffIcon /> : <EyeIcon />}
                      </Button>
                    </div>
                    {formMode === 'edit' && !form.secretAccessKey && (
                      <p className="text-xs text-muted-foreground">
                        Leave blank to keep the existing secret.
                      </p>
                    )}
                    <FieldError>{errors.secretAccessKey}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.prefix}>
                    <FieldLabel htmlFor="prefix">Prefix (optional)</FieldLabel>
                    <Input
                      id="prefix"
                      value={form.prefix}
                      onChange={(e) => setField('prefix', e.target.value)}
                      placeholder="path/to/files/"
                      aria-invalid={!!errors.prefix}
                    />
                    <FieldError>{errors.prefix}</FieldError>
                  </Field>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submitting} size="sm">
                      {submitting ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={closeForm}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        )}

        {sources.length === 0 && formMode === 'idle' ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">No source configurations yet.</p>
            <Button onClick={openAdd} size="sm">
              <PlusIcon />
              Add Source
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sources.map((source) => (
              <Card key={source.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {source.name}
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {source.type}
                    </span>
                  </CardTitle>
                  <CardAction>
                    {confirmDeleteId === source.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Delete?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={submitting}
                          onClick={() => handleDelete(source.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={submitting}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setConfirmDeleteId(null)
                            openEdit(source)
                          }}
                          aria-label="Edit"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmDeleteId(source.id)}
                          aria-label="Delete"
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    )}
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
                    <div>
                      <dt className="text-xs text-muted-foreground">Bucket</dt>
                      <dd className="font-mono">{source.config.bucket}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Region</dt>
                      <dd className="font-mono">{source.config.region}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Access Key ID</dt>
                      <dd className="font-mono">{source.config.accessKeyId}</dd>
                    </div>
                    {source.config.prefix && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Prefix</dt>
                        <dd className="font-mono">{source.config.prefix}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractErrors(
  issues: Array<{ path: (string | number)[]; message: string }>
): FormErrors {
  const errors: FormErrors = {}
  for (const issue of issues) {
    const path = issue.path.join('.')
    if (path === 'name') errors.name = issue.message
    else if (path === 'config.bucket') errors.bucket = issue.message
    else if (path === 'config.region') errors.region = issue.message
    else if (path === 'config.accessKeyId') errors.accessKeyId = issue.message
    else if (path === 'config.secretAccessKey') errors.secretAccessKey = issue.message
    else if (path === 'config.prefix') errors.prefix = issue.message
  }
  return errors
}
