"""add_media_and_kyc_columns

Revision ID: a78bc3419df1
Revises: f52e89a1c432
Create Date: 2026-09-24 19:37:30.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a78bc3419df1'
down_revision: Union[str, None] = 'f52e89a1c432'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add banner_url to stores
    op.add_column('stores', sa.Column('banner_url', sa.String(length=500), nullable=True))

    # Add KYC document and tax identification columns to businesses
    op.add_column('businesses', sa.Column('cac_document_url', sa.String(length=500), nullable=True))
    op.add_column('businesses', sa.Column('government_id_url', sa.String(length=500), nullable=True))
    op.add_column('businesses', sa.Column('tax_id', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('businesses', 'tax_id')
    op.drop_column('businesses', 'government_id_url')
    op.drop_column('businesses', 'cac_document_url')
    op.drop_column('stores', 'banner_url')

