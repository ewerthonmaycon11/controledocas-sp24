import os
from datetime import datetime, timedelta
from io import BytesIO
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import inspect, text

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'chave-secreta-docas-2026-neon')

DATABASE_URL = os.environ.get('DATABASE_URL') or 'postgresql://neondb_owner:npg_5pCBLb2VHoKa@ep-wandering-night-b5dj5kku-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("postgresql://") and not "+psycopg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)

class Doca(db.Model):
    __tablename__ = 'docas'
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.Integer, unique=True, nullable=False)
    tipo = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='LIVRE')
    
    nome = db.Column(db.String(100), nullable=True, default='')
    regiao = db.Column(db.String(100), nullable=True, default='')
    placa = db.Column(db.String(20), nullable=True, default='')
    chegada = db.Column(db.String(20), nullable=True, default='')
    eta = db.Column(db.String(20), nullable=True, default='')
    cpt = db.Column(db.String(50), nullable=True, default='')
    
    ultima_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'numero': self.numero,
            'tipo': self.tipo,
            'status': self.status,
            'nome': self.nome or '',
            'regiao': self.regiao or '',
            'placa': self.placa or '',
            'chegada': self.chegada or '',
            'eta': self.eta or '',
            'cpt': self.cpt or '',
            'ultima_atualizacao': self.ultima_atualizacao.strftime('%H:%M:%S') if self.ultima_atualizacao else ''
        }

class HistoricoDoca(db.Model):
    __tablename__ = 'historico_docas'
    id = db.Column(db.Integer, primary_key=True)
    doca_numero = db.Column(db.Integer, nullable=False)
    tipo = db.Column(db.String(10), nullable=False)
    nome = db.Column(db.String(100), nullable=True, default='')
    regiao = db.Column(db.String(100), nullable=True, default='')
    placa = db.Column(db.String(20), nullable=True, default='')
    chegada = db.Column(db.String(20), nullable=True, default='')
    eta = db.Column(db.String(20), nullable=True, default='')
    cpt = db.Column(db.String(50), nullable=True, default='')
    horario_saida = db.Column(db.String(20), nullable=True, default='')
    data_registro = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'doca_numero': self.doca_numero,
            'tipo': self.tipo,
            'nome': self.nome or '',
            'regiao': self.regiao or '',
            'placa': self.placa or '',
            'chegada': self.chegada or '',
            'eta': self.eta or '',
            'cpt': self.cpt or '',
            'horario_saida': self.horario_saida or '',
            'data_registro': self.data_registro.strftime('%d/%m/%Y %H:%M:%S') if self.data_registro else ''
        }

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

def limpar_historico_antigo():
    limite = datetime.utcnow() - timedelta(days=2)
    HistoricoDoca.query.filter(HistoricoDoca.data_registro < limite).delete()
    db.session.commit()

def init_db():
    with app.app_context():
        db.create_all()
        
        inspector = inspect(db.engine)
        if inspector.has_table("docas"):
            columns = [c['name'] for c in inspector.get_columns("docas")]
            with db.engine.begin() as conn:
                if 'nome' not in columns:
                    conn.execute(text("ALTER TABLE docas ADD COLUMN nome VARCHAR(100) DEFAULT ''"))
                if 'regiao' not in columns:
                    conn.execute(text("ALTER TABLE docas ADD COLUMN regiao VARCHAR(100) DEFAULT ''"))
                if 'chegada' not in columns:
                    conn.execute(text("ALTER TABLE docas ADD COLUMN chegada VARCHAR(20) DEFAULT ''"))
                if 'eta' not in columns:
                    conn.execute(text("ALTER TABLE docas ADD COLUMN eta VARCHAR(20) DEFAULT ''"))
                if 'cpt' not in columns:
                    conn.execute(text("ALTER TABLE docas ADD COLUMN cpt VARCHAR(50) DEFAULT ''"))

        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            hashed_pwd = generate_password_hash('admin')
            admin = User(username='admin', password_hash=hashed_pwd, is_admin=True, is_approved=True)
            db.session.add(admin)
            db.session.commit()

        if Doca.query.count() == 0:
            for num in range(1, 41):
                tipo_doca = 'HUB' if 1 <= num <= 16 else 'SOC'
                doca = Doca(numero=num, tipo=tipo_doca, status='LIVRE', placa='', regiao='')
                db.session.add(doca)
            db.session.commit()

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

@app.route('/historico')
@login_required
def historico_page():
    limpar_historico_antigo()
    data_sel = request.args.get('data', datetime.utcnow().strftime('%Y-%m-%d'))
    
    try:
        data_obj = datetime.strptime(data_sel, '%Y-%m-%d')
    except ValueError:
        data_obj = datetime.utcnow()

    inicio_dia = datetime(data_obj.year, data_obj.month, data_obj.day, 0, 0, 0)
    fim_dia = datetime(data_obj.year, data_obj.month, data_obj.day, 23, 59, 59)

    registros = HistoricoDoca.query.filter(
        HistoricoDoca.data_registro >= inicio_dia,
        HistoricoDoca.data_registro <= fim_dia
    ).order_by(HistoricoDoca.data_registro.desc()).all()

    return render_template('historico.html', registros=registros, data_selecionada=data_sel)

@app.route('/historico/exportar/<formato>')
@login_required
def exportar_historico(formato):
    limpar_historico_antigo()
    data_sel = request.args.get('data', datetime.utcnow().strftime('%Y-%m-%d'))
    try:
        data_obj = datetime.strptime(data_sel, '%Y-%m-%d')
    except ValueError:
        data_obj = datetime.utcnow()

    inicio_dia = datetime(data_obj.year, data_obj.month, data_obj.day, 0, 0, 0)
    fim_dia = datetime(data_obj.year, data_obj.month, data_obj.day, 23, 59, 59)

    registros = HistoricoDoca.query.filter(
        HistoricoDoca.data_registro >= inicio_dia,
        HistoricoDoca.data_registro <= fim_dia
    ).order_by(HistoricoDoca.data_registro.asc()).all()

    filename = f"historico_docas_{data_sel}.{formato}"

    if formato == 'txt':
        conteudo = f"=== HISTÓRICO DE DOCAS - {data_sel} ===\n\n"
        for r in registros:
            conteudo += (
                f"DOCA: {r.doca_numero} ({r.tipo})\n"
                f"PLACA: {r.placa or 'NÃO INFORMADA'} | NOME: {r.nome or 'NÃO INFORMADO'}\n"
                f"REGIÃO: {r.regiao or 'NÃO INFORMADA'} | CPT: {r.cpt or 'NÃO INFORMADO'}\n"
                f"CHEGADA: {r.chegada or 'NÃO INFORMADA'} | ETA: {r.eta or 'NÃO INFORMADO'}\n"
                f"HORÁRIO SAÍDA: {r.horario_saida or 'NÃO INFORMADO'}\n"
                f"REGISTRADO EM: {r.data_registro.strftime('%d/%m/%Y %H:%M:%S')}\n"
                f"--------------------------------------------------\n"
            )
        buffer = BytesIO()
        buffer.write(conteudo.encode('utf-8'))
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='text/plain')

    elif formato == 'pdf':
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        y = 750
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y, f"Relatorio de Historico de Docas - {data_sel}")
        y -= 30
        p.setFont("Helvetica", 10)

        for r in registros:
            if y < 80:
                p.showPage()
                y = 750
                p.setFont("Helvetica", 10)

            texto = f"Doca {r.doca_numero} ({r.tipo}) - Placa: {r.placa or 'N/A'} | Nome: {r.nome or 'N/A'}"
            detalhe = f"Regiao: {r.regiao or 'N/A'} | Chegada: {r.chegada or 'N/A'} | Saida: {r.horario_saida or 'N/A'} | CPT: {r.cpt or 'N/A'}"
            
            p.drawString(50, y, texto)
            y -= 15
            p.drawString(50, y, detalhe)
            y -= 20

        p.showPage()
        p.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    return redirect(url_for('historico_page'))

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

@app.route('/api/docas', methods=['GET'])
def api_get_docas():
    docas = Doca.query.order_by(Doca.numero.asc()).all()
    return jsonify([d.to_dict() for d in docas])

@app.route('/api/doca/<int:numero>/update', methods=['POST'])
@login_required
def api_update_doca(numero):
    doca = Doca.query.filter_by(numero=numero).first_or_404()
    data = request.get_json() or {}
    
    novo_status = data.get('status')
    horario_agora = datetime.utcnow().strftime('%H:%M:%S')

    if novo_status in ['LIVRE', 'OCUPADA']:
        if novo_status == 'LIVRE' and doca.status == 'OCUPADA':
            hist = HistoricoDoca(
                doca_numero=doca.numero,
                tipo=doca.tipo,
                nome=doca.nome,
                regiao=doca.regiao,
                placa=doca.placa,
                chegada=doca.chegada,
                eta=doca.eta,
                cpt=doca.cpt,
                horario_saida=horario_agora,
                data_registro=datetime.utcnow()
            )
            db.session.add(hist)

            doca.nome = ''
            doca.regiao = ''
            doca.placa = ''
            doca.chegada = ''
            doca.eta = ''
            doca.cpt = ''

        elif novo_status == 'OCUPADA':
            val_nome = data.get('nome', '')
            val_regiao = data.get('regiao', '')
            val_placa = data.get('placa', '')
            val_chegada = data.get('chegada', '')
            val_eta = data.get('eta', '')
            val_cpt = data.get('cpt', '')

            doca.nome = val_nome.strip().upper() if isinstance(val_nome, str) else str(val_nome).strip().upper()
            doca.regiao = val_regiao.strip().upper() if isinstance(val_regiao, str) else str(val_regiao).strip().upper()
            doca.placa = val_placa.strip().upper() if isinstance(val_placa, str) else str(val_placa).strip().upper()
            doca.chegada = val_chegada.strip() if isinstance(val_chegada, str) else str(val_chegada).strip()
            doca.eta = val_eta.strip() if isinstance(val_eta, str) else str(val_eta).strip()
            doca.cpt = val_cpt.strip().upper() if isinstance(val_cpt, str) else str(val_cpt).strip().upper()

        doca.status = novo_status

    db.session.commit()
    return jsonify({'success': True, 'doca': doca.to_dict()})

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)