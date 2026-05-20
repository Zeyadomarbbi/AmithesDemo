from rest_framework import serializers
import difflib

from ..models.reference import FinancialCategory, FinancialLineItem
from ..models.transactions import FinancialEntry


class FinancialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialCategory
        fields = ["category_id", "name", "sign_multiplier"]
        read_only_fields = fields


class FinancialLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialLineItem
        fields = "__all__"
        read_only_fields = ['special_field', 'created_at', 'updated_at', 'created_by']

    def validate(self, attrs):
        """
        Intercepts the validation to perform Fuzzy Matching on the name.
        Auto-assigns special_field if match > 75%.
        """
        input_name = attrs.get('name', '').lower().strip()
        category_obj = attrs.get('category') 
        
        # 1. Get the category name to decide which keywords to scan
        # We assume category_obj.name contains 'Income' or 'Expense'
        # Adjust 'category_name' access based on your actual Category model structure
        category_name = category_obj.name.lower() if category_obj else ""

        # 2. Define our Keyword Rules
        # Structure: Special_Tag -> List of triggers
        income_keywords = {
            FinancialLineItem.SpecialField.REALIZED_GAIN: ['realized gain', 'realized', 'real gain'],
            FinancialLineItem.SpecialField.UNREALIZED_GAIN: ['unrealized gain', 'unrealized', 'unreal'],
        }
        
        expense_keywords = {
            FinancialLineItem.SpecialField.MANAGEMENT_FEES: ['management fees', 'man fees', 'management', 'mngmt fees', 'catch up'],
            FinancialLineItem.SpecialField.STRUCTURING_FEES: ['structuring fees', 'structuring costs', 'structuring', 'struct fees'],
            FinancialLineItem.SpecialField.DD_FEES: ['due diligence', 'dd fees', 'dd', 'diligence'],
            FinancialLineItem.SpecialField.OPEX: ['opex', 'administration fees', 'admin fees', 'administrative'],
            FinancialLineItem.SpecialField.OTHER_EXPENSES: ['other expenses', 'other', 'miscellaneous'],
        }

        # 3. Select the target dictionary based on Category
        target_map = {}
        if 'income' in category_name:
            target_map = income_keywords
        elif 'expense' in category_name:
            target_map = expense_keywords
        else:
            # If category is ambiguous, check ALL keywords (Safety Net)
            target_map = {**income_keywords, **expense_keywords}

        # 4. Perform Fuzzy Matching
        best_match_field = None
        highest_ratio = 0.0

        for field_key, keywords in target_map.items():
            for keyword in keywords:
                # Calculate similarity ratio (0.0 to 1.0)
                ratio = difflib.SequenceMatcher(None, input_name, keyword).ratio()
                
                # We prioritize the highest match found
                if ratio > highest_ratio:
                    highest_ratio = ratio
                    best_match_field = field_key

        # 5. Apply Threshold (75% or 0.75)
        # Note: "Realized Only" vs "Realized Gain" is roughly 0.69 similarity. 
        # You might want to lower this slightly to 0.65 or 0.70 to catch "Realized Only".
        if highest_ratio >= 0.70: 
            attrs['special_field'] = best_match_field
            # Debug Print (Optional)
            # print(f"Auto-Matched '{input_name}' to {best_match_field} (Score: {highest_ratio:.2f})")
        else:
            attrs['special_field'] = None

        return attrs

class FinancialEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialEntry
        fields = "__all__"
        read_only_fields = fields
