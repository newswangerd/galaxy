from galaxy.common.influx_query import InfluxQuery, AnalyticsWidget
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
class PositionInSearch(AnalyticsWidget):
    influxQuery = SearchLinkStar
    name = 'PositionInSearch'

    def parseData(self, data):
        if 'series' not in data:
            return []

        cols = data['series'][0]['columns']
        vals = data['series'][0]['values']
        position_index = cols.index('position_in_results')

        results = {}

        for point in vals:
            pos = str(point[position_index])
            if pos not in results:
                results[pos] = 1
            else:
                results[pos] += 1

        list_results = []
        for x in results:
            list_results.append([x, results[x]])

        return list_results


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
