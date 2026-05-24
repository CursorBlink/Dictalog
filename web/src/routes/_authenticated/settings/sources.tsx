import React, { useState, useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from 'lucide-react'
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

// ─── Constants ───────────────────────────────────────────────────────────────

const DRAFT_KEY = 'dictalog:source-config-draft'

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
    const cfg = c.config as Record<string, unknown>
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      config: {
        bucket: cfg.bucket as string,
        region: cfg.region as string,
        accessKeyId: cfg.accessKeyId as string,
        prefix: cfg.prefix as string | undefined,
        endpoint: cfg.endpoint as string | undefined,
        forcePathStyle: cfg.forcePathStyle as boolean | undefined,
        tlsVerify: cfg.tlsVerify as boolean | undefined,
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

const testS3ConnectionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        bucket: z.string().min(1),
        region: z.string().min(1),
        accessKeyId: z.string().min(1),
        secretAccessKey: z.string().min(1),
        endpoint: z.string().url().optional(),
        forcePathStyle: z.boolean().optional(),
        tlsVerify: z.boolean().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    const { S3Client, HeadBucketCommand, ListBucketsCommand } = await import('@aws-sdk/client-s3')

    let requestHandler: unknown
    if (data.tlsVerify === false) {
      const https = await import('https')
      const { NodeHttpHandler } = await import('@smithy/node-http-handler')
      requestHandler = new NodeHttpHandler({
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      })
    }

    const client = new S3Client({
      region: data.region,
      credentials: {
        accessKeyId: data.accessKeyId,
        secretAccessKey: data.secretAccessKey,
      },
      ...(data.endpoint ? { endpoint: data.endpoint } : {}),
      ...(data.forcePathStyle ? { forcePathStyle: true } : {}),
      ...(requestHandler ? { requestHandler } : {}),
    })

    try {
      await client.send(new HeadBucketCommand({ Bucket: data.bucket }))
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } }
      return {
        success: false as const,
        overPermissioned: false,
        errorCode: e.name ?? 'UnknownError',
        errorMessage: e.message ?? 'Connection test failed',
      }
    }

    let overPermissioned = false
    try {
      const { Buckets } = await client.send(new ListBucketsCommand({}))
      const otherBuckets = (Buckets ?? []).filter((b) => b.Name !== data.bucket)
      overPermissioned = otherBuckets.length > 0
    } catch {
      // AccessDenied on ListBuckets is expected and desired — not over-permissioned
    }

    return { success: true as const, overPermissioned }
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
  endpoint: string
  forcePathStyle: boolean
  tlsVerify: boolean
  prefix: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

type TestResult = 'idle' | 'pending' | 'passed' | 'failed'

type Draft = {
  formMode: 'add' | 'edit'
  editingId: string | null
  name: string
  bucket: string
  region: string
  accessKeyId: string
  endpoint: string
  forcePathStyle: boolean
  tlsVerify: boolean
  prefix: string
}

const emptyForm: FormState = {
  name: '',
  bucket: '',
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
  endpoint: '',
  forcePathStyle: false,
  tlsVerify: true,
  prefix: '',
}

const CREDENTIAL_FIELDS = new Set<keyof FormState>([
  'bucket', 'region', 'accessKeyId', 'secretAccessKey', 'endpoint', 'forcePathStyle', 'tlsVerify',
])

// ─── Component ───────────────────────────────────────────────────────────────

function SourcesPage() {
  const sources = Route.useLoaderData()
  const router = useRouter()

  const [formMode, setFormMode] = useState<'idle' | 'add' | 'edit'>('idle')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setFormState] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [secretVisible, setSecretVisible] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [testResult, setTestResult] = useState<TestResult>('idle')
  const [testError, setTestError] = useState<string>('')
  const [overPermissioned, setOverPermissioned] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [restoredFromDraft, setRestoredFromDraft] = useState(false)

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as Draft
      setFormState({
        name: draft.name ?? '',
        bucket: draft.bucket ?? '',
        region: draft.region ?? '',
        accessKeyId: draft.accessKeyId ?? '',
        secretAccessKey: '',
        endpoint: draft.endpoint ?? '',
        forcePathStyle: draft.forcePathStyle ?? false,
        tlsVerify: draft.tlsVerify ?? true,
        prefix: draft.prefix ?? '',
      })
      setEditingId(draft.editingId)
      setFormMode(draft.formMode)
      setRestoredFromDraft(true)
    } catch {
      // Ignore malformed draft
    }
  }, [])

  function saveDraft(mode: 'add' | 'edit', id: string | null, fields: FormState) {
    const draft: Draft = {
      formMode: mode,
      editingId: id,
      name: fields.name,
      bucket: fields.bucket,
      region: fields.region,
      accessKeyId: fields.accessKeyId,
      endpoint: fields.endpoint,
      forcePathStyle: fields.forcePathStyle,
      tlsVerify: fields.tlsVerify,
      prefix: fields.prefix,
      // secretAccessKey intentionally omitted
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }

  function clearDraft() {
    sessionStorage.removeItem(DRAFT_KEY)
  }

  function resetTestState() {
    setTestResult('idle')
    setTestError('')
    setOverPermissioned(false)
    setWarningAcknowledged(false)
  }

  function openAdd() {
    setFormState(emptyForm)
    setErrors({})
    setSecretVisible(false)
    setEditingId(null)
    setFormMode('add')
    setRestoredFromDraft(false)
    resetTestState()
  }

  function openEdit(source: SourceConfigItem) {
    const fields: FormState = {
      name: source.name,
      bucket: source.config.bucket,
      region: source.config.region,
      accessKeyId: source.config.accessKeyId,
      secretAccessKey: '',
      endpoint: source.config.endpoint ?? '',
      forcePathStyle: source.config.forcePathStyle ?? false,
      tlsVerify: source.config.tlsVerify ?? true,
      prefix: source.config.prefix ?? '',
    }
    setFormState(fields)
    setErrors({})
    setSecretVisible(false)
    setEditingId(source.id)
    setFormMode('edit')
    setRestoredFromDraft(false)
    resetTestState()
  }

  function closeForm() {
    clearDraft()
    setFormMode('idle')
    setEditingId(null)
    setErrors({})
    setSecretVisible(false)
    setRestoredFromDraft(false)
    resetTestState()
  }

  function setField(field: keyof FormState, value: string) {
    const next = { ...form, [field]: value }
    setFormState(next)
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    if (formMode === 'add' || formMode === 'edit') {
      saveDraft(formMode, editingId, next)
    }
    if (CREDENTIAL_FIELDS.has(field)) {
      resetTestState()
    }
  }

  function setBoolField(field: keyof FormState, value: boolean) {
    const next = { ...form, [field]: value }
    setFormState(next)
    if (formMode === 'add' || formMode === 'edit') {
      saveDraft(formMode, editingId, next)
    }
    if (CREDENTIAL_FIELDS.has(field)) {
      resetTestState()
    }
  }

  function buildConfigPayload() {
    return {
      bucket: form.bucket,
      region: form.region,
      accessKeyId: form.accessKeyId,
      secretAccessKey: form.secretAccessKey,
      endpoint: form.endpoint || undefined,
      forcePathStyle: form.forcePathStyle || undefined,
      tlsVerify: form.tlsVerify === false ? false : undefined,
      prefix: form.prefix || undefined,
    }
  }

  function validateAdd(): FormErrors | null {
    const result = sourceConfigSchema.safeParse({
      name: form.name,
      type: 'S3',
      config: buildConfigPayload(),
    })
    if (result.success) return null
    return extractErrors(result.error.issues)
  }

  function validateEdit(): FormErrors | null {
    const result = updateSourceConfigSchema.safeParse({
      name: form.name,
      type: 'S3',
      config: buildConfigPayload(),
    })
    if (result.success) return null
    return extractErrors(result.error.issues)
  }

  function validateCredentials(): string | null {
    if (!form.bucket) return 'Bucket is required'
    if (!form.region) return 'Region is required'
    if (!form.accessKeyId) return 'Access key ID is required'
    if (!form.secretAccessKey) return 'Secret access key is required to test the connection'
    return null
  }

  async function handleTestConnection() {
    const credentialError = validateCredentials()
    if (credentialError) {
      setTestError(credentialError)
      setTestResult('failed')
      return
    }

    setTestResult('pending')
    setTestError('')
    setOverPermissioned(false)
    setWarningAcknowledged(false)

    try {
      const result = await testS3ConnectionFn({
        data: {
          bucket: form.bucket,
          region: form.region,
          accessKeyId: form.accessKeyId,
          secretAccessKey: form.secretAccessKey,
          endpoint: form.endpoint || undefined,
          forcePathStyle: form.forcePathStyle || undefined,
          tlsVerify: form.tlsVerify === false ? false : undefined,
        },
      })

      if (result.success) {
        setTestResult('passed')
        setOverPermissioned(result.overPermissioned)
      } else {
        setTestResult('failed')
        setTestError(result.errorMessage ?? 'Connection test failed')
      }
    } catch (err: unknown) {
      setTestResult('failed')
      setTestError(err instanceof Error ? err.message : 'Connection test failed')
    }
  }

  const saveDisabled =
    testResult !== 'passed' || (overPermissioned && !warningAcknowledged)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saveDisabled) return

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
            config: buildConfigPayload(),
          },
        })
      } else if (formMode === 'edit' && editingId) {
        await updateSourceConfig({
          data: {
            id: editingId,
            name: form.name,
            type: 'S3',
            config: buildConfigPayload(),
          },
        })
      }
      clearDraft()
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
                    {formMode === 'edit' && !form.secretAccessKey && !restoredFromDraft && (
                      <p className="text-xs text-muted-foreground">
                        Leave blank to keep the existing secret.
                      </p>
                    )}
                    {restoredFromDraft && (
                      <p className="text-xs text-amber-600">
                        Your draft was restored, but the secret access key was not saved for
                        security reasons. Please re-enter it before testing.
                      </p>
                    )}
                    <FieldError>{errors.secretAccessKey}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.endpoint}>
                    <FieldLabel htmlFor="endpoint">Endpoint (optional)</FieldLabel>
                    <Input
                      id="endpoint"
                      value={form.endpoint}
                      onChange={(e) => setField('endpoint', e.target.value)}
                      placeholder="https://minio.example.com"
                      aria-invalid={!!errors.endpoint}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use AWS. Required for MinIO, RustFS, and other S3-compatible platforms.
                    </p>
                    <FieldError>{errors.endpoint}</FieldError>
                  </Field>

                  <div className="flex flex-col gap-3">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={form.forcePathStyle}
                        onChange={(e) => setBoolField('forcePathStyle', e.target.checked)}
                        className="mt-0.5 size-4"
                      />
                      <div>
                        <span className="text-sm font-medium">Force path-style addressing</span>
                        <p className="text-xs text-muted-foreground">
                          Required for some MinIO and RustFS configurations.
                        </p>
                      </div>
                    </label>

                    <div className="flex flex-col gap-1">
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={!form.tlsVerify}
                          onChange={(e) => setBoolField('tlsVerify', !e.target.checked)}
                          className="mt-0.5 size-4"
                        />
                        <div>
                          <span className="text-sm font-medium">Disable TLS verification</span>
                          <p className="text-xs text-muted-foreground">
                            Use only for private deployments with self-signed certificates.
                          </p>
                        </div>
                      </label>
                      {!form.tlsVerify && (
                        <div className="ml-6 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                          <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                          Disabling TLS verification exposes this connection to potential man-in-the-middle attacks. Only use this on trusted private networks.
                        </div>
                      )}
                    </div>
                  </div>

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

                  {/* Test result feedback */}
                  {testResult === 'passed' && !overPermissioned && (
                    <p className="flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle2Icon className="size-4 shrink-0" />
                      Connection successful
                    </p>
                  )}

                  {testResult === 'failed' && (
                    <p className="text-sm text-destructive">{testError}</p>
                  )}

                  {overPermissioned && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                        <div className="flex flex-col gap-2">
                          <p>
                            These credentials have permission to list <strong>all S3 buckets</strong> in the
                            account, not just <code className="rounded bg-amber-100 px-1">{form.bucket}</code>.
                            Consider using a more restrictive IAM policy scoped to this bucket only.
                          </p>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={warningAcknowledged}
                              onChange={(e) => setWarningAcknowledged(e.target.checked)}
                              className="size-4"
                            />
                            I understand and want to proceed anyway
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testResult === 'pending'}
                    >
                      {testResult === 'pending' ? (
                        <>
                          <Loader2Icon className="animate-spin" />
                          Testing…
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                    <Button type="submit" disabled={submitting || saveDisabled} size="sm">
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
                    {source.config.endpoint && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Endpoint</dt>
                        <dd className="font-mono">{source.config.endpoint}</dd>
                      </div>
                    )}
                    {source.config.prefix && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Prefix</dt>
                        <dd className="font-mono">{source.config.prefix}</dd>
                      </div>
                    )}
                  </dl>
                  {(source.config.forcePathStyle || source.config.tlsVerify === false) && (
                    <div className="mt-2 flex gap-1.5">
                      {source.config.forcePathStyle && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          Path Style
                        </span>
                      )}
                      {source.config.tlsVerify === false && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                          TLS Unverified
                        </span>
                      )}
                    </div>
                  )}
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
    else if (path === 'config.endpoint') errors.endpoint = issue.message
    else if (path === 'config.prefix') errors.prefix = issue.message
  }
  return errors
}
