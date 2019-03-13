# (c) 2012-2019, Ansible by Red Hat
#
# This file is part of Ansible Galaxy
#
# Ansible Galaxy is free software: you can redistribute it and/or modify
# it under the terms of the Apache License as published by
# the Apache Software Foundation, either version 2 of the License, or
# (at your option) any later version.
#
# Ansible Galaxy is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# Apache License for more details.
#
# You should have received a copy of the Apache License
# along with Galaxy.  If not, see <http://www.apache.org/licenses/>.

from rest_framework import serializers
from galaxy.main import models

__all__ = [
    'CollectionListSerializer',
]


class CollectionListSerializer(serializers.ModelSerializer):
    summary_fields = serializers.SerializerMethodField()
    community_survey_count = serializers.SerializerMethodField()

    class Meta:
        model = models.Collection
        fields = (
            'namespace',
            'name',
            'deprecated',
            'download_count',
            'community_score',
            'quality_score',
            'summary_fields',
            'community_survey_count'
        )

    def get_summary_fields(self, obj):
        # TODO get the actual latest import
        return {
            'latest_import': {
                'id': 0,
                'state': 'SUCCESS',
                'started': '2018-03-24T22:12:22.431210Z',
                'finished': '2018-03-24T22:12:23.368447Z',
                'created': '2018-03-24T22:12:22.381363Z',
                'modified': '2018-03-24T22:12:23.368555Z'
            }
        }

    def get_community_survey_count(self, obj):
        return 0
