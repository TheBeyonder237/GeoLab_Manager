"""add projets table

Revision ID: 004_add_projets
Revises: 003_add_templates
Create Date: 2024-01-01 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_projets'
down_revision = '003_add_templates'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Créer la table projets
    op.create_table(
        'projets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nom', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('code_projet', sa.String(), nullable=False),
        sa.Column('client', sa.String(), nullable=True),
        sa.Column('site', sa.String(), nullable=True),
        sa.Column('responsable_id', sa.Integer(), nullable=True),
        sa.Column('date_debut', sa.DateTime(timezone=True), nullable=True),
        sa.Column('date_fin', sa.DateTime(timezone=True), nullable=True),
        sa.Column('statut', sa.String(), nullable=False, server_default='actif'),
        sa.Column('est_archive', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['responsable_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code_projet')
    )
    op.create_index(op.f('ix_projets_id'), 'projets', ['id'], unique=False)
    op.create_index('ix_projets_nom', 'projets', ['nom'], unique=False)
    op.create_index('ix_projets_code_projet', 'projets', ['code_projet'], unique=True)
    
    # Ajouter la colonne projet_id à la table essais
    op.add_column('essais', sa.Column('projet_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_essais_projet_id', 'essais', 'projets', ['projet_id'], ['id'])
    op.create_index('ix_essais_projet_id', 'essais', ['projet_id'], unique=False)
    
    # Garder projet_nom pour compatibilité (peut être rempli depuis l'ancien champ projet)
    op.add_column('essais', sa.Column('projet_nom', sa.String(), nullable=True))
    
    # Migrer les données existantes si possible
    # Si des essais ont déjà un champ 'projet', on peut créer un projet par défaut
    # ou laisser projet_nom = projet pour compatibilité


def downgrade() -> None:
    op.drop_index('ix_essais_projet_id', table_name='essais')
    op.drop_constraint('fk_essais_projet_id', 'essais', type_='foreignkey')
    op.drop_column('essais', 'projet_nom')
    op.drop_column('essais', 'projet_id')
    op.drop_index('ix_projets_code_projet', table_name='projets')
    op.drop_index('ix_projets_nom', table_name='projets')
    op.drop_index(op.f('ix_projets_id'), 'projets', ['id'])
    op.drop_table('projets')

