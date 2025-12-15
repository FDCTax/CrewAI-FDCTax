# Luna Style Guide Implementation

**Date**: December 15, 2025  
**Purpose**: Consistent, educator-friendly AI responses

---

## Global System Prompt

**Location**: `/app/python_rag/main.py` (line ~155)

**Prompt**:
```
You are Luna, supportive FDC tax assistant for Australian educators. 
Be brief (3-6 sentences), practical, cautious. Use bullets. 
Reference ATO. Tone: friendly mate, not formal.

Core Guidelines:
• Keep responses 3-6 sentences (use bullets for lists)
• Practical, actionable advice
• Be cautious with tax claims - reference ATO when needed
• Friendly, supportive tone (like chatting with a knowledgeable mate)
• Avoid overly formal language
• Focus on educators' specific needs and deductions
```

This prompt is applied **before** RAG retrieval, ensuring every Luna response follows the FDC style.

---

## Style Guide Prioritization

**How it Works**:
1. When searching the knowledge base, Luna retrieves more results than needed (limit × 2)
2. Documents with "Luna Style Guide" in title or filename get **50% relevance boost**
3. Style guide chunks appear first in search results
4. This ensures Luna's tone/style is consistently reinforced

**Implementation**: `/app/python_rag/main.py` - `search_knowledge_base()` function

**Boost Logic**:
```python
if 'luna style guide' in title or 'luna style guide' in filename:
    doc_entry['distance'] = distance * 0.5  # 50% boost
    style_guide_docs.append(doc_entry)
```

**Result**: Style guide chunks are always prioritized in RAG context, even if other documents are technically more "relevant" to the query.

---

## Testing the Style

### Upload Style Guide
1. Go to: https://fdctax-sandbox.preview.emergentagent.com
2. Click "Upload Documents" tab
3. Upload: "Luna Style Guide.docx"
4. Category: "Style"
5. Submit

### Verify Prioritization
1. Go to "KB Library" tab
2. See "Luna Style Guide" listed
3. Upload another document (e.g., FDC Expenses PDF)
4. Go to "Chat with Luna" tab
5. Ask any question
6. Check response tone - should be brief, friendly, practical

### Test Questions
Try these to see the style in action:

**Question 1**: "What deductions can I claim as an educator?"
**Expected**: 
- Brief answer (3-6 sentences or bullets)
- Practical examples
- Friendly tone
- ATO reference if needed

**Question 2**: "How do I calculate my FDC percentage?"
**Expected**:
- Step-by-step with bullets
- Practical, not overly formal
- Cautious language ("make sure to...", "check with...")

**Question 3**: "Can I claim my entire internet bill?"
**Expected**:
- Cautious answer (partial claim)
- Reference to ATO rules
- Practical advice
- Friendly but accurate

---

## Why This Works

### Before (Without Style Guide):
❌ Inconsistent tone  
❌ Sometimes too formal  
❌ Long-winded responses  
❌ Generic tax advice  

### After (With Style Guide):
✅ Consistent educator-friendly tone  
✅ Brief, actionable responses  
✅ Always references style guide examples  
✅ FDC-specific language and approach  

---

## Maintenance

### Updating Luna's Style
1. Edit "Luna Style Guide.docx"
2. Re-upload through dashboard
3. Delete old version from KB Library
4. New style takes effect immediately (no retraining needed)

### Adding New Style Rules
Just add sections to the style guide:
- Example Q&A pairs
- Tone guidelines
- Do's and Don'ts
- Educator-specific language

The more examples in the style guide, the better Luna's consistency!

---

## Technical Details

### System Prompt Location
File: `/app/python_rag/main.py`  
Function: `chat()` endpoint (POST /chat)  
Line: ~155-175

### Prioritization Logic
File: `/app/python_rag/main.py`  
Function: `search_knowledge_base()`  
Line: ~78-115  
Boost: 50% (distance × 0.5)

### RAG Flow
1. User asks question
2. Search KB (style guide boosted to top)
3. Build context with style guide chunks first
4. Apply global system prompt
5. Send to LLM (Ollama or OpenAI fallback)
6. Return styled response

---

## Compliance Benefits

✅ **Consistency**: Every educator gets the same quality advice  
✅ **Auditability**: Style guide is versioned and exportable  
✅ **Traceability**: Can see which style guide version was used  
✅ **Control**: Update style without retraining models  
✅ **Transparency**: Style rules are documented and visible  

---

## Next Steps

1. Upload "Luna Style Guide.docx" 
2. Test with educator-specific questions
3. Refine style guide based on responses
4. Add more example Q&A pairs
5. Monitor consistency in production

---

*Luna is now trained and ready to speak like a supportive FDC tax mate! 🇦🇺*
