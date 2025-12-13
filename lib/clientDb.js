import { query, getPool } from './db'
import { encryptTFN, decryptTFN } from './encryption'
import { v4 as uuidv4 } from 'uuid'

export async function createClient(clientData) {
  const pool = getPool()
  
  try {
    // Generate UUID for resume link
    const uuid = uuidv4()
    
    // Encrypt TFN if provided
    const encryptedTFN = clientData.tfn ? encryptTFN(clientData.tfn) : null
    
    // Build full name
    const fullName = [clientData.first_name, clientData.middle_name, clientData.last_name]
      .filter(Boolean)
      .join(' ')
    
    // Insert client
    const result = await query(`
      INSERT INTO clients (
        uuid, code, type, abn, tfn, acn, name, trading_name,
        first_name, middle_name, last_name, casual_name, title, gender, birth_date,
        email, phone, mobile,
        residential_address_line_1, residential_address_line_2, residential_address_location,
        residential_address_state, residential_address_postcode, residential_address_country,
        postal_address_line_1, postal_address_line_2, postal_address_location,
        postal_address_state, postal_address_postcode, postal_address_country,
        business_address_line_1, business_address_line_2, business_address_location,
        business_address_state, business_address_postcode, business_address_country,
        eft_account_name, eft_account_number, eft_bsb_number, bank_details_later,
        fdc_start_date, entity_name, is_sole_trader,
        deduction_profile,
        used_accountant_previously, prev_accountant_name, prev_accountant_firm, prev_accountant_email,
        id_verification_status, envelope_id, engagement_letter_signed,
        gst_assistance_requested,
        onboarding_stage, onboarding_completed, onboarding_data,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
        $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, NOW(), NOW()
      ) RETURNING system_id, uuid
    `, [
      uuid,
      clientData.code || null,
      clientData.type || 'Individual',
      clientData.abn || null,
      encryptedTFN,
      clientData.acn || null,
      fullName,
      clientData.trading_name || null,
      clientData.first_name || null,
      clientData.middle_name || null,
      clientData.last_name || null,
      clientData.casual_name || null,
      clientData.title || null,
      clientData.gender || null,
      clientData.birth_date || null,
      clientData.email || null,
      clientData.phone || null,
      clientData.mobile || null,
      clientData.residential_address_line_1 || null,
      clientData.residential_address_line_2 || null,
      clientData.residential_address_location || null,
      clientData.residential_address_state || null,
      clientData.residential_address_postcode || null,
      clientData.residential_address_country || 'Australia',
      clientData.postal_address_line_1 || null,
      clientData.postal_address_line_2 || null,
      clientData.postal_address_location || null,
      clientData.postal_address_state || null,
      clientData.postal_address_postcode || null,
      clientData.postal_address_country || 'Australia',
      clientData.business_address_line_1 || null,
      clientData.business_address_line_2 || null,
      clientData.business_address_location || null,
      clientData.business_address_state || null,
      clientData.business_address_postcode || null,
      clientData.business_address_country || 'Australia',
      clientData.eft_account_name || null,
      clientData.eft_account_number || null,
      clientData.eft_bsb_number || null,
      clientData.fdc_start_date || null,
      clientData.entity_name || null,
      clientData.is_sole_trader || 'Y',
      JSON.stringify(clientData.deduction_profile || {}),
      clientData.used_accountant_previously || 'N',
      clientData.prev_accountant_name || null,
      clientData.prev_accountant_firm || null,
      clientData.prev_accountant_email || null,
      clientData.id_verification_status || 'pending',
      clientData.envelope_id || null,
      clientData.engagement_letter_signed || 'N',
      (clientData.gst_assistance === 'yes_assist' || clientData.gst_assistance === 'discuss_further') ? 'Y' : 'N',
      9, // Completed all stages
      'Y', // Onboarding completed
      JSON.stringify(clientData)
    ])
    
    return {
      success: true,
      system_id: result.rows[0].system_id,
      uuid: result.rows[0].uuid
    }
  } catch (error) {
    console.error('Error creating client:', error)
    throw error
  }
}

export async function getAllClients(filters = {}) {
  try {
    let queryText = 'SELECT * FROM clients WHERE archived = $1'
    const params = ['N']
    
    if (filters.search) {
      queryText += ' AND (casual_name ILIKE $2 OR email ILIKE $2 OR mobile ILIKE $2)'
      params.push(`%${filters.search}%`)
    }
    
    queryText += ' ORDER BY created_at DESC'
    
    const result = await query(queryText, params)
    
    // Decrypt TFNs for display
    const clients = result.rows.map(client => ({
      ...client,
      tfn: client.tfn ? decryptTFN(client.tfn) : null
    }))
    
    return clients
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw error
  }
}

export async function getClientByUUID(uuid) {
  try {
    const result = await query('SELECT * FROM clients WHERE uuid = $1', [uuid])
    
    if (result.rows.length === 0) {
      return null
    }
    
    const client = result.rows[0]
    // Decrypt TFN
    client.tfn = client.tfn ? decryptTFN(client.tfn) : null
    
    return client
  } catch (error) {
    console.error('Error fetching client by UUID:', error)
    throw error
  }
}

export async function deleteClient(systemId) {
  try {
    await query('DELETE FROM clients WHERE system_id = $1', [systemId])
    return { success: true }
  } catch (error) {
    console.error('Error deleting client:', error)
    throw error
  }
}
