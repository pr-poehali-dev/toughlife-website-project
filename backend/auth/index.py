import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для регистрации и авторизации пользователей на сайте ToughLife'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                return register_user(body)
            elif action == 'login':
                return login_user(body)
            elif action == 'verify':
                return verify_token(event.get('headers', {}))
            else:
                return error_response('Unknown action', 400)
                
        except json.JSONDecodeError:
            return error_response('Invalid JSON', 400)
        except Exception as e:
            return error_response(str(e), 500)
    
    return error_response('Method not allowed', 405)

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${pwd_hash}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, pwd_hash = stored_hash.split('$')
        check_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return check_hash == pwd_hash
    except:
        return False

def generate_token(user_id: int) -> str:
    return secrets.token_urlsafe(32) + f"_{user_id}"

def register_user(body: dict) -> dict:
    username = body.get('username', '').strip()
    email = body.get('email', '').strip()
    password = body.get('password', '')
    minecraft_nick = body.get('minecraft_nick', '').strip()
    
    if not username or len(username) < 3:
        return error_response('Username must be at least 3 characters', 400)
    if not email or '@' not in email:
        return error_response('Invalid email', 400)
    if not password or len(password) < 6:
        return error_response('Password must be at least 6 characters', 400)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            return error_response('Username or email already exists', 409)
        
        password_hash = hash_password(password)
        
        cur.execute("""
            INSERT INTO users (username, email, password_hash, minecraft_nick)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (username, email, password_hash, minecraft_nick or None))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        
        token = generate_token(user_id)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'User registered successfully',
                'user': {
                    'id': user_id,
                    'username': username,
                    'email': email,
                    'minecraft_nick': minecraft_nick
                },
                'token': token
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        conn.rollback()
        return error_response(f'Database error: {str(e)}', 500)
    finally:
        cur.close()
        conn.close()

def login_user(body: dict) -> dict:
    username = body.get('username', '').strip()
    password = body.get('password', '')
    
    if not username or not password:
        return error_response('Username and password required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, username, email, password_hash, minecraft_nick, is_active
            FROM users
            WHERE username = %s OR email = %s
        """, (username, username))
        
        user = cur.fetchone()
        
        if not user:
            return error_response('Invalid credentials', 401)
        
        user_id, uname, email, pwd_hash, mc_nick, is_active = user
        
        if not is_active:
            return error_response('Account is disabled', 403)
        
        if not verify_password(password, pwd_hash):
            return error_response('Invalid credentials', 401)
        
        cur.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.now(), user_id))
        conn.commit()
        
        token = generate_token(user_id)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user_id,
                    'username': uname,
                    'email': email,
                    'minecraft_nick': mc_nick
                },
                'token': token
            }),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()

def verify_token(headers: dict) -> dict:
    token = headers.get('X-User-Token') or headers.get('x-user-token')
    
    if not token:
        return error_response('No token provided', 401)
    
    try:
        user_id = int(token.split('_')[-1])
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, username, email, minecraft_nick
            FROM users
            WHERE id = %s AND is_active = true
        """, (user_id,))
        
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return error_response('Invalid token', 401)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'minecraft_nick': user[3]
                }
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        return error_response(f'Token verification failed: {str(e)}', 401)

def error_response(message: str, status_code: int) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': False,
            'error': message
        }),
        'isBase64Encoded': False
    }
