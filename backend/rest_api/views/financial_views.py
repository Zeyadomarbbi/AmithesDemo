from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..models.reference import FinancialCategory, FinancialLineItem
from ..models.core import Timeframe
from ..models.transactions import FinancialEntry

from ..serializers.financial_serializers import FinancialCategorySerializer, FinancialLineItemSerializer

class FinancialCategoryView(ListAPIView):
    serializer_class = FinancialCategorySerializer
    lookup_field = "category_id"

    def get_queryset(self):
        qs = FinancialCategory.objects.all()
        category_id = self.kwargs.get(self.lookup_field)
        if category_id is not None:
            qs = qs.filter(category_id=category_id)
        return qs

class FinancialLineItemViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialLineItemSerializer
    def get_queryset(self):
        """
        Returns line items strictly for the fund specified in the URL.
        Optimized with select_related to fetch Category data in one query.
        """
        fund_id = self.kwargs.get('fund_id')
        if not fund_id:
            return FinancialLineItem.objects.none()
            
        return FinancialLineItem.objects.filter(
            fund_id=fund_id, 
            is_deleted=False
        ).select_related('category').order_by('category', 'name')

    def perform_create(self, serializer):
        """
        Auto-assigns the Fund ID from the URL and the User.
        This triggers the Serializer's validate() method where Fuzzy Matching happens.
        """
        fund_id = self.kwargs.get('fund_id')
        
        # Check for duplicates manually if needed, or rely on DB constraints
        # valid_data includes the 'special_field' injected by the serializer
        serializer.save(
            fund_id=fund_id,
            created_by=self.request.user.id if self.request.user.is_authenticated else None
        )

    def perform_destroy(self, instance):
        """
        Soft Delete implementation.
        """
        instance.is_deleted = True
        instance.save()

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
    POST   /api/pnl/<fund_id>/line-item/               — create
    PATCH  /api/pnl/<fund_id>/line-item/<line_item_id>/ — update name
    DELETE /api/pnl/<fund_id>/line-item/<line_item_id>/ — soft delete
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
                "special_field": existing.special_field,
            })
 
        serializer_data = {
            "fund_id": int(fund_id),
            "category": int(category_id),
            "name": name,
            "is_deleted": False,
        }
 
        serializer = FinancialLineItemSerializer(data=serializer_data)
 
        if serializer.is_valid():
            obj = serializer.save(
                created_at=timezone.now(),
                created_by=request.user.id if request.user.is_authenticated else None,
            )
            if obj.special_field:
                print(f"✅ FUZZY MATCH SUCCESS: '{obj.name}' -> [{obj.special_field}]")
            else:
                print(f"ℹ️ No Special Field match for: '{obj.name}'")
 
            return Response({
                "ok": True,
                "created": True,
                "line_item_id": obj.line_item_id,
                "fund_id": int(fund_id),
                "category_id": int(category_id),
                "name": obj.name,
                "special_field": obj.special_field,
            }, status=status.HTTP_201_CREATED)
 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    def patch(self, request, fund_id, line_item_id):
        name = (request.data.get("name") or "").strip()
 
        if not name:
            return Response(
                {"detail": "name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        obj = get_object_or_404(
            FinancialLineItem,
            line_item_id=line_item_id,
            fund_id=int(fund_id),
            is_deleted=False,
        )
 
        serializer = FinancialLineItemSerializer(obj, data={"name": name}, partial=True)
 
        if serializer.is_valid():
            updated = serializer.save(
                updated_at=timezone.now(),
            )
            return Response({
                "ok": True,
                "line_item_id": updated.line_item_id,
                "fund_id": int(fund_id),
                "name": updated.name,
                "special_field": updated.special_field,
            })
 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    def delete(self, request, fund_id, line_item_id):
        obj = get_object_or_404(
            FinancialLineItem,
            line_item_id=line_item_id,
            fund_id=int(fund_id),
            is_deleted=False,
        )

        FinancialEntry.objects.filter(line_item=obj).delete()
        obj.delete()

        return Response({"ok": True, "deleted": True, "line_item_id": line_item_id},
                        status=status.HTTP_200_OK)