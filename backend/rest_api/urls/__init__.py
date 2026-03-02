from django.urls import path, include
from ..views_auth import login_view, logout_view, csrf_view, me_view, users_list_view, user_detail_view

from .core import urlpatterns as core_urlpatterns
from .fund_urls import urlpatterns as fund_urlpatterns
from .reference import urlpatterns as reference_urlpatterns
from .scenario_urls import urlpatterns as scenario_urlpatterns
from .financial_urls import urlpatterns as financial_urlpatterns
from .lps_statement_urls import urlpatterns as lps_statement_urlpatterns
from .portfolio_urls import urlpatterns as portfolio_urlpatterns
from .kpis_urls import urlpatterns as kpis_urlpatterns

urlpatterns = [
    path("login/", login_view),
    path("logout/", logout_view),
    path("csrf/", csrf_view),
    path('me/', me_view, name='me'),
    path('users/', users_list_view),
    path('users/<int:pk>/', user_detail_view), # GET (retrieve), PATCH (update), DELETE
]
urlpatterns += core_urlpatterns
urlpatterns += fund_urlpatterns
urlpatterns += reference_urlpatterns
urlpatterns += scenario_urlpatterns
urlpatterns += financial_urlpatterns
urlpatterns += lps_statement_urlpatterns
urlpatterns += portfolio_urlpatterns
urlpatterns += kpis_urlpatterns