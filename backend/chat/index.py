import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для работы с чатом сервера'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            limit = int(event.get('queryStringParameters', {}).get('limit', '50'))
            
            cur.execute('''
                SELECT m.id, m.message, m.created_at, u.username, u.minecraft_nick
                FROM messages m
                JOIN users u ON m.user_id = u.id
                ORDER BY m.created_at DESC
                LIMIT %s
            ''', (limit,))
            
            rows = cur.fetchall()
            messages = []
            for row in rows:
                messages.append({
                    'id': row[0],
                    'message': row[1],
                    'timestamp': row[2].isoformat(),
                    'username': row[3],
                    'minecraft_nick': row[4]
                })
            
            messages.reverse()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'messages': messages})
            }
        
        elif method == 'POST':
            token = event.get('headers', {}).get('x-auth-token') or event.get('headers', {}).get('X-Auth-Token')
            
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            cur.execute('SELECT id FROM users WHERE password_hash = %s', (token,))
            user_row = cur.fetchone()
            
            if not user_row:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неверный токен'})
                }
            
            user_id = user_row[0]
            data = json.loads(event.get('body', '{}'))
            message = data.get('message', '').strip()
            
            if not message:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Сообщение не может быть пустым'})
                }
            
            if len(message) > 500:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Сообщение слишком длинное (макс. 500 символов)'})
                }
            
            cur.execute(
                'INSERT INTO messages (user_id, message) VALUES (%s, %s) RETURNING id, created_at',
                (user_id, message)
            )
            row = cur.fetchone()
            conn.commit()
            
            cur.execute('SELECT username, minecraft_nick FROM users WHERE id = %s', (user_id,))
            user_info = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': row[0],
                    'message': message,
                    'timestamp': row[1].isoformat(),
                    'username': user_info[0],
                    'minecraft_nick': user_info[1]
                })
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cur.close()
        conn.close()
