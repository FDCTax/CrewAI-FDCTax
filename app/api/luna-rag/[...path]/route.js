import { NextResponse } from 'next/server';

/**
 * Proxy for Luna RAG API
 * Routes requests from frontend to Python RAG server
 */

const RAG_API_URL = 'http://localhost:8002';

export async function GET(request, { params }) {
  try {
    const path = params.path.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    const response = await fetch(`${RAG_API_URL}/${path}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const path = params.path.join('/');
    const contentType = request.headers.get('content-type') || '';
    
    // Check if this is a file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      const response = await fetch(`${RAG_API_URL}/${path}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // Regular JSON request
      const body = await request.json();
      
      const response = await fetch(`${RAG_API_URL}/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const path = params.path.join('/');
    
    const response = await fetch(`${RAG_API_URL}/${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
