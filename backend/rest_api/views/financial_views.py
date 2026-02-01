from rest_framework.generics import ListAPIView
from ..models.reference import *
from ..serializers.financial_serializers import *

class FinancialCategoryView(ListAPIView):
    serializer_class = FinancialCategorySerializer
    lookup_field = 'category_id'

    def get_queryset(self):
        qs = FinancialCategory.objects.all()
        category_id = self.kwargs.get(self.lookup_field)
        if category_id is not None:
            qs = qs.filter(category_id=category_id)
        return qs