# Luna Sandbox API Documentation
## For MyFDC Frontend Integration

---

## 🔗 Sandbox API Base URL

```
https://crm-taskhub.preview.emergentagent.com
```

---

## 🔐 Authentication

**None required for Sandbox testing** - endpoints are open for development.

For production, you'll add authentication headers once migrated to main DB.

---

## 📋 API Endpoints

### 1. Get User Context
**Endpoint:** `GET /api/user/context`

**Query Parameters:**
- `user_id` (required) - User's system_id

**Example Request:**
```bash
curl "https://crm-taskhub.preview.emergentagent.com/api/user/context?user_id=143000"
```

**Response:**
```json
{
  "user": {
    "id": 143000,
    "name": "Sarah",
    "email": "sarah.test@fdctax.com.au",
    "gst_registered": false,
    "bas_quarter": "Q1",
    "cashbook_start_date": "2024-07-01",
    "days_since_start": 534
  },
  "tasks": {
    "pending": [
      {
        "id": 1,
        "task_name": "Set up recurring expenses",
        "status": "pending",
        "due_date": null,
        "created_at": "2024-12-15T06:09:31.742Z",
        "updated_at": "2024-12-15T06:09:31.742Z"
      },
      {
        "id": 2,
        "task_name": "Upload Q1 receipts",
        "status": "pending",
        "due_date": "2024-12-22",
        "created_at": "2024-12-15T06:09:31.742Z",
        "updated_at": "2024-12-15T06:09:31.742Z"
      }
    ],
    "count": 2
  },
  "recent_conversations": [],
  "context_summary": {
    "is_new": false,
    "has_pending_tasks": true,
    "gst_status": "Not registered"
  }
}
```

---

### 2. Get User Checklist
**Endpoint:** `GET /api/user/checklist`

**Query Parameters:**
- `user_id` (required)

**Example Request:**
```bash
curl "https://crm-taskhub.preview.emergentagent.com/api/user/checklist?user_id=143000"
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 2,
      "task_name": "Upload Q1 receipts",
      "status": "pending",
      "due_date": "2024-12-22",
      "created_at": "2024-12-15T06:09:31.742Z",
      "updated_at": "2024-12-15T06:09:31.742Z"
    },
    {
      "id": 1,
      "task_name": "Set up recurring expenses",
      "status": "pending",
      "due_date": null,
      "created_at": "2024-12-15T06:09:31.742Z",
      "updated_at": "2024-12-15T06:09:31.742Z"
    }
  ],
  "total": 2,
  "pending": 2,
  "completed": 0
}
```

---

### 3. Update Checklist Task
**Endpoint:** `POST /api/user/checklist/update`

**Body (JSON):**
```json
{
  "task_id": 1,
  "status": "completed"
}
```

**Valid Statuses:** `"pending"`, `"completed"`, `"dismissed"`

**Example Request:**
```bash
curl -X POST "https://crm-taskhub.preview.emergentagent.com/api/user/checklist/update" \
  -H "Content-Type: application/json" \
  -d '{"task_id": 1, "status": "completed"}'
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": 1,
    "user_id": 143000,
    "task_name": "Set up recurring expenses",
    "status": "completed",
    "due_date": null,
    "created_at": "2024-12-15T06:09:31.742Z",
    "updated_at": "2024-12-15T08:30:15.123Z"
  }
}
```

---

### 4. Get BAS Status (GST Registered Users Only)
**Endpoint:** `GET /api/user/bas-status`

**Query Parameters:**
- `user_id` (required)

**Example Request:**
```bash
curl "https://crm-taskhub.preview.emergentagent.com/api/user/bas-status?user_id=143001"
```

**Response (GST Registered):**
```json
{
  "gst_registered": true,
  "bas_quarter": "Q3",
  "next_due_date": "2026-04-28",
  "days_until_due": 132,
  "pending_tasks": [
    {
      "id": 3,
      "task_name": "Review BAS lodgement",
      "due_date": "2024-10-28"
    }
  ]
}
```

**Response (Not GST Registered):**
```json
{
  "gst_registered": false,
  "message": "User is not registered for GST"
}
```

---

### 5. Chat with Luna (Contextual AI)
**Endpoint:** `POST /api/luna-rag/chat`

**Body (JSON):**
```json
{
  "messages": [
    {"role": "user", "content": "What should I do first?"}
  ],
  "session_id": "unique-session-id",
  "user_id": 143000,
  "mode": "educator",
  "use_fallback": false
}
```

**Parameters:**
- `messages` (array) - Chat history
- `session_id` (string) - Unique session identifier
- `user_id` (integer, optional) - For personalized responses
- `mode` (string) - `"educator"` (client-friendly) or `"internal"` (tax agent mode)
- `use_fallback` (boolean) - `false` = OpenAI (default), `true` = Ollama

**Example Request:**
```bash
curl -X POST "https://crm-taskhub.preview.emergentagent.com/api/luna-rag/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hi Luna!"}],
    "session_id": "test-session-123",
    "user_id": 143000,
    "mode": "educator",
    "use_fallback": false
  }'
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Hello Sarah! How can I assist you today with your FDC tax queries?"
  },
  "kb_sources": [
    {
      "title": "Luna Style Guide",
      "category": "Core"
    }
  ],
  "session_id": "test-session-123",
  "provider": "openai",
  "user_name": "Sarah"
}
```

**Note:** Conversation is automatically saved to `user_conversations` table if `user_id` provided.

---

## 👥 Test Users (Sandbox)

### User 1: Sarah Wilson (Not GST Registered)
```json
{
  "system_id": 143000,
  "email": "sarah.test@fdctax.com.au",
  "casual_name": "Sarah",
  "gst_registered": false,
  "bas_quarter": "Q1",
  "pending_tasks": 2
}
```

### User 2: Emma Thompson (GST Registered)
```json
{
  "system_id": 143001,
  "email": "emma.test@fdctax.com.au",
  "casual_name": "Em",
  "gst_registered": true,
  "bas_quarter": "Q3",
  "pending_tasks": 2
}
```

### User 3: Michael Chen (New Educator)
```json
{
  "system_id": 143002,
  "email": "michael.test@fdctax.com.au",
  "casual_name": "Mike",
  "gst_registered": false,
  "bas_quarter": "Q2",
  "pending_tasks": 0
}
```

---

## 🚀 Integration Example (React/Next.js)

### Fetch User Context on Dashboard Load

```javascript
// In your MyFDC dashboard component
import { useEffect, useState } from 'react';

export default function EducatorDashboard() {
  const [userContext, setUserContext] = useState(null);
  const userId = 143000; // Hardcode Sarah for testing
  
  useEffect(() => {
    async function loadContext() {
      const res = await fetch(
        `https://crm-taskhub.preview.emergentagent.com/api/user/context?user_id=${userId}`
      );
      const data = await res.json();
      setUserContext(data);
      
      // Generate personalized greeting
      const greeting = await generateGreeting(data);
      console.log(greeting);
    }
    
    loadContext();
  }, []);
  
  async function generateGreeting(context) {
    const res = await fetch(
      'https://crm-taskhub.preview.emergentagent.com/api/luna-rag/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: 'Generate a warm, personalized greeting for me' 
          }],
          session_id: 'greeting-' + Date.now(),
          user_id: userId,
          mode: 'educator',
          use_fallback: false
        })
      }
    );
    
    const data = await res.json();
    return data.message.content;
  }
  
  return (
    <div>
      {userContext && (
        <div>
          <h1>Welcome, {userContext.user.name}!</h1>
          <p>You have {userContext.tasks.count} pending tasks</p>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ What You'll See When Testing

**Personalized Greeting:**
> "Hello Sarah! It's wonderful to connect with you. If you need any help with your tax queries or have questions about uploading your Q1 receipts, feel free to ask."

**Context-Aware Responses:**
- Luna knows your name
- References your specific pending tasks
- Understands your GST status
- Tailors advice to your experience level

**Conversation Logging:**
- All interactions automatically saved to database
- Can retrieve recent conversations via `/api/user/context`

---

## 📞 Support

If you encounter any issues:
1. Check endpoint URLs match exactly
2. Verify `user_id` exists in Sandbox database
3. Check browser console for detailed error messages

**Happy testing! Luna is ready to go in MyFDC!** 🚀
