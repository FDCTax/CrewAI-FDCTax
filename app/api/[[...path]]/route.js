import { NextResponse } from 'next/server'

// Health check endpoint
export async function GET(request) {
  const { pathname } = new URL(request.url)
  
  if (pathname === '/api/health') {
    return NextResponse.json({
      status: 'ok',
      environment: 'sandbox',
      project: 'FDC Tax – Luna Onboarding',
      timestamp: new Date().toISOString()
    })
  }
  
  return NextResponse.json({
    message: 'API endpoint not found',
    path: pathname
  }, { status: 404 })
}

export async function POST(request) {
  const { pathname } = new URL(request.url)
  
  return NextResponse.json({
    message: 'API endpoint not implemented',
    path: pathname
  }, { status: 501 })
}

export async function PUT(request) {
  const { pathname } = new URL(request.url)
  
  return NextResponse.json({
    message: 'API endpoint not implemented',
    path: pathname
  }, { status: 501 })
}

export async function DELETE(request) {
  const { pathname } = new URL(request.url)
  
  return NextResponse.json({
    message: 'API endpoint not implemented',
    path: pathname
  }, { status: 501 })
}