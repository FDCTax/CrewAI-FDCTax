import { NextResponse } from 'next/server'
import { testConnection, query } from '@/lib/db'
import { createClient, getAllClients, getClientByUUID, deleteClient } from '@/lib/clientDb'
import { encryptTFN, decryptTFN, maskTFN } from '@/lib/encryption'
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/emails'

// Health check endpoint
export async function GET(request) {
  const { pathname } = new URL(request.url)
  
  if (pathname === '/api/health') {
    const dbStatus = await testConnection()
    
    return NextResponse.json({
      status: 'ok',
      environment: 'sandbox',
      project: 'FDC Tax – Luna Onboarding',
      timestamp: new Date().toISOString(),
      database: dbStatus
    })
  }
  
  if (pathname === '/api/db-test') {
    const dbStatus = await testConnection()
    return NextResponse.json(dbStatus)
  }

  // Get all clients
  if (pathname === '/api/clients') {
    try {
      const url = new URL(request.url)
      const search = url.searchParams.get('search')
      
      const clients = await getAllClients({ search })
      
      return NextResponse.json({ clients })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Get client by UUID
  if (pathname.startsWith('/api/clients/')) {
    const uuid = pathname.split('/').pop()
    
    try {
      const client = await getClientByUUID(uuid)
      
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      
      return NextResponse.json({ client })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  
  return NextResponse.json({
    message: 'API endpoint not found',
    path: pathname
  }, { status: 404 })
}

export async function POST(request) {
  const { pathname } = new URL(request.url)
  
  // TFN Validation
  if (pathname === '/api/validate-tfn') {
    try {
      const { tfn } = await request.json()
      
      // Clean: remove ALL non-digits (spaces, dashes, etc.)
      const cleanTFN = tfn.replace(/\D/g, '')
      
      // Check length only
      if (cleanTFN.length !== 9) {
        return NextResponse.json({
          valid: false,
          message: 'TFN must be 9 digits'
        })
      }
      
      // TFN algorithm validation (ATO checksum)
      const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10]
      let sum = 0
      
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanTFN[i]) * weights[i]
      }
      
      const isValid = sum % 11 === 0
      
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'Valid TFN ✓' : 'Invalid TFN - please check the number'
      })
    } catch (error) {
      return NextResponse.json({ valid: false, message: 'Validation error' }, { status: 500 })
    }
  }

  // ABN Validation
  if (pathname === '/api/validate-abn') {
    try {
      const { abn } = await request.json()
      
      // Basic ABN validation (11 digits)
      const cleanABN = abn.replace(/\\s/g, '')
      
      if (cleanABN.length !== 11) {
        return NextResponse.json({
          valid: false,
          message: 'ABN must be 11 digits'
        })
      }
      
      if (!/^\\d{11}$/.test(cleanABN)) {
        return NextResponse.json({
          valid: false,
          message: 'ABN must contain only numbers'
        })
      }
      
      // ABN algorithm validation
      const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
      let sum = 0
      
      // Subtract 1 from first digit
      const digits = cleanABN.split('').map((d, i) => i === 0 ? parseInt(d) - 1 : parseInt(d))
      
      for (let i = 0; i < 11; i++) {
        sum += digits[i] * weights[i]
      }
      
      const isValid = sum % 89 === 0
      
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'Valid ABN' : 'Invalid ABN - please check the number'
      })
    } catch (error) {
      return NextResponse.json({ valid: false, message: 'Validation error' }, { status: 500 })
    }
  }

  // Create new client
  if (pathname === '/api/clients') {
    try {
      const clientData = await request.json()
      
      const result = await createClient(clientData)
      
      // Add UUID to client data for emails
      const clientDataWithUUID = { ...clientData, uuid: result.uuid }
      
      // Send emails asynchronously (don't block the response)
      Promise.all([
        sendWelcomeEmail(clientDataWithUUID).catch(err => console.error('Welcome email failed:', err)),
        sendAdminNotification(clientDataWithUUID).catch(err => console.error('Admin notification failed:', err))
      ]).then(() => {
        console.log('✅ All emails sent successfully')
      })
      
      return NextResponse.json({
        success: true,
        message: 'Client created successfully',
        system_id: result.system_id,
        uuid: result.uuid,
        resume_link: `${process.env.NEXT_PUBLIC_BASE_URL}/luna/client/${result.uuid}`
      })
    } catch (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Export clients to LodgeiT CSV
  if (pathname === '/api/clients/export-lodgeit') {
    try {
      const { client_ids } = await request.json()
      
      // Fetch clients
      const result = await query(
        'SELECT * FROM clients WHERE system_id = ANY($1)',
        [client_ids]
      )
      
      const clients = result.rows
      
      // Build CSV
      const headers = [
        'Code', 'Type', 'ABN', 'TFN', 'ACN', 'Industry Code', 'Director ID',
        'Name', 'Trading Name', 'Title', 'Suffix', 'First Name', 'Middle Name',
        'Last Name', 'Casual Name', 'Gender', 'Birth Date', 'Email', 'Phone',
        'Mobile', 'Fax', 'Business Address Line 1', 'Business Address Line 2',
        'Business Address Location', 'Business Address State', 'Business Address Postcode',
        'Business Address Country', 'Postal Address Line 1', 'Postal Address Line 2',
        'Postal Address Location', 'Postal Address State', 'Postal Address Postcode',
        'Postal Address Country', 'EFT Account Name', 'EFT Account Number',
        'EFT BSB Number', 'Fee From Refund', 'Manage Activity Statements', 'Manage Tax Returns'
      ]
      
      let csv = headers.join(',') + '\\n'
      
      clients.forEach(client => {
        // Decrypt and mask TFN
        const decryptedTFN = client.tfn ? decryptTFN(client.tfn) : ''
        const maskedTFN = decryptedTFN ? maskTFN(decryptedTFN) : ''
        
        const row = [
          client.code || '',
          client.type || 'Individual',
          client.abn || '',
          maskedTFN,
          client.acn || '',
          client.industry_code || '',
          client.director_id || '',
          client.name || '',
          client.trading_name || '',
          client.title || '',
          client.suffix || '',
          client.first_name || '',
          client.middle_name || '',
          client.last_name || '',
          client.casual_name || '',
          client.gender || '',
          client.birth_date || '',
          client.email || '',
          client.phone || '',
          client.mobile || '',
          client.fax || '',
          client.business_address_line_1 || '',
          client.business_address_line_2 || '',
          client.business_address_location || '',
          client.business_address_state || '',
          client.business_address_postcode || '',
          client.business_address_country || 'Australia',
          client.postal_address_line_1 || '',
          client.postal_address_line_2 || '',
          client.postal_address_location || '',
          client.postal_address_state || '',
          client.postal_address_postcode || '',
          client.postal_address_country || 'Australia',
          client.eft_account_name || '',
          client.eft_account_number || '',
          client.eft_bsb_number || '',
          client.fee_from_refund || 'N',
          client.manage_activity_statements || 'Y',
          client.manage_tax_returns || 'Y'
        ].map(field => `\"${String(field).replace(/\"/g, '\"\"')}\"`)
        
        csv += row.join(',') + '\\n'
      })
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=\"lodgeit_export_${Date.now()}.csv\"`
        }
      })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Annature ID verification
  if (pathname === '/api/annature/verify-id') {
    try {
      const { client_uuid, email, first_name, last_name } = await request.json()
      
      // TODO: Call Annature Enhanced Verification API
      // For now, return placeholder
      
      return NextResponse.json({
        success: true,
        verification_url: 'https://sandbox.annature.com.au/verify/placeholder',
        message: 'ID verification initiated'
      })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Annature envelope creation
  if (pathname === '/api/annature/create-envelope') {
    try {
      const { client_uuid, include_clearance } = await request.json()
      
      // TODO: Create Annature envelope with engagement letter + optional clearance letter
      // For now, return placeholder
      
      return NextResponse.json({
        success: true,
        envelope_id: 'ENV_' + Date.now(),
        signing_url: 'https://sandbox.annature.com.au/sign/placeholder'
      })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Address search (placeholder for Addressr)
  if (pathname === '/api/address-search') {
    try {
      const url = new URL(request.url)
      const searchQuery = url.searchParams.get('q') || ''
      
      // TODO: Replace with real Addressr API call when deployed
      // For now, return mock suggestions based on common Australian addresses
      
      const mockSuggestions = [
        { street: `${searchQuery}`, suburb: 'Sydney', state: 'NSW', postcode: '2000', line2: '' },
        { street: `${searchQuery}`, suburb: 'Melbourne', state: 'VIC', postcode: '3000', line2: '' },
        { street: `${searchQuery}`, suburb: 'Brisbane', state: 'QLD', postcode: '4000', line2: '' },
      ].filter(addr => 
        addr.street.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      return NextResponse.json({
        suggestions: mockSuggestions.slice(0, 5)
      })
    } catch (error) {
      return NextResponse.json({ suggestions: [] }, { status: 200 })
    }
  }

  return NextResponse.json({
    message: 'API endpoint not implemented',
    path: pathname
  }, { status: 501 })
}

export async function DELETE(request) {
  const { pathname } = new URL(request.url)
  
  // Delete client
  if (pathname.startsWith('/api/clients/')) {
    const systemId = pathname.split('/').pop()
    
    try {
      await deleteClient(parseInt(systemId))
      
      return NextResponse.json({ success: true, message: 'Client deleted' })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  
  return NextResponse.json({
    message: 'API endpoint not implemented',
    path: pathname
  }, { status: 501 })
}
