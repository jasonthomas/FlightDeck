/*
 * Class representing the Capability only 
 * Prepare the editor, save, update
 */

var Capability = new Class({
	Implements: [Options, Events],
	type: 'capability',
	options: {
		version: {},
		//slug: null,
		//name: null,
		//description: null,
		//author: null,
		//managers: [],
		//developers: [],
		//public_permission: 2,
		//group_permission: 2,
		description_el: {element: 'capability_description'},
		//switch_description_id: '',
		update_el: 'update',
		version_create_el: 'version_create',
		try_in_browser_el: 'try_in_browser',
		//edit_url: '',
		//update_url: '',
		//version_create_url: ''
	},
	/*
	 * Method: initialize
	 * @attribute object options: 
	 * 	
	 * initialize Version and inside of that chosen Editor
	 * assign actions to the buttons
	 */
	initialize: function(options) {
		this.setOptions(options)
		this.initializeVersion();
		this.instantiateEditors();

		this.listenToEvents();
		this.initializeEditorSwitches();
		
		this.data = {};
		this.data[this.type+'_slug'] = this.options.slug;
		this.data[this.type+'_name'] = this.options.name;
		this.data[this.type+'_description'] = this.options.description;
		// #TODO: remove these - it's just to switch the buttons all the time
		this.afterVersionChanged();
		this.afterDataChanged();
	},
	/*
	 * Method: instantiateEditors
	 */
	instantiateEditors: function() {
		this.description_el = new Editor(this.options.description_el).hide();
		fd.editors.push(this.description_el);
	},
	/*
	 * Method: initializeEditorSwitches
	 */
	initializeEditorSwitches: function() {
		$$('.UI_File_Listing li').each(function(file_el) {
			file_el.switch_mode_on = function() {
				this.removeClass('UI_File_Normal')
					.addClass('UI_File_Selected')
					.getSiblings('.UI_File_Selected').each(function(el) {
						el.switch_mode_off();
					});
			};
			file_el.switch_mode_off = function() {
				this.removeClass('UI_File_Selected')
					.addClass('UI_File_Normal')
			}
		});
		$$('.UI_File_Listing li a').addEvent('click', function() {
			this.getParent('li').switch_mode_on();
		});;
		this.switch_description_el = $(this.options.switch_description_id);
		if (this.switch_description_el) {
			this.switch_description_el.addEvent('click', this.switchToDescription.bind(this));
		}	
	},
	/*
	 * Method: switchToDescription
	 */
	switchToDescription: function() {
		fd.hideEditors();
		this.description_el.show();
	},
	/*
	 * Method: listenToEvents
	 */
	listenToEvents: function() {
		this.boundAfterDataChanged = this.afterDataChanged.bind(this);
		this.boundAfterVersionChanged = this.afterVersionChanged.bind(this);
		// #TODO: using change is wrong here 
		this.description_el.addEvent('change', this.boundAfterDataChanged);
		this.version.addEvent('change', this.boundAfterVersionChanged);
		// one may try even not edited data
		$(this.options.try_in_browser_el).addEvent('click', function(e) {
			e.stop();
			this.try_in_browser();
		}.bind(this));
	},
	/* 
	 * Method: afterVersionChanged
	 * assign version_create with the $('version_create') click event
	 */
	afterDataChanged: function() {
		$(this.options.update_el).addEvent('click', function(e) {
			e.stop();
			this.update();
		}.bind(this));
		this.description_el.removeEvent('change', this.boundAfterDataChanged);
	},
	/* 
	 * Method: afterVersionChanged
	 * assign version_create with the $('version_create') click event
	 */
	afterVersionChanged: function() {
		// TODO: discover if change was actually an undo and there is 
		//       no change to the original content
		$(this.options.version_create_el).addEvent('click', function(e) {
			e.stop(); 
			this.version_create();
		}.bind(this));
		this.version.removeEvent('change', this.boundAfterVersionChanged);
	},
	/*
	 * Method: initializeVersion
	 * assigns CapVersion to this.version
	 */
	initializeVersion: function() {
		this.version = new CapVersion(this.options.version);
	},
	/*
	 * Method: update
	 * Prepare data and send Request to the back-end
	 */
	update: function() {
		var data = this.prepareData();
		new Request.JSON({
			url: this.options.update_url,
			data: data,
			method: 'post',
			onSuccess: function(response) {
				// display notification from response
				fd.message.alert('Success', response.message);
			}
		}).send();
	},
	/*
	 * Method: version_create
	 * Prepare data and send Request - create a new version
	 */
	version_create: function(data) {
		var data = $pick(data, this.version.prepareData());
		new Request.JSON({
			url: this.options.version_create_url,
			data: data,
			method: 'post',
			onSuccess: function(response) {
				window.location.href = response.version_absolute_url;
			}
		}).send();
	},
	/*
	 * Method: try_in_browser
	 * Prepare Capability using saved content and install temporary in the browser
	 */
	try_in_browser: function() {
		var data = this.getFullData();
		fd.warning.alert('Not implemented','try_in_browser');
		console.log(data);
	},
	/*
	 * Method: getContent
	 * Wrapper for getting content from the Editor
	 */
	getContent: function() {
		return this.version.getContent();
	},
	/*
	 * Method: getVersionName
	 * Wrapper for getting Version name from options
	 */
	getVersionName: function() {
		return this.version.getName()
	},
	/*
	 * Method: prepareData
	 * Take all jetpack available data and return
	 */
	prepareData: function() {
		this.updateFromDOM();
		return this.data;
	},
	/*
	 * Method: updateFromDOM
	 * get all jetpack editable fields from DOM and set parameters in model
	 */
	updateFromDOM: function() {
		// here update metadata from its editors
		this.data[this.type+'_description'] = this.description_el.getContent();
	},
	/*
	 * Method: getFullData
	 * get all data to save Jetpack and Version models
	 */
	getFullData: function() {
		var data = $H(this.prepareData());
		data.extend(this.version.prepareData());
		return data.getClean();
	}
	
});

/*
 * Class representing the Version only 
 * Prepare the editor, save, update
 */
var CapVersion = new Class({
	Implements: [Options, Events],
	type: 'capability',
	options: {
		//commited_by: null,
		//name: null,
		//description: null,
		//content: null,
		//status: null,
		//is_base: null,
		name_el: 'version_name',
		// TODO: move to new Editor
		description_el: {element: 'version_description'},
		content_el: {element: 'version_content'},
		update_el: 'update',
		edit_url: '',
		update_url: '',
		set_as_base_url: ''
	},
	/*
	 * Method: initialize
	 * instantiate Editor
	 */
	initialize: function(options) {
		this.setOptions(options);
		this.instantiateEditors();
		this.listenToEvents();
		this.initializeEditorSwitches();

		// this.data is everything we send to the backend
		this.data = {
			version_name: this.options.name,
			version_description: this.options.description,
			version_content: this.options.content,
		};
		// #TODO: remove these - it's just to switch the buttons all the time
		this.afterDataChanged();
	},
	/*
	 * Method: instantiateEditors
	 */
	instantiateEditors: function() {
		this.name_el = $(this.options.name_el);
		this.content_el = new Editor(this.options.content_el);
		this.description_el = new Editor(this.options.description_el).hide();
		fd.editors.push(this.content_el);
		fd.editors.push(this.description_el);
	},
	/*
	 * Method: initializeEditorSwitches
	 */
	initializeEditorSwitches: function() {
		this.switch_content_el = $(this.options.switch_content_id);
		this.switch_description_el = $(this.options.switch_description_id);
		if (this.switch_content_el) {
			this.switch_content_el.addEvent('click', this.switchToContent.bind(this));
		}
		if (this.switch_description_el) {
			this.switch_description_el.addEvent('click', this.switchToDescription.bind(this));
		}	
	},
	/*
	 * Method: switchToContent
	 */
	switchToContent: function(e) {
		e.stop();
		fd.hideEditors();
		this.content_el.show();
	},
	/*
	 * Method: switchToDescription
	 */
	switchToDescription: function(e) {
		e.stop();
		fd.hideEditors();
		this.description_el.show();
	},
	/*
	 * Method: listenToCapabilityEvents
	 */
	listenToEvents: function() {
		this.changed = false;
		this.boundAfterDataChanged = this.afterDataChanged.bind(this);
		this.description_el.addEvent('change', this.boundAfterDataChanged);
		this.content_el.addEvent('change', this.boundAfterDataChanged);
	},
	afterDataChanged: function() {
		this.fireEvent('change');
		// TODO: discover if change was actually an undo and there is 
		//       no change to the original content
		this.changed = true;
		$(this.options.update_el).addEvent('click', function(e) {
			e.stop();
			this.update();
		}.bind(this));
		this.content_el.removeEvent('change', this.boundAfterDataChanged);
		this.description_el.removeEvent('change', this.boundAfterDataChanged);
	},
	/*
	 * Method: update
	 * get current data and send Request to the backend
	 */
	update: function() {
		var data = this.prepareData();
		// prevent from updating a version with different name
		if (data.version_name != this.options.name) {
			// # TODO: create version
			return window[this.type].version_create(data);
		}
		new Request.JSON({
			url: this.options.update_url,
			data: data,
			method: 'post',
			onSuccess: function(response) {
				fd.message.alert('Success', response.message);
			}
		}).send();
	},
	/*
	 * Method: getContent
	 * Wrapper for getting content from the Editor
	 */
	getContent: function() {
		return this.content_el.getContent();
	},
	/*
	 * Method: getName
	 * Wrapper for getting Version name from options
	 */
	getName: function() {
		return this.options.name
	},
	/*
	 * Method: prepareData
	 * Prepare all version specific available data
	 */
	prepareData: function() {
		this.updateFromDOM();
		return this.data;
	},
	/*
	 * Method: updateFromDOM
	 * get all version editable fields from DOM and set parameters in model
	 */
	updateFromDOM: function() {
		this.data.version_name = this.name_el.get('value');
		this.data.version_content = this.content_el.getContent();
		this.data.version_description = this.description_el.getContent();
	}
});

