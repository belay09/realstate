from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PublicLeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=64)
    email: EmailStr | None = None
    message: str | None = None
    listing_slug: str | None = Field(default=None, max_length=512)
    listing_id: UUID | None = None
    unit_id: UUID | None = None
    source: str = Field(default="website", max_length=64)


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID | None
    unit_id: UUID | None
    company_id: UUID
    quote_id: UUID | None
    name: str
    phone: str
    email: str | None
    message: str | None
    source: str
    status: str
    created_at: datetime
    updated_at: datetime


class LeadStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=32)
    note: str | None = None


class LeadQuoteLink(BaseModel):
    quote_id: UUID


class ReservationCreate(BaseModel):
    quote_id: UUID
    expires_at: datetime | None = None


class ReservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quote_id: UUID
    unit_id: UUID
    status: str
    expires_at: datetime | None
    created_at: datetime


class SalesContractCreate(BaseModel):
    quote_id: UUID
    reservation_id: UUID | None = None
    buyer_name: str = Field(min_length=1, max_length=255)
    contract_number: str | None = Field(default=None, max_length=64)
    signed_date: date | None = None


class SalesContractRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quote_id: UUID
    reservation_id: UUID | None
    contract_number: str
    buyer_name: str
    locked_price: Decimal
    status: str
    signed_date: date | None
    created_at: datetime
