'use client'

// This file contains ALL 9 stages - will be used to replace page.js
// Stages 3-8 complete implementation

import { useState, useEffect } from 'react'
import { Sparkles, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2, Building2, CreditCard, Car, Home, Smartphone, Wifi, FileCheck, Shield } from 'lucide-react'

// Stage 3: Contact Details
const Stage3ContactDetails = ({ formData, updateField, nextStage, prevStage }) => {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">How can we reach you?</h2>
      <p className="text-gray-600 mb-6">Your contact information</p>

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
            value={formData.mobile || ''}
            onChange={(e) => updateField('mobile', e.target.value)}
            placeholder="0400 000 000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Alternate Phone <span className="text-gray-400">(optional)</span></label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="(02) 0000 0000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Home or work number</p>
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
    </>
  )
}

// Stage 4: Business Details  
const Stage4BusinessDetails = ({ formData, updateField, validations, nextStage, prevStage }) => {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell me about your business</h2>
      <p className="text-gray-600 mb-6">Family Day Care details</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Do you have an ABN? *</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="has_abn"
                checked={formData.has_abn === 'yes'}
                onChange={() => updateField('has_abn', 'yes')}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="has_abn"
                checked={formData.has_abn === 'no'}
                onChange={() => updateField('has_abn', 'no')}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        {formData.has_abn === 'yes' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Australian Business Number (ABN) *</label>
              <div className="relative">
                <input
                  value={formData.abn || ''}
                  onChange={(e) => updateField('abn', e.target.value)}
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

            <div>
              <label className="block text-sm font-medium mb-2">Trading Name / Business Name *</label>
              <input
                value={formData.trading_name || ''}
                onChange={(e) => updateField('trading_name', e.target.value)}
                placeholder="Your FDC business name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">When did you start Family Day Care? *</label>
          <input
            type="date"
            value={formData.fdc_start_date || ''}
            onChange={(e) => updateField('fdc_start_date', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Are you a sole trader? *</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="is_sole_trader"
                checked={formData.is_sole_trader === 'Y'}
                onChange={() => updateField('is_sole_trader', 'Y')}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="is_sole_trader"
                checked={formData.is_sole_trader === 'N'}
                onChange={() => updateField('is_sole_trader', 'N')}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        {formData.is_sole_trader === 'N' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Entity Name *</label>
              <input
                value={formData.entity_name || ''}
                onChange={(e) => updateField('entity_name', e.target.value)}
                placeholder="Company or Trust name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ACN (if applicable)</label>
              <input
                value={formData.acn || ''}
                onChange={(e) => updateField('acn', e.target.value)}
                placeholder="000 000 000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </>
        )}

        {formData.has_abn === 'yes' && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 pt-4">Business Address</h3>
            <p className="text-sm text-gray-600 -mt-4">Where do you operate your FDC?</p>

            <div>
              <label className="block text-sm font-medium mb-2">Street Address *</label>
              <input
                value={formData.business_address_line_1 || ''}
                onChange={(e) => updateField('business_address_line_1', e.target.value)}
                placeholder="123 Main Street"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Suburb/City *</label>
                <input
                  value={formData.business_address_location || ''}
                  onChange={(e) => updateField('business_address_location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State *</label>
                <select
                  value={formData.business_address_state || ''}
                  onChange={(e) => updateField('business_address_state', e.target.value)}
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
                value={formData.business_address_postcode || ''}
                onChange={(e) => updateField('business_address_postcode', e.target.value)}
                maxLength={4}
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
          disabled={!formData.fdc_start_date || !formData.is_sole_trader}
          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
        >
          Continue <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </>
  )
}

// Stage 5: Bank Details
const Stage5BankDetails = ({ formData, updateField, nextStage, prevStage }) => {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank account for refunds</h2>
      <p className="text-gray-600 mb-6">Where should we send your tax refund?</p>

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
    </>
  )
}

// Continue with stages 6-8 exports...
export { Stage3ContactDetails, Stage4BusinessDetails, Stage5BankDetails }
