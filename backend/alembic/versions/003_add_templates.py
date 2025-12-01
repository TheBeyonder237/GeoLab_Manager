"""add essai templates

Revision ID: 003_add_templates
Revises: 002_add_history
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_templates'
down_revision = '002_add_history'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'essais_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nom', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_essai', sa.String(), nullable=False),
        sa.Column('donnees_generales', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('donnees_specifiques', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('createur_id', sa.Integer(), nullable=False),
        sa.Column('est_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['createur_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_essais_templates_id'), 'essais_templates', ['id'], unique=False)
    op.create_index('ix_essais_templates_nom', 'essais_templates', ['nom'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_essais_templates_nom', table_name='essais_templates')
    op.drop_index(op.f('ix_essais_templates_id'), 'essais_templates', ['id'])
    op.drop_table('essais_templates')

