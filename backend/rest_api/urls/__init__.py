from django.urls import path, include

from .core import urlpatterns as core_urlpatterns
from .fund_urls import urlpatterns as fund_urlpatterns
from .reference import urlpatterns as reference_urlpatterns
from .scenario_urls import urlpatterns as scenario_urlpatterns
from .financial_urls import urlpatterns as financial_urlpatterns

urlpatterns = []
urlpatterns += core_urlpatterns
urlpatterns += fund_urlpatterns
urlpatterns += reference_urlpatterns
urlpatterns += scenario_urlpatterns
urlpatterns += financial_urlpatterns