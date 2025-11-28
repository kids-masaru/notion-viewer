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
    const { database_id: raw_database_id, filter, sorts } = body;

    if (!raw_database_id) {
      return NextResponse.json({ error: 'Missing database_id' }, { status: 400 });
    }

    // データベースIDがURL形式の場合、ID部分だけを抽出する
    // 例: https://www.notion.so/myworkspace/a8aec43384f447ed84390e8e42c2e089?v=... -> a8aec43384f447ed84390e8e42c2e089
    let database_id = raw_database_id;
    const urlMatch = raw_database_id.match(/([a-f0-9]{32})/);
    if (urlMatch) {
      database_id = urlMatch[1];
    }

    console.log(`Debug: Raw ID=${raw_database_id}, Extracted ID=${database_id}`);

    const notion = new Client({ auth: token });

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
