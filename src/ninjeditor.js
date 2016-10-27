(function(outside) {
	var inside = {};
	
	
	(function(outside) {
		var weapons = {
			'h1': {text: 'h1'},
			'h2': {text: 'h2'},
			'bold': {icon: 'bold'},
			'italic': {icon: 'italic'},
			'underline': {icon: 'underline'},
			'strikethrough': {icon: 'strikethrough'},
			'text-left': {icon: 'align-left'},
			'text-center': {icon: 'align-center'},
			'text-right': {icon: 'align-right'},
			'text-justify': {icon: 'align-justify'}
		}
		
		var getContent = function(weapon) {
			weapon = weapons[weapon];
			return weapon.icon ? '<i class="fa fa-' + weapon.icon + '"></i>' : weapon.text;
		}
		
		
		var weaponPrototype = {
			get el() { return this._el; }
		};
		
		
		var Group = function(config) {
			var el = this._el = document.createElement('div');
			el.className = 'ninjeditor-group';
			
			for (var i = 0; i < config.children.length; i++) {
				var child = config.children[i],
					button = document.createElement('button');
				
				button.innerHTML = getContent(child);
				button.className = 'ninjeditor-btn';
				el.appendChild(button);
			}
		};
		Group.prototype = weaponPrototype;
		
		
		var Dropdown = function(config) {
			var el = this._el = document.createElement('div'),
				button = document.createElement('button')
				dropdown = document.createElement('ul');
			
			el.className = 'ninjeditor-group';
			button.className = 'ninjeditor-btn';
			button.innerHTML = config.icon ? '<i class="fa fa-' + config.icon + '"></i>' : config.text;
			button.innerHTML += ' <i class="fa fa-caret-down"></i>';
			dropdown.className = 'ninjeditor-dropdown';
			
			for (var i = 0; i < config.children.length; i++) {
				var child = config.children[i],
					option = document.createElement('li');
				
				option.value = child;
				option.innerHTML = getContent(child);
				dropdown.appendChild(option);
			}
			el.appendChild(button);
			el.appendChild(dropdown);
		};
		Dropdown.prototype = weaponPrototype;
		
		
		var Single = function(config) {
			var el = this._el = document.createElement('button');
			el.innerHTML = getContent(config.content);
			el.className = 'ninjeditor-group ninjeditor-btn';
		};
		Single.prototype = weaponPrototype;
		
		
		var weaponFactory = {
			new: function(config) {
				if (typeof config === 'string') config = {type: 'single', content: config};
				
				switch (config.type) {
					case 'dropdown': return new Dropdown(config);
					case 'group': return new Group(config);
					case 'single': return new Single(config);
				}
			}
		}
		
		
		// Expose part of this submodule
		outside.weaponFactory = weaponFactory;
	})(inside);
	
	
	(function(outside) {
		var Toolbar = function(embedded, config) {
			this.embedded = embedded;
			var el = this._el = document.createElement('div');
			el.className = 'ninjeditor-toolbar';
			
			this.construct(el, config);
		};
		Toolbar.prototype = {
			construct: function(el, weapons) {
				for (var i = 0; i < weapons.length; i++) {
					var weapon = outside.weaponFactory.new(weapons[i]);
					el.appendChild(weapon.el);
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
				} else if (config === 'normal') { // TODO: actually implement this interface
					config = [
						{type: 'group', children: ['text-left', 'text-center']},
						{type: 'dropdown', icon: 'bold', children: ['bold', 'italic']},
						{type: 'group', children: ['h1', 'h2']},
					];
				} else if (config === 'full') { // TODO: actually implement this interface
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
				var el = this._el = document.createElement('div'),
					editor = this._editor = el;
				
				if (config.type !== 'inline') { // stick the toolbar and the editor in there
					editor = this._editor = document.createElement('div');
					el.appendChild(this.toolbar.el);
					el.appendChild(editor);
				}
				
				editor.contentEditable = true;

				if (typeof config.attrs === 'object') {
					Object.keys(config.attrs).forEach(function(attr) {
						el.setAttribute(attr, config.attrs[attr]);
					});
				}
				if (config.val) editor.innerHTML = config.val;
				this.bind(editor);
			},
			
			bind: function(el) {
				el.onkeydown = this.handleKeydown.bind(this, el);
				el.oninput = this.handleInput.bind(this, el);
				if (this.config.type === 'inline') {
					el.onfocus = this.handleFocus.bind(this, el);
					el.onblur = this.handleBlur.bind(this, el);
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
			get el() { return this._el; },
			get val() { return this.el.innerHTML; }
		};
		
		
		// Expose part of this submodule
		outside.Ninjeditor = Ninjeditor;
	})(inside);
	
	
	// Expose part of this module
	outside.Ninjeditor = inside.Ninjeditor

})(this);
