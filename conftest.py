"""
pytest conftest — shim for running tests under Python 3.11 with Django 6.x.

Django 6.x uses inspect.markcoroutinefunction (added in Python 3.12).
Patching inspect before any Django import allows the test suite to run on
Python 3.11 without upgrading the venv's Django pin.
"""
import inspect
import sys
from unittest.mock import MagicMock

# Backport Python 3.12 symbol that Django 6.x needs at import time.
if not hasattr(inspect, 'markcoroutinefunction'):
    inspect.markcoroutinefunction = lambda f: f

# xblockutils.resources pulls in Django's template engine on import, which
# would re-trigger the missing-symbol error.  Replace with a stub so the
# XBlock module loads without a running Django project.
sys.modules.setdefault('xblockutils', MagicMock())
sys.modules.setdefault('xblockutils.resources', MagicMock())
