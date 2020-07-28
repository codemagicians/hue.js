"use strict";

function create_UUID() {
    return Math.random().toString() + Math.random().toString();
}

class ComponentBase {
    dataValueChanged = (component, name, newValue) => { console.log('data ' + newValue); };

    selector;
    id;
    template;
    style;
    script;
    oldDOM;
    #data = {};
    htmlElement;

    constructor(obj) {
        if (!obj) {
            console.error('An object that describes the component is required. Cannot proceed without it. Consider passing an object with fields: [name, template, style, script]');
        }
        this.selector = obj.selector;
        this.id = this.selector + create_UUID();
        this.template = obj.template;
        this.style = obj.style;
        this.script = obj.script;
        const self = this;
        let data = {};
        const dataKeys = Object.keys(obj.script.data);

        for(const key of dataKeys) {
            self.#data[key] = '';

            Object.defineProperty(data, key, {
                get: function () {
                    return self.#data[key];
                },
                set: function (v) {
                    self.#data[key] = v;
                    self.dataValueChanged(key, v);
                }
            });
            this.#data[key] = obj.script.data[key];
        }
        this.script.data = data;
    }
}

let $event;

class HueApplication {
    components = new Map();
    componentFactories = new Map();
    templateParametersRegex = /\[\[.*?\]\]/g;

    use(componentFactory) {
        if (!(componentFactory() instanceof ComponentBase)) {
            console.error('Method Hue.use requires an instance of a class ComponentBase');
            return;
        }
        const tempComponent = componentFactory();

        if (!tempComponent.selector) {
            throw `A selector for component of type ${tempComponent.constructor.name} has invalid value - ${tempComponent.selector}!`;
        }
        if (!this.componentFactories.has(tempComponent.selector)) {
            this.componentFactories.set(tempComponent.selector, componentFactory);
        }
        this.initializeComponents();
        this.setStylesForComponent(tempComponent);
    }

    initializeComponents() {
        this.oldDOM = document.body.innerHTML;

        for (const componentName of this.componentFactories.keys()) {
            const elements = document.getElementsByTagName(componentName);

            while (elements.length > 0) {
                const component = this.componentFactories.get(componentName)();
                component.htmlElement = elements[0];
                this.setPropertiesFromAttributes(component, elements[0].attributes ?? []);
                this.renderComponent(component);
                component.dataValueChanged = (n, v) => this.componentDataValueChanged(component, n, v);
            }
        }
    }

    renderComponent(component) {
        const htmlElement = component.htmlElement;
        const t = `<div id="${component.id}" class="___${component.selector}___">${component.template}</div>`;
        const parser = new DOMParser();
        const dummyHtmlDoc = parser.parseFromString(t, 'text/html');
        const allHtmlElements = dummyHtmlDoc.body.getElementsByTagName("*");

        const templateParameters = dummyHtmlDoc.body.innerHTML.match(this.templateParametersRegex) ?? [];

        for (const p of templateParameters) {
            const name = p.substring(2, p.length - 2);
            try {
                const value = this.getValue(component, name) ?? '';
                dummyHtmlDoc.body.innerHTML = dummyHtmlDoc.body.innerHTML.replace(p, value);
            } catch { }
        }

        for (const c of allHtmlElements) {
            for (const a of c.attributes) {
                if (a.name[0] === '[' && a.name[a.name.length - 1] === ']') {
                    // add handling of expressions here!!!
                    a.value = this.getValue(component, a.value) ?? a.value;
                    c.removeAttribute(a.name);
                    c[a.name.substring(1, a.name.length - 1)] = a.value;
                }

                if (a.name[0] === '(' && a.name[a.name.length - 1] === ')') {
                    const v = a.value.trim();
                    const domEventName = a.name.substring(1, a.name.length - 1);

                    if (domEventName) {
                        const indexOfP = v.indexOf('(');
                        let fName = indexOfP < 0 ? v : v.substring(0, indexOfP);
                        let fArgs = v.substring(indexOfP + 1, v.length - 1);
                        let f = component.script[fName];

                        if (!f) {
                            console.warn(`Method ${fName} was not found`);
                            continue;
                        }

                        if (fArgs) {
                            fArgs = fArgs.split(',');

                            for (var i = 0; i < fArgs.length; i++) {
                                fArgs[i] = fArgs[i].trim();

                                if (fArgs[i][0] !== '\'' && fArgs[i].toLowerCase() != fArgs[i].toUpperCase()) {
                                    fArgs[i] = this.getValue(component, fArgs[i]);
                                }
                            }
                        } else {
                            fArgs = [];
                        }
                        c.addEventListener(domEventName, ev => {
                            $event = ev;
                            f.apply(component.script, fArgs);
                        });
                    }
                }
            }
        }

        if (!htmlElement.parentNode) {
            const doc = document.getElementById(component.id);
            doc.parentNode.replaceChild(dummyHtmlDoc.body.children[0], doc);
        } else {
            htmlElement.parentNode.replaceChild(dummyHtmlDoc.body.children[0], htmlElement);
        }
    }

    setPropertiesFromAttributes(component, attributes) {
        if (attributes.length < 1) {
            return;
        }
        const propsMap = new Map();

        for (const key of Object.getOwnPropertyNames(component.script.props)) {
            propsMap.set(key.toUpperCase(), key);
        }

        for (let attribute of attributes) {
            const key = propsMap.get(attribute.name.toUpperCase());

            if (key) {
                component.script.props[key] = attribute.value;
            }
        }
    }

    setStylesForComponent(component) {
        var sheet = document.createElement('style');
        sheet.type = 'text/css';

        try {
            const style = component.style.trim();
            let selectorStarted = true;
            let newStyle = '';
            const selectorDecorator = ` div.___${component.selector}___ `;

            for (let i = 0; i < style.length; i++) {
                if (style[i] === '{') {
                    selectorStarted = false;
                } else if (style[i] === '}') {
                    selectorStarted = true;
                } else if (selectorStarted && style[i] != ' ') {
                    newStyle += selectorDecorator;
                    selectorStarted = false;
                }
                newStyle += style[i];
            }
            newStyle = newStyle.trim().replace(/\s\s+/g, ' ');
            sheet.innerHTML = newStyle;
            document.body.appendChild(sheet);
        } catch (error) {
            console.warn(error);
            sheet.innerHTML = component.style;
            document.body.appendChild(sheet);
        }
    }

    componentDataValueChanged(component, name, newValue) {
        window.Hue.renderComponent(component);
    }

    getValue(component, name) {
        if (component.script.props.hasOwnProperty(name)) {
            return component.script.props[name];
        }

        if (component.script.data.hasOwnProperty(name)) {
            return component.script.data[name];
        }
        console.warn($`Value for parameter ${name} was not found`);
        return null;
    }

    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }
}

window.Hue = new HueApplication();