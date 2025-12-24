'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

/**
 * Australian Address Autocomplete Component
 * 
 * Currently uses free Data.gov.au GNAF API
 * Can be swapped to self-hosted Addressr when deployed
 * 
 * Features:
 * - Type-ahead dropdown
 * - Auto-fill street, suburb, state, postcode
 * - Fallback to manual entry
 * - Supports PO boxes and rural addresses
 */

export default function AddressAutocomplete({ 
  prefix, // 'residential', 'postal', or 'business'
  formData, 
  updateField,
  label = "Address"
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const dropdownRef = useRef(null)

  // Initialize query from existing data
  useEffect(() => {
    const existingAddress = formData[`${prefix}_address_line_1`]
    if (existingAddress && !query) {
      setQuery(existingAddress)
      setManualEntry(true)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search for addresses using free AU data API
  const searchAddresses = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // Using free Australian address data
      // This is a placeholder - in production, use Addressr or similar
      const response = await fetch(`/api/address-search?q=${encodeURIComponent(searchQuery)}`)
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } else {
        // Fallback: generate sample suggestions based on query
        setSuggestions([])
      }
    } catch (error) {
      console.error('Address search error:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (manualEntry) return
    
    const timeoutId = setTimeout(() => {
      if (query) {
        searchAddresses(query)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, manualEntry])

  const handleQueryChange = (value) => {
    setQuery(value)
    setShowDropdown(true)
    setManualEntry(false)
    updateField(`${prefix}_address_line_1`, value)
  }

  const selectAddress = (address) => {
    // Auto-fill all fields
    updateField(`${prefix}_address_line_1`, address.street)
    updateField(`${prefix}_address_line_2`, address.line2 || '')
    updateField(`${prefix}_address_location`, address.suburb)
    updateField(`${prefix}_address_state`, address.state)
    updateField(`${prefix}_address_postcode`, address.postcode)
    
    setQuery(address.street)
    setShowDropdown(false)
    setManualEntry(true)
  }

  const enableManualEntry = () => {
    setManualEntry(true)
    setShowDropdown(false)
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium mb-2">
          {label} *
          {!manualEntry && (
            <span className="text-xs text-gray-500 ml-2">(Start typing to search)</span>
          )}
        </label>
        
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Start typing your street address..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            onFocus={() => !manualEntry && setShowDropdown(true)}
          />
          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          {loading && (
            <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Dropdown Suggestions */}
        {showDropdown && !manualEntry && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectAddress(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">{suggestion.street}</div>
                <div className="text-xs text-gray-500">
                  {suggestion.suburb}, {suggestion.state} {suggestion.postcode}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Manual Entry Toggle */}
        {!manualEntry && (
          <button
            type="button"
            onClick={enableManualEntry}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Can't find your address? Enter manually
          </button>
        )}
      </div>

      {/* Manual Entry Fields */}
      {manualEntry && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
            <input
              value={formData[`${prefix}_address_line_1`] || ''}
              onChange={(e) => updateField(`${prefix}_address_line_1`, e.target.value)}
              placeholder="123 Main Street"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Address Line 2 <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={formData[`${prefix}_address_line_2`] || ''}
              onChange={(e) => updateField(`${prefix}_address_line_2`, e.target.value)}
              placeholder="Unit 5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Suburb/City *</label>
              <input
                value={formData[`${prefix}_address_location`] || ''}
                onChange={(e) => updateField(`${prefix}_address_location`, e.target.value)}
                placeholder="Sydney"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State *</label>
              <select
                value={formData[`${prefix}_address_state`] || ''}
                onChange={(e) => updateField(`${prefix}_address_state`, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select</option>
                {['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'].map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium mb-2">Postcode *</label>
            <input
              type="tel"
              inputMode="numeric"
              value={formData[`${prefix}_address_postcode`] || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                updateField(`${prefix}_address_postcode`, value)
              }}
              placeholder="2000"
              maxLength={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setManualEntry(false)
              setQuery('')
            }}
            className="text-xs text-primary hover:underline"
          >
            ← Back to address search
          </button>
        </>
      )}
    </div>
  )
}
