from django.contrib import admin

from .models import Verification, BlockchainRecord

admin.site.register(Verification)
admin.site.register(BlockchainRecord)