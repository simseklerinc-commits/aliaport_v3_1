"""Merge migration heads

Revision ID: 85a1eb87feda
Revises: 1f2e3d4c5b67, a7b8c9d0e1f2
Create Date: 2025-11-27 22:21:22.352115

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85a1eb87feda'
down_revision: Union[str, Sequence[str], None] = ('1f2e3d4c5b67', 'a7b8c9d0e1f2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
