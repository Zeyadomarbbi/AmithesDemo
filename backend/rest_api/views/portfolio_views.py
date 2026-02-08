from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..models.transactions import *
from ..serializers.portfolio_serializers import *

class PortfolioInvestmentView(APIView):
    def get(self, request, fund_id):
        qs = PortfolioInvestment.objects.filter(
            fund_id=fund_id,
            is_deleted=False
        ).order_by("-created_at")
        serializer = PortfolioInvestmentSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        serializer = PortfolioInvestmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        created_by = None
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            created_by = getattr(user, "username", None)

        serializer.save(fund_id=fund_id, created_by=created_by)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PortfolioTransactionFlowView(APIView):
    def get(self, request, fund_id, investment_id):
        qs = PortfolioTransactionFlow.objects.filter(
            portfolio_investment_id=investment_id,
            is_deleted=False
        ).order_by("date", "flow_id")
        serializer = PortfolioTransactionFlowSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id, investment_id):
        investment = get_object_or_404(
            PortfolioInvestment, investment_id=investment_id, fund_id=fund_id
        )
        serializer = PortfolioTransactionFlowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        created_by = None
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            created_by = getattr(user, "username", None)

        next_index = (
            PortfolioTransactionFlow.objects.filter(portfolio_investment=investment).count() + 1
        )
        flow_name = f"#flow {next_index}"
        serializer.save(
            portfolio_investment=investment,
            flow_name=flow_name,
            created_by=created_by,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PortfolioFairValueFlowView(APIView):
    def get(self, request, fund_id, investment_id):
        qs = PortfolioFairValueFlow.objects.filter(
            portfolio_investment_id=investment_id
        ).order_by("-date", "-fair_value_id")
        serializer = PortfolioFairValueFlowSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id, investment_id):
        investment = get_object_or_404(
            PortfolioInvestment, investment_id=investment_id, fund_id=fund_id
        )
        # Upsert by (investment_id + date): update if exists, otherwise create
        date = request.data.get("date")
        existing = None
        if date:
            existing = PortfolioFairValueFlow.objects.filter(
                portfolio_investment=investment,
                date=date,
            ).order_by("-fair_value_id").first()

        created_by = None
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            created_by = getattr(user, "username", None)

        if existing:
            serializer = PortfolioFairValueFlowSerializer(
                existing, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = PortfolioFairValueFlowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            portfolio_investment=investment,
            created_by=created_by,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
