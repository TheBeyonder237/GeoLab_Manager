"""create qualite tables manual

Revision ID: 8f8de5165c4a
Revises: 213d3ab43700
Create Date: 2025-11-21
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "8f8de5165c4a"
down_revision = "213d3ab43700"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Table controles_qualite
    op.create_table(
        "controles_qualite",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("statut", sa.String(length=50), nullable=False),
        sa.Column("titre", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("date_prevue", sa.DateTime(timezone=True), nullable=False),
        sa.Column("date_realisation", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resultats", sa.JSON(), nullable=True),
        sa.Column("conforme", sa.Boolean(), nullable=True),
        sa.Column("actions_correctives", sa.Text(), nullable=True),
        sa.Column("responsable_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Table calibrations
    op.create_table(
        "calibrations",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("equipement", sa.String(), nullable=False),
        sa.Column("numero_serie", sa.String(), nullable=False),
        sa.Column("date_calibration", sa.DateTime(timezone=True), nullable=False),
        sa.Column("date_prochaine", sa.DateTime(timezone=True), nullable=False),
        sa.Column("mesures", sa.JSON(), nullable=False),
        sa.Column("precision", sa.Float(), nullable=True),
        sa.Column("conforme", sa.Boolean(), nullable=False),
        sa.Column("commentaires", sa.Text(), nullable=True),
        sa.Column("technicien_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Table non_conformites
    op.create_table(
        "non_conformites",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("titre", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("gravite", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("origine", sa.String(), nullable=False),
        sa.Column("essai_id", sa.Integer(), sa.ForeignKey("essais.id"), nullable=True),
        sa.Column("detecteur_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("responsable_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action_immediate", sa.Text(), nullable=True),
        sa.Column("action_corrective", sa.Text(), nullable=True),
        sa.Column("date_resolution", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("non_conformites")
    op.drop_table("calibrations")
    op.drop_table("controles_qualite")
