import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await req.json();
    const { database_id, filter, sorts } = body;

    if (!database_id) {
      return NextResponse.json({ error: 'Missing database_id' }, { status: 400 });
    }

    const notion = new Client({ auth: token });

    const queryParams: any = {
      database_id,
    };

    if (filter) queryParams.filter = filter;
    if (sorts) queryParams.sorts = sorts;

    const response = await (notion.databases as any).query(queryParams);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Notion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
