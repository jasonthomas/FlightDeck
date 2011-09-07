import commonware
import shutil
import os

from mock import Mock
from nose.tools import eq_
from test_utils import TestCase

from django.contrib.auth.models import User
from django.conf import settings

from amo.constants import *
from amo.tasks import upload_to_amo
from base.templatetags.base_helpers import hashtag
from jetpack.models import Package, PackageRevision
from utils.amo import AMOOAuth

log = commonware.log.getLogger('f.test')


class UploadTest(TestCase):
    fixtures = ['mozilla_user', 'users', 'core_sdk', 'packages']
    ADDON_AMO_ID = 1
    AMO_FILE_ID = 20

    def setUp(self):
        self.author = User.objects.get(username='john')
        self.addonrev = Package.objects.get(name='test-addon',
                                         author__username='john').latest
        self.hashtag = hashtag()
        self.amo = AMOOAuth(domain=settings.AMOOAUTH_DOMAIN,
                           port=settings.AMOOAUTH_PORT,
                           protocol=settings.AMOOAUTH_PROTOCOL,
                           prefix=settings.AMOOAUTH_PREFIX)


    def test_create_new_amo_addon(self):
        AMOOAuth._send = Mock(return_value={
            'status': STATUS_NULL,  # current result from AMO API
            'id': self.ADDON_AMO_ID})
        upload_to_amo(self.addonrev.pk, self.hashtag)
        # checking status and other attributes
        addonrev = Package.objects.get(name='test-addon',
                                       author__username='john').latest
        eq_(addonrev.package.amo_id, self.ADDON_AMO_ID)
        eq_(addonrev.amo_version_name, 'initial')
        eq_(addonrev.amo_status, STATUS_NULL)
        # check if right API was called
        assert 'POST' in AMOOAuth._send.call_args[0]
        assert self.amo.url('addon') in AMOOAuth._send.call_args[0]

    def test_update_amo_addon(self):
        AMOOAuth._send = Mock(return_value={'id': self.AMO_FILE_ID})
        # set add-on as uploaded
        self.addonrev.amo_status = STATUS_PUBLIC
        self.addonrev.amo_version_name = self.addonrev.get_version_name()
        self.addonrev.package.amo_id = self.ADDON_AMO_ID
        self.addonrev.package.latest_uploaded = self.addonrev
        self.addonrev.package.save()
        # create a new "clean" revision
        self.addonrev.save()
        assert not self.addonrev.amo_version_name
        assert not self.addonrev.amo_status
        # upload it to AMO
        upload_to_amo(self.addonrev.pk, self.hashtag)
        # test status and other attributes
        addonrev = Package.objects.get(name='test-addon',
                                       author__username='john').latest
        eq_(addonrev.pk, addonrev.package.latest_uploaded.pk)
        eq_(addonrev.amo_version_name,
                'initial.rev%d' % addonrev.revision_number)
        eq_(addonrev.amo_file_id, self.AMO_FILE_ID)
        eq_(addonrev.amo_status, STATUS_UNREVIEWED)  # hardcoded
        # check if right API was called
        assert 'POST' in AMOOAuth._send.call_args[0]
        assert self.amo.url('version') % self.ADDON_AMO_ID in AMOOAuth._send.call_args[0]