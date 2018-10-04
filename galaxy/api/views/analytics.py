from galaxy.common.influx_query import InfluxQuery, PieChartWidget
from rest_framework import views
from rest_framework.response import Response
from rest_framework import status

__all__ = [
    'AnalyticsWidgetView',
]


# Query Definitions
class SearchLinkStar(InfluxQuery):
    measurement = "search_click"
    selector = "*"
    conditions = "content_clicked = '{content}'"
    # group_by = "current_component"


# Widget Definitions
class PositionInSearch(PieChartWidget):
    influxQuery = SearchLinkStar
    name = 'PositionInSearch'
    col_to_count = 'position_in_results'


widget_map = {
    'position_in_search': PositionInSearch,
}


# Views
class AnalyticsWidgetView(views.APIView):
    def get(self, request):
        widget_name = request.GET.get('widget_name', '')
        if not widget_name:
            return Response(
                "widget_name must be defined",
                status=status.HTTP_400_BAD_REQUEST
            )

        params = request.GET.dict()
        del params['widget_name']

        if widget_name not in widget_map:
            return Response(
                "Unsuported widget",
                status=status.HTTP_400_BAD_REQUEST
            )
        widget = widget_map[widget_name]

        widget = widget(params)
        if widget.error:
            return Response(
                widget.error,
                status=status.HTTP_400_BAD_REQUEST
            )
        data = widget.getData()

        return Response(data)
