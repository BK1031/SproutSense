"""add temp

Revision ID: 799f3d35f6c9
Revises: 
Create Date: 2025-02-16 18:31:00.653517

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '799f3d35f6c9'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('sensor_data', schema=None) as batch_op:
        batch_op.add_column(sa.Column('temperature', sa.Integer(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('sensor_data', schema=None) as batch_op:
        batch_op.drop_column('temperature')

    # ### end Alembic commands ###
