import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('[Notion API] Missing Authorization header');
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    console.log(`[Notion API] Received token (masked): ${token.slice(0, 5)}***`);

    // リクエストボディを取得（一度だけ）
    const body = await req.json();
    const { database_id: rawDatabaseId, filter, sorts } = body;

    console.log(`[Notion API] Request body:`, JSON.stringify(body));
    console.log(`[Notion API] Raw database_id input:`, rawDatabaseId);

    if (!rawDatabaseId) {
      console.log('[Notion API] Missing database_id');
      return NextResponse.json({ error: 'Missing database_id' }, { status: 400 });
    }

    // データベース ID 正規化
    const cleaned = rawDatabaseId.replace(/-/g, '').split('?')[0];
    const match = cleaned.match(/([a-f0-9]{32})/i);
    const databaseId = match ? match[1] : cleaned;
    if (match) {
      console.log(`[Notion API] Extracted database ID: ${databaseId}`);
    } else {
      console.log(`[Notion API] Could not extract 32-char ID, using raw value: ${databaseId}`);
    }

    // Notion SDK 初期化
    const notion = new Client({ auth: token });
    console.log('[Notion API] Notion client initialized');

    // クエリパラメータ作成
    const queryParams: any = { database_id: databaseId };
    if (filter) queryParams.filter = filter;
    if (sorts) queryParams.sorts = sorts;
    console.log(`[Notion API] Query params:`, JSON.stringify(queryParams));

    // Notion API 呼び出し
    const requestPath = `databases/${databaseId}/query`;
    console.log(`[Notion API] Calling Notion API: ${requestPath}`);
    const response = await notion.request({
      path: requestPath,
      method: 'post',
      body: queryParams,
    }) as any; // 型アサーションを追加

    console.log('[Notion API] ✅ Success! Response received with', response.results?.length || 0, 'items');
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Notion API] ❌ Error:', error.message || error);
    console.error('[Notion API] Stack:', error.stack || 'No stack trace');
    return NextResponse.json({
      error: error.message || 'Internal Server Error',
      code: error.code || 'unknown',
      status: error.status || 500
    }, { status: error.status || 500 });
  }
}