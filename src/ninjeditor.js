(function(outside) {
	var inside = {};


	(function(outside) {
		var El = function(tagName, attributes, content) {
			tagName || (tagName = 'div');
			if (typeof attributes === 'string') {
				content = attributes;
				attributes = undefined;
			}

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
				this.el.className = this.el.className.split(' ').concat(theClass.split(' ')).filter(function(x) { return x; }).join(' ');
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
				if (val instanceof El) val = val.el.outerHTML;
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
			bind: function(parent, ninjeditor) {
				var self = this;
				parent.on('click', this.onclick.bind(this, ninjeditor));
			},

			get el() {
				if (this._el) return this._el;

				if (this._icon) return this._el = new outside.El('i.fa.fa-' + this._icon);
				else return this._el = new outside.El('span', this._text);
			}
		};
		var weapons = {
			'h1': {
				_text: '<strong>h1</strong>',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'h2': {
				_text: 'h2',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'bold': {
				_icon: 'bold',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'italic': {
				_icon: 'italic',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'underline': {
				_icon: 'underline',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'strikethrough': {
				_icon: 'strikethrough',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'text-left': {
				_icon: 'align-left',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'text-center': {
				_icon: 'align-center',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'text-right': {
				_icon: 'align-right',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			},
			'text-justify': {
				_icon: 'align-justify',
				onclick: function(ninjeditor) {
					console.log('here!', ninjeditor.editInfo);
				}
			}
		};

		var weaponConstructors = {};

		/*
			The weaponFactory learns as the program is used.
			The individual weapon prototypes are defined in the 'weapons' object, but they aren't turned into actual 'classes' until they're needed.
			Then they're stored for later use.
		*/
		var weaponFactory = function(weapon, parent, ninjeditor) {
			if (weaponConstructors[weapon]) return new weaponConstructors[weapon]();

			weapon = weapons[weapon];
			var Weapon = function() {
				this.bind(parent, ninjeditor);
			};
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
			get el() { return this._el; },
			get weapons() { return this._weapons || (this._weapons = []); }
		};


		var Group = function(config, ninjeditor) {
			this.ninjeditor = ninjeditor;
			var el = this._el = new outside.El();
			el.addClass('ninja-group');

			for (var i = 0; i < config.children.length; i++) {
				var child = config.children[i],
					button = new outside.El('button');

				var weapon = outside.weaponFactory(child, button, this.ninjeditor);
				this.weapons.push(weapon);
				button.html(weapon.el);
				button.addClass('ninja-btn');
				el.append(button);
			}
		};
		Group.prototype = toolPrototype;


		var Dropdown = function(config, ninjeditor) {
			this.ninjeditor = ninjeditor;
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
					var weapon = outside.weaponFactory(child, option, this.ninjeditor);
					this.weapons.push(weapon);
					option.html(weapon.el);
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


		var Single = function(config, ninjeditor) {
			this.ninjeditor = ninjeditor;
			var el = this._el = new outside.El('button'),
				weapon = outside.weaponFactory(config.content, button, this.ninjeditor);

			this.weapons.push(weapon);
			el.html(weapon.el);
			el.addClass('ninja-group ninja-btn');
		};
		Single.prototype = toolPrototype;


		var toolFactory = {
			new: function(config, ninjeditor) {
				if (typeof config === 'string') config = {type: 'single', content: config};

				switch (config.type) {
					case 'dropdown': return new Dropdown(config, ninjeditor);
					case 'group': return new Group(config, ninjeditor);
					case 'single': return new Single(config, ninjeditor);
				}
			}
		};


		// Expose part of this submodule
		outside.toolFactory = toolFactory;
	})(inside);


	(function(outside) {
		var Toolbar = function(embedded, ninjeditor, config) {
			this.embedded = embedded;
			this.ninjeditor = ninjeditor;
			var el = this._el = new outside.El();
			el.addClass('ninja-toolbar');

			this.construct(el, config);
		};
		Toolbar.prototype = {
			construct: function(el, tools) {
				for (var i = 0; i < tools.length; i++) {
					var tool = outside.toolFactory.new(tools[i], this.ninjeditor);
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
			new: function(embedded, ninjeditor, config) {
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
					// TODO: add this ninjeditor to this toolbar's ninjeditors
					return floatingToolbars[key] = new outside.Toolbar(embedded, ninjeditor, config);
				}
				return new outside.Toolbar(embedded, ninjeditor, config);
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
			this.editInfo = {};
			this.edit = this.save = new Function(); // no-ops; these are meant to be overridden
			this.toolbar = outside.toolbarFactory.new(config.type !== 'inline', this, config.toolbar);
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

			handleHotkeys: function(editInfo, event) {
				if (editInfo.which === 83 && editInfo.ctrl) {
					event.preventDefault();
					this.save(this.val); // ctrl+s
				}
			},

			handleInput: function(el, event) {
				console.log(this.editInfo.range);
				this.edit(this.val);
			},

			handleKeydown: function(el, event) {
				this.editInfo.range = window.getSelection().getRangeAt(0);
				this.editInfo.which = event.which;
				this.editInfo.alt = event.altKey;
				this.editInfo.ctrl = event.ctrlKey;
				this.editInfo.shift = event.shiftKey;

				this.handleHotkeys(this.editInfo, event);
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
