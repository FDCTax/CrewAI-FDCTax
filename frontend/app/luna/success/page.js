'use client'

import { useSearchParams } from 'next/navigation'
import { Check, Mail, FileText, Calendar, ArrowRight } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const uuid = searchParams.get('uuid')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Welcome to FDC Tax! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Your application has been successfully submitted
          </p>
        </div>

        {/* What Happens Next */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What happens next?</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-900">Check your email</h3>
                <p className="text-sm text-gray-600">We've sent you a welcome email with important information and your checklist.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-900">Document signing</h3>
                <p className="text-sm text-gray-600">You'll receive an Annature link to sign your engagement letter (usually within 24 hours).</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-900">Our team will reach out</h3>
                <p className="text-sm text-gray-600">We'll contact you to arrange document collection and answer any questions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-900 mb-1">Email Support</p>
            <a href="mailto:hello@fdctax.com.au" className="text-xs text-primary hover:underline">hello@fdctax.com.au</a>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-900 mb-1">Your Reference</p>
            <p className="text-xs text-gray-600 font-mono">{uuid?.slice(0, 8) || 'N/A'}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-900 mb-1">Response Time</p>
            <p className="text-xs text-gray-600">Within 1 business day</p>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Helpful Resources</h3>
          <div className="space-y-2">
            <a href="https://fdctax.com.au/faq" className="flex items-center text-sm text-primary hover:underline">
              <ArrowRight className="w-4 h-4 mr-2" />
              Frequently Asked Questions
            </a>
            <a href="https://fdctax.com.au/checklist" className="flex items-center text-sm text-primary hover:underline">
              <ArrowRight className="w-4 h-4 mr-2" />
              Document Checklist
            </a>
            <a href="https://fdctax.com.au/contact" className="flex items-center text-sm text-primary hover:underline">
              <ArrowRight className="w-4 h-4 mr-2" />
              Contact Us
            </a>
          </div>
        </div>

        {/* Resume Link */}
        {uuid && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 mb-2">
              <strong>📌 Bookmark this link:</strong> You can return to your application anytime:
            </p>
            <p className="text-xs font-mono text-blue-800 break-all">
              {process.env.NEXT_PUBLIC_BASE_URL || 'https://fdctax.com.au'}/luna/client/{uuid}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <a 
            href="https://fdctax.com.au"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Visit FDC Tax Website
          </a>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
