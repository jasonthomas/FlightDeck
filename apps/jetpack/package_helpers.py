" Helpers for the package "

import zipfile
import simplejson
import os

from base.shortcuts import get_object_with_related_or_404
from jetpack.models import Package, PackageRevision
from jetpack.errors import FilenameExistException, ManifestNotValid

def get_package_revision(id_name, type_id,
                         revision_number=None,
                         version_name=None, latest=False):
    """
    Return revision of the package
    """

    if not (revision_number or version_name):
        # get default revision - one linked via Package:version
        package = get_object_with_related_or_404(Package, id_number=id_name,
                                                 type=type_id)
        package_revision = package.latest if latest else package.version

    elif revision_number:
        # get version given by revision number
        package_revision = get_object_with_related_or_404(PackageRevision,
                            package__id_number=id_name, package__type=type_id,
                            revision_number=revision_number)
    elif version_name:
        # get version given by version name
        package_revision = get_object_with_related_or_404(PackageRevision,
                            package__id_number=id_name, package__type=type_id,
                            version_name=version_name)
    return package_revision


def create_from_archive(path, author, package_type='a'):
    """
    Create new package from the PKZip archive.
    Call Package.create_revision_from_archive.

    Args:
       path (str): direct, full path of the archive

    Returns:
        Package object

    Raises:
        ManifestNotValid, BadZipFile, LargeZipFile
    """
    # read package.json
    packed = zipfile.ZipFile(path, 'r')

    if package_type == 'a':
        try:
            manifest = simplejson.loads(packed.read('package.json'))
        except Exception, err:
            raise ManifestNotValid("Problem with reading manifest's data.\n"
                    "Error: %s" % str(err))
    else:
        filename = os.path.basename(path)
        filename = os.path.splitext(filename)[0]
        manifest  = {
                'name': filename,
                'license': '',
                'version': 'uploaded'}

    if not ('name' in manifest and \
            'license' in manifest and \
            'version' in manifest):
        raise ManifestNotValid("Manifest is not valid.\n"
                "name, license and version fields are obsolete")

    if 'fullName' not in manifest:
        manifest['fullName'] = manifest['name']

    # * optional - check for jid - might be a problem with private key
    # create Package
    obj = Package(
        author=author,
        full_name=manifest['fullName'],
        name=manifest['name'],
        type=package_type,
        license=manifest['license'],
        description=manifest['description'] \
                if 'description' in manifest else ''
    )
    obj.save()
    obj.latest.set_version('empty.uploaded')
    obj.create_revision_from_archive(packed, manifest, author)

    return obj


def create_package_from_xpi(path, author, libs=[]):
    """
    Create new package(s) from the XPI
    Call Package.create_revision_from_xpi

    Args:
       path (str): direct, full path of the archive

    Returns:
        Package object

    Raises:
        ManifestNotValid, BadZipFile, LargeZipFile
    """
    packed = zipfile.ZipFile(path, 'r')

    filename = os.path.basename(path)
    filename = os.path.splitext(filename)[0]
    # read harness-options.json
    harness_options = simplejson.loads(packed.read('harness-options.json'))
    manifest = harness_options['metadata'][filename]
    manifest['version'] = 'uploaded'
    manifest['main'] = harness_options['main']
    if 'contributors' in manifest:
        manifest['contributors'] = ','.join(manifest['contributors'])
    if  'license' not in manifest:
        manifest['license'] = ''

    if 'name' not in manifest:
        raise ManifestNotValid("Manifest is not valid.\n"
                "name is obsolete")

    if 'fullName' not in manifest:
        manifest['fullName'] = manifest['name']

    # * optional - check for jid - might be a problem with private key
    # create Package
    obj = Package(
        author=author,
        full_name=manifest['fullName'],
        name=manifest['name'],
        type='a',
        license=manifest['license'],
        description=manifest['description'] \
                if 'description' in manifest else ''
    )
    obj.save()
    obj.latest.set_version('empty.uploaded')
    obj.create_revision_from_xpi(packed, manifest, author,
        harness_options['jetpackID'])

    # create each library

    return obj

