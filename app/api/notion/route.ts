import * as fs from 'fs';
import * as path from 'path';
import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

// ---------- Simple file logger ----------
const logFile = path.resolve(process.cwd(), 'logs', 'api.log');
const log = (msg: string) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  try { fs.mkdirSync(path.dirname(logFile), { recursive: true }); } catch (_) { }
  fs.appendFileSync(logFile, line);
  console.log(line.trim()); // also output to console for dev
};

export async function POST(req: NextRequest) {
  try {
    // Authorization ヘッダー取得
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      log('Missing Authorization header');
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    log(`Received token (masked): ${token.slice(0, 5)}***`);

    // リクエストボディは一度だけ取得 (テキストでログ取得)
    const rawBody = await req.text();
    log(`Raw request body: ${rawBody}`);
    let bodyObj: any = {};
    try {
      bodyObj = JSON.parse(rawBody);
    } catch (e) {
      log('Failed to parse JSON, falling back to req.json()');
      bodyObj = await req.json();
    }
    const { database_id: rawDatabaseId, filter, sorts } = bodyObj;
    log(`Raw database_id input: ${rawDatabaseId}`);
    if (!rawDatabaseId) {
      log('Missing database_id');
      return NextResponse.json({ error: 'Missing database_id' }, { status: 400 });
    }

    // ---- データベース ID 正規化 ----
    const cleaned = rawDatabaseId.replace(/-/g, '').split('?')[0];
    const match = cleaned.match(/([a-f0-9]{32})/i);
    const databaseId = match ? match[1] : cleaned;
    if (match) {
      log(`Extracted database ID: ${databaseId}`);
    } else {
      log('Could not extract 32‑char ID, using raw value');
    }

    // Notion SDK 初期化
    const notion = new Client({ auth: token });
    log('Notion client initialized');

    // クエリパラメータ作成
    const queryParams: any = { database_id: databaseId };
    if (filter) queryParams.filter = filter;
    if (sorts) queryParams.sorts = sorts;
    log(`Query params: ${JSON.stringify(queryParams)}`);

    // Low‑level request (fallback for missing .query)
    const requestPath = `databases/${databaseId}/query`;
    log(`Calling Notion API path: ${requestPath}`);
    const response = await notion.request({
      path: requestPath,
      method: 'post',
      body: queryParams,
    });
    log('Notion API response received');
    return NextResponse.json(response);
  } catch (error: any) {
    log(`Notion API Error: ${error.message || error}`);
    log(error.stack || 'No stack trace');
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}