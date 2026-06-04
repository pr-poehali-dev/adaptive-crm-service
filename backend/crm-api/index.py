"""
CRM API — клиенты, задачи, настройки для ДачаПро CRM.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p38013793_adaptive_crm_service'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    # ---- CLIENTS ----
    if path == '/clients':
        if method == 'GET':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'SELECT * FROM {SCHEMA}.clients ORDER BY created_at DESC')
                    rows = cur.fetchall()
            return ok([dict(r) for r in rows])

        if method == 'POST':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.clients
                            (name, product, product_type, order_amount, avito_link, phone, comment, status, next_action_date)
                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                            RETURNING *""",
                        (body.get('name',''), body.get('product',''), body.get('productType','Бытовка'),
                         body.get('orderAmount',0), body.get('avitoLink',''), body.get('phone',''),
                         body.get('comment',''), body.get('status','Заинтересован'),
                         body.get('nextActionDate') or None)
                    )
                    row = dict(cur.fetchone())
                conn.commit()
            return ok(row)

    if path.startswith('/clients/') and len(path) > 9:
        cid = path[9:]

        if method == 'PUT':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"""UPDATE {SCHEMA}.clients SET
                            name=%s, product=%s, product_type=%s, order_amount=%s,
                            avito_link=%s, phone=%s, comment=%s, status=%s,
                            next_action_date=%s, updated_at=NOW()
                            WHERE id=%s RETURNING *""",
                        (body.get('name',''), body.get('product',''), body.get('productType','Бытовка'),
                         body.get('orderAmount',0), body.get('avitoLink',''), body.get('phone',''),
                         body.get('comment',''), body.get('status','Заинтересован'),
                         body.get('nextActionDate') or None, cid)
                    )
                    row = cur.fetchone()
                conn.commit()
            return ok(dict(row)) if row else err('Not found', 404)

        if method == 'DELETE':
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(f'DELETE FROM {SCHEMA}.clients WHERE id=%s', (cid,))
                conn.commit()
            return ok({'deleted': cid})

    # ---- TASKS ----
    if path == '/tasks':
        if method == 'GET':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'SELECT * FROM {SCHEMA}.tasks ORDER BY due_date ASC, created_at ASC')
                    rows = cur.fetchall()
            return ok([dict(r) for r in rows])

        if method == 'POST':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.tasks (title, client_id, due_date, done)
                            VALUES (%s,%s,%s,%s) RETURNING *""",
                        (body.get('title',''), body.get('clientId') or None,
                         body.get('dueDate'), body.get('done', False))
                    )
                    row = dict(cur.fetchone())
                conn.commit()
            return ok(row)

    if path.startswith('/tasks/') and len(path) > 7:
        tid = path[7:]

        if method == 'PUT':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"""UPDATE {SCHEMA}.tasks SET
                            title=%s, client_id=%s, due_date=%s, done=%s
                            WHERE id=%s RETURNING *""",
                        (body.get('title',''), body.get('clientId') or None,
                         body.get('dueDate'), body.get('done', False), tid)
                    )
                    row = cur.fetchone()
                conn.commit()
            return ok(dict(row)) if row else err('Not found', 404)

        if method == 'DELETE':
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(f'DELETE FROM {SCHEMA}.tasks WHERE id=%s', (tid,))
                conn.commit()
            return ok({'deleted': tid})

    # ---- SETTINGS ----
    if path == '/settings':
        if method == 'GET':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'SELECT * FROM {SCHEMA}.settings WHERE id=1')
                    row = cur.fetchone()
            if not row:
                return ok({'id': 1, 'user_name': 'Менеджер', 'commission_percent': 5})
            return ok(dict(row))

        if method == 'PUT':
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.settings (id, user_name, commission_percent)
                            VALUES (1, %s, %s)
                            ON CONFLICT (id) DO UPDATE SET user_name=EXCLUDED.user_name
                            RETURNING *""",
                        (body.get('userName', 'Менеджер'), 5)
                    )
                    row = dict(cur.fetchone())
                conn.commit()
            return ok(row)

    return err('Not found', 404)
