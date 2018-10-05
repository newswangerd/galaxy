import influxdb
from django.conf import settings


class InfluxQuery(object):
    measurement = ""
    selector = ""
    conditions = ""
    group_by = ""
    error = ""

    def __init__(self, params):
        try:
            self.conditions = self.conditions.format(**params)
        except KeyError as e:
            self.error = "Missing parameter: " + str(e)

    def query(self):
        data = self.queryPostgres()

        if not data:
            data = self.queryInflux()
            self.cacheQuery(data)

        return data

    def queryPostgres(self):
        # Look up signature in postgres. If it exists and it's not too old
        # return it
        return False

    def cacheQuery(self, data):
        pass

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

        if self.conditions:
            query = "%s WHERE %s" % (query, self.conditions)

        if self.group_by:
            query = "%s GROUP BY %s" % (query, self.group_by)

        return query

    def getSignature(self):
        return self.getQuery()


class AnalyticsWidget(object):
    name = ""
    queryInstance = ""
    error = ""

    def __init__(self, params):
        self.name = type(self).__name__
        self.queryInstance = self.influxQuery(params)
        self.error = self.queryInstance.error

    def getSignature(self):
        return self.name + str(self.queryInstance.getSignature())

    def checkCache(self):
        return False

    def cacheData(self, data):
        pass

    def getData(self):
        data = self.checkCache()
        if not data:
            data = self.queryInstance.query()
            data = self.parseData(data)
            self.cacheData(data)

        return data

    def parseData(self, data):
        return "Please implement 'parseData()' on any object that " + \
            "inherits from AnalyticsWidget"
