import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In a real app, you would verify the token from the request
    // For this simplified version, we'll just return a success response
    // since the protected route will handle the actual authentication
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: '1',
        name: 'admin',
      },
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { isAuthenticated: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
