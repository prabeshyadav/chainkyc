from django.contrib import admin

from .models import BlockchainAnchor


@admin.register(BlockchainAnchor)
class BlockchainAnchorAdmin(admin.ModelAdmin):
    list_display = ("kyc_submission", "network", "status", "tx_hash", "anchored_at")
    list_filter = ("network", "status")
    search_fields = ("tx_hash", "ipfs_cid", "kyc_submission__user__wallet_address")
