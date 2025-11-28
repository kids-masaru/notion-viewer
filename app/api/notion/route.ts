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
    console.log('Notion Client:', notion);
    console.log('Notion Databases:', notion.databases);

    const queryParams: any = {
      database_id,
    };

    if (filter) queryParams.filter = filter;
    if (sorts) queryParams.sorts = sorts;

    // @ts-ignore
    // notion.databases.queryが一部環境でundefinedになる問題の回避策として
    // 直接APIエンドポイントを叩く notion.request を使用
    const response = await notion.request({
      path: `databases/${database_id}/query`,
      method: 'post',
      body: queryParams,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Notion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
