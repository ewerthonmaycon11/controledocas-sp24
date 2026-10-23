import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'chave-secreta-docas-2026-neon')

# Configuração do Banco de Dados com fallback para o seu link do Neon
DATABASE_URL = os.environ.get('DATABASE_URL') or 'postgresql://neondb_owner:npg_5pCBLb2VHoKa@ep-wandering-night-b5dj5kku-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Garante o uso do driver psycopg 3 compatível com qualquer versão do Python no Render
if DATABASE_URL.startswith("postgresql://") and not "+psycopg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# --- MODELOS DO BANCO DE DADOS ---

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)  # Status de aprovação pelo Admin

class Doca(db.Model):
    __tablename__ = 'docas'
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.Integer, unique=True, nullable=False)
    tipo = db.Column(db.String(10), nullable=False) # 'HUB' (1-16) ou 'SOC' (17-40)
    status = db.Column(db.String(20), default='LIVRE') # 'LIVRE' ou 'OCUPADA'
    placa = db.Column(db.String(20), nullable=True, default='')
    destino = db.Column(db.String(100), nullable=True, default='')
    ultima_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'numero': self.numero,
            'tipo': self.tipo,
            'status': self.status,
            'placa': self.placa or '',
            'destino': self.destino or '',
            'ultima_atualizacao': self.ultima_atualizacao.strftime('%H:%M:%S') if self.ultima_atualizacao else ''
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- INICIALIZAÇÃO DO BANCO DE DADOS ---

def init_db():
    with app.app_context():
        db.create_all()
        
        # Cria o Admin mestre padrão (admin / admin) pré-aprovado
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            hashed_pwd = generate_password_hash('admin')
            admin = User(username='admin', password_hash=hashed_pwd, is_admin=True, is_approved=True)
            db.session.add(admin)
            db.session.commit()

        # Popula as 40 docas se não existirem
        if Doca.query.count() == 0:
            for num in range(1, 41):
                tipo_doca = 'HUB' if 1 <= num <= 16 else 'SOC'
                doca = Doca(numero=num, tipo=tipo_doca, status='LIVRE', placa='', destino='')
                db.session.add(doca)
            db.session.commit()

# --- ROTAS PRINCIPAIS ---

@app.route('/')
def index():
    docas = Doca.query.order_by(Doca.numero.asc()).all()
    hub_count = sum(1 for d in docas if d.tipo == 'HUB')
    soc_count = sum(1 for d in docas if d.tipo == 'SOC')
    ocupadas_count = sum(1 for d in docas if d.status == 'OCUPADA')
    livres_count = sum(1 for d in docas if d.status == 'LIVRE')
    
    return render_template(
        'index.html', 
        docas=docas, 
        total=len(docas),
        hub_count=hub_count,
        soc_count=soc_count,
        ocupadas=ocupadas_count,
        livres=livres_count
    )

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            if not user.is_approved:
                flash('Sua conta está aguardando aprovação do administrador.', 'warning')
                return render_template('login.html')
                
            login_user(user)
            flash('Autenticado com sucesso!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Usuário ou senha inválidos.', 'danger')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username').strip()
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('Este nome de usuário já está cadastrado.', 'danger')
            return render_template('register.html')
            
        hashed_pwd = generate_password_hash(password)
        novo_usuario = User(username=username, password_hash=hashed_pwd, is_admin=False, is_approved=False)
        db.session.add(novo_usuario)
        db.session.commit()
        
        flash('Cadastro realizado com sucesso! Aguarde a aprovação do Administrador para acessar.', 'info')
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Sessão encerrada.', 'info')
    return redirect(url_for('index'))

# --- PAINEL ADMINISTRATIVO DE GESTÃO DE USUÁRIOS ---

@app.route('/admin/users')
@login_required
def admin_users():
    if not current_user.is_admin:
        flash('Acesso negado. Apenas administradores podem acessar esta página.', 'danger')
        return redirect(url_for('index'))
        
    users = User.query.order_by(User.id.asc()).all()
    return render_template('admin_users.html', users=users)

@app.route('/admin/user/<int:user_id>/toggle-approval', methods=['POST'])
@login_required
def toggle_user_approval(user_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Não autorizado'}), 403
        
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash('Você não pode alterar seu próprio status.', 'warning')
        return redirect(url_for('admin_users'))
        
    user.is_approved = not user.is_approved
    db.session.commit()
    flash(f'Status de aprovação de {user.username} alterado.', 'success')
    return redirect(url_for('admin_users'))

@app.route('/admin/user/<int:user_id>/toggle-admin', methods=['POST'])
@login_required
def toggle_user_admin(user_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Não autorizado'}), 403
        
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash('Você não pode alterar seus próprios privilégios de admin.', 'warning')
        return redirect(url_for('admin_users'))
        
    user.is_admin = not user.is_admin
    db.session.commit()
    flash(f'Permissões de Admin de {user.username} alteradas.', 'success')
    return redirect(url_for('admin_users'))

# --- API ENDPOINTS ---

@app.route('/api/docas', methods=['GET'])
def api_get_docas():
    docas = Doca.query.order_by(Doca.numero.asc()).all()
    return jsonify([d.to_dict() for d in docas])

@app.route('/api/doca/<int:numero>/update', methods=['POST'])
@login_required
def api_update_doca(numero):
    if not current_user.is_approved:
        return jsonify({'success': False, 'message': 'Conta não aprovada'}), 403

    doca = Doca.query.filter_by(numero=numero).first_or_404()
    data = request.get_json() or {}
    
    novo_status = data.get('status')
    nova_placa = data.get('placa', '').strip().upper()
    novo_destino = data.get('destino', '').strip().upper()
    
    if novo_status in ['LIVRE', 'OCUPADA']:
        doca.status = novo_status
        if novo_status == 'LIVRE':
            doca.placa = ''
            doca.destino = ''
        elif novo_status == 'OCUPADA':
            if nova_placa:
                doca.placa = nova_placa
            if novo_destino:
                doca.destino = novo_destino
            
    db.session.commit()
    return jsonify({'success': True, 'doca': doca.to_dict()})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)