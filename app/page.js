'use client'

import { Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border border-gray-200">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                FDC Tax – Luna Onboarding
              </h1>
              <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                SANDBOX
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Welcome to the sandbox environment for the new client onboarding flow.
                This will power MyFDC's new-educator setup process.
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Database</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  ✅ PostgreSQL connection configured
                </p>
                <p className="text-xs text-gray-500">
                  DigitalOcean Database • Port 25060 • SSL Enabled
                </p>
              </div>

              <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-6 border border-secondary/20">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Annature Integration</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Environment variables ready for Annature sandbox keys.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-gray-600 rounded-full mr-2"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Design System</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Using Teal (#15ADC2) and Indigo (#6366F1) color scheme with Inter font.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-gray-600 rounded-full mr-2"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Ready for Luna first-run interview and start-up email flow development.
                </p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This is a blank canvas with no data from the current MyFDC project.
                The full Luna onboarding flow will be built here incrementally.
              </p>
            </div>
          </div>

          {/* Color Palette Preview */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Colors</h3>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-primary rounded-lg shadow-md border-2 border-white"></div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Primary (Teal)</p>
                  <p className="text-xs text-gray-500">#15ADC2</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-secondary rounded-lg shadow-md border-2 border-white"></div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Secondary (Indigo)</p>
                  <p className="text-xs text-gray-500">#6366F1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}