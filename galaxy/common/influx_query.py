import influxdb
import hashlib
import datetime
import pytz
from django.conf import settings
from galaxy.main import models
from django.core.exceptions import ObjectDoesNotExist


def compute_hash(input):
    return hashlib.sha1(input.encode()).hexdigest()


class InfluxDataBase(object):
    # timeout in seconds (one day)
    cacheTimeOut = 60 * 60 * 24

    def checkCache(self):
        if not self.useQueryCaching:
            return False

        try:
            cache = models.InfluxDataCache.objects.get(
                signature=self.getSignature()
            )
            now = datetime.datetime.utcnow().replace(tzinfo=pytz.UTC)
            delta = datetime.timedelta(seconds=self.cacheTimeOut)

            # Reset the cache if it is out of date
            if cache.modified < now - delta:
                return False

        except ObjectDoesNotExist:
            return False

        return cache.data

    def cacheData(self, data, name=''):
        models.InfluxDataCache.objects.update_or_create(
            signature=self.getSignature(),
            data=data,
            widget_name=name
        )


class InfluxQuery(InfluxDataBase):
    '''
    This is designed to be an extra layer of abstraction on over influx queries
    to allow for them to be cached to our main database and to prevent people
    from executing queries that return too much data.

    Usage:
    class SearchLinkStar(InfluxQuery):
        measurement = "search_click"
        selector = "*"
        conditions = "content_clicked = '{content}'"

    Create a new class that subclasses InfluxQuery. The following properties
    must be set:
    - measurement: the influxDB measurement to query data from
    - selector: tags/fields or functions to select from influxDB
    - conditions: the full WHERE clause of the influx query. Parameters that
      you wish to insert into the query should be set up as {variable_name}

    Optional properties:
    - range: default for how far back should data be queried
    - allowedRanges: time ranges that users are allowed to query.
    - useQueryCaching: set this to False if queries shouldn't be cached
    - cacheTimeOut: number of seconds that caches are valid before they should
      be reset
    - group_by: group the data by a tag/time range
    '''
    measurement = ""
    selector = ""
    conditions = ""
    group_by = ""
    error = ""
    useQueryCaching = False
    allowedRanges = ('1h', '1d', '1w', '2w', '3w', '4w')
    range = '1w'

    def __init__(self, params):
        try:
            self.conditions = self.conditions.format(**params)
        except KeyError as e:
            self.error = "Missing parameter: " + str(e)

        if 'range' in params:
            range = params['range']
            if range in self.allowedRanges:
                self.range = range

    # Returns the raw data from influxDB
    def query(self):
        data = self.checkCache()

        if not data:
            data = self.queryInflux()

            if self.useQueryCaching:
                self.cacheData(data)

        return data

    def queryInflux(self):
        client = influxdb.InfluxDBClient(
            host=settings.INFLUX_DB_HOST,
            port=settings.INFLUX_DB_PORT,
            username=settings.INFLUX_DB_USERNAME,
            password=settings.INFLUX_DB_PASSWORD
        )

        client.switch_database('galaxy_metrics')
        data = client.query(self.getQuery())
        client.close()

        return data.raw

    def getQuery(self):
        query = "SELECT %s FROM %s" % (self.selector, self.measurement)
        query = "%s WHERE time > now() - %s" % (query, self.range)

        if self.conditions:
            query = "%s AND %s" % (query, self.conditions)

        if self.group_by:
            query = "%s GROUP BY %s" % (query, self.group_by)

        return query

    def getSignature(self):
        return compute_hash(self.getQuery())


class AnalyticsWidget(InfluxDataBase):
    '''
    Defines how data should be shaped for a specific UI elements. This class
    allows for raw data from influxDB to be processed into something that's
    useable by the UI and cached.

    Usage:
    class PositionInSearch(AnalyticsWidget):
        influxQuery = SearchLinkStar
        name = 'PositionInSearch'

        def parseData(self, data):
            (...)

    Create a new class that subclasses AnalyticsWidget and define:
    - influxQuery: influxDB query object
    - parseData(self, data): receives raw influxDB data and returns a data
      structure that's useful to the UI.

      Raw influx data looks like this:
        {
          "series": [
            {
              "statement_id": 0
              "name": "search_click",
              "values": [
                [
                  "2018-09-26T18:31:18.3564592Z",
                  "val2",
                  (...)
                ]
              ],
              "columns": [
                "col1",
                "col2",
                (...)
              ]
            }
          ],
        }

    Optional properties:
    - useQueryCaching: set to False if data output by parseData should not be
      cached
    - cacheTimeOut: number of seconds that caches are valid before they should
      be reset
    '''
    name = ""
    queryInstance = ""
    error = ""
    useQueryCaching = True

    def __init__(self, params):
        self.name = type(self).__name__
        self.queryInstance = self.influxQuery(params)
        self.error = self.queryInstance.error

    def getSignature(self):
        return compute_hash(self.name + self.queryInstance.getSignature())

    def getData(self):
        data = self.checkCache()
        if not data:
            data = self.queryInstance.query()
            data = self.parseData(data)

            if self.useQueryCaching:
                self.cacheData(data, name=self.name)

        return data

    def parseData(self, data):
        return "Please implement 'parseData()' on any object that " + \
            "inherits from AnalyticsWidget"
