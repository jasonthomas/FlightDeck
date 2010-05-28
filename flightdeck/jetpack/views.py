import os
import sys
from random import choice

from django.core.urlresolvers import reverse
from django.views.static import serve
from django.shortcuts import render_to_response, get_object_or_404
from django.http import Http404, HttpResponseRedirect, HttpResponse, \
						HttpResponseNotAllowed, HttpResponseServerError
from django.template import RequestContext#,Template
from django.utils import simplejson
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.db.models import Q

from base.shortcuts import get_object_or_create, get_object_with_related_or_404, get_random_string
from utils.os_utils import whereis

from jetpack.models import Package, PackageRevision, Module, Attachment
from jetpack import settings
from jetpack.browser_helpers import get_package_revision

def homepage(r):
	"""
	Get mixed packages for homepage
	"""
	return HttpResponse("Homepage here")

def package_browser(r, page_number=1, type=None, username=None):
	"""
	Display a list of addons or libraries with pages
	Filter based on the request (type, username).
	"""
	# calculate which template to use
	template_suffix = ''
	packages = Package.objects

	if username:
		author = User.objects.get(username=username)
		packages = packages.filter(author__username=username)
		template_suffix = '%s_user' % template_suffix
	if type: 
		other_type = 'l' if type == 'a' else 'a'
		other_packages_number = len(packages.filter(type=other_type))
		packages = packages.filter(type=type)
		template_suffix = '%s_%s' % (template_suffix, settings.PACKAGE_PLURAL_NAMES[type])

	limit = r.GET.get('limit', settings.PACKAGES_PER_PAGE)

	pager = Paginator(
		packages,
		per_page = limit,
		orphans = 1
	).page(page_number)
	

	return render_to_response(
		'package_browser%s.html' % template_suffix, locals(),
		context_instance=RequestContext(r))



def package_details(r, id, type, revision_number=None, version_name=None):
	"""
	Show package - read only
	"""
	package_revision = get_package_revision(id, type, revision_number, version_name)
	return HttpResponse('VIEW: %s' % package_revision)
		

@login_required
def package_edit(r, id, type, revision_number=None, version_name=None):
	"""
	Edit package - only for the owner
	"""
	package_revision = get_package_revision(id, type, revision_number, version_name)
	return HttpResponse('EDIT: %s' % package_revision)
		

@login_required
def package_create(r, type):
	"""
	Create new Package (Add-on or Library)
	Target of the Popup window with basic metadata
	"""
	item = Package(
		author=r.user,
		full_name=r.POST.get("full_name"),
		description=r.POST.get("description"),
		type=type
		)
	item.save()

	return render_to_response("json/%s_created.json" % settings.PACKAGE_SINGULAR_NAMES[type], {'item': item},
				context_instance=RequestContext(r),
				mimetype='application/json')
	
