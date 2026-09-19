import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiErrorMessage } from '@/lib/apiErrors'
import { downloadFile } from '@/lib/download'
import { fileNameFromUrl, sameOriginPath } from '@/lib/mediaUrl'
import { availabilityOf, formatFileSize, isSafeExternalUrl, learningService, type LearningMaterial } from '@/services/learning'

const MaterialCard: React.FC<{ material: LearningMaterial }> = ({ material }) => {
  const availability = availabilityOf(material)
  const download = async () => {
    const path = sameOriginPath(material.file)
    if (!path) return
    await downloadFile(path, { filename: fileNameFromUrl(material.file, material.title) })
  }
  return <Card>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-h4 text-ink-primary">{material.title}</h2>{material.description && <p className="mt-1 text-sm text-ink-secondary whitespace-pre-wrap">{material.description}</p>}</div><Badge variant={material.kind === 'FILE' ? 'info' : 'primary'}>{material.kind === 'FILE' ? 'File' : 'Link'}</Badge></div>
    <p className="mt-4 text-sm text-ink-muted">{availability.message ?? 'Available now'}</p>
    <div className="mt-4 flex flex-wrap gap-2">{material.kind === 'FILE' && material.file && <Button size="sm" onClick={download}>Download {formatFileSize(material.size_bytes) && `(${formatFileSize(material.size_bytes)})`}</Button>}{material.kind === 'LINK' && material.url && isSafeExternalUrl(material.url) && <a className="inline-flex items-center rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white" href={material.url} target="_blank" rel="noopener noreferrer">Open link</a>}</div>
  </Card>
}

export const LearningFeedPage: React.FC = () => {
  const query = useQuery({ queryKey: ['learning-feed'], queryFn: () => learningService.getFeed() })
  if (query.isLoading) return <LoadingState message="Loading your learning materials..." />
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error, 'Could not load your learning materials.')} onRetry={() => query.refetch()} />
  return <PageShell title="My Learning" description="Published materials shared with you.">{query.data?.length ? <div className="space-y-4">{query.data.map((material) => <MaterialCard key={material.id} material={material} />)}</div> : <EmptyState icon="📚" title="No learning materials" description="Published materials for your enrolled sections will appear here." />}</PageShell>
}
