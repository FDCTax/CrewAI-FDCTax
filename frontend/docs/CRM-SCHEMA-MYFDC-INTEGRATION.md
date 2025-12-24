# CRM Schema Documentation for MyFDC Integration

**Version**: 1.0  
**Environment**: Sandbox  
**Base URL**: `https://crm-taskhub.preview.emergentagent.com`  
**Database**: PostgreSQL (DigitalOcean Managed)

---

## Table of Contents
1. [Database Schemas](#database-schemas)
2. [CRM Tables](#crm-tables)
3. [API Endpoints](#api-endpoints)
4. [Test Clients](#test-clients)
5. [Integration Examples](#integration-examples)

---

## Database Schemas

The database uses schema-based separation:
- `crm` - CRM data (clients, tasks, messages, documents)
- `myfdc` - MyFDC app data (income, expenses, calculations)

---

## CRM Tables

### 1. `crm.clients`

Primary client/educator records. **Excludes sensitive fields**: TFN, bank account details.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `system_id` | INTEGER | NOT NULL | **Primary Key** |
| `first_name` | TEXT | NULL | First name |
| `last_name` | TEXT | NULL | Last name |
| `casual_name` | TEXT | NULL | Preferred name (e.g., "Sarah") |
| `email` | TEXT | NULL | Email address |
| `mobile` | TEXT | NULL | Mobile phone |
| `phone` | TEXT | NULL | Landline phone |
| `abn` | TEXT | NULL | Australian Business Number |
| `business_name` | VARCHAR(255) | NULL | Business/trading name |
| `type` | TEXT | NULL | Entity type (e.g., "Individual") |
| `client_type` | VARCHAR(50) | NULL | Service level: `MyFDC Only`, `DIY/Luna`, `Full Service` |
| `gst_registered` | BOOLEAN | NULL | GST registration status |
| `bas_quarter` | VARCHAR(2) | NULL | BAS quarter: `Q1`, `Q2`, `Q3`, `Q4`, or `A` (Annual) |
| `fdc_percent` | NUMERIC | NULL | FDC usage percentage (0-100) |
| `estimated_turnover` | NUMERIC | NULL | Annual turnover estimate |
| `status` | VARCHAR(20) | NULL | Account status: `active`, `inactive`, `pending` |
| `client_access_approved` | BOOLEAN | NULL | **Tech help permission** - Can CRM view MyFDC data? |
| `start_date` | DATE | NULL | FDC start date |
| `fdc_start_date` | TEXT | NULL | Alternative FDC start date field |
| `cashbook_start_date` | DATE | NULL | Cashbook start date |
| `created_at` | TIMESTAMP | NULL | Record creation timestamp |
| `updated_at` | TIMESTAMP | NULL | Last update timestamp |

**Address Fields** (all TEXT, nullable):
- `postal_address_line_1`, `postal_address_line_2`, `postal_address_location`, `postal_address_state`, `postal_address_postcode`, `postal_address_country`
- `business_address_line_1`, `business_address_line_2`, `business_address_location`, `business_address_state`, `business_address_postcode`, `business_address_country`
- `residential_address_line_1`, `residential_address_line_2`, `residential_address_location`, `residential_address_state`, `residential_address_postcode`, `residential_address_country`

**Onboarding Fields**:
- `onboarding_stage` (INTEGER) - Current stage in onboarding flow
- `onboarding_data` (JSONB) - Onboarding form data
- `onboarding_completed` (TEXT) - Completion status

---

### 2. `crm.tasks`

Tasks assigned to clients for action.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | NOT NULL | **Primary Key** |
| `client_id` | INTEGER | NOT NULL | **Foreign Key** → `crm.clients.system_id` |
| `title` | VARCHAR(255) | NOT NULL | Task title |
| `description` | TEXT | NULL | Task description (supports HTML) |
| `status` | VARCHAR(20) | NULL | `pending`, `in_progress`, `submitted`, `completed`, `cancelled` |
| `due_date` | DATE | NULL | Task due date |
| `priority` | VARCHAR(10) | NULL | `low`, `medium`, `high`, `urgent` |
| `assigned_to` | VARCHAR(100) | NULL | Agent/team assignment |
| `input_type` | VARCHAR(20) | NULL | Required input: `none`, `amount`, `text`, `file`, `dropdown`, `radio` |
| `custom_options` | TEXT[] | NULL | Options for dropdown/radio inputs |
| `notify_on_complete` | BOOLEAN | NULL | Send email notification on completion |
| `client_response` | TEXT | NULL | Client's text/selection response |
| `client_amount` | NUMERIC | NULL | Client's numeric response |
| `client_files` | JSONB | NULL | Array of uploaded file objects |
| `client_comment` | TEXT | NULL | Additional client comments |
| `submitted_at` | TIMESTAMP | NULL | When client submitted response |
| `agent_notes` | TEXT | NULL | Internal notes from agent |
| `created_at` | TIMESTAMP | NULL | Task creation timestamp |
| `updated_at` | TIMESTAMP | NULL | Last update timestamp |

**Status Flow**:
```
pending → in_progress → submitted → completed
                    ↘ cancelled
```

---

### 3. `crm.messages`

Communication between clients and agents.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | NOT NULL | **Primary Key** |
| `client_id` | INTEGER | NOT NULL | **Foreign Key** → `crm.clients.system_id` |
| `task_id` | INTEGER | NULL | **Foreign Key** → `crm.tasks.id` (optional) |
| `sender` | VARCHAR(20) | NOT NULL | `client`, `agent`, `system`, `luna` |
| `message_text` | TEXT | NOT NULL | Message content |
| `timestamp` | TIMESTAMP | NULL | Message timestamp |
| `attachment_id` | INTEGER | NULL | **Foreign Key** → `crm.documents.id` |
| `read` | BOOLEAN | NULL | Read status |

---

## API Endpoints

### Client Endpoints

#### GET `/api/clients`
Retrieve all clients.

**Query Parameters**:
- `search` (optional) - Filter by name, email, or business name

**Response**:
```json
{
  "clients": [
    {
      "system_id": 143003,
      "first_name": "Sarah",
      "last_name": "Test",
      "email": "sarah.testclient@fdctax.com.au",
      "client_type": "MyFDC Only",
      "client_access_approved": true,
      "pending_tasks": 1
    }
  ],
  "total": 5
}
```

---

#### GET `/api/clients/{id}`
Get detailed client information with related data.

**Response**:
```json
{
  "client": { /* full client object */ },
  "tasks": [ /* client's tasks */ ],
  "messages": [ /* recent messages */ ],
  "documents": [ /* uploaded documents */ ],
  "calculations": [ /* tax calculations */ ],
  "luna_logs": [ /* AI conversation logs */ ]
}
```

---

#### PUT `/api/clients/{id}`
Update client information.

**Request Body**:
```json
{
  "first_name": "Sarah",
  "last_name": "Test",
  "email": "sarah@example.com",
  "gst_registered": true,
  "fdc_percent": 75
}
```

---

### Task Endpoints

#### GET `/api/myfdc/tasks?user_id={client_id}`
**MyFDC Integration Endpoint** - Get tasks for a specific client.

**Response**:
```json
{
  "tasks": [
    {
      "id": 10,
      "client_id": 143003,
      "title": "Upload Q3 receipts",
      "description": "Please upload all your receipts...",
      "status": "pending",
      "due_date": "2026-01-05",
      "priority": "high",
      "input_type": "file",
      "custom_options": null
    }
  ]
}
```

---

#### POST `/api/tasks`
Create a new task for a client.

**Request Body**:
```json
{
  "client_id": 143003,
  "title": "Upload Q3 receipts",
  "description": "Please upload all your receipts for July-September 2025",
  "due_date": "2026-01-05",
  "priority": "high",
  "input_type": "file",
  "custom_options": [],
  "notify_on_complete": true
}
```

---

#### POST `/api/tasks/{taskId}/submit`
**MyFDC Integration Endpoint** - Client submits task response.

**Request Body**:
```json
{
  "client_response": "Yes, I approve access",
  "client_amount": null,
  "client_files": [
    {"name": "receipt.pdf", "url": "/uploads/receipt.pdf", "size": 12345}
  ],
  "client_comment": "Here are my Q3 receipts"
}
```

**Special Behavior**:
- For "Approve Tech Help Access" tasks: If `client_response` contains "yes", sets `client_access_approved = true` on the client record.

---

#### PUT `/api/tasks/{taskId}`
Update task status or add agent notes.

**Request Body**:
```json
{
  "status": "completed",
  "agent_notes": "Receipts processed and recorded"
}
```

---

#### POST `/api/tasks/{taskId}/reply`
Add a message to a task thread.

**Request Body**:
```json
{
  "message": "Thank you for uploading the receipts",
  "sender": "agent"
}
```

---

### User Context Endpoint

#### GET `/api/user/context?user_id={client_id}`
Get client context for MyFDC dashboard display.

**Response**:
```json
{
  "user": {
    "system_id": 143003,
    "first_name": "Sarah",
    "last_name": "Test",
    "casual_name": "Sarah",
    "email": "sarah.testclient@fdctax.com.au",
    "gst_registered": true
  }
}
```

---

## Test Clients

| system_id | Name | Email | Client Type | GST | BAS | FDC % | Turnover |
|-----------|------|-------|-------------|-----|-----|-------|----------|
| 143003 | Sarah Test | sarah.testclient@fdctax.com.au | MyFDC Only | ✓ | Q1 | 75% | $50,000 |
| 143004 | Mike Test | mike.testclient@fdctax.com.au | DIY/Luna | ✗ | A | 100% | $80,000 |
| 143005 | Emma Test | emma.testclient@fdctax.com.au | DIY/Luna | ✓ | Q2 | 75% | $100,000 |
| 143006 | James Test | james.testclient@fdctax.com.au | Full Service | ✓ | Q3 | 100% | $120,000 |
| 143007 | Lisa Test | lisa.testclient@fdctax.com.au | Full Service | ✗ | A | 75% | $150,000 |

Each test client has:
- 1x "Upload Q3 receipts" task (file upload)
- 1x "Approve Tech Help Access" task (radio selection)

---

## Integration Examples

### 1. Fetch Client Tasks (MyFDC → CRM)

```javascript
// Get tasks for a logged-in educator
const response = await fetch('/api/myfdc/tasks?user_id=143003');
const { tasks } = await response.json();

// Filter pending tasks
const pendingTasks = tasks.filter(t => t.status === 'pending');
```

### 2. Submit Task Response (MyFDC → CRM)

```javascript
// Submit approval for tech help access
const response = await fetch('/api/tasks/10/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_response: 'Yes, I approve access',
    client_comment: 'Happy to help with my records'
  })
});
```

### 3. Check Tech Help Access (CRM → MyFDC)

```javascript
// Check if CRM can access educator's MyFDC data
const response = await fetch('/api/clients/143003');
const { client } = await response.json();

if (client.client_access_approved) {
  // Can view income, expenses, mileage, FDC claims
  const myfdcData = await fetch('/api/myfdc/data?client_id=143003');
}
```

---

## Constraints & Validation

### Client Type Values
- `MyFDC Only` - Self-service MyFDC users
- `DIY/Luna` - Use Luna AI for tax assistance
- `Full Service` - Full tax agent management

### Task Status Values
- `pending` - Awaiting client action
- `in_progress` - Client working on it
- `submitted` - Client submitted, awaiting review
- `completed` - Agent marked complete
- `cancelled` - Task cancelled

### Task Input Types
- `none` - No input required (informational)
- `amount` - Numeric/dollar input
- `text` - Free text response
- `file` - File upload required
- `dropdown` - Select from options
- `radio` - Single choice from options

### BAS Quarter Values
- `Q1` - July to September
- `Q2` - October to December
- `Q3` - January to March
- `Q4` - April to June
- `A` - Annual lodgement

---

## Audit Logging

All API actions are logged to `crm.audit_logs`:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary Key |
| `user_type` | VARCHAR(20) | `agent`, `educator`, `system`, `admin` |
| `user_id` | VARCHAR(100) | User identifier |
| `user_email` | VARCHAR(255) | User email |
| `action` | VARCHAR(50) | `view`, `edit`, `create`, `delete`, `approve`, `reject`, `submit` |
| `table_name` | VARCHAR(100) | Affected table |
| `record_id` | VARCHAR(100) | Record identifier |
| `client_id` | INTEGER | Related client ID |
| `old_values` | JSONB | Previous values |
| `new_values` | JSONB | Updated values |
| `notes` | TEXT | Action description |
| `created_at` | TIMESTAMP | Log timestamp |

---

## Contact

For integration support, contact the FDC Tax development team.
