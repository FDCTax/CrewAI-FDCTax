'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2, Building2, CreditCard, Car, Home, Smartphone, Wifi, FileCheck, Shield, UserCheck } from 'lucide-react'
import AddressAutocomplete from '@/components/AddressAutocomplete'

const AUSTRALIAN_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']
const TITLES = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof']

export default function LunaOnboarding() {
  const [stage, setStage] = useState(1)
  const [formData, setFormData] = useState({
    is_sole_trader: 'Y',
    has_abn: '',
    used_accountant_previously: '',
    deduction_profile: {}
  })
  const [validations, setValidations] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [postalSameAsResidential, setPostalSameAsResidential] = useState(true)

  const progress = (stage / 9) * 100

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validations[field]) {
      setValidations(prev => ({ ...prev, [field]: null }))
    }
  }

  const updateDeduction = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deduction_profile: { ...prev.deduction_profile, [field]: value }
    }))
  }

  const validateTFN = async (tfn) => {
    if (!tfn) return
    
    // Clean: remove all non-digits
    const cleanTFN = tfn.replace(/\D/g, '')
    
    // Check length first
    if (cleanTFN.length === 0) return
    if (cleanTFN.length !== 9) {
      setValidations(prev => ({
        ...prev,
        tfn: { valid: false, message: 'TFN must be 9 digits', loading: false }
      }))
      return
    }
    
    setValidations(prev => ({ ...prev, tfn: { loading: true } }))
    
    try {
      const response = await fetch('/api/validate-tfn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tfn: cleanTFN })
      })
      
      const data = await response.json()
      
      setValidations(prev => ({
        ...prev,
        tfn: { valid: data.valid, message: data.message, loading: false }
      }))
    } catch (error) {
      setValidations(prev => ({
        ...prev,
        tfn: { valid: false, message: 'Validation error', loading: false }
      }))
    }
  }

  const validateABN = async (abn) => {
    if (!abn || abn.replace(/\s/g, '').length !== 11) return
    
    setValidations(prev => ({ ...prev, abn: { loading: true } }))
    
    try {
      const response = await fetch('/api/validate-abn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abn: abn.replace(/\s/g, '') })
      })
      
      const data = await response.json()
      
      setValidations(prev => ({
        ...prev,
        abn: { valid: data.valid, message: data.message, loading: false }
      }))
    } catch (error) {
      setValidations(prev => ({
        ...prev,
        abn: { valid: false, message: 'Validation error', loading: false }
      }))
    }
  }

  // Auto-prefill preferred name from first name (full name, not just first letter)
  useEffect(() => {
    // Only auto-fill if casual_name is empty or hasn't been manually edited
    if (formData.first_name && !formData.casual_name_edited) {
      updateField('casual_name', formData.first_name)
    }
  }, [formData.first_name])

  useEffect(() => {
    if (formData.tfn) {
      const timeoutId = setTimeout(() => validateTFN(formData.tfn), 500)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.tfn])

  useEffect(() => {
    if (formData.abn) {
      const timeoutId = setTimeout(() => validateABN(formData.abn), 500)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.abn])

  useEffect(() => {
    if (postalSameAsResidential) {
      setFormData(prev => ({
        ...prev,
        postal_address_line_1: prev.residential_address_line_1,
        postal_address_line_2: prev.residential_address_line_2,
        postal_address_location: prev.residential_address_location,
        postal_address_state: prev.residential_address_state,
        postal_address_postcode: prev.residential_address_postcode,
      }))
    }
  }, [postalSameAsResidential, formData.residential_address_line_1, formData.residential_address_location, formData.residential_address_state, formData.residential_address_postcode])

  const nextStage = () => {
    setStage(prev => Math.min(prev + 1, 9))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStage = () => {
    setStage(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      window.location.href = `/luna/success?uuid=${data.uuid}`
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Progress Bar */}
      <div className="fixed top-11 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="container mx-auto px-4 py-3">
          <p className="text-sm text-gray-600 text-center">
            Stage {stage} of 9 • {Math.round(progress)}% Complete
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-32 max-w-2xl">
        {/* Stage 1: Welcome */}
        {stage === 1 && (
          <div className="bg-white rounded-xl shadow-xl border-2 border-primary/20 p-8 md:p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Hi! I'm Luna 👋
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                I'll help you get set up with FDC Tax in about 8–10 minutes. Let's make this easy!
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-2">What you'll need:</p>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>✓ Tax File Number</li>
                  <li>✓ ABN (if you have one)</li>
                  <li>✓ Bank account details</li>
                  <li>✓ ID for verification (Driver's License or Passport)</li>
                </ul>
              </div>
              <button 
                onClick={nextStage}
                className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-lg font-semibold flex items-center justify-center"
              >
                Let's Get Started <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 2: Personal Details */}
        {stage === 2 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's start with your details</h2>
              <p className="text-gray-600">Tell me about yourself</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <select
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {TITLES.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  value={formData.first_name || ''}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Middle Name(s) <span className="text-gray-400">(optional)</span></label>
                <input
                  value={formData.middle_name || ''}
                  onChange={(e) => updateField('middle_name', e.target.value)}
                  placeholder="Middle names"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <input
                  value={formData.last_name || ''}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Name *</label>
                <input
                  value={formData.casual_name || ''}
                  onChange={(e) => {
                    updateField('casual_name', e.target.value)
                    // Mark as manually edited so auto-fill won't override
                    updateField('casual_name_edited', true)
                  }}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">This is how we'll address you in emails</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender *</label>
                <div className="flex gap-4">
                  {['Male', 'Female', 'Other'].map(g => (
                    <label key={g} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={formData.gender === g}
                        onChange={() => updateField('gender', g)}
                        className="mr-2"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax File Number (TFN) *</label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formData.tfn || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9]/g, '')
                      if (value.length > 9) value = value.slice(0, 9)
                      
                      // Auto-format: add spaces after 3rd and 6th digit
                      if (value.length > 6) {
                        value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6)
                      } else if (value.length > 3) {
                        value = value.slice(0, 3) + ' ' + value.slice(3)
                      }
                      
                      updateField('tfn', value)
                    }}
                    placeholder="000 000 000"
                    maxLength={11}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      validations.tfn?.valid === true ? 'border-green-500' : ''
                    } ${validations.tfn?.valid === false ? 'border-red-500' : ''}`}
                  />
                  {validations.tfn?.loading && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {validations.tfn?.valid === true && (
                    <Check className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                  )}
                  {validations.tfn?.valid === false && (
                    <AlertCircle className="absolute right-3 top-3 w-4 h-4 text-red-500" />
                  )}
                </div>
                {validations.tfn?.message && (
                  <p className={`text-xs mt-1 ${validations.tfn.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {validations.tfn.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">9 digits • Auto-formats as you type • We validate with the ATO</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  <strong>🔒 Your data is secure:</strong> Your TFN is encrypted and stored securely. We're TPB registered.
                </p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pt-4">Residential Address</h3>

              <AddressAutocomplete
                prefix="residential"
                formData={formData}
                updateField={updateField}
                label="Your Home Address"
              />

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Postal Address</h3>
                
                <label className="flex items-center cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={postalSameAsResidential}
                    onChange={(e) => setPostalSameAsResidential(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Same as residential address</span>
                </label>

                {!postalSameAsResidential && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 mb-3">Enter your postal/mailing address:</p>
                    
                    <AddressAutocomplete
                      prefix="postal"
                      formData={formData}
                      updateField={updateField}
                      label="Postal Address"
                    />
                  </div>
                )}

                {postalSameAsResidential && (
                  <p className="text-sm text-gray-600 italic">
                    ✓ Postal address will be the same as your residential address
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStage} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={nextStage} 
                disabled={
                  !formData.first_name || 
                  !formData.last_name || 
                  !formData.casual_name || 
                  !formData.birth_date || 
                  !formData.gender || 
                  !formData.tfn || 
                  validations.tfn?.valid !== true ||
                  !formData.residential_address_line_1 ||
                  !formData.residential_address_location ||
                  !formData.residential_address_state ||
                  !formData.residential_address_postcode ||
                  (!postalSameAsResidential && (!formData.postal_address_line_1 || !formData.postal_address_location || !formData.postal_address_state || !formData.postal_address_postcode))
                }
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: Contact Details */}
        {stage === 3 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How can we reach you?</h2>
              <p className="text-gray-600">Your contact information</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">We'll send all correspondence here</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.mobile || ''}
                  onChange={(e) => {
                    // Remove all non-digits
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length > 10) value = value.slice(0, 10)
                    
                    // Auto-format: 0400 000 000
                    if (value.length > 7) {
                      value = value.slice(0, 4) + ' ' + value.slice(4, 7) + ' ' + value.slice(7)
                    } else if (value.length > 4) {
                      value = value.slice(0, 4) + ' ' + value.slice(4)
                    }
                    
                    updateField('mobile', value)
                  }}
                  placeholder="0400 000 000"
                  maxLength={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Australian mobile number</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alternate Phone <span className="text-gray-400">(optional)</span></label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone || ''}
                  onChange={(e) => {
                    // Remove all non-digits
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length > 10) value = value.slice(0, 10)
                    
                    // Smart format: detects mobile (04xx) vs landline (02/03/07/08)
                    if (value.startsWith('04') && value.length > 4) {
                      // Mobile format: 0400 000 000
                      if (value.length > 7) {
                        value = value.slice(0, 4) + ' ' + value.slice(4, 7) + ' ' + value.slice(7)
                      } else {
                        value = value.slice(0, 4) + ' ' + value.slice(4)
                      }
                    } else if (value.length > 2) {
                      // Landline format: 02 1234 5678
                      if (value.length > 6) {
                        value = value.slice(0, 2) + ' ' + value.slice(2, 6) + ' ' + value.slice(6)
                      } else {
                        value = value.slice(0, 2) + ' ' + value.slice(2)
                      }
                    }
                    
                    updateField('phone', value)
                  }}
                  placeholder="02 1234 5678"
                  maxLength={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Home or work number (mobile or landline)</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStage} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={nextStage} 
                disabled={!formData.email || !formData.mobile}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 4: Business Details */}
        {stage === 4 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's talk about your business</h2>
              <p className="text-gray-600">Your Family Day Care setup</p>
            </div>

            <div className="space-y-6">
              {/* ABN Question */}
              <div>
                <label className="block text-sm font-medium mb-3">Do you have an ABN (Australian Business Number)? *</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="has_abn"
                      checked={formData.has_abn === 'yes'}
                      onChange={() => {
                        updateField('has_abn', 'yes')
                        updateField('abn_assistance', '')
                      }}
                      className="mr-3"
                    />
                    <span className="font-medium">Yes, I have an ABN</span>
                  </label>
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="has_abn"
                      checked={formData.has_abn === 'no'}
                      onChange={() => updateField('has_abn', 'no')}
                      className="mr-3"
                    />
                    <span className="font-medium">No, I don't have an ABN</span>
                  </label>
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="has_abn"
                      checked={formData.has_abn === 'unsure'}
                      onChange={() => updateField('has_abn', 'unsure')}
                      className="mr-3"
                    />
                    <span className="font-medium">I'm not sure</span>
                  </label>
                </div>
              </div>

              {/* ABN Entry (if Yes) */}
              {formData.has_abn === 'yes' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Please enter your ABN *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.abn || ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9]/g, '')
                        if (value.length > 11) value = value.slice(0, 11)
                        
                        // Auto-format: 00 000 000 000
                        if (value.length > 8) {
                          value = value.slice(0, 2) + ' ' + value.slice(2, 5) + ' ' + value.slice(5, 8) + ' ' + value.slice(8)
                        } else if (value.length > 5) {
                          value = value.slice(0, 2) + ' ' + value.slice(2, 5) + ' ' + value.slice(5)
                        } else if (value.length > 2) {
                          value = value.slice(0, 2) + ' ' + value.slice(2)
                        }
                        
                        updateField('abn', value)
                      }}
                      placeholder="00 000 000 000"
                      maxLength={14}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        validations.abn?.valid === true ? 'border-green-500' : ''
                      } ${validations.abn?.valid === false ? 'border-red-500' : ''}`}
                    />
                    {validations.abn?.loading && (
                      <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
                    )}
                    {validations.abn?.valid === true && (
                      <Check className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {validations.abn?.message && (
                    <p className={`text-xs mt-1 ${validations.abn.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.abn.message}
                    </p>
                  )}
                </div>
              )}

              {/* ABN Assistance (if No or Unsure) */}
              {(formData.has_abn === 'no' || formData.has_abn === 'unsure') && (
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                  <p className="text-sm text-blue-900 leading-relaxed mb-4">
                    Your ABN is your Australian Business Number. If you have not yet set up an ABN, you can do so for free at{' '}
                    <a href="https://www.abr.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                      www.abr.gov.au
                    </a>, or for a fee of <strong>$99.00</strong> we can obtain an ABN on your behalf.
                  </p>
                  <p className="text-sm font-medium text-blue-900 mb-3">Please indicate your preference:</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center cursor-pointer p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50">
                      <input
                        type="radio"
                        name="abn_assistance"
                        checked={formData.abn_assistance === 'assist_me'}
                        onChange={() => updateField('abn_assistance', 'assist_me')}
                        className="mr-3"
                      />
                      <span className="text-sm">Yes - Please assist me ($99)</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50">
                      <input
                        type="radio"
                        name="abn_assistance"
                        checked={formData.abn_assistance === 'apply_myself'}
                        onChange={() => updateField('abn_assistance', 'apply_myself')}
                        className="mr-3"
                      />
                      <span className="text-sm">No thanks - I will apply myself</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50">
                      <input
                        type="radio"
                        name="abn_assistance"
                        checked={formData.abn_assistance === 'have_question'}
                        onChange={() => updateField('abn_assistance', 'have_question')}
                        className="mr-3"
                      />
                      <span className="text-sm">Not yet - I have a question</span>
                    </label>
                  </div>
                  {formData.abn_assistance === 'assist_me' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-900">
                        ✓ Perfect! We'll contact you within 1-2 business days to assist with your ABN application.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* GST Registration (only if ABN is Yes and valid) */}
              {formData.has_abn === 'yes' && validations.abn?.valid === true && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium mb-3">Are you registered for GST? *</label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="gst_registered"
                          checked={formData.gst_registered === 'yes'}
                          onChange={() => updateField('gst_registered', 'yes')}
                          className="mr-3"
                        />
                        <span className="font-medium">Yes, I'm registered for GST</span>
                      </label>
                      <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="gst_registered"
                          checked={formData.gst_registered === 'no'}
                          onChange={() => updateField('gst_registered', 'no')}
                          className="mr-3"
                        />
                        <span className="font-medium">No, I'm not registered</span>
                      </label>
                      <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="gst_registered"
                          checked={formData.gst_registered === 'unsure'}
                          onChange={() => updateField('gst_registered', 'unsure')}
                          className="mr-3"
                        />
                        <span className="font-medium">I'm not sure</span>
                      </label>
                    </div>
                  </div>

                  {/* GST Basis (if registered) */}
                  {formData.gst_registered === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">On what basis? *</label>
                      <select
                        value={formData.gst_basis || ''}
                        onChange={(e) => updateField('gst_basis', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  )}

                  {/* GST Information (if not registered) */}
                  {(formData.gst_registered === 'no' || formData.gst_registered === 'unsure') && (
                    <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                      <p className="text-sm text-yellow-900 mb-4">
                        If you do not wish to register for GST, press Next to continue. Otherwise, please indicate if you wish to read further information.
                      </p>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-yellow-900 mb-2">Would you like to find out more about GST?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="gst_learn_more"
                              checked={formData.gst_learn_more === 'yes'}
                              onChange={() => updateField('gst_learn_more', 'yes')}
                              className="mr-2"
                            />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="gst_learn_more"
                              checked={formData.gst_learn_more === 'no'}
                              onChange={() => updateField('gst_learn_more', 'no')}
                              className="mr-2"
                            />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                      </div>

                      {formData.gst_learn_more === 'yes' && (
                        <>
                          <div className="mb-4 p-4 bg-white rounded-lg border border-yellow-300">
                            <p className="text-sm text-gray-900 mb-2">
                              📄 <strong>Download our GST fact sheet:</strong>
                            </p>
                            <a 
                              href="https://fdctax.sharepoint.com/:b:/s/FDCTaxTeam/EeS8vK9uN9pGvq8jKQx_n8IBpYqx-1qQMJxXO_4vZqOKBw?e=1HU0qn" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm font-medium"
                            >
                              Should I Register for GST? →
                            </a>
                            <p className="text-xs text-gray-600 mt-2">
                              Or feel free to call us on <strong>1300 000 000</strong> to discuss your situation.
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-yellow-900 mb-2">Would you like assistance registering for GST?</label>
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center cursor-pointer p-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50">
                                <input
                                  type="radio"
                                  name="gst_assistance"
                                  checked={formData.gst_assistance === 'yes_assist'}
                                  onChange={() => updateField('gst_assistance', 'yes_assist')}
                                  className="mr-3"
                                />
                                <span className="text-sm">Yes - Please assist me</span>
                              </label>
                              <label className="flex items-center cursor-pointer p-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50">
                                <input
                                  type="radio"
                                  name="gst_assistance"
                                  checked={formData.gst_assistance === 'no_thanks'}
                                  onChange={() => updateField('gst_assistance', 'no_thanks')}
                                  className="mr-3"
                                />
                                <span className="text-sm">No thanks</span>
                              </label>
                              <label className="flex items-center cursor-pointer p-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50">
                                <input
                                  type="radio"
                                  name="gst_assistance"
                                  checked={formData.gst_assistance === 'discuss_further'}
                                  onChange={() => updateField('gst_assistance', 'discuss_further')}
                                  className="mr-3"
                                />
                                <span className="text-sm">Not now - I'd like to discuss further</span>
                              </label>
                            </div>
                          </div>

                          {formData.gst_assistance === 'yes_assist' && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-900">
                                ✓ Great! We will contact you within 1-2 business days to assist with your GST registration.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Entity Structure */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium mb-3">Do you operate through a trust, company, or partnership? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="has_entity"
                      checked={formData.has_entity === 'yes'}
                      onChange={() => updateField('has_entity', 'yes')}
                      className="mr-3"
                    />
                    <span className="font-medium">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="has_entity"
                      checked={formData.has_entity === 'no'}
                      onChange={() => updateField('has_entity', 'no')}
                      className="mr-3"
                    />
                    <span className="font-medium">No (sole trader)</span>
                  </label>
                </div>
              </div>

              {formData.has_entity === 'yes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Entity Name *</label>
                    <input
                      value={formData.entity_name || ''}
                      onChange={(e) => updateField('entity_name', e.target.value)}
                      placeholder="e.g., Smith Family Trust"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ACN (if company)</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.acn || ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9]/g, '').slice(0, 9)
                        // Auto-format: 000 000 000
                        if (value.length > 6) {
                          value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6)
                        } else if (value.length > 3) {
                          value = value.slice(0, 3) + ' ' + value.slice(3)
                        }
                        updateField('acn', value)
                      }}
                      placeholder="000 000 000"
                      maxLength={11}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Business Address */}
              {formData.has_abn === 'yes' && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Address</h3>
                    <p className="text-sm text-gray-600 mb-4">Where do you operate your Family Day Care?</p>

                    <label className="flex items-center cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={formData.business_same_as_residential !== false}
                        onChange={(e) => {
                          updateField('business_same_as_residential', e.target.checked)
                          if (e.target.checked) {
                            // Copy residential to business
                            updateField('business_address_line_1', formData.residential_address_line_1)
                            updateField('business_address_line_2', formData.residential_address_line_2)
                            updateField('business_address_location', formData.residential_address_location)
                            updateField('business_address_state', formData.residential_address_state)
                            updateField('business_address_postcode', formData.residential_address_postcode)
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Same as residential address</span>
                    </label>

                    {formData.business_same_as_residential === false && (
                      <AddressAutocomplete
                        prefix="business"
                        formData={formData}
                        updateField={updateField}
                        label="Business Location"
                      />
                    )}

                    {formData.business_same_as_residential !== false && (
                      <p className="text-sm text-gray-600 italic">
                        ✓ Business address will be the same as your residential address
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStage} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={nextStage}
                disabled={!formData.has_abn || !formData.has_entity}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
              >
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 5: Bank Details */}
        {stage === 5 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank account for refunds</h2>
              <p className="text-gray-600">Where should we send your tax refund?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Account Name *</label>
                <input
                  value={formData.eft_account_name || ''}
                  onChange={(e) => updateField('eft_account_name', e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Name on the bank account</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">BSB *</label>
                  <input
                    value={formData.eft_bsb_number || ''}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '')
                      if (val.length > 3) {
                        val = val.slice(0, 3) + '-' + val.slice(3, 6)
                      }
                      updateField('eft_bsb_number', val)
                    }}
                    placeholder="000-000"
                    maxLength={7}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Account Number *</label>
                  <input
                    value={formData.eft_account_number || ''}
                    onChange={(e) => updateField('eft_account_number', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="12345678"
                    maxLength={9}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> This account will be used for tax refunds and any credits. You can update it later if needed.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStage} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={nextStage}
                disabled={!formData.eft_account_name || !formData.eft_bsb_number || !formData.eft_account_number}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
              >
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 6: Deductions Profile */}
        {stage === 6 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's maximize your deductions</h2>
              <p className="text-gray-600">Tell me what expenses you have</p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Car className="w-5 h-5 text-primary mt-1 mr-3" />
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Do you use your car for work?</label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.car_use === true}
                          onChange={() => updateDeduction('car_use', true)}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.car_use === false}
                          onChange={() => updateDeduction('car_use', false)}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                    {formData.deduction_profile.car_use && (
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600">Method:</label>
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              checked={formData.deduction_profile.car_method === 'logbook'}
                              onChange={() => updateDeduction('car_method', 'logbook')}
                              className="mr-2"
                            />
                            <span className="text-sm">Logbook</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              checked={formData.deduction_profile.car_method === 'cents_per_km'}
                              onChange={() => updateDeduction('car_method', 'cents_per_km')}
                              className="mr-2"
                            />
                            <span className="text-sm">Cents per km</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Home className="w-5 h-5 text-primary mt-1 mr-3" />
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Do you use your home as an office?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.home_office === true}
                          onChange={() => updateDeduction('home_office', true)}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.home_office === false}
                          onChange={() => updateDeduction('home_office', false)}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Smartphone className="w-5 h-5 text-primary mt-1 mr-3" />
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Do you claim mobile phone expenses?</label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.mobile_expense === true}
                          onChange={() => updateDeduction('mobile_expense', true)}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.mobile_expense === false}
                          onChange={() => updateDeduction('mobile_expense', false)}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                    {formData.deduction_profile.mobile_expense && (
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600">Business use %:</label>
                        <input
                          type="number"
                          value={formData.deduction_profile.mobile_business_percent || ''}
                          onChange={(e) => updateDeduction('mobile_business_percent', parseInt(e.target.value))}
                          min="0"
                          max="100"
                          placeholder="e.g. 75"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600 ml-2">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Wifi className="w-5 h-5 text-primary mt-1 mr-3" />
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Do you claim internet/streaming expenses?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.internet_expense === true}
                          onChange={() => updateDeduction('internet_expense', true)}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.deduction_profile.internet_expense === false}
                          onChange={() => updateDeduction('internet_expense', false)}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-900">
                  <strong>💰 Great!</strong> We'll help you maximize these deductions when preparing your return.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStage} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={nextStage}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center"
              >
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 7: Previous Accountant */}
        {stage === 7 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Previous accountant</h2>
              <p className="text-gray-600">Have you used an accountant before?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Used an accountant previously? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.used_accountant_previously === 'Y'}
                      onChange={() => updateField('used_accountant_previously', 'Y')}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.used_accountant_previously === 'N'}
                      onChange={() => updateField('used_accountant_previously', 'N')}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {formData.used_accountant_previously === 'Y' && (
                <>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>📄 Professional clearance:</strong> We'll send a clearance letter to your previous accountant as required by TPB regulations.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Accountant Name *</label>
                    <input
                      value={formData.prev_accountant_name || ''}
                      onChange={(e) => updateField('prev_accountant_name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Firm/Company *</label>
                    <input
                      value={formData.prev_accountant_firm || ''}
                      onChange={(e) => updateField('prev_accountant_firm', e.target.value)}
                      placeholder="ABC Accounting Pty Ltd"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.prev_accountant_email || ''}
                      onChange={(e) => updateField('prev_accountant_email', e.target.value)}
                      placeholder="accountant@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStage} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={nextStage}
                disabled={!formData.used_accountant_previously || (formData.used_accountant_previously === 'Y' && (!formData.prev_accountant_name || !formData.prev_accountant_firm || !formData.prev_accountant_email))}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
              >
                Continue <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 8: ID Verification (Annature Placeholder) */}
        {stage === 8 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-full mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick ID verification</h2>
              <p className="text-gray-600">Required by TPB & AML laws</p>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-900 mb-3">
                  <strong>🛡️ Why we need this:</strong>
                </p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• TPB (Tax Practitioners Board) requirement</li>
                  <li>• AML (Anti-Money Laundering) compliance</li>
                  <li>• 100-point ID check via Annature</li>
                  <li>• Secure & encrypted verification</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 text-center">
                <UserCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-sm text-gray-700 mb-4">
                  You'll need one of the following:
                </p>
                <div className="text-left max-w-xs mx-auto space-y-2">
                  <div className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span className="text-sm">Australian Driver's License</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span className="text-sm">Australian Passport</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span className="text-sm">Medicare Card</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-900">
                  <strong>⚡ Takes 2-3 minutes:</strong> Annature will verify your ID instantly. Your documents are secure and not stored.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStage} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={nextStage}
                className="flex-1 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 flex items-center justify-center"
              >
                Start ID Check <Shield className="ml-2 w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              Note: In sandbox mode, ID verification is simulated. In production, you'll complete this via Annature.
            </p>
          </div>
        )}

        {/* Stage 9: Final Submission */}
        {stage === 9 && (
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h2>
              <p className="text-gray-600">Review and submit your application</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Your Details Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{formData.first_name} {formData.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mobile:</span>
                    <span className="font-medium">{formData.mobile}</span>
                  </div>
                  {formData.abn && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ABN:</span>
                      <span className="font-medium">{formData.abn}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📄 Documents to be signed:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span>FDC Tax Engagement Letter 2025-26</span>
                  </li>
                  {formData.used_accountant_previously === 'Y' && (
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                      <span>Professional Clearance Letter (sent to previous accountant)</span>
                    </li>
                  )}
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  You'll sign these via Annature (digital signature platform)
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm text-blue-900">
                    <strong>Declaration:</strong> I declare that the information provided is true and correct. I authorize FDC Tax to act as my tax agent and prepare my tax returns in accordance with the engagement letter.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={prevStage} 
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
              >
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit & Finish <Check className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              After submission, you'll receive a welcome email with next steps.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
