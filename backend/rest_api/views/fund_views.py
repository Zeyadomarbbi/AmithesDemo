from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..models.transactions import *
from ..serializers.fund_serializers import *

class FundWaterfallView(APIView):
    def get(self, request, fund_id, pk=None):
        if pk:
            step = get_object_or_404(FundWaterfallSteps, pk=pk, fund_id=fund_id)
            serializer = FundWaterfallStepSerializer(step)
            return Response(serializer.data)
        
        qs = FundWaterfallSteps.objects.filter(fund_id=fund_id).order_by('step_definition__step_number')
        serializer = FundWaterfallStepSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        data = request.data.copy()
        data['fund'] = fund_id
        serializer = FundWaterfallStepSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, fund_id, pk):
        step = get_object_or_404(FundWaterfallSteps, pk=pk, fund_id=fund_id)
        data = request.data.copy()
        data['fund'] = fund_id
        serializer = FundWaterfallStepSerializer(step, data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, fund_id, pk):
        step = get_object_or_404(FundWaterfallSteps, pk=pk, fund_id=fund_id)
        step.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class FundManFeeRuleView(APIView):
    """
    Unified View for List, Create, Update, and Delete operations.
    URL patterns should route both list and detail requests here.
    """

    def get(self, request, fund_id, fee_rule_id=None):
        if fee_rule_id:
            rule = get_object_or_404(FundManFeeRules, pk=fee_rule_id, fund_id=fund_id)
            serializer = FundManFeeRuleSerializer(rule)
            return Response(serializer.data)
        
        qs = FundManFeeRules.objects.filter(fund_id=fund_id).order_by("date_from")
        serializer = FundManFeeRuleSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        data = request.data.copy()
        data["fund"] = fund_id

        serializer = FundManFeeRuleSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, fund_id, fee_rule_id):
        rule = get_object_or_404(FundManFeeRules, pk=fee_rule_id, fund_id=fund_id)
        
        data = request.data.copy()
        data["fund"] = fund_id 

        serializer = FundManFeeRuleSerializer(rule, data=data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)