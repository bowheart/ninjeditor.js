(function(outside) {
	var inside = {};
	
	
	(function(outside) {
		var El = function(tagName, attributes, content) {
			tagName || (tagName = 'div');
			var classes = tagName.split('.');
			tagName = classes.shift();
			var el = this._el = document.createElement(tagName || 'div');
			
			if (classes.length) {
				this.addClass(classes.join(' '));
			}
			
			if (typeof attributes === 'object' && !Array.isArray(attributes)) {
				Object.keys(attributes).forEach(function(attr) {
					el.setAttribute(attr, attributes[attr]);
				});
			}
			
			if (content) this.html(content);
		};
		El.prototype = {
			addClass: function(theClass) {
				this.el.className = this.el.className.split(' ').concat(theClass.split(' ')).join(' ');
				return this;
			},
			append: function(el) {
				if (el instanceof El) el = el.el;
				this.el.appendChild(el);
				return this;
			},
			attr: function(key, val) {
				if (typeof val === 'undefined') return this.el[key];
				this.el.setAttribute(key, val);
				return this;
			},
			hide: function() {
				this.el.hidden = true;
			},
			html: function(val) {
				if (typeof val === 'undefined') return this.el.innerHTML;
				this.el.innerHTML = val;
				return this;
			},
			on: function(eventName, handler) {
				this.el.addEventListener(eventName, handler);
			},
			show: function() {
				this.el.removeAttribute('hidden');
			},
			toggle: function() {
				this[this.el.hidden ? 'show' : 'hide']();
			},
			
			get el() { return this._el; }
		};
		
		
		// Expose part of this submodule
		outside.El = El;
	})(inside);
	
	
	(function(outside) {
		var weaponPrototype = {
			get button() {
				return this._icon ? '<i class="fa fa-' + this._icon + '"></i>' : this._text;
			}
		};
		var weapons = {
			'h1': {
				_text: 'h1'
			},
			'h2': {
				_text: 'h2'
			},
			'bold': {
				_icon: 'bold'
			},
			'italic': {
				_icon: 'italic'
			},
			'underline': {
				_icon: 'underline'
			},
			'strikethrough': {
				_icon: 'strikethrough'
			},
			'text-left': {
				_icon: 'align-left'
			},
			'text-center': {
				_icon: 'align-center'
			},
			'text-right': {
				_icon: 'align-right'
			},
			'text-justify': {
				_icon: 'align-justify'
			}
		};
		
		var weaponConstructors = {};
		
		/*
			The weaponFactory learns as the program is used.
			The individual weapon prototypes are defined in the 'weapons' object, but they aren't turned into actual 'classes' until they're needed.
			Then they're stored for later use.
		*/
		var weaponFactory = function(weapon) {
			if (weaponConstructors[weapon]) return new weaponConstructors[weapon]();
			
			weapon = weapons[weapon];
			var Weapon = new Function();
			Weapon.prototype = weapon;
			Object.setPrototypeOf(Weapon.prototype, weaponPrototype);
			weaponConstructors[weapon] = Weapon;
			return new Weapon();
		};
		
		
		// Expose part of this submodule
		outside.weaponFactory = weaponFactory;
	})(inside);
	
	
	(function(outside) {
		var toolPrototype = {
			get el() { return this._el; }
		};
		
		
		var Group = function(config) {
			var el = this._el = new outside.El();
			el.addClass('ninja-group');
			
			for (var i = 0; i < config.children.length; i++) {
				var child = config.children[i],
					button = new outside.El('button');
				
				button.html(outside.weaponFactory(child));
				button.addClass('ninja-btn');
				el.append(button);
			}
		};
		Group.prototype = toolPrototype;
		
		
		var Dropdown = function(config) {
			this.initEl(config);
		};
		Dropdown.prototype = {
			initEl: function(config) {
				var el = this._el = new outside.El(),
					button = new outside.El('button'),
					dropdown = new outside.El('ul');
				
				el.addClass('ninja-group');
				
				var buttonHtml = config.icon ? '<i class="fa fa-' + config.icon + '"></i>' : config.text;
				buttonHtml += ' <i class="fa fa-caret-down"></i>';
				button.addClass('ninja-btn');
				button.html(buttonHtml);
				
				dropdown.addClass('ninja-dropdown');
				dropdown.hide();
				
				for (var i = 0; i < config.children.length; i++) {
					var child = config.children[i],
						option = new outside.El('li');
					
					option.attr('value', child);
					option.html(outside.weaponFactory(child));
					dropdown.append(option);
				}
				el.append(button).append(dropdown);
				this.bind(button, dropdown);
			},
			bind: function(button, dropdown) {
				button.on('click', this.handleButtonClick.bind(this, button, dropdown));
			},
			handleButtonClick: function(button, dropdown, event) {
				dropdown.toggle();
				if (!dropdown.attr('hidden')) { // we just showed the dropdown.
					var causeClose = function() {
						document.removeEventListener('click', causeClose);
						document.addEventListener('click', close);
					};
					var close = function() {
						document.removeEventListener('click', close);
						dropdown.hide();
					}
					document.addEventListener('click', causeClose);
				}
			}
		};
		Object.setPrototypeOf(Dropdown.prototype, toolPrototype);
		
		
		var Single = function(config) {
			var el = this._el = new outside.El('button');
			el.html(outside.weaponFactory(config.content));
			el.addClass('ninja-group ninja-btn');
		};
		Single.prototype = toolPrototype;
		
		
		var toolFactory = {
			new: function(config) {
				if (typeof config === 'string') config = {type: 'single', content: config};
				
				switch (config.type) {
					case 'dropdown': return new Dropdown(config);
					case 'group': return new Group(config);
					case 'single': return new Single(config);
				}
			}
		};
		
		
		// Expose part of this submodule
		outside.toolFactory = toolFactory;
	})(inside);
	
	
	(function(outside) {
		var Toolbar = function(embedded, config) {
			this.embedded = embedded;
			var el = this._el = new outside.El();
			el.addClass('ninja-toolbar');
			
			this.construct(el, config);
		};
		Toolbar.prototype = {
			construct: function(el, tools) {
				for (var i = 0; i < tools.length; i++) {
					var tool = outside.toolFactory.new(tools[i]);
					el.append(tool.el);
					if (i < tools.length - 1) el.append(new outside.El('span.ninja-divider'));
				}
			},
			get el() { return this._el; }
		};
		
		
		// Expose part of this submodule
		outside.Toolbar = Toolbar;
	})(inside);
	
	
	(function(outside) {
		// Doesn't matter what this function returns, as long as its output is unique to a config array
		var stringifyConfig = function(config) {
			var result = '';
			for (var i = 0; i < config.length; i++) {
				var item = config[i];
				result += (Array.isArray(item) ? '|' + stringifyConfig(item) : ',' + item);
			}
			return result;
		}
		
		var floatingToolbars = {}
		
		var toolbarFactory = {
			new: function(embedded, config) {
				config || (config = 'normal');
				
				if (config === 'basic') {
					config = [
						{type: 'group', children: ['text-left', 'text-center']},
						{type: 'dropdown', icon: 'bold', children: ['bold', 'italic']},
						{type: 'group', children: ['h1', 'h2']},
					];
				} else if (config === 'normal') { // TODO: actually implement this template
					config = [
						{type: 'group', children: ['text-left', 'text-center']},
						{type: 'dropdown', icon: 'bold', children: ['bold', 'italic']},
						{type: 'group', children: ['h1', 'h2']},
					];
				} else if (config === 'full') { // TODO: actually implement this template
					config = [
						{type: 'group', children: ['text-left', 'text-center']},
						{type: 'dropdown', icon: 'bold', children: ['bold', 'italic']},
						{type: 'group', children: ['h1', 'h2']},
					];
				}
				
				if (!embedded) { // If it's a floating toolbar, see if we have a toolbar with this same config and use that one.
					var key = stringifyConfig(config);
					if (floatingToolbars[key]) return floatingToolbars[key];
					
					return floatingToolbars[key] = new outside.Toolbar(embedded, config);
				}
				return new outside.Toolbar(embedded, config);
			}
		};
		
		
		// Expose part of this submodule
		outside.toolbarFactory = toolbarFactory;
	})(inside);
	
	
	(function(outside) {
		var Ninjeditor = function(config) {
			config || (config = {});
			if (typeof config !== 'object') throw new TypeError('Ninjeditor error: Config must be an object');
			config.type || (config.type = 'normal');
			config.toolbar || (config.toolbar = 'normal');
			
			this._config = config;
			this.keyInfo = {};
			this.edit = this.save = new Function(); // no-ops; these are meant to be overridden
			this.toolbar = outside.toolbarFactory.new(config.type !== 'inline', config.toolbar);
			this.initEl(config);
		};
		Ninjeditor.prototype = {
			initEl: function(config) {
				var el = this._el = new outside.El('div', config.attrs),
					editor = this._editor = el;
				
				if (config.type !== 'inline') { // stick the toolbar and the editor in there
					editor = this._editor = new outside.El();
					el.addClass('ninja');
					el.append(this.toolbar.el);
					el.append(editor);
				}
				
				editor.addClass('ninja-editor');
				editor.attr('contentEditable', true);
				if (config.val) editor.html(config.val);
				
				this.bind(editor);
			},
			
			bind: function(el) {
				el.on('keydown', this.handleKeydown.bind(this, el));
				el.on('input', this.handleInput.bind(this, el));
				if (this.config.type === 'inline') {
					el.on('focus', this.handleFocus.bind(this, el));
					el.on('blur', this.handleBlur.bind(this, el));
				}
			},
			
			// For inline editors, hide the toolbar.
			handleBlur: function(el, event) {
				this.toolbar.hide();
			},
			
			// For inline editors, show the toolbar
			handleFocus: function(el, event) {
				this.toolbar.show();
			},
			
			handleHotkeys: function(keyInfo, event) {
				if (keyInfo.which === 83 && keyInfo.ctrl) {
					event.preventDefault();
					this.save(this.val); // ctrl+s
				}
			},
			
			handleInput: function(el, event) {
				var range = window.getSelection();
				this.edit(this.val);
			},
			
			handleKeydown: function(el, event) {
				var range = window.getSelection();
				console.log(range, range.toString());
				this.keyInfo.which = event.which;
				this.keyInfo.alt = event.altKey;
				this.keyInfo.ctrl = event.ctrlKey;
				this.keyInfo.shift = event.shiftKey;
				
				this.handleHotkeys(this.keyInfo, event);
			},
			
			onEdit: function(callback) {
				if (typeof callback !== 'function') throw new TypeError('Ninjeditor error: onEdit expects parameter 1 to be a function');
				this.edit = callback;
				return this;
			},
			onSave: function(callback) {
				if (typeof callback !== 'function') throw new TypeError('Ninjeditor error: onSave expects parameter 1 to be a function');
				this.save = callback;
				return this;
			},
			
			get config() { return this._config; },
			get editor() { return this._editor; },
			get el() { return this._el.el; },
			get val() { return this.el.innerHTML; }
		};
		
		
		// Expose part of this submodule
		outside.Ninjeditor = Ninjeditor;
	})(inside);
	
	
	// Expose part of this module
	outside.Ninjeditor = inside.Ninjeditor

})(this);
