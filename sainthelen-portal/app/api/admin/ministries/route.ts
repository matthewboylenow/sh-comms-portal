import { NextRequest, NextResponse } from 'next/server';
import { getAirtableBase, TABLE_NAMES } from '../../../lib/airtable';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const base = getAirtableBase();
    const records = await base(TABLE_NAMES.MINISTRIES)
      .select({
        sort: [{ field: 'Name', direction: 'asc' }]
      })
      .all();

    const ministries = records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      aliases: record.fields.Aliases ? String(record.fields.Aliases).split(',').map((alias: string) => alias.trim()) : [],
      requiresApproval: record.fields['Requires Approval'] === true,
      approvalCoordinator: record.fields['Approval Coordinator'] || 'adult-discipleship',
      description: record.fields.Description || '',
      active: record.fields.Active !== false, // Default to true if not specified
      createdAt: record.fields['Created At'],
      updatedAt: record.fields['Updated At']
    }));

    return NextResponse.json({ ministries });
  } catch (error: any) {
    console.error('Error fetching ministries:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to fetch ministries' }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, requiresApproval, approvalCoordinator, description, active } = await request.json();

    if (!name?.trim()) {
      return new NextResponse(
        JSON.stringify({ error: 'Ministry name is required' }),
        { status: 400 }
      );
    }

    // Check if ministry already exists
    const base = getAirtableBase();
    const existingRecords = await base(TABLE_NAMES.MINISTRIES)
      .select({
        filterByFormula: `LOWER({Name}) = LOWER("${name.trim()}")`
      })
      .all();

    if (existingRecords.length > 0) {
      return new NextResponse(
        JSON.stringify({ error: 'A ministry with this name already exists' }),
        { status: 409 }
      );
    }

    const record = await base(TABLE_NAMES.MINISTRIES).create([
      {
        fields: {
          Name: name.trim(),
          'Requires Approval': requiresApproval || false,
          'Approval Coordinator': approvalCoordinator || 'adult-discipleship',
          Description: description?.trim() || '',
          Active: active !== false, // Default to true
          'Created At': new Date().toISOString(),
          'Updated At': new Date().toISOString()
        }
      }
    ]);

    const newMinistry = {
      id: record[0].id,
      name: record[0].fields.Name,
      requiresApproval: record[0].fields['Requires Approval'] === true,
      approvalCoordinator: record[0].fields['Approval Coordinator'],
      description: record[0].fields.Description,
      active: record[0].fields.Active !== false,
      createdAt: record[0].fields['Created At'],
      updatedAt: record[0].fields['Updated At']
    };

    return NextResponse.json({ ministry: newMinistry }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ministry:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to create ministry' }),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, requiresApproval, approvalCoordinator, description, active } = await request.json();

    if (!id || !name?.trim()) {
      return new NextResponse(
        JSON.stringify({ error: 'Ministry ID and name are required' }),
        { status: 400 }
      );
    }

    // Check if another ministry with this name exists (excluding current one)
    const base = getAirtableBase();
    const existingRecords = await base(TABLE_NAMES.MINISTRIES)
      .select({
        filterByFormula: `AND(LOWER({Name}) = LOWER("${name.trim()}"), RECORD_ID() != "${id}")`
      })
      .all();

    if (existingRecords.length > 0) {
      return new NextResponse(
        JSON.stringify({ error: 'A ministry with this name already exists' }),
        { status: 409 }
      );
    }

    const record = await base(TABLE_NAMES.MINISTRIES).update([
      {
        id,
        fields: {
          Name: name.trim(),
          'Requires Approval': requiresApproval || false,
          'Approval Coordinator': approvalCoordinator || 'adult-discipleship',
          Description: description?.trim() || '',
          Active: active !== false,
          'Updated At': new Date().toISOString()
        }
      }
    ]);

    const updatedMinistry = {
      id: record[0].id,
      name: record[0].fields.Name,
      requiresApproval: record[0].fields['Requires Approval'] === true,
      approvalCoordinator: record[0].fields['Approval Coordinator'],
      description: record[0].fields.Description,
      active: record[0].fields.Active !== false,
      createdAt: record[0].fields['Created At'],
      updatedAt: record[0].fields['Updated At']
    };

    return NextResponse.json({ ministry: updatedMinistry });
  } catch (error: any) {
    console.error('Error updating ministry:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to update ministry' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Ministry ID is required' }),
        { status: 400 }
      );
    }

    const base = getAirtableBase();
    await base(TABLE_NAMES.MINISTRIES).destroy([id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ministry:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to delete ministry' }),
      { status: 500 }
    );
  }
}