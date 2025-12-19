from flask import Flask, render_template, request, redirect, url_for, flash, session
import sqlite3
import hashlib
from datetime import datetime, timedelta
import re
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-it-in-production'
DATABASE = 'users.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT,
                last_login TIMESTAMP,
                profile_color TEXT DEFAULT '#ff99c8',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS user_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT 0,
                priority TEXT DEFAULT 'medium',
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            CREATE TABLE IF NOT EXISTS user_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT DEFAULT 'general',
                color TEXT DEFAULT '#ff99c8',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            CREATE TABLE IF NOT EXISTS user_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                target_date DATE,
                progress INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        ''')

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def check_auth():
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    return None

def create_default_content(user_id, conn):
    defaults = {
        'tasks': [
            ('Welcome to Youth Balance!', 'Take a moment to explore your dashboard and customize it to your needs.', 'high', 'general'),
            ('Set up your morning routine', 'Create a morning routine that energizes you for the day ahead.', 'medium', 'personal'),
            ('Plan your weekly goals', 'Think about what you want to achieve this week and break it into smaller steps.', 'medium', 'personal'),
            ('Practice self-care today', 'Do something kind for yourself - take a bath, read a book, or call a friend.', 'low', 'health')
        ],
        'notes': [
            ('Daily Affirmations', 'I am capable of achieving my dreams.\\nI deserve love and happiness.\\nI am growing stronger every day.\\nI trust in my ability to overcome challenges.\\nI believe in myself and my potential.', 'inspiration', '#4f46e5'),
            ('Self-Care Ideas', '• Take a relaxing bath with essential oils\\n• Write in a gratitude journal\\n• Go for a peaceful walk in nature\\n• Listen to your favorite music\\n• Practice deep breathing exercises\\n• Treat yourself to something special', 'ideas', '#a8e6cf'),
            ('Study Tips', '• Use the Pomodoro Technique (25 min study, 5 min break)\\n• Create a dedicated study space\\n• Break large tasks into smaller ones\\n• Reward yourself after completing tasks\\n• Stay hydrated and take regular breaks', 'general', '#ffd93d'),
            ('Mood Tracker', 'Track your daily mood and notice patterns:\\n\\nToday I feel: ___________\\nWhat made me happy: ___________\\nWhat challenged me: ___________\\nTomorrow I want to: ___________', 'reminders', '#74b9ff')
        ],
        'goals': [
            ('Develop a consistent self-care routine', 'Create and maintain daily habits that support physical and mental wellbeing.', (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')),
            ('Improve time management skills', 'Learn to prioritize tasks effectively and create a balanced schedule.', (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')),
            ('Build confidence and self-esteem', 'Practice positive self-talk and celebrate achievements, big and small.', (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'))
        ]
    }
    
    for title, desc, priority, category in defaults['tasks']:
        conn.execute('INSERT INTO user_tasks (user_id, title, description, priority, category) VALUES (?, ?, ?, ?, ?)', (user_id, title, desc, priority, category))
    for title, content, category, color in defaults['notes']:
        conn.execute('INSERT INTO user_notes (user_id, title, content, category, color) VALUES (?, ?, ?, ?, ?)', (user_id, title, content, category, color))
    for title, desc, target_date in defaults['goals']:
        conn.execute('INSERT INTO user_goals (user_id, title, description, target_date) VALUES (?, ?, ?, ?)', (user_id, title, desc, target_date))

@app.route('/')
@app.route('/home')
def home():
    return redirect(url_for('dashboard')) if 'username' in session else render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username, password = request.form['username'], request.form['password']
        if not username or not password:
            flash('Please fill in all required fields', 'error')
            return render_template('login.html')
        
        conn = get_db()
        user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, hash_password(password))).fetchone()
        
        if user:
            session.update({'username': username, 'user_id': user['id'], 'email': user['email']})
            if request.form.get('remember_me'):
                session.permanent = True
                app.permanent_session_lifetime = timedelta(days=30)
            
            conn.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
            conn.commit()
        
        conn.close()
        
        if user:
            flash('Welcome back! Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'error')
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username, password, email = request.form['username'], request.form['password'], request.form.get('email', '')
        
        if not username or not password:
            flash('Please fill in all required fields', 'error')
            return render_template('signup.html')
        
        if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            flash('Please enter a valid email address', 'error')
            return render_template('signup.html')
        
        try:
            conn = get_db()
            cursor = conn.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', (username, hash_password(password), email))
            user_id = cursor.lastrowid
            create_default_content(user_id, conn)
            conn.commit()
            conn.close()
            flash('Account created successfully! You can now login', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username already exists. Please choose a different one.', 'error')
    
    return render_template('signup.html')

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        flash('Please login first to access your dashboard', 'error')
        return redirect(url_for('login'))
    return render_template('dashboard.html', username=session['username'])

@app.route('/wellbeing')
def wellbeing():
    return render_template('wellbeing.html')

@app.route('/tasks')
def tasks_page():
    return render_template('tasks.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')

@app.route('/account')
def account():
    return redirect(url_for('dashboard' if 'username' in session else 'login'))

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully', 'success')
    return redirect(url_for('home'))

@app.route('/api/tasks', methods=['GET', 'POST'])
def api_tasks():
    auth_error = check_auth()
    if auth_error: return auth_error
    
    conn = get_db()
    
    if request.method == 'POST':
        data = request.get_json()
        cursor = conn.execute('INSERT INTO user_tasks (user_id, title, description, priority, category) VALUES (?, ?, ?, ?, ?)', 
                            (session['user_id'], data['title'], data.get('description', ''), 
                             data.get('priority', 'medium'), data.get('category', 'general')))
        conn.commit()
        conn.close()
        return {'success': True, 'id': cursor.lastrowid}
    
    tasks = conn.execute('SELECT * FROM user_tasks WHERE user_id = ? ORDER BY created_at DESC', (session['user_id'],)).fetchall()
    conn.close()
    return [dict(task) for task in tasks]

@app.route('/api/tasks/<int:task_id>', methods=['DELETE', 'PUT'])
def api_task_actions(task_id):
    auth_error = check_auth()
    if auth_error: return auth_error
    
    conn = get_db()
    
    if request.method == 'DELETE':
        conn.execute('DELETE FROM user_tasks WHERE id = ? AND user_id = ?', (task_id, session['user_id']))
    elif request.method == 'PUT':
        data = request.get_json()
        conn.execute('UPDATE user_tasks SET title = ?, description = ?, priority = ?, category = ? WHERE id = ? AND user_id = ?', 
                    (data['title'], data.get('description', ''), data.get('priority', 'medium'), 
                     data.get('category', 'general'), task_id, session['user_id']))
    
    conn.commit()
    conn.close()
    return {'success': True}

@app.route('/api/notes', methods=['GET', 'POST'])
def api_notes():
    auth_error = check_auth()
    if auth_error: return auth_error
    
    conn = get_db()
    
    if request.method == 'POST':
        data = request.get_json()
        cursor = conn.execute('INSERT INTO user_notes (user_id, title, content, category, color) VALUES (?, ?, ?, ?, ?)', 
                            (session['user_id'], data['title'], data.get('content', ''), 
                             data.get('category', 'general'), data.get('color', '#ff99c8')))
        conn.commit()
        conn.close()
        return {'success': True, 'id': cursor.lastrowid}
    
    notes = conn.execute('SELECT * FROM user_notes WHERE user_id = ? ORDER BY created_at DESC', (session['user_id'],)).fetchall()
    conn.close()
    return [dict(note) for note in notes]

@app.route('/api/notes/<int:note_id>', methods=['DELETE', 'PUT'])
def api_note_actions(note_id):
    auth_error = check_auth()
    if auth_error: return auth_error
    
    conn = get_db()
    
    if request.method == 'DELETE':
        conn.execute('DELETE FROM user_notes WHERE id = ? AND user_id = ?', (note_id, session['user_id']))
    elif request.method == 'PUT':
        data = request.get_json()
        conn.execute('UPDATE user_notes SET title = ?, content = ?, category = ?, color = ? WHERE id = ? AND user_id = ?', 
                    (data['title'], data.get('content', ''), data.get('category', 'general'), 
                     data.get('color', '#ff99c8'), note_id, session['user_id']))
    
    conn.commit()
    conn.close()
    return {'success': True}

@app.route('/api/goals', methods=['GET', 'POST'])
def api_goals():
    auth_error = check_auth()
    if auth_error: return auth_error
    
    conn = get_db()
    
    if request.method == 'POST':
        data = request.get_json()
        cursor = conn.execute('INSERT INTO user_goals (user_id, title, description, target_date) VALUES (?, ?, ?, ?)', 
                            (session['user_id'], data['title'], data.get('description', ''), data.get('target_date')))
        conn.commit()
        conn.close()
        return {'success': True, 'id': cursor.lastrowid}
    
    goals = conn.execute('SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC', (session['user_id'],)).fetchall()
    conn.close()
    return [dict(goal) for goal in goals]

@app.route('/api/goals/<int:goal_id>', methods=['DELETE', 'PUT'])
def api_goal_actions(goal_id):
    auth_error = check_auth()
    if auth_error: return auth_error
    
    conn = get_db()
    
    if request.method == 'DELETE':
        conn.execute('DELETE FROM user_goals WHERE id = ? AND user_id = ?', (goal_id, session['user_id']))
    elif request.method == 'PUT':
        data = request.get_json()
        conn.execute('UPDATE user_goals SET title = ?, description = ?, target_date = ?, progress = ? WHERE id = ? AND user_id = ?', 
                    (data['title'], data.get('description', ''), data.get('target_date'), 
                     data.get('progress', 0), goal_id, session['user_id']))
    
    conn.commit()
    conn.close()
    return {'success': True}

@app.route('/api/tasks/<int:task_id>/toggle', methods=['POST'])
def api_toggle_task(task_id):
    auth_error = check_auth()
    if auth_error: return auth_error
    
    conn = get_db()
    task = conn.execute('SELECT completed FROM user_tasks WHERE id = ? AND user_id = ?', (task_id, session['user_id'])).fetchone()
    if task:
        conn.execute('UPDATE user_tasks SET completed = ? WHERE id = ? AND user_id = ?', (not task['completed'], task_id, session['user_id']))
        conn.commit()
    conn.close()
    
    return {'success': True}

if __name__ == '__main__':
    init_db()
    conn = get_db()
    user_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    if user_count == 0:
        cursor = conn.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', ('test', hash_password('123'), 'test@example.com'))
        create_default_content(cursor.lastrowid, conn)
        conn.commit()
        print("Test user created: username='test', password='123'")
    conn.close()
    
    app.run(debug=True, host='0.0.0.0', port=5000)