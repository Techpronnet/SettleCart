"""add_notifications

Revision ID: f52e89a1c432
Revises: 36883fd1adf0
Create Date: 2026-09-24 19:26:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f52e89a1c432'
down_revision: Union[str, None] = '36883fd1adf0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationchannel') THEN
                    CREATE TYPE notificationchannel AS ENUM ('in_app', 'email', 'sms', 'push');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationeventtype') THEN
                    CREATE TYPE notificationeventtype AS ENUM (
                        'order_created', 'payment_confirmed', 'order_cancelled',
                        'vendor_order_assigned', 'dispatch_assigned', 'delivery_otp_generated',
                        'delivery_picked_up', 'delivery_in_transit', 'delivery_completed',
                        'delivery_failed', 'settlement_credited', 'withdrawal_requested',
                        'withdrawal_processed', 'kyc_reviewed', 'general'
                    );
                END IF;
            END $$;
        """)

    op.create_table(
        'notifications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column(
            'channel',
            postgresql.ENUM('in_app', 'email', 'sms', 'push', name='notificationchannel', create_type=False),
            nullable=False,
        ),
        sa.Column(
            'event_type',
            postgresql.ENUM(
                'order_created', 'payment_confirmed', 'order_cancelled',
                'vendor_order_assigned', 'dispatch_assigned', 'delivery_otp_generated',
                'delivery_picked_up', 'delivery_in_transit', 'delivery_completed',
                'delivery_failed', 'settlement_credited', 'withdrawal_requested',
                'withdrawal_processed', 'kyc_reviewed', 'general',
                name='notificationeventtype',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_event_type'), 'notifications', ['event_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_event_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')

    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        sa.Enum(name='notificationeventtype').drop(bind, checkfirst=True)
        sa.Enum(name='notificationchannel').drop(bind, checkfirst=True)

