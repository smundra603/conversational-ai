import Button from 'components/common/Button'
import { useAgentManagement } from 'hooks/useAgentManagement'
import React from 'react'
import AddAgentModal from './AddAgentModal'
import EditAgentModal from './EditAgentModal'
import Filters from './Filters'
import Grid from './Grid'

const Agent = () => {
  const {
    providers,
    agents,
    loading,
    error,
    search,
    setSearch,
    primaryProvider,
    setPrimaryProvider,
    fallbackProvider,
    setFallbackProvider,
    adding,
    addError,
    addAgent,
    editAgent,
    updatingId,
    updateError
  } = useAgentManagement()

  // Add Agent modal state
  const [addOpen, setAddOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingAgent, setEditingAgent] = React.useState<
    null | (typeof agents)[number]
  >(null)

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Controls row */}
        <div className="mb-4 flex items-center justify-between">
          <Filters
            search={search}
            onSearchChange={setSearch}
            primaryProvider={primaryProvider}
            onPrimaryChange={setPrimaryProvider}
            fallbackProvider={fallbackProvider}
            onFallbackChange={setFallbackProvider}
            providers={providers}
          />
          <div>
            <Button onClick={() => setAddOpen(true)}>Add Agent</Button>
          </div>
        </div>

        {/* Content */}
        <Grid
          agents={agents}
          loading={loading}
          error={error}
          onAddAgent={() => setAddOpen(true)}
          onEditAgent={(agent) => {
            setEditingAgent(agent)
            setEditOpen(true)
          }}
        />
      </div>

      <AddAgentModal
        isOpen={addOpen}
        providers={providers}
        adding={adding}
        addError={addError}
        onAdd={addAgent}
        onClose={() => setAddOpen(false)}
      />
      <EditAgentModal
        isOpen={editOpen}
        agent={editingAgent}
        providers={providers}
        updating={!!updatingId}
        error={updateError}
        onSave={async (id, updates) => {
          // ensure empty string becomes undefined for fallbackProvider to unset
          if (updates.fallbackProvider === '') {
            updates.fallbackProvider = undefined
          }
          await editAgent(id, updates)
        }}
        onClose={() => setEditOpen(false)}
      />
    </div>
  )
}

export default Agent
