from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..models.transactions import *
from ..serializers.fund_serializers import *

class FundWaterfallView(APIView):
    def get_queryset(self, fund_id):
        return (
            FundWaterfallSteps.objects
            .filter(fund_id=fund_id)
            .select_related('step_definition')
            .prefetch_related(
                'step_rules__share_class',
                'envelopes__rules__share_class'
            )
            .order_by('step_definition__step_number')
        )

    def get(self, request, fund_id, pk=None):
        qs = self.get_queryset(fund_id)
        if pk:
            step = get_object_or_404(qs, pk=pk)
            serializer = FundWaterfallStepSerializer(step)
            return Response(serializer.data)

        serializer = FundWaterfallStepSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        # 1. Prepare data with fund context
        data = {**request.data, 'fund': fund_id}
        step_def_id = data.get('step_definition')

        # 2. Check for existing Step Definition for this Fund (Upsert Check)
        existing_step = FundWaterfallSteps.objects.filter(
            fund_id=fund_id, 
            step_definition_id=step_def_id
        ).first()

        if existing_step:
            # --- UPDATE MODE ---
            # Pass the instance to perform an update instead of a create
            serializer = FundWaterfallStepSerializer(existing_step, data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        else:
            # --- CREATE MODE ---
            serializer = FundWaterfallStepSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, fund_id, pk):
        step = get_object_or_404(FundWaterfallSteps, pk=pk, fund_id=fund_id)
        
        data = {**request.data, 'fund': fund_id}
        
        serializer = FundWaterfallStepSerializer(step, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, fund_id, pk):
        step = get_object_or_404(FundWaterfallSteps, pk=pk, fund_id=fund_id)
        step.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class FundManFeeRuleView(APIView):
    def get(self, request, fund_id, fee_rule_id=None):
        if fee_rule_id:
            rule = get_object_or_404(FundManFeeRules, pk=fee_rule_id, fund_id=fund_id)
            serializer = FundManFeeRuleSerializer(rule)
            return Response(serializer.data)
        
        # Grouping by phase then date provides better structure for the UI
        qs = FundManFeeRules.objects.filter(fund_id=fund_id).order_by("phase_id", "date_from")
        serializer = FundManFeeRuleSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, fund_id):
        # Handle both single objects and lists (for bulk share class init)
        is_many = isinstance(request.data, list)
        serializer = FundManFeeRuleSerializer(data=request.data, many=is_many)
        
        serializer.is_valid(raise_exception=True)
        # Passing fund_id here is cleaner than copying request.data
        serializer.save(fund_id=fund_id)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, fund_id, fee_rule_id):
        rule = get_object_or_404(FundManFeeRules, pk=fee_rule_id, fund_id=fund_id)
        
        # Partial=True is generally safer for React state updates
        serializer = FundManFeeRuleSerializer(rule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(fund_id=fund_id)
        
        return Response(serializer.data)

    def delete(self, request, fund_id, fee_rule_id):
        rule = get_object_or_404(FundManFeeRules, pk=fee_rule_id, fund_id=fund_id)
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class FundManFeeRuleBulkView(APIView):
    def put(self, request, fund_id):
        if not isinstance(request.data, list):
            return Response(
                {"detail": "Payload must be an array of rule objects."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_rules = []
        created_rules = []

        # Atomic block guarantees trigger sequence, resolving the deadlock
        with transaction.atomic():
            for item in request.data:
                rule_id = item.get("fee_rule_id")
                
                if rule_id:
                    rule = get_object_or_404(FundManFeeRules, pk=rule_id, fund_id=fund_id)
                    serializer = FundManFeeRuleSerializer(rule, data=item, partial=True)
                    serializer.is_valid(raise_exception=True)
                    serializer.save(fund_id=fund_id)
                    updated_rules.append(serializer.data)
                else:
                    serializer = FundManFeeRuleSerializer(data=item)
                    serializer.is_valid(raise_exception=True)
                    serializer.save(fund_id=fund_id)
                    created_rules.append(serializer.data)

        return Response(
            {"created": created_rules, "updated": updated_rules}, 
            status=status.HTTP_200_OK
        )