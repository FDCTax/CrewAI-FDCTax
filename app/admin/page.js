'use client'

import { useState, useEffect } from 'react'
import { Search, Download, Trash2, Eye, Loader2, Users, UserPlus } from 'lucide-react'

export default function AdminConsole() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClients, setSelectedClients] = useState([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [search])

  const fetchClients = async () => {
    try {
      const response = await fetch(`/api/clients?search=${encodeURIComponent(search)}`)
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClients(clients.map(c => c.system_id))
    } else {
      setSelectedClients([])
    }
  }

  const handleSelectClient = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId))
    } else {
      setSelectedClients([...selectedClients, clientId])
    }
  }

  const exportToLodgeiT = async () => {
    if (selectedClients.length === 0) {
      alert('Please select at least one client to export')
      return
    }

    setExporting(true)
    try {
      const response = await fetch('/api/clients/export-lodgeit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_ids: selectedClients })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `lodgeit_export_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Export failed')
      }
    } catch (error) {
      alert('Export error: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const deleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchClients()
      } else {
        alert('Delete failed')
      }
    } catch (error) {
      alert('Delete error: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                <p className="text-sm text-gray-600">FDC Tax Luna Onboarding</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-primary/10 rounded-lg">
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-primary">{clients.length}</p>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={exportToLodgeiT}
              disabled={selectedClients.length === 0 || exporting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export to LodgeiT ({selectedClients.length})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Client Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No clients found</p>
              <p className="text-sm text-gray-500">Clients will appear here once they complete Luna onboarding</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedClients.length === clients.length}
                        onChange={handleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ABN</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.system_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.system_id)}
                          onChange={() => handleSelectClient(client.system_id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{client.system_id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.casual_name || client.first_name}</p>
                          <p className="text-xs text-gray-500">{client.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.mobile}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.abn || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(client.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/luna/client/${client.uuid}`, '_blank')}
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteClient(client.system_id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>FDC Tax Luna Onboarding Admin Console • Sandbox Environment</p>
        </div>
      </div>
    </div>
  )
}
