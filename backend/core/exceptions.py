from typing import Any

from django.utils.encoding import force_str
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(
    exc: Exception, context: dict[str, Any]
) -> Response | None:
    """
    A custom exception handler for Django REST Framework.

    This handler formats all API exceptions into a consistent JSON structure,
    providing a clear and uniform error response format across the API. It
    wraps the default DRF exception handler and reformats the response.

    Args:
        exc (Exception): The exception that was raised.
        context (dict): A dictionary containing the context of the exception,
                        such as the view and the request.

    Returns:
        Response | None: A DRF Response object with the formatted error, or
                        None if the exception could not be handled.
    """
    response = drf_exception_handler(exc, context)

    # If the default handler didn't handle the exception,
    # return a generic 500 error.
    if response is None:
        return Response(
            {
                "error": {
                    "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": "Internal server error",
                    "details": {},
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Reformat the response data into a consistent structure.
    data = response.data
    message = data.get("detail") if isinstance(data, dict) else "Request failed"
    return Response(
        {
            "error": {
                "code": response.status_code,
                "message": force_str(message),
                "details": data if isinstance(data, dict) else {"detail": data},
            }
        },
        status=response.status_code,
    )
