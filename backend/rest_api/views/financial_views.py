from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from ..models.reference import FinancialCategory, FinancialLineItem
from ..models.core import Timeframe
from ..models.transactions import FinancialEntry

from ..serializers.financial_serializers import FinancialCategorySerializer


class FinancialCategoryView(ListAPIView):
    serializer_class = FinancialCategorySerializer
    lookup_field = "category_id"

    def get_queryset(self):
        qs = FinancialCategory.objects.all()
        category_id = self.kwargs.get(self.lookup_field)
        if category_id is not None:
            qs = qs.filter(category_id=category_id)
        return qs


class PnLView(APIView):
    """
    GET /api/pnl/<fund_id>/
    Optional: ?timeframe_ids=1,2,3
    """

    def get(self, request, fund_id):
        # ---- timeframes filtering ----
        tf_ids_param = request.query_params.get("timeframe_ids")
        if tf_ids_param:
            tf_ids = [int(x) for x in tf_ids_param.split(",") if x.strip().isdigit()]
            timeframes_qs = Timeframe.objects.filter(pk__in=tf_ids)
        else:
            if hasattr(Timeframe, "fund_id"):
                timeframes_qs = Timeframe.objects.filter(fund_id=fund_id)
            elif hasattr(Timeframe, "fund"):
                timeframes_qs = Timeframe.objects.filter(fund_id=fund_id)
            else:
                timeframes_qs = Timeframe.objects.all()

        if hasattr(Timeframe, "sort"):
            timeframes_qs = timeframes_qs.order_by("sort")
        elif hasattr(Timeframe, "timeframe_id"):
            timeframes_qs = timeframes_qs.order_by("timeframe_id")
        else:
            timeframes_qs = timeframes_qs.order_by("pk")

        timeframes = list(timeframes_qs.values())
        timeframe_ids = list(timeframes_qs.values_list("pk", flat=True))

        # ---- category ids (case + plural tolerant) ----
        cats = {
            (c.name or "").strip().lower(): c.category_id
            for c in FinancialCategory.objects.all()
        }
        income_id = cats.get("income")
        expense_id = cats.get("expense") or cats.get("expenses")
        tax_id = cats.get("tax") or cats.get("taxes")

        # ---- line items by category ----
        line_items_qs = FinancialLineItem.objects.filter(
            fund_id=fund_id,
            is_deleted=False
        )

        income_lines = list(line_items_qs.filter(category_id=income_id).values()) if income_id else []
        expense_lines = list(line_items_qs.filter(category_id=expense_id).values()) if expense_id else []
        tax_lines = list(line_items_qs.filter(category_id=tax_id).values()) if tax_id else []

        all_line_ids = list(line_items_qs.values_list("line_item_id", flat=True))

        # ---- entries ----
        entries = list(
            FinancialEntry.objects.filter(
                timeframe_id__in=timeframe_ids,
                line_item_id__in=all_line_ids,
            ).values("timeframe_id", "line_item_id", "amount")
        )

        def build_values_map(allowed_ids):
            out = {}
            for e in entries:
                lid = e["line_item_id"]
                if lid not in allowed_ids:
                    continue
                out.setdefault(str(lid), {})[str(e["timeframe_id"])] = float(e["amount"] or 0)
            return out

        income_allowed = set(l["line_item_id"] for l in income_lines)
        expense_allowed = set(l["line_item_id"] for l in expense_lines)
        tax_allowed = set(l["line_item_id"] for l in tax_lines)

        return Response({
            "timeframes": timeframes,
            "incomeLines": income_lines,
            "expenseLines": expense_lines,
            "taxLines": tax_lines,
            "incomeValues": build_values_map(income_allowed),
            "expenseValues": build_values_map(expense_allowed),
            "taxValues": build_values_map(tax_allowed),
        })


class PnLValueUpsertView(APIView):
    """
    POST /api/pnl/<fund_id>/value/
    body: { "lineItemId": 12, "timeframeId": 5, "amount": 12345.67 }

    Fixes:
    - created_at NOT NULL on create
    - created_at remains unchanged on updates
    """

    def post(self, request, fund_id):
        line_item_id = request.data.get("lineItemId")
        timeframe_id = request.data.get("timeframeId")
        amount = request.data.get("amount", 0)

        if line_item_id is None or timeframe_id is None:
            return Response(
                {"detail": "lineItemId and timeframeId are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not FinancialLineItem.objects.filter(
            line_item_id=int(line_item_id),
            fund_id=int(fund_id),
            is_deleted=False,
        ).exists():
            return Response(
                {"detail": "Invalid lineItemId for this fund"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()  # timezone-aware

        updated = FinancialEntry.objects.filter(
            timeframe_id=int(timeframe_id),
            line_item_id=int(line_item_id),
        ).update(
            amount=amount,
            updated_at=now,
            updated_by=None,
        )

        if updated:
            obj = FinancialEntry.objects.get(
                timeframe_id=int(timeframe_id),
                line_item_id=int(line_item_id),
            )
            return Response({"ok": True, "created": False, "entry_id": obj.entry_id})

        obj = FinancialEntry.objects.create(
            timeframe_id=int(timeframe_id),
            line_item_id=int(line_item_id),
            amount=amount,
            created_at=now,
            created_by=None,
            updated_at=now,
            updated_by=None,
        )

        return Response({"ok": True, "created": True, "entry_id": obj.entry_id})


class PnLLineItemCreateView(APIView):
    """
    POST /api/pnl/<fund_id>/line-item/
    body: { "category": "income" | "expense" | "tax", "name": "My new row" }

    Creates a FinancialLineItem row so custom rows can be saved.
    """

    def post(self, request, fund_id):
        category = (request.data.get("category") or "").strip().lower()
        name = (request.data.get("name") or "").strip()

        if category not in ("income", "expense", "tax"):
            return Response(
                {"detail": "category must be one of: income, expense, tax"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not name:
            return Response(
                {"detail": "name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # map category -> category_id (case/plural tolerant)
        cats = {(c.name or "").strip().lower(): c.category_id for c in FinancialCategory.objects.all()}
        if category == "income":
            category_id = cats.get("income")
        elif category == "expense":
            category_id = cats.get("expense") or cats.get("expenses")
        else:
            category_id = cats.get("tax") or cats.get("taxes")

        if not category_id:
            return Response(
                {"detail": f"Category '{category}' not found in FinancialCategory table"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Avoid duplicates (same fund + category + name) if your table supports it
        existing = FinancialLineItem.objects.filter(
            fund_id=int(fund_id),
            category_id=int(category_id),
            name=name,
            is_deleted=False
        ).first()

        if existing:
            return Response({
                "ok": True,
                "created": False,
                "line_item_id": existing.line_item_id,
                "fund_id": int(fund_id),
                "category_id": int(category_id),
                "name": existing.name,
            })

        now = timezone.now()

        # Create with safe optional fields if they exist in model
        create_kwargs = {
            "fund_id": int(fund_id),
            "category_id": int(category_id),
            "name": name,
            "is_deleted": False,
        }

        # Some schemas have created_at/updated_at columns on line items too:
        if hasattr(FinancialLineItem, "created_at"):
            create_kwargs["created_at"] = now
        if hasattr(FinancialLineItem, "updated_at"):
            create_kwargs["updated_at"] = now
        if hasattr(FinancialLineItem, "created_by"):
            create_kwargs["created_by"] = None
        if hasattr(FinancialLineItem, "updated_by"):
            create_kwargs["updated_by"] = None

        obj = FinancialLineItem.objects.create(**create_kwargs)

        return Response({
            "ok": True,
            "created": True,
            "line_item_id": obj.line_item_id,
            "fund_id": int(fund_id),
            "category_id": int(category_id),
            "name": obj.name,
        }, status=status.HTTP_201_CREATED)
