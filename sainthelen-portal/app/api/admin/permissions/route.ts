import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserPermissions } from '../../../config/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    const permissions = await getUserPermissions(session.user.email);
    
    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to fetch permissions' }),
      { status: 500 }
    );
  }
}