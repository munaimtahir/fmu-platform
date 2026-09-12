import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { Switch } from '@/components/ui/Switch'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import type { PaginationState } from '@/components/ui/DataTable/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FormSection } from '@/components/ui/FormSection'
import { Modal } from '@/components/ui/Modal'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { syllabusApi, type SyllabusItem, type CreateSyllabusItemData } from '@/api/syllabus'
import { academicsNewService } from '@/services/academicsNew'

const EMPTY_ITEM_FORM_DATA: CreateSyllabusItemData = {
  title: '',
  order_no: 1,
  is_active: true,
}

/**
 * Syllabus Manager Page - Admin can manage syllabus items
 */
export const SyllabusManagerPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<{
    program_id?: number
    period_id?: number
    learning_block_id?: number
    module_id?: number
    is_active?: boolean
  }>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateSyllabusItemData>(EMPTY_ITEM_FORM_DATA)

  useUnsavedChangesWarning(showForm)

  const updateFilters = (next: typeof filters) => {
    setFilters(next)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  // Fetch programs for filter
  const { data: programs } = useQuery({
    queryKey: ['academics-programs'],
    queryFn: () => academicsNewService.getPrograms({ is_active: true }),
  })

  // Fetch periods when program is selected
  const { data: periods } = useQuery({
    queryKey: ['academics-periods', filters.program_id],
    queryFn: () => academicsNewService.getPeriods({ program: filters.program_id }),
    enabled: !!filters.program_id,
  })

  // Fetch learning blocks when period is selected
  const { data: learningBlocks } = useQuery({
    queryKey: ['academics-blocks', filters.period_id],
    queryFn: async () => {
      if (!filters.period_id) return []
      // Get all tracks for the program, then get blocks
      const program = programs?.find(p => p.id === filters.program_id)
      if (!program) return []
      const tracks = await academicsNewService.getTracks({ program: program.id })
      const allBlocks: any[] = []
      for (const track of tracks) {
        const blocks = await academicsNewService.getBlocks({
          period: filters.period_id,
          track: track.id,
        })
        allBlocks.push(...blocks)
      }
      return allBlocks
    },
    enabled: !!filters.period_id && !!filters.program_id,
  })

  // Fetch modules when learning block is selected
  const { data: modules } = useQuery({
    queryKey: ['academics-modules', filters.learning_block_id],
    queryFn: () => academicsNewService.getModules({ block: filters.learning_block_id }),
    enabled: !!filters.learning_block_id,
  })

  // Fetch syllabus items (server-side pagination; the backend already
  // orders by order_no/title, and every filter here is a real query param,
  // so a page always reflects the current filtered result set).
  const { data: syllabusData, isLoading } = useQuery({
    queryKey: ['syllabus-items', filters, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      syllabusApi.getAll({
        ...filters,
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
      }),
    placeholderData: (previousData) => previousData,
  })

  const syllabusItems = syllabusData?.results || []
  const totalCount = syllabusData?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize))

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: CreateSyllabusItemData) => {
      if (editingItem) {
        return syllabusApi.update(editingItem.id, data)
      }
      return syllabusApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus-items'] })
      setShowForm(false)
      setEditingItem(null)
      setFormData(EMPTY_ITEM_FORM_DATA)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => syllabusApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus-items'] })
    },
  })

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (items: Array<{ id: number; order_no: number }>) =>
      syllabusApi.reorder({ items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus-items'] })
    },
  })

  const handleEdit = (item: SyllabusItem) => {
    setEditingItem(item)
    setFormData({
      program: item.program,
      period: item.period,
      learning_block: item.learning_block,
      module: item.module,
      title: item.title,
      code: item.code,
      description: item.description,
      learning_objectives: item.learning_objectives,
      order_no: item.order_no,
      is_active: item.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this syllabus item?')) {
      deleteMutation.mutate(id)
    }
  }

  // Note: reordering only considers items on the currently loaded page.
  // In practice the anchor filters (program/period/block/module) above
  // narrow the working set to a single small anchor group before reordering
  // is used, so this rarely spans a page boundary — but a sibling item that
  // has scrolled onto another page won't be found here.
  const handleMoveUp = (item: SyllabusItem) => {
    const filtered = syllabusItems.filter(
      i =>
        (item.program && i.program === item.program) ||
        (item.period && i.period === item.period) ||
        (item.learning_block && i.learning_block === item.learning_block) ||
        (item.module && i.module === item.module)
    )
    const sorted = [...filtered].sort((a, b) => a.order_no - b.order_no)
    const index = sorted.findIndex(i => i.id === item.id)
    if (index > 0) {
      const prev = sorted[index - 1]
      reorderMutation.mutate([
        { id: item.id, order_no: prev.order_no },
        { id: prev.id, order_no: item.order_no },
      ])
    }
  }

  const handleMoveDown = (item: SyllabusItem) => {
    const filtered = syllabusItems.filter(
      i =>
        (item.program && i.program === item.program) ||
        (item.period && i.period === item.period) ||
        (item.learning_block && i.learning_block === item.learning_block) ||
        (item.module && i.module === item.module)
    )
    const sorted = [...filtered].sort((a, b) => a.order_no - b.order_no)
    const index = sorted.findIndex(i => i.id === item.id)
    if (index < sorted.length - 1) {
      const next = sorted[index + 1]
      reorderMutation.mutate([
        { id: item.id, order_no: next.order_no },
        { id: next.id, order_no: item.order_no },
      ])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  const resetFilters = () => {
    updateFilters({})
  }

  const getAnchorDisplay = (item: SyllabusItem) => {
    if (item.module_name) return `Module: ${item.module_name}`
    if (item.learning_block_name) return `Block: ${item.learning_block_name}`
    if (item.period_name) return `Period: ${item.period_name}`
    if (item.program_name) return `Program: ${item.program_name}`
    return 'N/A'
  }

  const columns = useMemo<ColumnDef<SyllabusItem>[]>(
    () => [
      {
        accessorKey: 'order_no',
        header: 'Order',
      },
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        id: 'code',
        header: 'Code',
        accessorFn: (item) => item.code || '-',
      },
      {
        id: 'anchor',
        header: 'Anchor',
        accessorFn: (item) => getAnchorDisplay(item),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge domain="record" status={row.original.is_active ? 'Active' : 'Inactive'} />
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleMoveUp(item)}
                disabled={reorderMutation.isPending}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleMoveDown(item)}
                disabled={reorderMutation.isPending}
              >
                ↓
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(item.id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [reorderMutation.isPending, deleteMutation.isPending]
  )

  return (
    
      <PageShell title="Syllabus Manager" description="Manage syllabus items for academic programs">
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <div className="p-6">
              <h2 className="text-h4 text-ink-primary mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select
                  label="Program"
                  value={filters.program_id?.toString() || ''}
                  onChange={(value) => {
                    const programId = value ? Number(value) : undefined
                    updateFilters({
                      program_id: programId,
                      period_id: undefined,
                      learning_block_id: undefined,
                      module_id: undefined,
                    })
                  }}
                  options={[
                    { value: '', label: 'All Programs' },
                    ...(programs?.map((p) => ({
                      value: p.id.toString(),
                      label: p.name,
                    })) || []),
                  ]}
                />

                <Select
                  label="Period"
                  value={filters.period_id?.toString() || ''}
                  onChange={(value) => {
                    const periodId = value ? Number(value) : undefined
                    updateFilters({
                      ...filters,
                      period_id: periodId,
                      learning_block_id: undefined,
                      module_id: undefined,
                    })
                  }}
                  disabled={!filters.program_id}
                  options={[
                    { value: '', label: 'All Blocks' },
                    ...(periods?.map((p) => ({
                      value: p.id.toString(),
                      label: p.name,
                    })) || []),
                  ]}
                />

                <Select
                  label="Learning Block"
                  value={filters.learning_block_id?.toString() || ''}
                  onChange={(value) => {
                    const blockId = value ? Number(value) : undefined
                    updateFilters({
                      ...filters,
                      learning_block_id: blockId,
                      module_id: undefined,
                    })
                  }}
                  disabled={!filters.period_id}
                  options={[
                    { value: '', label: 'All Blocks' },
                    ...(learningBlocks?.map((b: any) => ({
                      value: b.id.toString(),
                      label: b.name,
                    })) || []),
                  ]}
                />

                <Select
                  label="Module"
                  value={filters.module_id?.toString() || ''}
                  onChange={(value) => {
                    const moduleId = value ? Number(value) : undefined
                    updateFilters({ ...filters, module_id: moduleId })
                  }}
                  disabled={!filters.learning_block_id}
                  options={[
                    { value: '', label: 'All Modules' },
                    ...(modules?.map((m: any) => ({
                      value: m.id.toString(),
                      label: m.name,
                    })) || []),
                  ]}
                />

                <div className="flex items-end">
                  <Button variant="secondary" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h4 text-ink-primary">Syllabus Items</h2>
                <Button onClick={() => {
                  setEditingItem(null)
                  setFormData(EMPTY_ITEM_FORM_DATA)
                  setShowForm(true)
                }}>
                  Add Syllabus Item
                </Button>
              </div>

              <DataTable
                data={syllabusItems}
                columns={columns}
                isLoading={isLoading}
                manualPagination
                pageCount={pageCount}
                totalCount={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            </div>
          </Card>

          {/* Create/Edit Form Modal */}
          {showForm && (
            <Modal
              title={editingItem ? 'Edit Syllabus Item' : 'Create Syllabus Item'}
              size="lg"
              onClose={() => {
                setShowForm(false)
                setEditingItem(null)
                setFormData(EMPTY_ITEM_FORM_DATA)
              }}
            >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <FormSection title="Anchor" description="Where this syllabus item lives in the program's curriculum structure.">
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Program"
                        value={formData.program?.toString() || ''}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            program: value ? Number(value) : undefined,
                            period: undefined,
                            learning_block: undefined,
                            module: undefined,
                          })
                        }
                        options={[
                          { value: '', label: 'Select Program' },
                          ...(programs?.map((p) => ({
                            value: p.id.toString(),
                            label: p.name,
                          })) || []),
                        ]}
                      />

                      <Select
                        label="Period"
                        value={formData.period?.toString() || ''}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            period: value ? Number(value) : undefined,
                            learning_block: undefined,
                            module: undefined,
                          })
                        }
                        disabled={!formData.program}
                        options={[
                          { value: '', label: 'Select Period' },
                          ...(periods?.map((p) => ({
                            value: p.id.toString(),
                            label: p.name,
                          })) || []),
                        ]}
                      />

                      <Select
                        label="Learning Block"
                        value={formData.learning_block?.toString() || ''}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            learning_block: value ? Number(value) : undefined,
                            module: undefined,
                          })
                        }
                        disabled={!formData.period}
                        options={[
                          { value: '', label: 'Select Block' },
                          ...(learningBlocks?.map((b: any) => ({
                            value: b.id.toString(),
                            label: b.name,
                          })) || []),
                        ]}
                      />

                      <Select
                        label="Module"
                        value={formData.module?.toString() || ''}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            module: value ? Number(value) : undefined,
                          })
                        }
                        disabled={!formData.learning_block}
                        options={[
                          { value: '', label: 'Select Module' },
                          ...(modules?.map((m: any) => ({
                            value: m.id.toString(),
                            label: m.name,
                          })) || []),
                        ]}
                      />
                    </div>
                    </FormSection>

                    <FormSection title="Content">
                    <Input
                      label="Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />

                    <Input
                      label="Code"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />

                    <TextArea
                      label="Description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />

                    <TextArea
                      label="Learning Objectives"
                      value={formData.learning_objectives || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, learning_objectives: e.target.value })
                      }
                      rows={4}
                    />
                    </FormSection>

                    <FormSection title="Order & Status">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Order Number"
                        type="number"
                        min="1"
                        value={formData.order_no}
                        onChange={(e) =>
                          setFormData({ ...formData, order_no: Number(e.target.value) })
                        }
                        required
                      />

                      <div className="flex items-center pt-6">
                        <Switch
                          label="Active"
                          checked={formData.is_active ?? true}
                          onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                      </div>
                    </div>
                    </FormSection>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowForm(false)
                          setEditingItem(null)
                          setFormData(EMPTY_ITEM_FORM_DATA)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
            </Modal>
          )}
        </div>
      </PageShell>
    
  )
}
