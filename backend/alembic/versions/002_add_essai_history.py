"""add essai history

Revision ID: 002_add_history
Revises: 7ea71076c19d
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_history'
down_revision = '7ea71076c19d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'essais_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('essai_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('field_name', sa.String(), nullable=True),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('changes', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['essai_id'], ['essais.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_essais_history_id'), 'essais_history', ['id'], unique=False)
    op.create_index('ix_essais_history_essai_id', 'essais_history', ['essai_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_essais_history_essai_id', table_name='essais_history')
    op.drop_index(op.f('ix_essais_history_id'), 'essais_history', ['id'])
    op.drop_table('essais_history')

