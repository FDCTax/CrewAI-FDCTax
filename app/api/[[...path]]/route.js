import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/db'

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