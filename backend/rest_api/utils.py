from datetime import datetime
from .models import DimDate

def get_or_create_dim_date(date_str, fmt="%d/%m/%Y"):
    """
    Parses a string date and returns the corresponding DimDate object.
    Raises ValueError if format is invalid.
    """
    dt_obj = datetime.strptime(date_str, fmt)
    date_id = int(dt_obj.strftime("%Y%m%d"))
    
    dim_date, _ = DimDate.objects.get_or_create(
        full_date=dt_obj.date(),
        defaults={
            'date_id': date_id,
            'quarter': (dt_obj.month - 1) // 3 + 1,
            'year': dt_obj.year
        }
    )
    return dim_date