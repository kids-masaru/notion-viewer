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

    // クエリパラメータ作成
    const queryBody: any = {};
    if (filter) queryBody.filter = filter;
    if (sorts) queryBody.sorts = sorts;
    console.log(`[Notion API] Query body:`, JSON.stringify(queryBody));

    // Notion API 呼び出し (fetch を使用)
    const requestUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;
    console.log(`[Notion API] Calling Notion API: ${requestUrl}`);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Notion API] ❌ Error:', data);
      return NextResponse.json({
        error: data.message || 'Notion API Error',
        code: data.code || 'unknown',
        status: response.status
      }, { status: response.status });
    }

    console.log('[Notion API] ✅ Success! Response received with', data.results?.length || 0, 'items');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Notion API] ❌ Error:', error.message || error);
    console.error('[Notion API] Stack:', error.stack || 'No stack trace');
    return NextResponse.json({
      error: error.message || 'Internal Server Error',
      code: error.code || 'unknown',
      status: 500
    }, { status: 500 });
  }
}