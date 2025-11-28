import * as fs from 'fs';
import * as path from 'path';
import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

// ---------- Simple file logger ----------
const logFile = path.resolve(process.cwd(), 'logs', 'api.log');
const log = (msg: string) => {
  const timestamp = new Date().toISOString();
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
    console.log(line.trim());
  };

  export async function POST(req: NextRequest) {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        log('Missing Authorization header');
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
      }
      const token = authHeader.replace('Bearer ', '');
      log(`Received token (masked): ${token.slice(0, 5)}***`);

      // リクエストボディを取得（一度だけ）
      const body = await req.json();
      const { database_id: rawDatabaseId, filter, sorts } = body;

      log(`Request body: ${JSON.stringify(body)}`);
      log(`Raw database_id input: ${rawDatabaseId}`);

      if (!rawDatabaseId) {
        log('Missing database_id');
        return NextResponse.json({ error: 'Missing database_id' }, { status: 400 });
      }

      // データベース ID 正規化
      const cleaned = rawDatabaseId.replace(/-/g, '').split('?')[0];
      const match = cleaned.match(/([a-f0-9]{32})/i);
      const databaseId = match ? match[1] : cleaned;
      if (match) {
        log(`Extracted database ID: ${databaseId}`);
      } else {
        log('Could not extract 32-char ID, using raw value');
      }

      // Notion SDK 初期化
      const notion = new Client({ auth: token });
      log('Notion client initialized');

      // クエリパラメータ作成
      const queryParams: any = { database_id: databaseId };
      if (filter) queryParams.filter = filter;
      if (sorts) queryParams.sorts = sorts;
      log(`Query params: ${JSON.stringify(queryParams)}`);

      // Notion API 呼び出し
      const requestPath = `databases/${databaseId}/query`;
      log(`Calling Notion API: ${requestPath}`);
      const response = await notion.request({
        path: requestPath,
        method: 'post',
        body: queryParams,
      });
      log('✅ Success! Notion API response received');
      return NextResponse.json(response);
    } catch (error: any) {
      // Ensure we always log and return valid JSON
      try {
        log(`❌ Notion API Error: ${error.message || error}`);
        log(error.stack || 'No stack trace');
      } catch (logError) {
        console.error('Logging failed:', logError);
      }
      return NextResponse.json({
        error: error.message || 'Internal Server Error',
        details: error.code || 'unknown'
      }, { status: 500 });
    }
  }