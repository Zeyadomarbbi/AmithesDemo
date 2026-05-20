from django.apps import AppConfig


class RestApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rest_api'

    def ready(self):
        import rest_api.signals
        from django.db.models.signals import post_save
        receivers = post_save.receivers
        print(f"[READY] total post_save receivers: {len(receivers)}")