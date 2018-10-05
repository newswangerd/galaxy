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


class ContentButtonClicks(InfluxQuery):
    measurement = "button_click"
    selector = "*"
    conditions = "current_page = '{content_page}'"


class ContentLinkClicks(InfluxQuery):
    measurement = "link_click"
    selector = "*"
    conditions = "current_page = '{content_page}'"


# Widget Definitions
class PositionInSearch(AnalyticsWidget):
    influxQuery = SearchLinkStar

    def parseData(self, data):
        if 'series' not in data:
            return []

        cols = data['series'][0]['columns']
        vals = data['series'][0]['values']
        position_index = cols.index('position_in_results')
        keywords_index = cols.index('keywords')

        results = {}
        metadata = {}

        for point in vals:
            pos = str(point[position_index])
            kw = point[keywords_index]
            if pos not in results:
                results[pos] = 1
                metadata[self.addNth(pos)] = {'keywords': [kw, ]}
            else:
                results[pos] += 1
                if kw not in metadata[self.addNth(pos)]['keywords']:
                    metadata[self.addNth(pos)]['keywords'].append(kw)

        values = []

        for x in results:
            values.append({'name': self.addNth(x), 'value': results[x]})
            # values.append([name, results[x]])

        return {'values': values, 'metadata': metadata}

    def addNth(self, x):
        name = x
        if x[-1] == '1':
            name += 'st'
        elif x[-1] == '2':
            name += 'nd'
        elif x[-1] == '3':
            name += 'rd'
        else:
            name += 'th'
        return name


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
