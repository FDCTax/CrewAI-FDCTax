'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

const AUSTRALIAN_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']
const TITLES = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof']

export default function LunaOnboarding() {
  const [stage, setStage] = useState(1)
  const [formData, setFormData] = useState({})
  const [validations, setValidations] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [postalSameAsResidential, setPostalSameAsResidential] = useState(true)

  const progress = (stage / 9) * 100

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user types
    if (validations[field]) {
      setValidations(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateTFN = async (tfn) => {
    if (!tfn || tfn.replace(/\\s/g, '').length !== 9) return
    
    setValidations(prev => ({ ...prev, tfn: { loading: true } }))
    
    try {
      const response = await fetch('/api/validate-tfn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tfn: tfn.replace(/\\s/g, '') })
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
    if (!abn || abn.replace(/\\s/g, '').length !== 11) return
    
    setValidations(prev => ({ ...prev, abn: { loading: true } }))
    
    try {
      const response = await fetch('/api/validate-abn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abn: abn.replace(/\\s/g, '') })
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
  }, [postalSameAsResidential, formData.residential_address_line_1, formData.residential_address_line_2, formData.residential_address_location, formData.residential_address_state, formData.residential_address_postcode])

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

      // Redirect to success page
      window.location.href = `/luna/success?uuid=${data.uuid}`
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20\">
      {/* Progress Bar */}
      <div className=\"fixed top-11 left-0 right-0 z-40 bg-white border-b border-gray-200\">
        <div className=\"h-2 bg-gray-200\">
          <div 
            className=\"h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500\"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className=\"container mx-auto px-4 py-3\">
          <p className=\"text-sm text-gray-600 text-center\">
            Stage {stage} of 9 • {Math.round(progress)}% Complete
          </p>
        </div>
      </div>

      <div className=\"container mx-auto px-4 pt-32 max-w-2xl\">
        {/* Stage 1: Welcome */}
        {stage === 1 && (
          <Card className=\"border-2 border-primary/20\">
            <CardContent className=\"p-8 md:p-12 text-center\">
              <div className=\"inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6\">
                <Sparkles className=\"w-10 h-10 text-white\" />
              </div>
              <h1 className=\"text-3xl md:text-4xl font-bold text-gray-900 mb-4\">
                Hi! I'm Luna 👋
              </h1>
              <p className=\"text-lg text-gray-600 mb-6\">
                I'll help you get set up with FDC Tax in about 8–10 minutes. Let's make this easy!
              </p>
              <div className=\"bg-blue-50 rounded-lg p-4 mb-6\">
                <p className=\"text-sm text-blue-900\">
                  <strong>What you'll need:</strong>
                </p>
                <ul className=\"text-sm text-blue-800 mt-2 space-y-1 text-left\">
                  <li>✓ Tax File Number</li>
                  <li>✓ ABN (if you have one)</li>
                  <li>✓ Bank account details</li>
                  <li>✓ ID for verification (Driver's License or Passport)</li>
                </ul>
              </div>
              <Button 
                onClick={nextStage}
                size=\"lg\"
                className=\"w-full bg-primary hover:bg-primary/90\"
              >
                Let's Get Started <ChevronRight className=\"ml-2 w-5 h-5\" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stage 2: Personal Details */}
        {stage === 2 && (
          <Card>
            <CardContent className=\"p-6 md:p-8\">
              <div className=\"mb-6\">
                <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Let's start with your details</h2>
                <p className=\"text-gray-600\">Tell me about yourself</p>
              </div>

              <div className=\"space-y-6\">
                <div className=\"grid grid-cols-4 gap-4\">
                  <div className=\"col-span-1\">
                    <Label>Title</Label>
                    <Select value={formData.title} onValueChange={(val) => updateField('title', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder=\"Select\" />
                      </SelectTrigger>
                      <SelectContent>
                        {TITLES.map(title => (
                          <SelectItem key={title} value={title}>{title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.first_name || ''}
                    onChange={(e) => updateField('first_name', e.target.value)}
                    placeholder=\"John\"
                  />
                </div>

                <div>
                  <Label>Middle Name(s) <span className=\"text-gray-400\">(optional)</span></Label>
                  <Input
                    value={formData.middle_name || ''}
                    onChange={(e) => updateField('middle_name', e.target.value)}
                    placeholder=\"Middle names\"
                  />
                </div>

                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.last_name || ''}
                    onChange={(e) => updateField('last_name', e.target.value)}
                    placeholder=\"Smith\"
                  />
                </div>

                <div>
                  <Label>Preferred Name *</Label>
                  <Input
                    value={formData.casual_name || ''}
                    onChange={(e) => updateField('casual_name', e.target.value)}
                    placeholder=\"What should we call you?\"
                  />
                  <p className=\"text-xs text-gray-500 mt-1\">This is how we'll address you in emails</p>
                </div>

                <div>
                  <Label>Date of Birth *</Label>
                  <Input
                    type=\"date\"
                    value={formData.birth_date || ''}
                    onChange={(e) => updateField('birth_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Gender *</Label>
                  <RadioGroup value={formData.gender} onValueChange={(val) => updateField('gender', val)}>
                    <div className=\"flex gap-4\">
                      <div className=\"flex items-center space-x-2\">
                        <RadioGroupItem value=\"Male\" id=\"male\" />
                        <Label htmlFor=\"male\" className=\"font-normal cursor-pointer\">Male</Label>
                      </div>
                      <div className=\"flex items-center space-x-2\">
                        <RadioGroupItem value=\"Female\" id=\"female\" />
                        <Label htmlFor=\"female\" className=\"font-normal cursor-pointer\">Female</Label>
                      </div>
                      <div className=\"flex items-center space-x-2\">
                        <RadioGroupItem value=\"Other\" id=\"other\" />
                        <Label htmlFor=\"other\" className=\"font-normal cursor-pointer\">Other</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Tax File Number (TFN) *</Label>
                  <div className=\"relative\">
                    <Input
                      value={formData.tfn || ''}
                      onChange={(e) => updateField('tfn', e.target.value)}
                      placeholder=\"000 000 000\"
                      maxLength={11}
                      className={`
                        ${validations.tfn?.valid === true ? 'border-green-500' : ''}
                        ${validations.tfn?.valid === false ? 'border-red-500' : ''}
                      `}
                    />
                    {validations.tfn?.loading && (
                      <Loader2 className=\"absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400\" />
                    )}
                    {validations.tfn?.valid === true && (
                      <Check className=\"absolute right-3 top-3 w-4 h-4 text-green-500\" />
                    )}
                    {validations.tfn?.valid === false && (
                      <AlertCircle className=\"absolute right-3 top-3 w-4 h-4 text-red-500\" />
                    )}
                  </div>
                  {validations.tfn?.message && (
                    <p className={`text-xs mt-1 ${validations.tfn.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.tfn.message}
                    </p>
                  )}
                  <p className=\"text-xs text-gray-500 mt-1\">9 digits • We validate this with the ATO</p>
                </div>

                <div className=\"bg-yellow-50 rounded-lg p-4 border border-yellow-200\">
                  <p className=\"text-sm text-yellow-900\">
                    <strong>🔒 Your data is secure:</strong> Your TFN is encrypted and stored securely. We're TPB registered.
                  </p>
                </div>

                <h3 className=\"text-lg font-semibold text-gray-900 pt-4\">Residential Address</h3>

                <div>
                  <Label>Street Address *</Label>
                  <Input
                    value={formData.residential_address_line_1 || ''}
                    onChange={(e) => updateField('residential_address_line_1', e.target.value)}
                    placeholder=\"123 Main Street\"
                  />
                </div>

                <div>
                  <Label>Address Line 2 <span className=\"text-gray-400\">(optional)</span></Label>
                  <Input
                    value={formData.residential_address_line_2 || ''}
                    onChange={(e) => updateField('residential_address_line_2', e.target.value)}
                    placeholder=\"Unit 5\"
                  />
                </div>

                <div className=\"grid grid-cols-2 gap-4\">
                  <div>
                    <Label>Suburb/City *</Label>
                    <Input
                      value={formData.residential_address_location || ''}
                      onChange={(e) => updateField('residential_address_location', e.target.value)}
                      placeholder=\"Sydney\"
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Select value={formData.residential_address_state} onValueChange={(val) => updateField('residential_address_state', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder=\"Select\" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUSTRALIAN_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className=\"grid grid-cols-2 gap-4\">
                  <div>
                    <Label>Postcode *</Label>
                    <Input
                      value={formData.residential_address_postcode || ''}
                      onChange={(e) => updateField('residential_address_postcode', e.target.value)}
                      placeholder=\"2000\"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className=\"flex items-center space-x-2\">
                  <Checkbox
                    id=\"postal-same\"
                    checked={postalSameAsResidential}
                    onCheckedChange={setPostalSameAsResidential}
                  />
                  <Label htmlFor=\"postal-same\" className=\"font-normal cursor-pointer\">
                    Postal address is the same as residential
                  </Label>
                </div>
              </div>

              <div className=\"flex gap-4 mt-8\">
                <Button variant=\"outline\" onClick={prevStage} className=\"flex-1\">
                  <ChevronLeft className=\"mr-2 w-4 h-4\" /> Back
                </Button>
                <Button 
                  onClick={nextStage} 
                  className=\"flex-1 bg-primary hover:bg-primary/90\"
                  disabled={!formData.first_name || !formData.last_name || !formData.casual_name || !formData.birth_date || !formData.gender || !formData.tfn || validations.tfn?.valid !== true}
                >
                  Continue <ChevronRight className=\"ml-2 w-4 h-4\" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional stages will be added in next file... */}
        {stage > 2 && stage < 9 && (
          <Card>
            <CardContent className=\"p-6 md:p-8\">
              <p className=\"text-center text-gray-600\">Stage {stage} content (to be completed)</p>
              <div className=\"flex gap-4 mt-8\">
                <Button variant=\"outline\" onClick={prevStage} className=\"flex-1\">
                  <ChevronLeft className=\"mr-2 w-4 h-4\" /> Back
                </Button>
                <Button onClick={nextStage} className=\"flex-1 bg-primary hover:bg-primary/90\">
                  Continue <ChevronRight className=\"ml-2 w-4 h-4\" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage 9: Final Submission */}
        {stage === 9 && (
          <Card>
            <CardContent className=\"p-6 md:p-8\">
              <h2 className=\"text-2xl font-bold text-gray-900 mb-4\">Almost there!</h2>
              <p className=\"text-gray-600 mb-6\">Review and submit your application</p>

              {error && (
                <div className=\"bg-red-50 border border-red-200 rounded-lg p-4 mb-6\">
                  <p className=\"text-sm text-red-900\">{error}</p>
                </div>
              )}

              <div className=\"flex items-start space-x-3 mb-6\">
                <Checkbox id=\"declaration\" required />
                <Label htmlFor=\"declaration\" className=\"text-sm leading-relaxed cursor-pointer\">
                  I declare that the information provided is true and correct. I authorize FDC Tax to act as my tax agent and prepare my tax returns.
                </Label>
              </div>

              <div className=\"flex gap-4\">
                <Button variant=\"outline\" onClick={prevStage} className=\"flex-1\" disabled={loading}>
                  <ChevronLeft className=\"mr-2 w-4 h-4\" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className=\"flex-1 bg-primary hover:bg-primary/90\"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className=\"mr-2 w-4 h-4 animate-spin\" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit & Finish <Check className=\"ml-2 w-4 h-4\" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
"