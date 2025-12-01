"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Créer la table users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('role', sa.Enum('ADMIN', 'INGENIEUR', 'CHEF_LAB', 'TECHNICIEN', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Créer la table essais
    op.create_table(
        'essais',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('numero_essai', sa.String(), nullable=False),
        sa.Column('type_essai', sa.Enum('ATTERBERG', 'CBR', 'PROCTOR', 'GRANULOMETRIE', 'AUTRE', name='typeessai'), nullable=False),
        sa.Column('statut', sa.Enum('BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', name='statutessai'), nullable=False),
        sa.Column('projet', sa.String(), nullable=True),
        sa.Column('echantillon', sa.String(), nullable=True),
        sa.Column('date_essai', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('date_reception', sa.DateTime(timezone=True), nullable=True),
        sa.Column('operateur_id', sa.Integer(), nullable=False),
        sa.Column('resultats', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('observations', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['operateur_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_essais_id'), 'essais', ['id'], unique=False)
    op.create_index(op.f('ix_essais_numero_essai'), 'essais', ['numero_essai'], unique=True)

    # Créer la table essais_atterberg
    op.create_table(
        'essais_atterberg',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('essai_id', sa.Integer(), nullable=False),
        sa.Column('wl_nombre_coups', sa.Integer(), nullable=True),
        sa.Column('wl_teneur_eau', sa.Float(), nullable=True),
        sa.Column('wp_teneur_eau', sa.Float(), nullable=True),
        sa.Column('wl', sa.Float(), nullable=True),
        sa.Column('wp', sa.Float(), nullable=True),
        sa.Column('ip', sa.Float(), nullable=True),
        sa.Column('ic', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['essai_id'], ['essais.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('essai_id')
    )

    # Créer la table essais_cbr
    op.create_table(
        'essais_cbr',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('essai_id', sa.Integer(), nullable=False),
        sa.Column('force_25mm', sa.Float(), nullable=True),
        sa.Column('force_50mm', sa.Float(), nullable=True),
        sa.Column('cbr_25mm', sa.Float(), nullable=True),
        sa.Column('cbr_50mm', sa.Float(), nullable=True),
        sa.Column('cbr_final', sa.Float(), nullable=True),
        sa.Column('teneur_eau', sa.Float(), nullable=True),
        sa.Column('densite_seche', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['essai_id'], ['essais.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('essai_id')
    )

    # Créer la table essais_proctor
    op.create_table(
        'essais_proctor',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('essai_id', sa.Integer(), nullable=False),
        sa.Column('type_proctor', sa.String(), nullable=False),
        sa.Column('points_mesure', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('opm', sa.Float(), nullable=True),
        sa.Column('densite_seche_max', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['essai_id'], ['essais.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('essai_id')
    )

    # Créer la table essais_granulometrie
    op.create_table(
        'essais_granulometrie',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('essai_id', sa.Integer(), nullable=False),
        sa.Column('points_tamisage', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('d10', sa.Float(), nullable=True),
        sa.Column('d30', sa.Float(), nullable=True),
        sa.Column('d60', sa.Float(), nullable=True),
        sa.Column('cu', sa.Float(), nullable=True),
        sa.Column('cc', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['essai_id'], ['essais.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('essai_id')
    )


def downgrade() -> None:
    op.drop_table('essais_granulometrie')
    op.drop_table('essais_proctor')
    op.drop_table('essais_cbr')
    op.drop_table('essais_atterberg')
    op.drop_index(op.f('ix_essais_numero_essai'), table_name='essais')
    op.drop_index(op.f('ix_essais_id'), table_name='essais')
    op.drop_table('essais')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS typeessai')
    op.execute('DROP TYPE IF EXISTS statutessai')

