from webob import Response
from json import JSONEncoder
from datetime import datetime

from django.template import Context, Template
from pkg_resources import resource_string as pkg_resource_string


def resource_string(path):
    """Handy helper for getting resources from our kit.
    :param path: (str) path of the resource to load

    :return: (str) encoded resource path
    """
    data = pkg_resource_string(__name__, path)
    return data.decode("utf8")


def render_template(template_path, context={}):
    """
    render resorce using django template engine and the give content object to it.
    :param template_path: (str) path of the resource to load
    :param context: {} dic object to pass to django template

    :return: template.render
    """
    template_str = resource_string(template_path)
    template = Template(template_str)
    return template.render(Context(context))


def json_response(payload):
    """
    This function is to convert dictionary to json http response object.
    :param payload: dict
    :return: Response
    """
    class CustomJSONEncoder(JSONEncoder):
        def default(self, value):
            if isinstance(value, datetime.date):
                return dict(year=value.year, month=value.month, day=value.day)
            return value.__dict__
    return Response(CustomJSONEncoder().encode(payload), content_type='application/json', charset='UTF-8')
