import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Loader2Icon, CheckCircle2Icon, AlertTriangleIcon, AudioLinesIcon } from 'lucide-react'

import { auth } from '@/lib/auth'
import { prisma } from '@/db'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

// ─── Constants ───────────────────────────────────────────────────────────────

const AUDIO_EXTENSIONS = new Set([
  'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'opus', 'wma', 'webm',
])

// ─── Server function ─────────────────────────────────────────────────────────

type FileInfo = {
  key: string
  lastModified: string
  size: number
  format: string
  isAudio: boolean
}

type AnalysisResult =
  | { status: 'no_source' }
  | { status: 'error'; message: string }
  | { status: 'ok'; files: FileInfo[]; isTruncated: boolean }

const listS3AudioFiles = createServerFn({ method: 'POST' }).handler(
  async (): Promise<AnalysisResult> => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    const sourceConfig = await prisma.sourceConfig.findFirst({
      where: { userId: session.user.id, type: 'S3' },
      orderBy: { createdAt: 'desc' },
    })

    if (!sourceConfig) {
      return { status: 'no_source' }
    }

    const cfg = sourceConfig.config as Record<string, unknown>
    const bucket = cfg.bucket as string
    const region = cfg.region as string
    const accessKeyId = cfg.accessKeyId as string
    const secretAccessKey = cfg.secretAccessKey as string
    const endpoint = cfg.endpoint as string | undefined
    const forcePathStyle = cfg.forcePathStyle as boolean | undefined
    const tlsVerify = cfg.tlsVerify as boolean | undefined
    const prefix = cfg.prefix as string | undefined

    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3')

    let requestHandler: unknown
    if (tlsVerify === false) {
      const https = await import('https')
      const { NodeHttpHandler } = await import('@smithy/node-http-handler')
      requestHandler = new NodeHttpHandler({
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      })
    }

    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint } : {}),
      ...(forcePathStyle ? { forcePathStyle: true } : {}),
      ...(requestHandler ? { requestHandler } : {}),
    })

    try {
      const response = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
      )

      const files: FileInfo[] = (response.Contents ?? []).map((obj) => {
        const key = obj.Key ?? ''
        const dotIndex = key.lastIndexOf('.')
        const ext = dotIndex >= 0 ? key.slice(dotIndex + 1).toLowerCase() : ''
        const isAudio = ext !== '' && AUDIO_EXTENSIONS.has(ext)
        return {
          key,
          lastModified: obj.LastModified?.toISOString() ?? '',
          size: obj.Size ?? 0,
          format: isAudio ? ext.toUpperCase() : ext === '' ? 'Unknown' : ext.toUpperCase(),
          isAudio,
        }
      })

      return { status: 'ok', files, isTruncated: response.IsTruncated ?? false }
    } catch (err: unknown) {
      const e = err as { message?: string }
      return { status: 'error', message: e.message ?? 'Failed to list S3 objects' }
    }
  },
)

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_authenticated/jobs/s3-audio-analysis')({
  component: S3AudioAnalysisPage,
})

// ─── Component ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

function S3AudioAnalysisPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await listS3AudioFiles()
      setResult(res)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setResult({ status: 'error', message: e.message ?? 'Unexpected error' })
    } finally {
      setLoading(false)
    }
  }

  const nonAudioCount =
    result?.status === 'ok'
      ? result.files.filter((f) => !f.isAudio).length
      : 0
  const allAudio =
    result?.status === 'ok' && result.files.length > 0 && nonAudioCount === 0

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/jobs/s3-audio-analysis">Jobs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>S3 Audio Analysis</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div>
          <h1 className="text-lg font-semibold">S3 Audio Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Verify that all files in your S3 bucket are audio files and ready for transcription.
          </p>
        </div>

        {/* No source configured */}
        {result?.status === 'no_source' && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">No S3 source configured yet.</p>
            <Button asChild size="sm" variant="outline">
              <Link to="/settings/sources">Go to Settings → Sources</Link>
            </Button>
          </div>
        )}

        {/* Error state */}
        {result?.status === 'error' && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            {result.message}
          </div>
        )}

        {/* Truncation notice */}
        {result?.status === 'ok' && result.isTruncated && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            Showing first 1000 files — bucket may contain more.
          </div>
        )}

        {/* Readiness summary */}
        {result?.status === 'ok' && result.files.length > 0 && (
          <div
            className={`flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${
              allAudio
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-amber-300 bg-amber-50 text-amber-800'
            }`}
          >
            {allAudio ? (
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            )}
            {allAudio
              ? `All ${result.files.length} files are audio — ready for transcription.`
              : `${nonAudioCount} non-audio ${nonAudioCount === 1 ? 'file' : 'files'} found. Remove or convert them before transcription.`}
          </div>
        )}

        {/* Empty bucket */}
        {result?.status === 'ok' && result.files.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <AudioLinesIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No files found in bucket.</p>
          </div>
        )}

        {/* Run button */}
        {result?.status !== 'no_source' && (
          <div>
            <Button onClick={runAnalysis} disabled={loading} size="sm">
              {loading ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Analysing…
                </>
              ) : (
                'Run Analysis'
              )}
            </Button>
          </div>
        )}

        {/* Results table */}
        {result?.status === 'ok' && result.files.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Filename</th>
                  <th className="px-4 py-2 font-medium">Created (UTC)</th>
                  <th className="px-4 py-2 font-medium">Size</th>
                  <th className="px-4 py-2 font-medium">Format</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.files.map((file) => (
                  <tr
                    key={file.key}
                    className={`border-b last:border-0 ${
                      file.isAudio ? '' : 'bg-amber-50/60'
                    }`}
                  >
                    <td className="max-w-xs truncate px-4 py-2 font-mono text-xs">
                      {file.key}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-muted-foreground">
                      {formatDate(file.lastModified)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-muted-foreground">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {file.format}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {file.isAudio ? (
                        <span className="flex items-center gap-1 text-green-700">
                          <CheckCircle2Icon className="size-3.5" />
                          Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700">
                          <AlertTriangleIcon className="size-3.5" />
                          Not audio
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
