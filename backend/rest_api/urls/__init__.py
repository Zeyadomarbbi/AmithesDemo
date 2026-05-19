from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

from ..views_auth import login_view, me_view, users_list_view, user_detail_view, me_profile_view, me_change_password_view, me_delete_view
from .core import urlpatterns as core_urlpatterns
from .fund_urls import urlpatterns as fund_urlpatterns
from .reference import urlpatterns as reference_urlpatterns
from .scenario_urls import urlpatterns as scenario_urlpatterns
from .financial_urls import urlpatterns as financial_urlpatterns
from .lps_statement_urls import urlpatterns as lps_statement_urlpatterns
from .portfolio_urls import urlpatterns as portfolio_urlpatterns
from .kpis_urls import urlpatterns as kpis_urlpatterns
from .dealflow_urls import urlpatterns as dealflow_urlpatterns

urlpatterns = [
    path("login/",               login_view,               name="login"),
    path("token/refresh/",       TokenRefreshView.as_view(), name="token_refresh"),
    path("me/",                  me_view,                  name="me"),
    path("me/profile/",          me_profile_view,          name="me-profile"),
    path("me/change-password/",  me_change_password_view,  name="me-change-password"),
    path("me/delete/",           me_delete_view,           name="me-delete"),
    path("users/",               users_list_view,          name="users-list"),
    path("users/<int:pk>/",      user_detail_view,         name="user-detail"),
]

urlpatterns += core_urlpatterns
urlpatterns += fund_urlpatterns
urlpatterns += reference_urlpatterns
urlpatterns += scenario_urlpatterns
urlpatterns += financial_urlpatterns
urlpatterns += lps_statement_urlpatterns
urlpatterns += portfolio_urlpatterns
urlpatterns += kpis_urlpatterns
urlpatterns += dealflow_urlpatterns
